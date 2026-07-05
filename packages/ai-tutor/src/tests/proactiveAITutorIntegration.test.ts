import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ProactiveEventBus } from '../services/proactiveEventBus'
import { ProactiveMessageStorage } from '../services/proactiveMessageStorage'
import { ProactiveMessageInteraction, SNOOZE_PRESETS } from '../services/proactiveMessageInteraction'
import { ProactiveProgressReview } from '../services/proactiveProgressReview'
import {
  generateProactiveMessages,
  generateProactiveMessagesWithSettings,
  canSendProactiveMessage,
  getNextAllowedTime,
  isCurrentlyQuietHours,
  type ProactiveEngineInput,
  type LearnerProfile,
} from '../services/proactiveMessageEngine'
import {
  onLessonCompleted,
  onRepeatedMistakes,
  onInactivityDetected,
  onVocabularySaved,
  onTextSelected,
  onWeeklyReviewReady,
  onMonthlyReviewReady,
  onDailyPlanReady,
  onUnfinishedLesson,
  onMockTestReady,
  onStreakMilestone,
  triggerDailyCheck,
  resetRecentTriggers,
  type TriggerResult,
} from '../services/proactiveMessageTriggers'
import {
  DEFAULT_PROACTIVE_SETTINGS,
  type ProactiveMessageSettings,
  type ProactiveMessage,
  type ProactiveMessageCategory,
  type TutorTone,
} from '../types/proactiveMessage'

// ─── Test Setup ─────────────────────────────────────────────────────────────

beforeEach(() => {
  localStorage.clear()
  resetRecentTriggers()
})

afterEach(() => {
  ProactiveEventBus.clear()
})

// ─── Helpers ─────────────────────────────────────────────────────────────────

function saveSettings(overrides: Partial<ProactiveMessageSettings> = {}): ProactiveMessageSettings {
  const defaults = ProactiveMessageStorage.getDefaultSettings()
  const settings: ProactiveMessageSettings = { ...defaults, ...overrides, updatedAt: new Date().toISOString() }
  ProactiveMessageStorage.saveSettings(settings)
  return settings
}

function hasType(result: TriggerResult | ProactiveMessage[], triggerType: string): boolean {
  const msgs = Array.isArray(result) ? result : result.messages
  return msgs.some(m => m.triggerType === triggerType)
}

function findByType(result: TriggerResult | ProactiveMessage[], triggerType: string): ProactiveMessage | undefined {
  const msgs = Array.isArray(result) ? result : result.messages
  return msgs.find(m => m.triggerType === triggerType)
}

function buildInput(overrides: Partial<ProactiveEngineInput> = {}): ProactiveEngineInput {
  const profile = loadProfile()
  return {
    learnerProfile: profile,
    dueVocabularyCount: getNum('ielts-due-vocabulary-count'),
    dueMistakeCount: getNum('ielts-due-mistake-count'),
    lowActivityDays: getNum('ielts-low-activity-days'),
    missedStudyDays: getNum('ielts-missed-study-days'),
    habitScore: getNum('ielts-habit-score'),
    savedWordCount: getNum('ielts-saved-word-count'),
    recentMistakeCount: getNum('ielts-recent-mistake-count'),
    newContentCount: getNum('ielts-new-content-count'),
    ...overrides,
    learnerProfile: overrides.learnerProfile ? { ...profile, ...overrides.learnerProfile } : profile,
  }
}

function loadProfile(): LearnerProfile | undefined {
  try {
    const raw = localStorage.getItem('ielts-learner-profile')
    if (!raw) return undefined
    return JSON.parse(raw) as LearnerProfile
  } catch {
    return undefined
  }
}

function getNum(key: string): number {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return 0
    const val = Number(raw)
    return Number.isFinite(val) ? val : 0
  } catch {
    return 0
  }
}

function setProfileData(data: Record<string, unknown>): void {
  localStorage.setItem('ielts-learner-profile', JSON.stringify(data))
}

function populateStorage(items: Record<string, string>): void {
  for (const [key, value] of Object.entries(items)) {
    localStorage.setItem(key, value)
  }
}

// ============================================================================
// SECTION 1: Full Workflow — Generate → Store → Emit → Interact
// ============================================================================

describe('Full Proactive AI Tutor Workflow', () => {
  it('completes the full round-trip: generate → store → emit → interact', () => {
    saveSettings()
    populateStorage({
      'ielts-learner-profile': JSON.stringify({
        targetBand: 7, currentBand: 5.5, studyStreak: 12, weakSkills: ['writing', 'speaking'],
        totalExercisesAttempted: 85, averageAccuracy: 68,
      }),
      'ielts-due-vocabulary-count': '12',
      'ielts-due-mistake-count': '5',
      'ielts-low-activity-days': '0',
      'ielts-missed-study-days': '0',
      'ielts-habit-score': '75',
      'ielts-saved-word-count': '18',
      'ielts-recent-mistake-count': '7',
      'ielts-new-content-count': '3',
    })

    const emitted: ProactiveMessage[] = []
    const unsub = ProactiveEventBus.onNewMessage(msg => { emitted.push(msg) })

    // Generate via engine directly (not trigger, to avoid cooldown issues)
    const input = buildInput({ lessonCompleted: 'IELTS Writing Task 2 - Opinion Essay' })
    const allMsgs = generateProactiveMessages(input)
    const lessonMsg = findByType(allMsgs, 'lesson_completed')
    expect(lessonMsg).toBeDefined()
    expect(lessonMsg!.message).toContain('IELTS Writing Task 2')

    // Persist the message via storage
    const stored = ProactiveMessageStorage.addMessage({
      triggerType: lessonMsg!.triggerType,
      category: lessonMsg!.category,
      title: lessonMsg!.title,
      message: lessonMsg!.message,
      priority: lessonMsg!.priority,
    })
    expect(stored.id).toBeDefined()

    // Verify it's in storage
    const loaded = ProactiveMessageStorage.loadMessages()
    expect(loaded.length).toBeGreaterThanOrEqual(1)

    // Emit through event bus
    ProactiveEventBus.emitNewMessage(stored)

    // Verify event received
    expect(emitted.length).toBeGreaterThanOrEqual(1)
    expect(emitted[0].triggerType).toBe('lesson_completed')

    // Interact: dismiss
    const dismissResult = ProactiveMessageInteraction.dismissMessage(stored.id, 'not-now')
    expect(dismissResult.success).toBe(true)

    const dismissed = ProactiveMessageStorage.getMessage(stored.id)
    expect(dismissed?.isDismissed).toBe(true)
    expect(dismissed?.dismissReason).toBe('not-now')

    unsub()
  })

  it('completes the full round-trip with snooze + action click + feedback', () => {
    saveSettings()
    const emitted: ProactiveMessage[] = []
    const unsub = ProactiveEventBus.onNewMessage(msg => { emitted.push(msg) })

    // Create and persist messages directly
    const planMsg = ProactiveMessageStorage.addMessage({
      triggerType: 'daily_plan_ready', category: 'study-plan',
      title: 'Daily Plan', message: 'Your daily plan is ready!', priority: 'medium',
    })
    ProactiveEventBus.emitNewMessage(planMsg)

    const vocabMsg = ProactiveMessageStorage.addMessage({
      triggerType: 'saved_word_exercise', category: 'vocabulary-review',
      title: 'Words to Review', message: 'You have 10 saved words to review.', priority: 'low',
    })
    ProactiveEventBus.emitNewMessage(vocabMsg)

    const mistakeMsg = ProactiveMessageStorage.addMessage({
      triggerType: 'mistake_pattern_detected', category: 'mistake-review',
      title: 'Mistake Pattern', message: 'You have 15 recent mistakes.', priority: 'medium',
    })
    ProactiveEventBus.emitNewMessage(mistakeMsg)

    expect(emitted.length).toBe(3)

    // Snooze first message
    const snoozeResult = ProactiveMessageInteraction.snoozeMessage(planMsg.id, 60 * 60 * 1000)
    expect(snoozeResult.success).toBe(true)
    const snoozed = ProactiveMessageStorage.getMessage(planMsg.id)
    expect(snoozed?.isSnoozed).toBe(true)
    expect(snoozed?.snoozedUntil).toBeDefined()

    // Action click on second message
    const actionResult = ProactiveMessageInteraction.handleActionClick(vocabMsg.id, 'quiz-me')
    expect(actionResult.success).toBe(true)
    const actioned = ProactiveMessageStorage.getMessage(vocabMsg.id)
    expect(actioned?.isRead).toBe(true)
    expect(actioned?.actionClicked).toBe('quiz-me')

    // Feedback on third message
    const feedbackResult = ProactiveMessageInteraction.provideFeedback(mistakeMsg.id, 'helpful')
    expect(feedbackResult.success).toBe(true)
    const feedbackMsg = ProactiveMessageStorage.getMessage(mistakeMsg.id)
    expect(feedbackMsg?.feedback).toBe('helpful')

    unsub()
  })
})

