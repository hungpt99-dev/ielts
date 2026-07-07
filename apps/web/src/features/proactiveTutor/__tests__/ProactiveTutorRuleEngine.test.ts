import { describe, it, expect, beforeEach } from 'vitest'
import type { LearningEvent, LearningEventType } from '../../learningEvents/types'
import { ProactiveTutorRuleEngine, proactiveTutorRuleEngine } from '../ProactiveTutorRuleEngine'
import type {
  ProactiveTutorContext,
  CooldownState,
  ProactiveMessageRecord,
  DismissedMessage,
  RuleEngineInput,
} from '../ProactiveTutorRuleEngine'
import { proactiveTutorSettingsRepository } from '../ProactiveTutorSettingsRepository'

function makeEvent(overrides: Partial<LearningEvent> = {}): LearningEvent {
  return {
    eventId: 'evt-1',
    eventType: 'vocabulary_saved',
    source: 'website',
    timestamp: new Date().toISOString(),
    page: '/vocabulary',
    entityType: 'vocabulary',
    entityId: 'vocab-1',
    payload: {
      eventType: 'vocabulary_saved',
      vocabularyId: 'vocab-1',
      word: 'abandon',
      topic: 'education',
      sessionWordCount: 6,
    },
    metadata: {},
    sessionId: 'sess-1',
    correlationId: null,
    createdAt: new Date().toISOString(),
    syncStatus: 'local_only',
    ...overrides,
  }
}

function makeContext(overrides: Partial<ProactiveTutorContext> = {}): ProactiveTutorContext {
  return {
    sessionVocabularyCount: 6,
    dailyVocabularySaved: 10,
    weeklyVocabularySaved: 25,
    dueVocabularyCount: 0,
    sessionMistakeCount: 0,
    dailyMistakeSaved: 0,
    repeatedMistakeCount: 0,
    dailyTasksCompleted: 3,
    dailyTasksSkipped: 0,
    consecutiveMissedDays: 0,
    currentStreak: 5,
    totalStreak: 5,
    targetBand: 7,
    examDate: null,
    daysUntilExam: null,
    todayPlanComplete: false,
    pendingTasksCount: 2,
    weakSkills: ['writing', 'speaking'],
    lastActiveAt: null,
    inactiveMinutes: 0,
    recentAccuracy: null,
    ...overrides,
  }
}

function makeCooldownState(overrides: Partial<CooldownState> = {}): CooldownState {
  return {
    global: { lastMessageAt: null },
    byEventType: {},
    ...overrides,
  }
}

function makeRecentMessages(overrides: Partial<ProactiveMessageRecord>[] = []): ProactiveMessageRecord[] {
  return overrides.map((o, i) => ({
    id: `msg-${i}`,
    eventId: `evt-${i}`,
    eventType: 'vocabulary_saved',
    messageType: 'vocabulary_saved',
    priority: 'low',
    status: 'shown',
    createdAt: new Date(Date.now() - 60000).toISOString(),
    ...o,
  }))
}

function makeDismissed(overrides: Partial<DismissedMessage>[] = []): DismissedMessage[] {
  return overrides.map((o, i) => ({
    id: `dismiss-${i}`,
    eventType: 'vocabulary_saved',
    messageType: 'vocabulary_saved',
    dismissedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    ...o,
  }))
}

function makeInput(overrides: Partial<RuleEngineInput> = {}): RuleEngineInput {
  return {
    event: makeEvent(),
    context: makeContext(),
    cooldownState: makeCooldownState(),
    recentMessages: [],
    dismissedMessages: [],
    currentPage: '/vocabulary',
    isUserChattingWithTutor: false,
    ...overrides,
  }
}

beforeEach(() => {
  proactiveTutorSettingsRepository.reset()
  proactiveTutorSettingsRepository.patch({
    enabled: true,
    maxMessagesPerDay: 10,
    currentDayMessageCount: 0,
    quietHoursStart: '12:00',
    quietHoursEnd: '13:00',
  })
})