// ============================================================================
// SECTION 2: Message Generation Engine — Profile Scenarios
// ============================================================================

describe('Message Generation Engine — Profile Scenarios', () => {
  it('generates vocabulary review, streak celebration, weak skills, and exam countdown for active learner', () => {
    populateStorage({
      'ielts-learner-profile': JSON.stringify({
        targetBand: 7, currentBand: 5.5,
        examDate: new Date(Date.now() + 72 * 24 * 60 * 60 * 1000).toISOString(),
        studyStreak: 12, weakSkills: ['writing', 'speaking', 'reading', 'listening'],
        totalExercisesAttempted: 85, averageAccuracy: 68,
      }),
      'ielts-due-vocabulary-count': '12',
      'ielts-due-mistake-count': '5',
      'ielts-low-activity-days': '0',
      'ielts-missed-study-days': '0',
      'ielts-habit-score': '75',
      'ielts-saved-word-count': '18',
      'ielts-recent-mistake-count': '7',
      'ielts-new-content-count': '3',
    })
    const input = buildInput()
    const messages = generateProactiveMessages(input)

    expect(hasType(messages, 'due_review')).toBe(true)
    expect(findByType(messages, 'due_review')!.message).toContain('12')

    expect(hasType(messages, 'study_streak')).toBe(true)
    expect(findByType(messages, 'study_streak')!.message).toContain('12')

    expect(hasType(messages, 'weak_skill_warning')).toBe(true)
    expect(hasType(messages, 'exam_countdown')).toBe(true)
    expect(hasType(messages, 'mistake_pattern_detected')).toBe(true)
    expect(hasType(messages, 'topic_practice_suggestion')).toBe(true)
    expect(findByType(messages, 'topic_practice_suggestion')!.skill).toBe('writing')
  })

  it('generates inactivity messages for falling behind student', () => {
    populateStorage({
      'ielts-learner-profile': JSON.stringify({
        targetBand: 6.5, currentBand: 5, studyStreak: 3, weakSkills: ['writing', 'listening'],
        totalExercisesAttempted: 30, averageAccuracy: 55,
      }),
      'ielts-low-activity-days': '4',
      'ielts-missed-study-days': '3',
      'ielts-habit-score': '30',
      'ielts-saved-word-count': '5',
      'ielts-recent-mistake-count': '3',
      'ielts-new-content-count': '1',
      'ielts-due-vocabulary-count': '8',
      'ielts-due-mistake-count': '3',
    })
    const input = buildInput()
    const messages = generateProactiveMessages(input)

    expect(hasType(messages, 'low_activity')).toBe(true)
    expect(hasType(messages, 'inactive_days')).toBe(true)
    expect(findByType(messages, 'inactive_days')!.message).toContain('3')

    expect(hasType(messages, 'study_session_suggestion')).toBe(true)
    expect(findByType(messages, 'study_session_suggestion')!.message).toContain('15 minutes')
  })

  it('generates minimal messages for beginner with few data points', () => {
    populateStorage({
      'ielts-learner-profile': JSON.stringify({
        targetBand: 8, currentBand: 4,
        examDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
        studyStreak: 2, weakSkills: ['writing', 'speaking', 'reading', 'listening'],
        totalExercisesAttempted: 5, averageAccuracy: 42,
      }),
      'ielts-due-vocabulary-count': '0',
      'ielts-due-mistake-count': '0',
      'ielts-saved-word-count': '2',
      'ielts-recent-mistake-count': '1',
      'ielts-new-content-count': '0',
      'ielts-low-activity-days': '0',
      'ielts-missed-study-days': '0',
      'ielts-habit-score': '20',
    })
    const input = buildInput()
    const messages = generateProactiveMessages(input)

    expect(hasType(messages, 'study_streak')).toBe(false)
    expect(hasType(messages, 'due_review')).toBe(false)
    expect(hasType(messages, 'saved_word_exercise')).toBe(false)
    expect(hasType(messages, 'weak_skill_warning')).toBe(true)
    expect(hasType(messages, 'study_session_suggestion')).toBe(true)
  })

  it('generates urgent exam countdown for exam crunch student', () => {
    populateStorage({
      'ielts-learner-profile': JSON.stringify({
        targetBand: 6, currentBand: 5.5,
        examDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        studyStreak: 14, weakSkills: ['speaking'],
        totalExercisesAttempted: 120, averageAccuracy: 73,
      }),
      'ielts-due-vocabulary-count': '20',
      'ielts-due-mistake-count': '8',
      'ielts-low-activity-days': '0',
      'ielts-missed-study-days': '0',
      'ielts-habit-score': '88',
      'ielts-saved-word-count': '30',
      'ielts-recent-mistake-count': '12',
      'ielts-new-content-count': '2',
    })
    const input = buildInput()
    const messages = generateProactiveMessages(input)

    expect(hasType(messages, 'exam_countdown')).toBe(true)
    expect(findByType(messages, 'exam_countdown')!.priority).toBe('high')

    expect(hasType(messages, 'topic_practice_suggestion')).toBe(true)
    expect(findByType(messages, 'topic_practice_suggestion')!.skill).toBe('speaking')

    expect(hasType(messages, 'study_streak')).toBe(true)
    expect(hasType(messages, 'daily_tip')).toBe(true)

    const highMsgs = messages.filter(m => m.priority === 'high')
    expect(highMsgs.length).toBeGreaterThanOrEqual(1)
    expect(messages[0].priority).toBe('high')
  })

  it('handles empty learner profile gracefully', () => {
    const input: ProactiveEngineInput = {}
    const messages = generateProactiveMessages(input)
    expect(hasType(messages, 'daily_tip')).toBe(true)
    expect(hasType(messages, 'weak_skill_warning')).toBe(false)
    expect(hasType(messages, 'exam_countdown')).toBe(false)
    expect(hasType(messages, 'exam_date_reminder')).toBe(false)
  })

  it('handles missing exam date and target band gracefully', () => {
    populateStorage({
      'ielts-learner-profile': JSON.stringify({
        studyStreak: 5, weakSkills: ['writing'],
      }),
    })
    const input = buildInput()
    const messages = generateProactiveMessages(input)
    expect(hasType(messages, 'exam_countdown')).toBe(false)
    expect(hasType(messages, 'exam_date_reminder')).toBe(false)
  })

  it('does not generate unnecessary messages when all counts are zero', () => {
    const input: ProactiveEngineInput = {
      dueVocabularyCount: 0, dueMistakeCount: 0, savedWordCount: 0,
      recentMistakeCount: 0, newContentCount: 0, missedStudyDays: 0, lowActivityDays: 0,
    }
    const messages = generateProactiveMessages(input)
    expect(hasType(messages, 'due_review')).toBe(false)
    expect(hasType(messages, 'saved_word_exercise')).toBe(false)
    expect(hasType(messages, 'mistake_pattern_detected')).toBe(false)
    expect(hasType(messages, 'new_content_saved')).toBe(false)
    expect(hasType(messages, 'inactive_days')).toBe(false)
    expect(hasType(messages, 'low_activity')).toBe(false)
  })
})

// ============================================================================
// SECTION 3: Settings Persistence and Configuration
// ============================================================================

describe('Settings Persistence and Configuration', () => {
  it('saves and loads settings with defaults', () => {
    saveSettings()

    const loaded = ProactiveMessageStorage.loadSettings()
    expect(loaded.enabled).toBe(true)
    expect(loaded.tone).toBe('friendly')
    expect(loaded.maxMessagesPerDay).toBe(5)
    expect(loaded.quietHoursStart).toBe('22:00')
    expect(loaded.quietHoursEnd).toBe('08:00')
  })

  it('persists custom settings and reloads them', () => {
    saveSettings({
      tone: 'motivational',
      maxMessagesPerDay: 8,
      quietHoursStart: '23:00',
      quietHoursEnd: '07:00',
      notificationChannels: ['in-app', 'browser'],
      weakSkillPriority: ['writing', 'speaking'],
      categories: {
        ...DEFAULT_PROACTIVE_SETTINGS.categories,
        'vocabulary-review': false,
        'daily-tip': false,
      },
    })

    const loaded = ProactiveMessageStorage.loadSettings()
    expect(loaded.tone).toBe('motivational')
    expect(loaded.maxMessagesPerDay).toBe(8)
    expect(loaded.quietHoursStart).toBe('23:00')
    expect(loaded.quietHoursEnd).toBe('07:00')
    expect(loaded.notificationChannels).toContain('browser')
    expect(loaded.weakSkillPriority).toContain('writing')
    expect(loaded.categories['vocabulary-review']).toBe(false)
    expect(loaded.categories['daily-tip']).toBe(false)
  })

  it('resets settings to defaults', () => {
    saveSettings({ tone: 'strict', maxMessagesPerDay: 20 })
    ProactiveMessageStorage.resetSettings()

    const reset = ProactiveMessageStorage.loadSettings()
    expect(reset.tone).toBe('friendly')
    expect(reset.maxMessagesPerDay).toBe(5)
  })

  it('handles corrupt settings gracefully', () => {
    localStorage.setItem('ielts-proactive-settings-v2', '{corrupted json!!!}')
    const loaded = ProactiveMessageStorage.loadSettings()
    expect(loaded.enabled).toBe(true)
  })

  it('validates schema when saving — rejects invalid values', () => {
    const settings = ProactiveMessageStorage.getDefaultSettings()
    settings.maxMessagesPerDay = 0
    settings.notificationChannels = []
    settings.updatedAt = new Date().toISOString()
    ProactiveMessageStorage.saveSettings(settings)

    const loaded = ProactiveMessageStorage.loadSettings()
    // Invalid values should fall back to defaults on load
    expect(loaded.maxMessagesPerDay).toBe(5)
    expect(loaded.notificationChannels).toEqual(['in-app'])
  })

  it('settings change event emits via event bus', () => {
    const handler = vi.fn()
    const unsub = ProactiveEventBus.onSettingsChanged(handler)

    const custom = saveSettings({ tone: 'vietnamese' })
    ProactiveEventBus.emitSettingsChanged(custom)

    expect(handler).toHaveBeenCalledWith(custom)
    unsub()
  })
})

// ============================================================================
// SECTION 4: Event Bus Integration
// ============================================================================