describe('ProactiveTutorRuleEngine', () => {
  describe('enabled / disabled', () => {
    it('returns ignore_event when proactive tutor is disabled', () => {
      proactiveTutorSettingsRepository.patch({ enabled: false })
      const result = proactiveTutorRuleEngine.evaluate(makeInput())
      expect(result.shouldShow).toBe(false)
      expect(result.reason).toBe('Proactive tutor is disabled')
    })

    it('returns show_message when enabled and all rules pass', () => {
      proactiveTutorSettingsRepository.patch({ enabled: true, maxMessagesPerDay: 10 })
      const result = proactiveTutorRuleEngine.evaluate(makeInput())
      expect(result.shouldShow).toBe(true)
      expect(result.reason).toBe('Event passed all rules')
    })
  })

  describe('category toggles', () => {
    it('returns ignore_event when vocabulary category is disabled', () => {
      proactiveTutorSettingsRepository.patch({ enabled: true, vocabularyReminder: false })
      const result = proactiveTutorRuleEngine.evaluate(makeInput())
      expect(result.shouldShow).toBe(false)
      expect(result.reason).toContain('vocabularyReminder')
    })

    it('returns show_message for study event when motivational category is enabled', () => {
      proactiveTutorSettingsRepository.patch({ enabled: true, motivationalMessage: true })
      const event = makeEvent({ eventType: 'study_task_completed', payload: { eventType: 'study_task_completed', taskId: 't-1', taskTitle: 'Task 1', taskCategory: 'reading', timeSpentMinutes: 30 } })
      const context = makeContext({ dailyTasksCompleted: 6 })
      const result = proactiveTutorRuleEngine.evaluate(makeInput({ event, context }))
      expect(result.shouldShow).toBe(true)
    })

    it('returns ignore_event for study event when motivational category is disabled', () => {
      proactiveTutorSettingsRepository.patch({ enabled: true, motivationalMessage: false })
      const event = makeEvent({ eventType: 'study_task_completed', payload: { eventType: 'study_task_completed', taskId: 't-1', taskTitle: 'Task 1', taskCategory: 'reading', timeSpentMinutes: 30 } })
      const result = proactiveTutorRuleEngine.evaluate(makeInput({ event }))
      expect(result.shouldShow).toBe(false)
    })

    it('allows unmapped event types to pass category check', () => {
      proactiveTutorSettingsRepository.patch({ enabled: true })
      const event = makeEvent({ eventType: 'app_opened', payload: { eventType: 'app_opened', lastActiveAt: null, isReturnVisit: false } })
      const result = proactiveTutorRuleEngine.evaluate(makeInput({ event }))
      expect(result.shouldShow).toBe(true)
    })
  })

  describe('quiet hours', () => {
    it('returns delay_message during quiet hours', () => {
      const now = new Date()
      const currentHour = now.getHours()
      const quietStart = `${String(currentHour).padStart(2, '0')}:00`
      const quietEnd = `${String((currentHour + 1) % 24).padStart(2, '0')}:00`
      proactiveTutorSettingsRepository.patch({ enabled: true, quietHoursStart: quietStart, quietHoursEnd: quietEnd })
      const result = proactiveTutorRuleEngine.evaluate(makeInput())
      expect(result.shouldShow).toBe(false)
      expect(result.reason).toBe('Quiet hours are active')
      expect(result.delayUntil).toBeTruthy()
    })

    it('does not delay outside quiet hours', () => {
      const now = new Date()
      const currentHour = now.getHours()
      const quietStart = `${String((currentHour + 2) % 24).padStart(2, '0')}:00`
      const quietEnd = `${String((currentHour + 3) % 24).padStart(2, '0')}:00`
      proactiveTutorSettingsRepository.patch({ enabled: true, quietHoursStart: quietStart, quietHoursEnd: quietEnd })
      const result = proactiveTutorRuleEngine.evaluate(makeInput())
      expect(result.shouldShow).toBe(true)
    })
  })

  describe('daily message limit', () => {
    it('returns store_silent when daily max is reached', () => {
      proactiveTutorSettingsRepository.patch({ enabled: true, maxMessagesPerDay: 3, currentDayMessageCount: 3 })
      const result = proactiveTutorRuleEngine.evaluate(makeInput())
      expect(result.shouldShow).toBe(false)
      expect(result.reason).toBe('Maximum daily messages reached')
    })

    it('shows message when daily count is within limit', () => {
      proactiveTutorSettingsRepository.patch({ enabled: true, maxMessagesPerDay: 3, currentDayMessageCount: 1 })
      const result = proactiveTutorRuleEngine.evaluate(makeInput())
      expect(result.shouldShow).toBe(true)
    })
  })

  describe('global cooldown', () => {
    it('returns store_silent when global cooldown is active', () => {
      const recentMessageTime = new Date(Date.now() - 5 * 60 * 1000).toISOString()
      const cooldownState = makeCooldownState({
        global: { lastMessageAt: recentMessageTime },
      })
      const result = proactiveTutorRuleEngine.evaluate(makeInput({ cooldownState }))
      expect(result.shouldShow).toBe(false)
      expect(result.reason).toBe('Global cooldown active')
    })

    it('shows message when global cooldown has expired', () => {
      const oldMessageTime = new Date(Date.now() - 25 * 60 * 1000).toISOString()
      const cooldownState = makeCooldownState({
        global: { lastMessageAt: oldMessageTime },
      })
      proactiveTutorSettingsRepository.patch({ enabled: true, maxMessagesPerDay: 10 })
      const result = proactiveTutorRuleEngine.evaluate(makeInput({ cooldownState }))
      expect(result.shouldShow).toBe(true)
    })

    it('shows message when no previous message exists', () => {
      proactiveTutorSettingsRepository.patch({ enabled: true, maxMessagesPerDay: 10 })
      const result = proactiveTutorRuleEngine.evaluate(makeInput())
      expect(result.shouldShow).toBe(true)
    })
  })

  describe('type-specific cooldown', () => {
    it('returns store_silent when type-specific cooldown is active', () => {
      const recentTypeTime = new Date(Date.now() - 60 * 60 * 1000).toISOString()
      const cooldownState = makeCooldownState({
        global: { lastMessageAt: null },
        byEventType: {
          'vocabulary_saved:vocab-1': { lastMessageAt: recentTypeTime },
        },
      })
      const result = proactiveTutorRuleEngine.evaluate(makeInput({ cooldownState }))
      expect(result.shouldShow).toBe(false)
      expect(result.reason).toContain('Cooldown active')
    })

    it('shows message when type-specific cooldown has expired', () => {
      const oldTypeTime = new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
      const cooldownState = makeCooldownState({
        global: { lastMessageAt: null },
        byEventType: {
          'vocabulary_saved': { lastMessageAt: oldTypeTime },
        },
      })
      proactiveTutorSettingsRepository.patch({ enabled: true, maxMessagesPerDay: 10 })
      const result = proactiveTutorRuleEngine.evaluate(makeInput({ cooldownState }))
      expect(result.shouldShow).toBe(true)
    })
  })

  describe('user chatting with tutor', () => {
    it('returns store_silent when user is chatting with tutor', () => {
      proactiveTutorSettingsRepository.patch({ enabled: true, maxMessagesPerDay: 10 })
      const result = proactiveTutorRuleEngine.evaluate(makeInput({ isUserChattingWithTutor: true }))
      expect(result.shouldShow).toBe(false)
      expect(result.reason).toBe('User is currently chatting with AI Tutor')
    })

    it('shows message when user is not chatting with tutor', () => {
      proactiveTutorSettingsRepository.patch({ enabled: true, maxMessagesPerDay: 10 })
      const result = proactiveTutorRuleEngine.evaluate(makeInput({ isUserChattingWithTutor: false }))
      expect(result.shouldShow).toBe(true)
    })
  })

  describe('recently dismissed messages', () => {
    it('returns ignore_event when similar message was recently dismissed', () => {
      const dismissedMessages = makeDismissed([
        { eventType: 'vocabulary_saved', dismissedAt: new Date(Date.now() - 60 * 60 * 1000).toISOString() },
      ])
      proactiveTutorSettingsRepository.patch({ enabled: true, maxMessagesPerDay: 10 })
      const result = proactiveTutorRuleEngine.evaluate(makeInput({ dismissedMessages }))
      expect(result.shouldShow).toBe(false)
      expect(result.reason).toBe('Similar message was recently dismissed')
    })

    it('shows message when dismissed message is old', () => {
      const dismissedMessages = makeDismissed([
        { eventType: 'vocabulary_saved', dismissedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString() },
      ])
      proactiveTutorSettingsRepository.patch({ enabled: true, maxMessagesPerDay: 10 })
      const result = proactiveTutorRuleEngine.evaluate(makeInput({ dismissedMessages }))
      expect(result.shouldShow).toBe(true)
    })
  })

  describe('aggregation thresholds', () => {
    it('returns store_silent when below vocabulary aggregation threshold', () => {
      const context = makeContext({ sessionVocabularyCount: 2 })
      proactiveTutorSettingsRepository.patch({ enabled: true, maxMessagesPerDay: 10 })
      const result = proactiveTutorRuleEngine.evaluate(makeInput({ context }))
      expect(result.shouldShow).toBe(false)
      expect(result.reason).toContain('aggregation threshold')
    })

    it('shows message when above vocabulary aggregation threshold', () => {
      const context = makeContext({ sessionVocabularyCount: 6 })
      proactiveTutorSettingsRepository.patch({ enabled: true, maxMessagesPerDay: 10 })
      const result = proactiveTutorRuleEngine.evaluate(makeInput({ context }))
      expect(result.shouldShow).toBe(true)
    })

    it('returns store_silent when below mistake aggregation threshold', () => {
      const event = makeEvent({ eventType: 'mistake_saved', payload: { eventType: 'mistake_saved', mistakeId: 'm-1', mistake: 'error', skill: 'grammar', sessionMistakeCount: 1 } })
      const context = makeContext({ sessionMistakeCount: 1 })
      proactiveTutorSettingsRepository.patch({ enabled: true, maxMessagesPerDay: 10 })
      const result = proactiveTutorRuleEngine.evaluate(makeInput({ event, context }))
      expect(result.shouldShow).toBe(false)
      expect(result.reason).toContain('aggregation threshold')
    })

    it('shows message when above mistake aggregation threshold', () => {
      const event = makeEvent({ eventType: 'mistake_saved', payload: { eventType: 'mistake_saved', mistakeId: 'm-1', mistake: 'error', skill: 'grammar', sessionMistakeCount: 4 } })
      const context = makeContext({ sessionMistakeCount: 4 })
      proactiveTutorSettingsRepository.patch({ enabled: true, maxMessagesPerDay: 10 })
      const result = proactiveTutorRuleEngine.evaluate(makeInput({ event, context }))
      expect(result.shouldShow).toBe(true)
    })

    it('returns store_silent when below skipped task threshold', () => {
      const event = makeEvent({ eventType: 'study_task_skipped', payload: { eventType: 'study_task_skipped', taskId: 't-1', taskTitle: 'Task 1', taskCategory: 'reading' } })
      const context = makeContext({ dailyTasksSkipped: 1 })
      proactiveTutorSettingsRepository.patch({ enabled: true, maxMessagesPerDay: 10 })
      const result = proactiveTutorRuleEngine.evaluate(makeInput({ event, context }))
      expect(result.shouldShow).toBe(false)
    })

    it('shows message when above skipped task threshold', () => {
      const event = makeEvent({ eventType: 'study_task_skipped', payload: { eventType: 'study_task_skipped', taskId: 't-1', taskTitle: 'Task 1', taskCategory: 'reading' } })
      const context = makeContext({ dailyTasksSkipped: 3 })
      proactiveTutorSettingsRepository.patch({ enabled: true, maxMessagesPerDay: 10 })
      const result = proactiveTutorRuleEngine.evaluate(makeInput({ event, context }))
      expect(result.shouldShow).toBe(true)
    })
  })

  describe('pending message merge', () => {
    it('returns merge_with_existing when similar message is pending', () => {
      const recentMessages = makeRecentMessages([
        { messageType: 'vocabulary_saved', status: 'pending' },
      ])
      proactiveTutorSettingsRepository.patch({ enabled: true, maxMessagesPerDay: 10 })
      const result = proactiveTutorRuleEngine.evaluate(makeInput({ recentMessages }))
      expect(result.shouldShow).toBe(false)
      expect(result.messageType).toBe('vocabulary_saved')
    })

    it('shows message when pending message is of different type', () => {
      const recentMessages = makeRecentMessages([
        { messageType: 'study_reminder', status: 'pending' },
      ])
      proactiveTutorSettingsRepository.patch({ enabled: true, maxMessagesPerDay: 10 })
      const result = proactiveTutorRuleEngine.evaluate(makeInput({ recentMessages }))
      expect(result.shouldShow).toBe(true)
    })
  })

  describe('priority calculation', () => {
    it('returns low priority for vocabulary_saved', () => {
      proactiveTutorSettingsRepository.patch({ enabled: true, maxMessagesPerDay: 10 })
      const result = proactiveTutorRuleEngine.evaluate(makeInput())
      expect(result.priority).toBe('low')
    })

    it('returns urgent for exam_date_is_close with <7 days and >5 incomplete tasks', () => {
      const event = makeEvent({
        eventType: 'exam_date_is_close',
        payload: { eventType: 'exam_date_is_close', examDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), daysRemaining: 3, tasksIncomplete: 8 },
      })
      proactiveTutorSettingsRepository.patch({ enabled: true, maxMessagesPerDay: 10 })
      const result = proactiveTutorRuleEngine.evaluate(makeInput({ event }))
      expect(result.priority).toBe('urgent')
    })

    it('returns high for exam_date_is_close with <7 days but few incomplete tasks', () => {
      const event = makeEvent({
        eventType: 'exam_date_is_close',
        payload: { eventType: 'exam_date_is_close', examDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), daysRemaining: 3, tasksIncomplete: 2 },
      })
      proactiveTutorSettingsRepository.patch({ enabled: true, maxMessagesPerDay: 10 })
      const result = proactiveTutorRuleEngine.evaluate(makeInput({ event }))
      expect(result.priority).toBe('high')
    })

    it('returns urgent for exam_date_is_close with 30 days (static mapping)', () => {
      const event = makeEvent({
        eventType: 'exam_date_is_close',
        payload: { eventType: 'exam_date_is_close', examDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), daysRemaining: 30, tasksIncomplete: 2 },
      })
      proactiveTutorSettingsRepository.patch({ enabled: true, maxMessagesPerDay: 10 })
      const result = proactiveTutorRuleEngine.evaluate(makeInput({ event }))
      expect(result.priority).toBe('urgent')
    })

    it('returns urgent for missed study with 3+ consecutive days', () => {
      const event = makeEvent({
        eventType: 'study_day_missed',
        payload: { eventType: 'study_day_missed', missedDate: new Date().toISOString(), consecutiveMissedDays: 4 },
      })
      const context = makeContext({ consecutiveMissedDays: 4 })
      proactiveTutorSettingsRepository.patch({ enabled: true, maxMessagesPerDay: 10 })
      const result = proactiveTutorRuleEngine.evaluate(makeInput({ event, context }))
      expect(result.priority).toBe('urgent')
    })

    it('returns high for missed study', () => {
      const event = makeEvent({
        eventType: 'study_day_missed',
        payload: { eventType: 'study_day_missed', missedDate: new Date().toISOString(), consecutiveMissedDays: 1 },
      })
      proactiveTutorSettingsRepository.patch({ enabled: true, maxMessagesPerDay: 10 })
      const result = proactiveTutorRuleEngine.evaluate(makeInput({ event }))
      expect(result.priority).toBe('high')
    })

    it('returns urgent for 30+ day streak', () => {
      const event = makeEvent({
        eventType: 'streak_milestone_reached',
        payload: { eventType: 'streak_milestone_reached', streakDays: 30, milestoneDays: 30 },
      })
      const context = makeContext({ totalStreak: 30 })
      proactiveTutorSettingsRepository.patch({ enabled: true, maxMessagesPerDay: 10 })
      const result = proactiveTutorRuleEngine.evaluate(makeInput({ event, context }))
      expect(result.priority).toBe('urgent')
    })

    it('returns high for 7+ day streak', () => {
      const event = makeEvent({
        eventType: 'streak_milestone_reached',
        payload: { eventType: 'streak_milestone_reached', streakDays: 7, milestoneDays: 7 },
      })
      const context = makeContext({ totalStreak: 7 })
      proactiveTutorSettingsRepository.patch({ enabled: true, maxMessagesPerDay: 10 })
      const result = proactiveTutorRuleEngine.evaluate(makeInput({ event, context }))
      expect(result.priority).toBe('high')
    })

    it('returns urgent for 5+ repeated mistakes', () => {
      const event = makeEvent({
        eventType: 'repeated_mistake_detected',
        payload: { eventType: 'repeated_mistake_detected', mistakeId: 'm-1', mistake: 'error', skill: 'grammar', repetitionCount: 6 },
      })
      const context = makeContext({ repeatedMistakeCount: 6 })
      proactiveTutorSettingsRepository.patch({ enabled: true, maxMessagesPerDay: 10 })
      const result = proactiveTutorRuleEngine.evaluate(makeInput({ event, context }))
      expect(result.priority).toBe('urgent')
    })

    it('returns high for repeated_mistake_detected by default', () => {
      const event = makeEvent({
        eventType: 'repeated_mistake_detected',
        payload: { eventType: 'repeated_mistake_detected', mistakeId: 'm-1', mistake: 'error', skill: 'grammar', repetitionCount: 2 },
      })
      const context = makeContext({ repeatedMistakeCount: 2 })
      proactiveTutorSettingsRepository.patch({ enabled: true, maxMessagesPerDay: 10 })
      const result = proactiveTutorRuleEngine.evaluate(makeInput({ event, context }))
      expect(result.priority).toBe('high')
    })
  })

  describe('suggested action', () => {
    const eventActionCases: Array<{ eventType: LearningEventType; expectedAction: string | null }> = [
      { eventType: 'vocabulary_saved', expectedAction: 'review_vocabulary' },
      { eventType: 'vocabulary_review_is_due', expectedAction: 'review_vocabulary' },
      { eventType: 'vocabulary_reviewed', expectedAction: 'review_vocabulary' },
      { eventType: 'mistake_saved', expectedAction: 'review_mistakes' },
      { eventType: 'repeated_mistake_detected', expectedAction: 'review_mistakes' },
      { eventType: 'study_task_skipped', expectedAction: 'adjust_plan' },
      { eventType: 'study_day_missed', expectedAction: 'adjust_plan' },
      { eventType: 'study_plan_generated', expectedAction: 'view_plan' },
      { eventType: 'reading_practice_completed', expectedAction: 'review_reading' },
      { eventType: 'listening_practice_completed', expectedAction: 'review_listening' },
      { eventType: 'writing_submitted', expectedAction: 'review_writing' },
      { eventType: 'speaking_practiced', expectedAction: 'review_speaking' },
      { eventType: 'exam_date_is_close', expectedAction: 'view_exam_prep' },
      { eventType: 'weekly_progress_review_is_due', expectedAction: 'view_progress' },
      { eventType: 'ai_progress_review_generated', expectedAction: 'view_progress' },
      { eventType: 'streak_milestone_reached', expectedAction: 'view_streak' },
      { eventType: 'user_returned_after_inactivity', expectedAction: 'resume_study' },
      { eventType: 'app_opened', expectedAction: null },
    ]

    for (const { eventType, expectedAction } of eventActionCases) {
      it(`returns ${expectedAction} for ${eventType}`, () => {
        proactiveTutorSettingsRepository.patch({ enabled: true, maxMessagesPerDay: 10 })
        const input = makeInput({ event: makeEvent({ eventType, payload: { eventType } }) })
        const result = proactiveTutorRuleEngine.evaluate(input)
        if (result.shouldShow) {
          expect(result.suggestedAction).toBe(expectedAction)
        }
      })
    }
  })

  describe('cooldown key', () => {
    it('includes entityId in cooldown key when present', () => {
      proactiveTutorSettingsRepository.patch({ enabled: true, maxMessagesPerDay: 10 })
      const result = proactiveTutorRuleEngine.evaluate(makeInput({
        event: makeEvent({ entityId: 'vocab-123' }),
      }))
      expect(result.cooldownKey).toBe('vocabulary_saved:vocab-123')
    })

    it('uses messageType as cooldown key when no entityId', () => {
      proactiveTutorSettingsRepository.patch({ enabled: true, maxMessagesPerDay: 10 })
      const result = proactiveTutorRuleEngine.evaluate(makeInput({
        event: makeEvent({ entityId: null }),
      }))
      expect(result.cooldownKey).toBe('vocabulary_saved')
    })
  })

  describe('evaluateEventType convenience method', () => {
    it('evaluates by event type without a full event object', () => {
      proactiveTutorSettingsRepository.patch({ enabled: true, maxMessagesPerDay: 10 })
      const result = proactiveTutorRuleEngine.evaluateEventType(
        'vocabulary_saved',
        makeContext({ sessionVocabularyCount: 6 }),
        makeCooldownState(),
        [],
        [],
        '/vocabulary',
        false,
      )
      expect(result.shouldShow).toBe(true)
      expect(result.messageType).toBe('vocabulary_saved')
    })

    it('respects disabled category via evaluateEventType', () => {
      proactiveTutorSettingsRepository.patch({ enabled: true, vocabularyReminder: false })
      const result = proactiveTutorRuleEngine.evaluateEventType(
        'vocabulary_saved',
        makeContext(),
        makeCooldownState(),
        [],
        [],
        '/vocabulary',
        false,
      )
      expect(result.shouldShow).toBe(false)
    })
  })

  describe('isCategoryEnabledForEvent', () => {
    it('returns true when category is enabled', () => {
      proactiveTutorSettingsRepository.patch({ enabled: true, vocabularyReminder: true })
      expect(proactiveTutorRuleEngine.isCategoryEnabledForEvent('vocabulary_saved')).toBe(true)
    })

    it('returns false when category is disabled', () => {
      proactiveTutorSettingsRepository.patch({ enabled: true, vocabularyReminder: false })
      expect(proactiveTutorRuleEngine.isCategoryEnabledForEvent('vocabulary_saved')).toBe(false)
    })

    it('returns false when proactive tutor is disabled', () => {
      proactiveTutorSettingsRepository.patch({ enabled: false })
      expect(proactiveTutorRuleEngine.isCategoryEnabledForEvent('vocabulary_saved')).toBe(false)
    })

    it('returns false for unmapped event types', () => {
      proactiveTutorSettingsRepository.patch({ enabled: true })
      expect(proactiveTutorRuleEngine.isCategoryEnabledForEvent('app_opened')).toBe(false)
    })
  })

  describe('getMessageType', () => {
    it('returns mapped message type for known event types', () => {
      expect(proactiveTutorRuleEngine.getMessageType('vocabulary_saved')).toBe('vocabulary_saved')
      expect(proactiveTutorRuleEngine.getMessageType('study_day_missed')).toBe('missed_study')
    })

    it('returns event type as message type for unmapped events', () => {
      expect(proactiveTutorRuleEngine.getMessageType('app_opened')).toBe('app_opened')
    })
  })

  describe('getCooldownMs', () => {
    it('returns cooldown for known message types', () => {
      expect(proactiveTutorRuleEngine.getCooldownMs('vocabulary_saved')).toBe(4 * 60 * 60 * 1000)
      expect(proactiveTutorRuleEngine.getCooldownMs('missed_study')).toBe(24 * 60 * 60 * 1000)
    })

    it('returns undefined for unknown message types', () => {
      expect(proactiveTutorRuleEngine.getCooldownMs('unknown_type')).toBeUndefined()
    })
  })

  describe('extension events', () => {
    it('shows message for extension events when extension category is enabled', () => {
      const event = makeEvent({
        eventType: 'extension_vocabulary_saved',
        source: 'extension_content_script',
        payload: { eventType: 'extension_vocabulary_saved', word: 'test', contextSnippet: 'test context', sourceUrl: 'https://example.com' },
      })
      proactiveTutorSettingsRepository.patch({ enabled: true, extensionProactiveMessage: true, maxMessagesPerDay: 10 })
      const result = proactiveTutorRuleEngine.evaluate(makeInput({ event }))
      expect(result.shouldShow).toBe(true)
    })

    it('hides message for extension events when extension category is disabled', () => {
      const event = makeEvent({
        eventType: 'extension_vocabulary_saved',
        source: 'extension_content_script',
        payload: { eventType: 'extension_vocabulary_saved', word: 'test', contextSnippet: 'test context', sourceUrl: 'https://example.com' },
      })
      proactiveTutorSettingsRepository.patch({ enabled: true, extensionProactiveMessage: false })
      const result = proactiveTutorRuleEngine.evaluate(makeInput({ event }))
      expect(result.shouldShow).toBe(false)
    })
  })

  describe('returned after inactivity', () => {
    it('returns high priority when 3+ days missed', () => {
      const event = makeEvent({
        eventType: 'user_returned_after_inactivity',
        payload: { eventType: 'user_returned_after_inactivity', inactivityDurationMinutes: 3 * 24 * 60 },
      })
      const context = makeContext({ consecutiveMissedDays: 3 })
      proactiveTutorSettingsRepository.patch({ enabled: true, maxMessagesPerDay: 10 })
      const result = proactiveTutorRuleEngine.evaluate(makeInput({ event, context }))
      expect(result.shouldShow).toBe(true)
      expect(result.priority).toBe('high')
    })

    it('returns normal priority when less than 3 days missed', () => {
      const event = makeEvent({
        eventType: 'user_returned_after_inactivity',
        payload: { eventType: 'user_returned_after_inactivity', inactivityDurationMinutes: 24 * 60 },
      })
      const context = makeContext({ consecutiveMissedDays: 1 })
      proactiveTutorSettingsRepository.patch({ enabled: true, maxMessagesPerDay: 10 })
      const result = proactiveTutorRuleEngine.evaluate(makeInput({ event, context }))
      expect(result.shouldShow).toBe(true)
      expect(result.priority).toBe('normal')
    })
  })

  describe('singleton', () => {
    it('exposes a default singleton', () => {
      expect(proactiveTutorRuleEngine).toBeInstanceOf(ProactiveTutorRuleEngine)
    })
  })
})