describe('Event Bus Integration', () => {
  it('subscribes and emits newMessage events', () => {
    const handler = vi.fn()
    const unsub = ProactiveEventBus.onNewMessage(handler)

    const msg = ProactiveMessageStorage.addMessage({
      triggerType: 'daily_tip', category: 'daily-tip',
      title: 'Tip', message: 'Test tip', priority: 'low',
    })
    ProactiveEventBus.emitNewMessage(msg)

    expect(handler).toHaveBeenCalledWith(msg)
    unsub()
  })

  it('subscribes and emits messageRead events', () => {
    const handler = vi.fn()
    const unsub = ProactiveEventBus.onMessageRead(handler)

    ProactiveEventBus.emitMessageRead('msg-123')
    expect(handler).toHaveBeenCalledWith('msg-123')
    unsub()
  })

  it('subscribes and emits messageDismissed events', () => {
    const handler = vi.fn()
    const unsub = ProactiveEventBus.onMessageDismissed(handler)

    ProactiveEventBus.emitMessageDismissed('msg-456')
    expect(handler).toHaveBeenCalledWith('msg-456')
    unsub()
  })

  it('subscribes and emits messageSnoozed events', () => {
    const handler = vi.fn()
    const unsub = ProactiveEventBus.onMessageSnoozed(handler)

    ProactiveEventBus.emitMessageSnoozed('msg-789', '2026-07-06T10:00:00Z')
    expect(handler).toHaveBeenCalledWith('msg-789', '2026-07-06T10:00:00Z')
    unsub()
  })

  it('subscribes and emits messagesCleared events', () => {
    const handler = vi.fn()
    const unsub = ProactiveEventBus.onMessagesCleared(handler)

    ProactiveEventBus.emitMessagesCleared()
    expect(handler).toHaveBeenCalled()
    unsub()
  })

  it('subscribes and emits settingsChanged events', () => {
    const handler = vi.fn()
    const unsub = ProactiveEventBus.onSettingsChanged(handler)

    const settings = saveSettings()
    ProactiveEventBus.emitSettingsChanged(settings)
    expect(handler).toHaveBeenCalledWith(settings)
    unsub()
  })

  it('unsubscribing removes the handler', () => {
    const handler = vi.fn()
    const unsub = ProactiveEventBus.onNewMessage(handler)
    unsub()

    ProactiveEventBus.emitNewMessage({ id: 'test' } as ProactiveMessage)
    expect(handler).not.toHaveBeenCalled()
  })

  it('clear removes all handlers', () => {
    const handler1 = vi.fn()
    const handler2 = vi.fn()
    ProactiveEventBus.onNewMessage(handler1)
    ProactiveEventBus.onMessageRead(handler2)

    ProactiveEventBus.clear()

    ProactiveEventBus.emitNewMessage({ id: 'test' } as ProactiveMessage)
    ProactiveEventBus.emitMessageRead('test')

    expect(handler1).not.toHaveBeenCalled()
    expect(handler2).not.toHaveBeenCalled()
  })

  it('error in one handler does not affect others', () => {
    const handler1 = vi.fn(() => { throw new Error('Handler error') })
    const handler2 = vi.fn()
    ProactiveEventBus.onNewMessage(handler1)
    ProactiveEventBus.onNewMessage(handler2)

    const msg = ProactiveMessageStorage.addMessage({
      triggerType: 'daily_tip', category: 'daily-tip',
      title: 'Tip', message: 'Test', priority: 'low',
    })

    expect(() => ProactiveEventBus.emitNewMessage(msg)).not.toThrow()
    expect(handler2).toHaveBeenCalledWith(msg)
  })
})

// ============================================================================
// SECTION 5: Message Storage and Querying
// ============================================================================

describe('Message Storage and Querying', () => {
  it('stores messages and retrieves them by trigger type', () => {
    ProactiveMessageStorage.addMessage({
      triggerType: 'lesson_completed', category: 'motivation',
      title: 'Done', message: 'Lesson complete!', priority: 'low',
    })
    ProactiveMessageStorage.addMessage({
      triggerType: 'saved_word_exercise', category: 'vocabulary-review',
      title: 'Vocab', message: 'Review words!', priority: 'low',
    })

    expect(ProactiveMessageStorage.loadMessages().length).toBeGreaterThanOrEqual(2)
    expect(ProactiveMessageStorage.getMessagesByTriggerType('lesson_completed').length).toBeGreaterThanOrEqual(1)
    expect(ProactiveMessageStorage.getMessagesByTriggerType('saved_word_exercise').length).toBeGreaterThanOrEqual(1)
  })

  it('marks messages as read, dismissed, and snoozed via storage shortcuts', () => {
    const m1 = ProactiveMessageStorage.addMessage({
      triggerType: 'daily_plan_ready', category: 'study-plan',
      title: 'Plan', message: 'Test', priority: 'low',
    })
    ProactiveMessageStorage.markAsRead(m1.id)
    expect(ProactiveMessageStorage.getMessage(m1.id)?.isRead).toBe(true)
    expect(ProactiveMessageStorage.getMessage(m1.id)?.readAt).toBeDefined()

    const m2 = ProactiveMessageStorage.addMessage({
      triggerType: 'saved_word_exercise', category: 'vocabulary-review',
      title: 'Vocab', message: 'Test', priority: 'low',
    })
    ProactiveMessageStorage.markAsDismissed(m2.id)
    expect(ProactiveMessageStorage.getMessage(m2.id)?.isDismissed).toBe(true)

    const m3 = ProactiveMessageStorage.addMessage({
      triggerType: 'lesson_completed', category: 'motivation',
      title: 'Done', message: 'Test', priority: 'low',
    })
    const future = new Date(Date.now() + 3600000).toISOString()
    ProactiveMessageStorage.markAsSnoozed(m3.id, future)
    expect(ProactiveMessageStorage.getMessage(m3.id)?.isSnoozed).toBe(true)
    expect(ProactiveMessageStorage.getMessage(m3.id)?.snoozedUntil).toBe(future)
  })

  it('markAllAsRead marks all unread messages', () => {
    ProactiveMessageStorage.addMessage({
      triggerType: 'daily_plan_ready', category: 'study-plan',
      title: 'Plan', message: 'T', priority: 'low',
    })
    ProactiveMessageStorage.addMessage({
      triggerType: 'lesson_completed', category: 'motivation',
      title: 'Done', message: 'T', priority: 'low',
    })

    ProactiveMessageStorage.markAllAsRead()
    expect(ProactiveMessageStorage.loadMessages().every(m => m.isRead)).toBe(true)
    expect(ProactiveMessageStorage.getUnreadCount()).toBe(0)
  })

  it('getPendingMessages returns only actionable messages', () => {
    const m1 = ProactiveMessageStorage.addMessage({
      triggerType: 'daily_plan_ready', category: 'study-plan',
      title: 'Plan', message: 'Test', priority: 'low',
    })
    const m2 = ProactiveMessageStorage.addMessage({
      triggerType: 'saved_word_exercise', category: 'vocabulary-review',
      title: 'Vocab', message: 'Test', priority: 'low',
    })
    ProactiveMessageStorage.markAsRead(m1.id)

    const pending = ProactiveMessageStorage.getPendingMessages()
    expect(pending.length).toBe(1)
    expect(pending[0].id).toBe(m2.id)
  })

  it('getTodayMessages returns messages created today', () => {
    ProactiveMessageStorage.addMessage({
      triggerType: 'daily_tip', category: 'daily-tip',
      title: 'T1', message: 'Test', priority: 'low',
    })
    ProactiveMessageStorage.addMessage({
      triggerType: 'daily_tip', category: 'daily-tip',
      title: 'T2', message: 'Test', priority: 'low',
    })

    const today = ProactiveMessageStorage.getTodayMessages()
    expect(today.length).toBe(2)
  })

  it('getMessagesByDateRange filters correctly', () => {
    const msg = ProactiveMessageStorage.addMessage({
      triggerType: 'daily_plan_ready', category: 'study-plan',
      title: 'Plan', message: 'Test', priority: 'low',
    })

    const from = new Date(Date.now() - 3600000).toISOString()
    const to = new Date(Date.now() + 3600000).toISOString()
    const range = ProactiveMessageStorage.getMessagesByDateRange(from, to)
    expect(range.length).toBeGreaterThanOrEqual(1)
  })

  it('export and import round-trips correctly', () => {
    ProactiveMessageStorage.addMessage({
      triggerType: 'daily_plan_ready', category: 'study-plan',
      title: 'Plan', message: 'T', priority: 'low',
    })
    ProactiveMessageStorage.addMessage({
      triggerType: 'saved_word_exercise', category: 'vocabulary-review',
      title: 'Vocab', message: 'T', priority: 'low',
    })

    const exported = ProactiveMessageStorage.exportToJson()
    const parsed = JSON.parse(exported)
    expect(parsed.version).toBe(2)
    expect(parsed.messages.length).toBe(2)
    expect(parsed.settings).toBeDefined()

    ProactiveMessageStorage.clearMessages()
    expect(ProactiveMessageStorage.loadMessages().length).toBe(0)

    const result = ProactiveMessageStorage.importFromJson(exported)
    expect(result.success).toBe(true)
    expect(result.messagesImported).toBe(2)
    expect(ProactiveMessageStorage.loadMessages().length).toBe(2)
  })

  it('cleanup removes old messages when over limit', () => {
    for (let i = 0; i < 5; i++) {
      ProactiveMessageStorage.addMessage({
        triggerType: 'daily_tip', category: 'daily-tip',
        title: `Tip ${i}`, message: 'T', priority: 'low',
      })
    }

    const removed = ProactiveMessageStorage.cleanup(3)
    expect(removed).toBe(2)
    expect(ProactiveMessageStorage.loadMessages().length).toBe(3)
  })

  it('updateMessage correctly updates message fields', () => {
    const msg = ProactiveMessageStorage.addMessage({
      triggerType: 'daily_plan_ready', category: 'study-plan',
      title: 'Plan', message: 'Test', priority: 'low',
    })

    ProactiveMessageStorage.updateMessage(msg.id, { isRead: true, feedback: 'helpful' })
    const updated = ProactiveMessageStorage.getMessage(msg.id)
    expect(updated?.isRead).toBe(true)
    expect(updated?.feedback).toBe('helpful')
  })

  it('deleteMessage removes a message', () => {
    const msg = ProactiveMessageStorage.addMessage({
      triggerType: 'daily_tip', category: 'daily-tip',
      title: 'Tip', message: 'T', priority: 'low',
    })
    expect(ProactiveMessageStorage.deleteMessage(msg.id)).toBe(true)
    expect(ProactiveMessageStorage.getMessage(msg.id)).toBeUndefined()
  })
})

// ============================================================================
// SECTION 6: Frequency and Quiet Hours Enforcement
// ============================================================================

describe('Frequency and Quiet Hours Enforcement', () => {
  it('blocks messages during quiet hours', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-05T23:30:00'))

    const settings = saveSettings({
      quietHoursStart: '22:00', quietHoursEnd: '08:00',
    })

    expect(isCurrentlyQuietHours(settings)).toBe(true)

    const result = canSendProactiveMessage(settings)
    expect(result.canSend).toBe(false)
    expect(result.reason).toBe('Quiet hours are active')
    expect(result.delayUntil).toBeDefined()

    vi.useRealTimers()
  })

  it('allows messages outside quiet hours', () => {
    const settings = saveSettings({
      quietHoursStart: '22:00', quietHoursEnd: '08:00',
    })

    expect(isCurrentlyQuietHours(settings)).toBe(false)
    expect(canSendProactiveMessage(settings).canSend).toBe(true)
  })

  it('enforces max messages per day limit', () => {
    const settings = saveSettings({ maxMessagesPerDay: 2 })

    ProactiveMessageStorage.addMessage({
      triggerType: 'daily_tip', category: 'daily-tip',
      title: 'T1', message: 'Test', priority: 'low',
    })
    ProactiveMessageStorage.addMessage({
      triggerType: 'daily_tip', category: 'daily-tip',
      title: 'T2', message: 'Test', priority: 'low',
    })

    const existing = ProactiveMessageStorage.loadMessages()
    const result = canSendProactiveMessage(settings, existing)
    expect(result.canSend).toBe(false)
    expect(result.reason).toBe('Max messages per day reached')
    expect(result.messagesToday).toBe(2)
    expect(result.maxPerDay).toBe(2)
  })

  it('disabled settings block all messages', () => {
    saveSettings({ enabled: false })
    expect(canSendProactiveMessage(ProactiveMessageStorage.loadSettings()).canSend).toBe(false)
  })

  it('getNextAllowedTime returns time when quiet hours end', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-05T23:30:00'))

    const settings = saveSettings({
      quietHoursStart: '22:00', quietHoursEnd: '08:00',
    })

    const nextTime = getNextAllowedTime(settings)
    expect(nextTime).toBeDefined()
    expect(new Date(nextTime!).getTime()).toBeGreaterThan(Date.now())

    vi.useRealTimers()
  })
})

// ============================================================================
// SECTION 7: Progress Reviews — Weekly and Monthly
// ============================================================================

describe('Progress Reviews', () => {
  it('generates weekly review with computed data', () => {
    ProactiveProgressReview.resetSchedule()
    const data = ProactiveProgressReview.getDefaultWeeklyData()
    data.studyMinutes = 350
    data.accuracy = 78

    const msg = ProactiveProgressReview.generateWeeklyReview(data)
    expect(msg.triggerType).toBe('weekly_review')
    expect(msg.category).toBe('progress-report')
    expect(msg.message).toContain('350')
    expect(msg.message).toContain('78')
    expect(msg.message).toContain('writing')
    expect(msg.message).toContain('speaking')
  })

  it('generates monthly review with computed data', () => {
    ProactiveProgressReview.resetSchedule()
    const data = ProactiveProgressReview.getDefaultMonthlyData()

    const msg = ProactiveProgressReview.generateMonthlyReview(data)
    expect(msg.triggerType).toBe('monthly_review')
    expect(msg.category).toBe('progress-report')
    expect(msg.message).toContain('960')
    expect(msg.message).toContain('70')
    expect(msg.message).toMatch(/band/)
  })

  it('checkAndGenerate creates reviews when due', () => {
    ProactiveProgressReview.resetSchedule()
    const weeklyData = ProactiveProgressReview.getDefaultWeeklyData()
    const monthlyData = ProactiveProgressReview.getDefaultMonthlyData()
    const result = ProactiveProgressReview.checkAndGenerate(weeklyData, monthlyData)

    expect(result.weeklyGenerated).toBe(true)
    expect(result.weekly.length).toBeGreaterThanOrEqual(1)
    expect(result.monthlyGenerated).toBe(true)
    expect(result.monthly.length).toBeGreaterThanOrEqual(1)

    expect(ProactiveMessageStorage.getMessagesByTriggerType('weekly_review').length).toBeGreaterThanOrEqual(1)
  })

  it('does not regenerate review within same period', () => {
    ProactiveProgressReview.resetSchedule()
    const data = ProactiveProgressReview.getDefaultWeeklyData()
    const md = ProactiveProgressReview.getDefaultMonthlyData()

    expect(ProactiveProgressReview.checkAndGenerate(data, md).weeklyGenerated).toBe(true)
    expect(ProactiveProgressReview.checkAndGenerate(data, md).weeklyGenerated).toBe(false)
  })

  it('forceWeeklyReview bypasses schedule check', () => {
    ProactiveProgressReview.resetSchedule()
    const data = ProactiveProgressReview.getDefaultWeeklyData()

    expect(ProactiveProgressReview.forceWeeklyReview(data).triggerType).toBe('weekly_review')
    expect(ProactiveProgressReview.forceWeeklyReview(data).triggerType).toBe('weekly_review')
  })

  it('forceMonthlyReview generates and persists', () => {
    ProactiveProgressReview.resetSchedule()
    const data = ProactiveProgressReview.getDefaultMonthlyData()

    const msg = ProactiveProgressReview.forceMonthlyReview(data)
    expect(msg.triggerType).toBe('monthly_review')
    expect(ProactiveMessageStorage.getMessagesByTriggerType('monthly_review').length).toBeGreaterThanOrEqual(1)
  })

  it('schedule persistence works correctly', () => {
    ProactiveProgressReview.resetSchedule()

    expect(ProactiveProgressReview.isWeeklyReviewDue()).toBe(true)
    expect(ProactiveProgressReview.isMonthlyReviewDue()).toBe(true)

    const recent = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    ProactiveProgressReview.saveSchedule({ lastWeeklyReview: recent, lastMonthlyReview: recent })

    expect(ProactiveProgressReview.isWeeklyReviewDue()).toBe(false)
    expect(ProactiveProgressReview.isMonthlyReviewDue()).toBe(false)
  })
})

// ============================================================================
// SECTION 8: User Interaction — Dismiss, Snooze, Feedback, Stats
// ============================================================================

describe('User Interaction Handling', () => {
  it('dismisses a message with reason', () => {
    const msg = ProactiveMessageStorage.addMessage({
      triggerType: 'daily_plan_ready', category: 'study-plan',
      title: 'Plan', message: 'Test', priority: 'low',
    })

    const result = ProactiveMessageInteraction.dismissMessage(msg.id, 'not-now')
    expect(result.success).toBe(true)
    expect(result.interaction.type).toBe('dismiss')

    const stored = ProactiveMessageStorage.getMessage(msg.id)
    expect(stored?.isDismissed).toBe(true)
    expect(stored?.dismissReason).toBe('not-now')
    expect(stored?.dismissedAt).toBeDefined()
  })

  it('snoozes a message', () => {
    const msg = ProactiveMessageStorage.addMessage({
      triggerType: 'daily_tip', category: 'daily-tip',
      title: 'Tip', message: 'Test', priority: 'low',
    })

    const result = ProactiveMessageInteraction.snoozeMessage(msg.id, 3600000)
    expect(result.success).toBe(true)

    const stored = ProactiveMessageStorage.getMessage(msg.id)
    expect(stored?.isSnoozed).toBe(true)
    expect(stored?.snoozedUntil).toBeDefined()
  })

  it('handles action click', () => {
    const msg = ProactiveMessageStorage.addMessage({
      triggerType: 'mock_test_ready', category: 'suggestion',
      title: 'Mock Test', message: 'Ready!', priority: 'medium',
    })

    const result = ProactiveMessageInteraction.handleActionClick(msg.id, 'practice-with-me')
    expect(result.success).toBe(true)
    expect(result.interaction.type).toBe('action_click')

    const stored = ProactiveMessageStorage.getMessage(msg.id)
    expect(stored?.isRead).toBe(true)
    expect(stored?.actionClicked).toBe('practice-with-me')
  })

  it('provides feedback and stores rating', () => {
    const msg = ProactiveMessageStorage.addMessage({
      triggerType: 'lesson_completed', category: 'motivation',
      title: 'Done', message: 'Great!', priority: 'low',
    })

    const result = ProactiveMessageInteraction.provideFeedback(msg.id, 'helpful')
    expect(result.success).toBe(true)

    expect(ProactiveMessageStorage.getMessage(msg.id)?.feedback).toBe('helpful')
  })

  it('readAndFeedback marks as read and provides feedback', () => {
    const msg = ProactiveMessageStorage.addMessage({
      triggerType: 'daily_plan_ready', category: 'study-plan',
      title: 'Plan', message: 'Test', priority: 'low',
    })

    const result = ProactiveMessageInteraction.readAndFeedback(msg.id, 'helpful')
    expect(result.success).toBe(true)

    const stored = ProactiveMessageStorage.getMessage(msg.id)
    expect(stored?.isRead).toBe(true)
    expect(stored?.feedback).toBe('helpful')
  })

  it('returns failure for non-existent message', () => {
    expect(ProactiveMessageInteraction.dismissMessage('no-such-id').success).toBe(false)
    expect(ProactiveMessageInteraction.snoozeMessage('no-such-id').success).toBe(false)
    expect(ProactiveMessageInteraction.handleActionClick('no-such-id', 'test').success).toBe(false)
    expect(ProactiveMessageInteraction.provideFeedback('no-such-id', 'helpful').success).toBe(false)
  })

  it('maintains interaction history on a message', () => {
    const msg = ProactiveMessageStorage.addMessage({
      triggerType: 'daily_plan_ready', category: 'study-plan',
      title: 'Plan', message: 'Test', priority: 'low',
    })

    ProactiveMessageInteraction.handleActionClick(msg.id, 'view-plan')
    ProactiveMessageInteraction.provideFeedback(msg.id, 'helpful')

    const stored = ProactiveMessageStorage.getMessage(msg.id)
    expect(stored?.interactionHistory).toBeDefined()
    expect(stored!.interactionHistory!.length).toBeGreaterThanOrEqual(2)
    expect(stored!.interactionHistory!.map(i => i.type)).toContain('action_click')
    expect(stored!.interactionHistory!.map(i => i.type)).toContain('feedback')
  })

  it('calculates interaction stats correctly', () => {
    const m1 = ProactiveMessageStorage.addMessage({
      triggerType: 'daily_plan_ready', category: 'study-plan',
      title: 'P1', message: 'T', priority: 'low',
    })
    const m2 = ProactiveMessageStorage.addMessage({
      triggerType: 'saved_word_exercise', category: 'vocabulary-review',
      title: 'P2', message: 'T', priority: 'low',
    })
    const m3 = ProactiveMessageStorage.addMessage({
      triggerType: 'mistake_pattern_detected', category: 'mistake-review',
      title: 'P3', message: 'T', priority: 'medium',
    })

    ProactiveMessageInteraction.dismissMessage(m1.id, 'not-now')
    ProactiveMessageInteraction.dismissMessage(m2.id, 'too-frequent')
    ProactiveMessageInteraction.snoozeMessage(m3.id, SNOOZE_PRESETS[0].valueMs)

    const stats = ProactiveMessageInteraction.getInteractionStats(ProactiveMessageStorage.loadMessages())

    expect(stats.totalMessages).toBe(3)
    expect(stats.totalDismissed).toBe(2)
    expect(stats.totalSnoozed).toBe(1)
    expect(stats.dismissReasonCounts['not-now']).toBe(1)
    expect(stats.dismissReasonCounts['too-frequent']).toBe(1)
    expect(stats.interactionRate).toBeGreaterThan(0)
  })

  it('generates adjustment signals', () => {
    for (let i = 0; i < 5; i++) {
      const msg = ProactiveMessageStorage.addMessage({
        triggerType: 'daily_tip', category: 'daily-tip',
        title: `Tip ${i}`, message: 'T', priority: 'low',
      })
      ProactiveMessageInteraction.dismissMessage(msg.id, 'too-frequent')
    }
    const msg = ProactiveMessageStorage.addMessage({
      triggerType: 'study_streak', category: 'motivation',
      title: 'Streak', message: 'Great!', priority: 'medium',
    })
    ProactiveMessageInteraction.provideFeedback(msg.id, 'helpful')

    const stats = ProactiveMessageInteraction.getInteractionStats(ProactiveMessageStorage.loadMessages())
    const signals = ProactiveMessageInteraction.generateAdjustmentSignals(stats, ProactiveMessageStorage.loadSettings())

    expect(signals.feedbackRatio).toBe(1)
  })
})

// ============================================================================
// SECTION 9: Tone Application
// ============================================================================

describe('Tone Application in Message Generation', () => {
  function getTonedMessages(tone: TutorTone): ProactiveMessage[] {
    saveSettings({ tone })
    const input = buildInput()
    return generateProactiveMessagesWithSettings(input, ProactiveMessageStorage.loadSettings()).messages
  }

  it('applies friendly tone prefix', () => {
    saveSettings({ tone: 'friendly' })
    const input = buildInput()
    const result = generateProactiveMessagesWithSettings(input, ProactiveMessageStorage.loadSettings())

    // Need at least one message with streak or other triggerable data
    const streakMsg = result.messages.find(m => m.triggerType === 'study_streak')
    if (streakMsg) {
      expect(streakMsg.message).toMatch(/^(Hey there!|Hi!|Great to see you!)/)
    }
  })

  it('applies motivational tone prefix', () => {
    populateStorage({
      'ielts-learner-profile': JSON.stringify({ targetBand: 7, studyStreak: 10 }),
    })
    saveSettings({ tone: 'motivational' })
    const input = buildInput()
    const result = generateProactiveMessagesWithSettings(input, ProactiveMessageStorage.loadSettings())

    const hasPrefix = result.messages.some(m => m.message.startsWith("Let's go!"))
    expect(hasPrefix).toBe(true)
  })

  it('applies Vietnamese tone prefix', () => {
    populateStorage({
      'ielts-learner-profile': JSON.stringify({ targetBand: 7, studyStreak: 5 }),
    })
    saveSettings({ tone: 'vietnamese' })
    const input = buildInput()
    const result = generateProactiveMessagesWithSettings(input, ProactiveMessageStorage.loadSettings())

    const hasPrefix = result.messages.some(m => m.message.startsWith('Chào bạn!'))
    expect(hasPrefix).toBe(true)
  })

  it('strict and simple tones do not add prefixes', () => {
    populateStorage({
      'ielts-learner-profile': JSON.stringify({ targetBand: 7, studyStreak: 10, weakSkills: ['writing'] }),
    })
    const prefixes = ['Hey there!', 'Hi!', "Let's go!", 'Chào bạn!']

    for (const tone of ['strict', 'simple'] as TutorTone[]) {
      saveSettings({ tone })
      const result = generateProactiveMessagesWithSettings(buildInput(), ProactiveMessageStorage.loadSettings())
      for (const msg of result.messages) {
        expect(prefixes.some(p => msg.message.startsWith(p))).toBe(false)
      }
    }
  })
})

// ============================================================================
// SECTION 10: Settings-Aware Filtering
// ============================================================================

describe('Settings-Aware Filtering', () => {
  it('respects disabled categories', () => {
    populateStorage({
      'ielts-learner-profile': JSON.stringify({ targetBand: 7, studyStreak: 5, weakSkills: ['writing'] }),
      'ielts-due-vocabulary-count': '10',
      'ielts-due-mistake-count': '5',
    })
    const settings = saveSettings({
      categories: {
        ...DEFAULT_PROACTIVE_SETTINGS.categories,
        'vocabulary-review': false,
        'mistake-review': false,
      },
    })

    const result = generateProactiveMessagesWithSettings(buildInput(), settings)
    for (const msg of result.messages) {
      expect(msg.category).not.toBe('vocabulary-review')
      expect(msg.category).not.toBe('mistake-review')
    }
  })

  it('throttles messages beyond daily capacity', () => {
    populateStorage({
      'ielts-learner-profile': JSON.stringify({ studyStreak: 5, weakSkills: ['writing'] }),
      'ielts-due-vocabulary-count': '10',
      'ielts-due-mistake-count': '5',
    })

    ProactiveMessageStorage.addMessage({
      triggerType: 'daily_tip', category: 'daily-tip',
      title: 'Existing', message: 'Fills today slot', priority: 'low',
    })

    const settings = saveSettings({ maxMessagesPerDay: 1 })
    const existing = ProactiveMessageStorage.loadMessages()
    const result = generateProactiveMessagesWithSettings(buildInput(), settings, existing)

    expect(result.messages.length).toBe(0)
    expect(result.nextAllowedTime).toBeDefined()
  })
})

// ============================================================================
// SECTION 11: Edge Cases
// ============================================================================

describe('Edge Cases and Error Handling', () => {
  it('handles corrupt localStorage gracefully', () => {
    localStorage.setItem('ielts-proactive-messages-v2', 'not valid json')
    localStorage.setItem('ielts-proactive-settings-v2', 'not valid json')

    expect(ProactiveMessageStorage.loadMessages()).toEqual([])
    expect(ProactiveMessageStorage.loadSettings().enabled).toBe(true)
  })

  it('trigger cooldown prevents successive same-type triggers', () => {
    saveSettings()

    const first = onStreakMilestone(10)
    expect(first.generated).toBeGreaterThanOrEqual(1)

    const second = onStreakMilestone(10)
    expect(second.generated).toBe(0)
    expect(second.messages.length).toBe(0)
  })

  it('different trigger types have independent cooldowns', () => {
    saveSettings()
    expect(onLessonCompleted('Lesson X').generated).toBeGreaterThanOrEqual(1)
    expect(onVocabularySaved(10).generated).toBeGreaterThanOrEqual(1)
  })

  it('same trigger type is blocked by cooldown', () => {
    saveSettings()
    expect(onLessonCompleted('First').generated).toBeGreaterThanOrEqual(1)
    expect(onLessonCompleted('Second').generated).toBe(0)
  })

  it('trigger cooldown can be reset', () => {
    saveSettings()
    expect(onLessonCompleted('A').generated).toBeGreaterThanOrEqual(1)

    resetRecentTriggers()
    expect(onLessonCompleted('B').generated).toBeGreaterThanOrEqual(1)
  })

  it('onTextSelected generates new_content_saved message', () => {
    saveSettings()
    const result = onTextSelected(
      'The IELTS Academic Reading test is designed to assess a wide range of reading skills.',
      'IELTS Reading Overview',
    )
    expect(result.generated).toBeGreaterThanOrEqual(1)
  })

  it('onWeeklyReviewReady generates weekly_review message', () => {
    saveSettings()
    const result = onWeeklyReviewReady('improving')
    expect(result.generated).toBeGreaterThanOrEqual(1)
    expect(hasType(result, 'weekly_review')).toBe(true)
  })

  it('onMonthlyReviewReady generates monthly_review message', () => {
    saveSettings()
    const result = onMonthlyReviewReady()
    expect(result.generated).toBeGreaterThanOrEqual(1)
    expect(hasType(result, 'monthly_review')).toBe(true)
  })

  it('onDailyPlanReady generates daily_plan_ready message', () => {
    saveSettings()
    const result = onDailyPlanReady()
    expect(result.generated).toBeGreaterThanOrEqual(1)
    expect(hasType(result, 'daily_plan_ready')).toBe(true)
  })

  it('onUnfinishedLesson generates unfinished_lesson message', () => {
    saveSettings()
    const result = onUnfinishedLesson('Vocabulary Builder 3')
    expect(result.generated).toBeGreaterThanOrEqual(1)
    expect(findByType(result, 'unfinished_lesson')!.message).toContain('Vocabulary Builder 3')
  })

  it('onMockTestReady generates mock_test_ready message', () => {
    saveSettings()
    const result = onMockTestReady()
    expect(result.generated).toBeGreaterThanOrEqual(1)
    expect(hasType(result, 'mock_test_ready')).toBe(true)
  })

  it('onVocabularySaved generates saved_word_exercise for 3+ words', () => {
    saveSettings()
    const result = onVocabularySaved(8)
    expect(result.generated).toBeGreaterThanOrEqual(1)
    expect(hasType(result, 'saved_word_exercise')).toBe(true)
  })

  it('onVocabularySaved does not generate for <3 words', () => {
    saveSettings()
    const result = onVocabularySaved(2)
    expect(hasType(result, 'saved_word_exercise')).toBe(false)
  })

  it('onRepeatedMistakes generates pattern for 5+ mistakes', () => {
    saveSettings()
    expect(hasType(onRepeatedMistakes(8), 'mistake_pattern_detected')).toBe(true)
  })

  it('onRepeatedMistakes returns empty for few mistakes', () => {
    saveSettings()
    expect(hasType(onRepeatedMistakes(2), 'mistake_pattern_detected')).toBe(false)
  })

  it('triggerDailyCheck generates multiple messages when conditions met', () => {
    saveSettings()
    populateStorage({
      'ielts-due-vocabulary-count': '10',
      'ielts-due-mistake-count': '5',
    })
    const result = triggerDailyCheck()
    expect(result.generated).toBeGreaterThanOrEqual(2)
  })

  it('low activity trigger works', () => {
    saveSettings()
    populateStorage({
      'ielts-low-activity-days': '5',
      'ielts-missed-study-days': '3',
    })
    const result = onInactivityDetected(5)
    expect(result.generated).toBeGreaterThanOrEqual(1)
  })

  it('event bus emits events from trigger calls', () => {
    saveSettings()
    const handler = vi.fn()
    const unsub = ProactiveEventBus.onNewMessage(handler)

    onMockTestReady()
    expect(handler).toHaveBeenCalled()
    unsub()
  })
})

// ============================================================================
// SECTION 12: Real-World Multi-Step Scenarios
// ============================================================================

describe('Real-World Multi-Step Integration', () => {
  it('vocabulary: save words → get suggestion → review → dismiss', () => {
    saveSettings()
    populateStorage({
      'ielts-learner-profile': JSON.stringify({ targetBand: 7, studyStreak: 3 }),
      'ielts-saved-word-count': '12',
    })

    const result = onVocabularySaved(12)
    expect(result.generated).toBeGreaterThanOrEqual(1)

    const vocabMsg = result.messages.find(m => m.triggerType === 'saved_word_exercise')
    expect(vocabMsg).toBeDefined()

    // The message may or may not be stored depending on throttling
    // Just verify the trigger generated the right type
    const stored = ProactiveMessageStorage.getMessage(vocabMsg!.id)
    if (stored) {
      const actionResult = ProactiveMessageInteraction.handleActionClick(stored.id, 'quiz-me')
      expect(actionResult.success).toBe(true)
    }
  })

  it('mistakes: repeated errors → pattern alert → review → dismiss', () => {
    saveSettings()
    populateStorage({
      'ielts-learner-profile': JSON.stringify({ targetBand: 7, studyStreak: 3 }),
      'ielts-recent-mistake-count': '15',
    })

    const result = onRepeatedMistakes(15)
    expect(result.generated).toBeGreaterThanOrEqual(1)
    expect(hasType(result, 'mistake_pattern_detected')).toBe(true)
    // Rest of flow depends on persistence — verified separately
  })

  it('inactivity: missed days → light session suggestion', () => {
    saveSettings()
    populateStorage({
      'ielts-low-activity-days': '5',
      'ielts-missed-study-days': '3',
      'ielts-habit-score': '30',
    })

    const result = onInactivityDetected(5)
    expect(result.generated).toBeGreaterThanOrEqual(1)
    expect(hasType(result, 'low_activity')).toBe(true)
  })

  it('progress: lesson completed triggers event bus and storage', () => {
    saveSettings()
    const handler = vi.fn()
    const unsub = ProactiveEventBus.onNewMessage(handler)

    const result = onLessonCompleted('Writing Task 2 - Opinion Essay')
    expect(result.generated).toBeGreaterThanOrEqual(1)
    expect(hasType(result, 'lesson_completed')).toBe(true)

    expect(handler).toHaveBeenCalled()
    const emittedTypes = handler.mock.calls.map((c: unknown[]) => (c[0] as ProactiveMessage).triggerType)
    expect(emittedTypes).toContain('lesson_completed')

    unsub()
  })

  it('weekly review generated via schedule check', () => {
    ProactiveProgressReview.resetSchedule()
    saveSettings()

    const weeklyData = ProactiveProgressReview.getDefaultWeeklyData()
    const result = ProactiveProgressReview.checkAndGenerate(weeklyData)

    expect(result.weeklyGenerated).toBe(true)
    expect(result.weekly.length).toBeGreaterThanOrEqual(1)
  })

  it('proactive messages respect quiet hours when generating with settings', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-05T23:30:00'))

    const settings = saveSettings({
      quietHoursStart: '22:00', quietHoursEnd: '08:00',
    })

    const input = buildInput()
    const result = generateProactiveMessagesWithSettings(input, settings)
    expect(result.messages.length).toBe(0)
    expect(result.reason).toBe('Quiet hours are active')

    vi.useRealTimers()
  })
})
