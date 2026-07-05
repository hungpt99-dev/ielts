import { describe, it, expect, beforeEach } from 'vitest'
import {
  generateProactiveMessages,
  generateProactiveMessagesWithSettings,
  generateContextSuggestions,
  isCurrentlyQuietHours,
} from '../services/proactiveMessageEngine'
import type { ProactiveEngineInput } from '../services/proactiveMessageEngine'
import {
  DEFAULT_PROACTIVE_SETTINGS,
} from '../types/proactiveMessage'
import type { ProactiveMessageSettings, ProactiveMessage } from '../types/proactiveMessage'

const baseInput: ProactiveEngineInput = {}
const defaultSettings: ProactiveMessageSettings = { ...DEFAULT_PROACTIVE_SETTINGS }

function withoutTip(messages: ProactiveMessage[]): ProactiveMessage[] {
  return messages.filter(m => m.triggerType !== 'daily_tip')
}

function hasMessageOfType(messages: ProactiveMessage[], triggerType: string): boolean {
  return messages.some(m => m.triggerType === triggerType)
}

// ─── generateProactiveMessages ───────────────────────────────────────────────

describe('generateProactiveMessages', () => {
  it('returns only daily tip for empty input', () => {
    const messages = generateProactiveMessages(baseInput)
    expect(messages.length).toBeGreaterThanOrEqual(1)
    expect(messages.every(m => m.triggerType === 'daily_tip')).toBe(true)
  })

  it('generates vocabulary review message when words are due', () => {
    const messages = withoutTip(generateProactiveMessages({ dueVocabularyCount: 15 }))
    expect(messages).toHaveLength(1)
    expect(messages[0].category).toBe('vocabulary-review')
    expect(messages[0].title).toContain('15')
    expect(messages[0].priority).toBe('medium')
  })

  it('generates high priority vocabulary review for many words', () => {
    const messages = withoutTip(generateProactiveMessages({ dueVocabularyCount: 30 }))
    expect(messages[0].priority).toBe('high')
  })

  it('generates mistake review message when mistakes are due', () => {
    const messages = withoutTip(generateProactiveMessages({ dueMistakeCount: 5 }))
    expect(messages).toHaveLength(1)
    expect(messages[0].category).toBe('mistake-review')
    expect(messages[0].title).toContain('5')
  })

  it('generates weak skill message when weak skills are provided', () => {
    const messages = withoutTip(generateProactiveMessages({
      learnerProfile: { weakSkills: ['writing', 'speaking'] },
    }))
    expect(hasMessageOfType(messages, 'weak_skill_warning')).toBe(true)
    const msg = messages.find(m => m.triggerType === 'weak_skill_warning')!
    expect(msg.category).toBe('study-plan')
    expect(msg.message).toContain('writing')
  })

  it('includes band gap information in weak skill message when target is far', () => {
    const messages = withoutTip(generateProactiveMessages({
      learnerProfile: { weakSkills: ['writing'], targetBand: 7, currentBand: 5 },
    }))
    expect(messages[0].message).toContain('2 bands')
  })

  it('generates exam countdown for approaching exam', () => {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 14)
    const messages = withoutTip(generateProactiveMessages({
      learnerProfile: { examDate: futureDate.toISOString() },
    }))
    expect(hasMessageOfType(messages, 'exam_countdown')).toBe(true)
    const examMsg = messages.find(m => m.triggerType === 'exam_countdown')!
    expect(examMsg.category).toBe('exam-countdown')
    expect(examMsg.title).toContain('14')
  })

  it('generates high urgency for exam within 7 days', () => {
    const nearDate = new Date()
    nearDate.setDate(nearDate.getDate() + 3)
    const messages = withoutTip(generateProactiveMessages({
      learnerProfile: { examDate: nearDate.toISOString() },
    }))
    const examMsg = messages.find(m => m.triggerType === 'exam_countdown')
    expect(examMsg?.priority).toBe('high')
  })

  it('does not generate exam countdown for exams far away', () => {
    const farDate = new Date()
    farDate.setDate(farDate.getDate() + 120)
    const messages = withoutTip(generateProactiveMessages({
      learnerProfile: { examDate: farDate.toISOString() },
    }))
    expect(hasMessageOfType(messages, 'exam_countdown')).toBe(false)
  })

  it('generates study streak message for 3+ day streaks', () => {
    const messages = withoutTip(generateProactiveMessages({
      learnerProfile: { studyStreak: 7 },
    }))
    expect(hasMessageOfType(messages, 'study_streak')).toBe(true)
    const streakMsg = messages.find(m => m.triggerType === 'study_streak')!
    expect(streakMsg.category).toBe('motivation')
    expect(streakMsg.title).toContain('7')
  })

  it('does not generate streak message for short streaks', () => {
    const messages = withoutTip(generateProactiveMessages({
      learnerProfile: { studyStreak: 2 },
    }))
    expect(hasMessageOfType(messages, 'study_streak')).toBe(false)
  })

  it('generates low activity message after 2+ idle days', () => {
    const messages = withoutTip(generateProactiveMessages({ lowActivityDays: 5 }))
    expect(hasMessageOfType(messages, 'low_activity')).toBe(true)
    expect(messages.find(m => m.triggerType === 'low_activity')?.title).toContain('studied today')
    expect(messages.find(m => m.triggerType === 'low_activity')?.priority).toBe('low')
  })

  it('generates high priority message after 7+ idle days', () => {
    const messages = withoutTip(generateProactiveMessages({ lowActivityDays: 10 }))
    expect(hasMessageOfType(messages, 'low_activity')).toBe(true)
    expect(messages.find(m => m.triggerType === 'low_activity')?.title).toContain('been a while')
    expect(messages.find(m => m.triggerType === 'low_activity')?.priority).toBe('high')
  })

  it('generates daily plan message', () => {
    const messages = withoutTip(generateProactiveMessages({ dailyPlanReady: true }))
    expect(hasMessageOfType(messages, 'daily_plan_ready')).toBe(true)
    expect(messages.find(m => m.triggerType === 'daily_plan_ready')?.category).toBe('study-plan')
  })

  it('generates mistake pattern for 5+ recent mistakes', () => {
    const messages = withoutTip(generateProactiveMessages({ recentMistakeCount: 8 }))
    expect(hasMessageOfType(messages, 'mistake_pattern_detected')).toBe(true)
    expect(messages.find(m => m.triggerType === 'mistake_pattern_detected')?.title).toContain('Pattern')
  })

  it('generates new content message', () => {
    const messages = withoutTip(generateProactiveMessages({ newContentCount: 3 }))
    expect(hasMessageOfType(messages, 'new_content_saved')).toBe(true)
    expect(messages.find(m => m.triggerType === 'new_content_saved')?.category).toBe('saved-content')
  })

  it('generates multiple messages when multiple conditions met', () => {
    const messages = withoutTip(generateProactiveMessages({
      dueVocabularyCount: 10,
      dueMistakeCount: 5,
      dailyPlanReady: true,
      learnerProfile: { studyStreak: 10 },
    }))
    expect(messages.length).toBeGreaterThanOrEqual(3)
    const categories = messages.map(m => m.category)
    expect(categories).toContain('vocabulary-review')
    expect(categories).toContain('mistake-review')
    expect(categories).toContain('motivation')
  })

  it('each generated message has required fields', () => {
    const messages = generateProactiveMessages({
      dueVocabularyCount: 10,
      dueMistakeCount: 5,
      learnerProfile: { studyStreak: 10, weakSkills: ['reading'] },
    })
    for (const msg of messages) {
      expect(msg.id).toBeTruthy()
      expect(msg.title).toBeTruthy()
      expect(msg.message).toBeTruthy()
      expect(msg.createdAt).toBeTruthy()
      expect(['high', 'medium', 'low']).toContain(msg.priority)
      expect(msg.isRead).toBe(false)
      expect(msg.isDismissed).toBe(false)
      expect(msg.autoGenerated).toBe(true)
    }
  })

  it('orders messages by priority (high first)', () => {
    const messages = withoutTip(generateProactiveMessages({
      dueVocabularyCount: 30,
      dueMistakeCount: 15,
      learnerProfile: { weakSkills: ['writing'], studyStreak: 3 },
    }))
    expect(messages.length).toBeGreaterThanOrEqual(3)
    const firstPriority = messages[0].priority
    const lastPriority = messages[messages.length - 1].priority
    const priorityOrder = { high: 0, medium: 1, low: 2 }
    expect(priorityOrder[firstPriority]).toBeLessThanOrEqual(priorityOrder[lastPriority])
  })

  // ── New generators ───────────────────────────────────────────────────────

  it('generates lesson completed message', () => {
    const messages = withoutTip(generateProactiveMessages({
      lessonCompleted: 'IELTS Writing Task 2',
    }))
    expect(hasMessageOfType(messages, 'lesson_completed')).toBe(true)
    const msg = messages.find(m => m.triggerType === 'lesson_completed')!
    expect(msg.category).toBe('motivation')
    expect(msg.message).toContain('IELTS Writing Task 2')
  })

  it('generates inactive days message for single missed day', () => {
    const messages = withoutTip(generateProactiveMessages({ missedStudyDays: 1 }))
    expect(hasMessageOfType(messages, 'inactive_days')).toBe(true)
    expect(messages.find(m => m.triggerType === 'inactive_days')?.title).toContain('yesterday')
  })

  it('generates inactive days message for multiple missed days', () => {
    const messages = withoutTip(generateProactiveMessages({ missedStudyDays: 3 }))
    expect(hasMessageOfType(messages, 'inactive_days')).toBe(true)
    expect(messages.find(m => m.triggerType === 'inactive_days')?.title).toContain('3')
    expect(messages.find(m => m.triggerType === 'inactive_days')?.priority).toBe('medium')
  })

  it('generates weekly review message', () => {
    const messages = withoutTip(generateProactiveMessages({ isWeeklyReviewReady: true }))
    expect(hasMessageOfType(messages, 'weekly_review')).toBe(true)
    expect(messages.find(m => m.triggerType === 'weekly_review')?.category).toBe('progress-report')
  })

  it('generates weekly review with accuracy trend', () => {
    const messages = withoutTip(generateProactiveMessages({
      isWeeklyReviewReady: true,
      learnerProfile: { averageAccuracy: 75 },
      recentAccuracyTrend: 'improving',
    }))
    const msg = messages.find(m => m.triggerType === 'weekly_review')
    expect(msg?.message).toContain('up')
    expect(msg?.message).toContain('75')
  })

  it('generates monthly review message', () => {
    const messages = withoutTip(generateProactiveMessages({
      isMonthlyReviewReady: true,
      learnerProfile: { currentBand: 6, targetBand: 7 },
    }))
    expect(hasMessageOfType(messages, 'monthly_review')).toBe(true)
    const msg = messages.find(m => m.triggerType === 'monthly_review')!
    expect(msg.category).toBe('progress-report')
    expect(msg.message).toContain('band 6')
  })

  it('generates unfinished lesson message', () => {
    const messages = withoutTip(generateProactiveMessages({
      unfinishedLessonTitle: 'Vocabulary Builder 3',
    }))
    expect(hasMessageOfType(messages, 'unfinished_lesson')).toBe(true)
    expect(messages.find(m => m.triggerType === 'unfinished_lesson')?.message).toContain('Vocabulary Builder 3')
  })

  it('generates saved word exercise for 3+ saved words', () => {
    const messages = withoutTip(generateProactiveMessages({ savedWordCount: 10 }))
    expect(hasMessageOfType(messages, 'saved_word_exercise')).toBe(true)
    expect(messages.find(m => m.triggerType === 'saved_word_exercise')?.category).toBe('vocabulary-review')
  })

  it('does not generate saved word exercise for fewer than 3 words', () => {
    const messages = withoutTip(generateProactiveMessages({ savedWordCount: 2 }))
    expect(hasMessageOfType(messages, 'saved_word_exercise')).toBe(false)
  })

  it('generates daily tip message', () => {
    const messages = generateProactiveMessages({})
    expect(hasMessageOfType(messages, 'daily_tip')).toBe(true)
    const tip = messages.find(m => m.triggerType === 'daily_tip')!
    expect(tip.category).toBe('daily-tip')
    expect(tip.message.length).toBeGreaterThan(10)
  })

  it('daily tip has 24-hour expiry', () => {
    const messages = generateProactiveMessages({})
    const tip = messages.find(m => m.triggerType === 'daily_tip')!
    expect(tip.expiresAt).toBeTruthy()
  })

  it('generates mock test ready message', () => {
    const messages = withoutTip(generateProactiveMessages({
      isMockTestReady: true,
      learnerProfile: { targetBand: 7 },
    }))
    expect(hasMessageOfType(messages, 'mock_test_ready')).toBe(true)
    expect(messages.find(m => m.triggerType === 'mock_test_ready')?.message).toContain('band 7')
  })

  it('generates exam date reminder with target band', () => {
    const messages = withoutTip(generateProactiveMessages({
      learnerProfile: { targetBand: 6.5, examDate: new Date(Date.now() + 30 * 86400000).toISOString() },
    }))
    expect(hasMessageOfType(messages, 'exam_date_reminder')).toBe(true)
  })

  it('generates exam date reminder without exam date but with target', () => {
    const messages = withoutTip(generateProactiveMessages({
      learnerProfile: { targetBand: 7 },
    }))
    expect(hasMessageOfType(messages, 'exam_date_reminder')).toBe(true)
    expect(messages.find(m => m.triggerType === 'exam_date_reminder')?.message).toContain('band 7')
  })

  it('generates progress celebration for long streaks', () => {
    const messages = withoutTip(generateProactiveMessages({
      learnerProfile: { studyStreak: 14 },
    }))
    expect(hasMessageOfType(messages, 'progress_celebration')).toBe(true)
  })

  it('generates progress celebration for high accuracy', () => {
    const messages = withoutTip(generateProactiveMessages({
      learnerProfile: { averageAccuracy: 85, studyStreak: 7 },
    }))
    expect(hasMessageOfType(messages, 'progress_celebration')).toBe(true)
  })

  it('generates study session suggestion based on habit score and streak', () => {
    const messages = withoutTip(generateProactiveMessages({
      habitScore: 85,
      learnerProfile: { studyStreak: 21, weakSkills: ['writing'] },
    }))
    expect(hasMessageOfType(messages, 'study_session_suggestion')).toBe(true)
  })

  it('generates topic practice suggestion for weak skills', () => {
    const messages = withoutTip(generateProactiveMessages({
      learnerProfile: { weakSkills: ['speaking'] },
    }))
    expect(hasMessageOfType(messages, 'topic_practice_suggestion')).toBe(true)
    expect(messages.find(m => m.triggerType === 'topic_practice_suggestion')?.category).toBe('speaking-practice')
  })

  it('maps weak skill to correct practice category', () => {
    const skillCategoryMap: Record<string, string> = {
      writing: 'writing-practice',
      speaking: 'speaking-practice',
      reading: 'reading-practice',
      listening: 'listening-practice',
    }
    for (const [skill, category] of Object.entries(skillCategoryMap)) {
      const messages = withoutTip(generateProactiveMessages({
        learnerProfile: { weakSkills: [skill] },
      }))
      const tpMsg = messages.find(m => m.triggerType === 'topic_practice_suggestion')
      expect(tpMsg?.category).toBe(category)
    }
  })
})

// ─── generateProactiveMessagesWithSettings ───────────────────────────────────

describe('generateProactiveMessagesWithSettings', () => {
  it('returns empty when tutor is disabled', () => {
    const result = generateProactiveMessagesWithSettings(
      { dueVocabularyCount: 10 },
      { ...defaultSettings, enabled: false },
    )
    expect(result.messages).toEqual([])
    expect(result.reason).toContain('disabled')
  })

  it('returns empty during quiet hours', () => {
    const settings: ProactiveMessageSettings = {
      ...defaultSettings,
      quietHoursStart: '00:00',
      quietHoursEnd: '23:59',
    }
    const result = generateProactiveMessagesWithSettings(
      { dueVocabularyCount: 10 },
      settings,
    )
    expect(result.messages).toEqual([])
    expect(result.reason).toContain('Quiet hours')
  })

  it('respects max messages per day', () => {
    const pastDate = new Date()
    pastDate.setHours(pastDate.getHours() - 1)
    const existingMessages = Array.from({ length: 5 }, (_, i) => ({
      id: `existing-${i}`,
      triggerType: 'due_review' as const,
      category: 'vocabulary-review' as const,
      title: 'Existing',
      message: 'Existing message',
      priority: 'low' as const,
      isRead: true,
      isDismissed: false,
      isSnoozed: false,
      autoGenerated: true,
      createdAt: pastDate.toISOString(),
    }))
    const result = generateProactiveMessagesWithSettings(
      { dueVocabularyCount: 10 },
      { ...defaultSettings, maxMessagesPerDay: 5 },
      existingMessages,
    )
    expect(result.messages).toEqual([])
    expect(result.reason).toContain('Max messages')
  })

  it('allows messages within daily limit', () => {
    const result = generateProactiveMessagesWithSettings(
      { dueVocabularyCount: 10 },
      defaultSettings,
      [],
    )
    expect(result.messages.length).toBeGreaterThanOrEqual(1)
    expect(result.throttled).toBe(0)
  })

  it('filters out disabled categories', () => {
    const settings: ProactiveMessageSettings = {
      ...defaultSettings,
      categories: {
        ...defaultSettings.categories,
        'vocabulary-review': false,
      },
    }
    const result = generateProactiveMessagesWithSettings(
      { dueVocabularyCount: 10 },
      settings,
    )
    expect(result.messages.every(m => m.category !== 'vocabulary-review')).toBe(true)
  })

  it('applies friendly tone prefix', () => {
    const result = generateProactiveMessagesWithSettings(
      { dueVocabularyCount: 5 },
      { ...defaultSettings, tone: 'friendly' },
      [],
    )
    for (const msg of result.messages) {
      expect(msg.message.startsWith('Hey there!')).toBe(true)
    }
  })

  it('applies motivational tone prefix', () => {
    const result = generateProactiveMessagesWithSettings(
      { dueVocabularyCount: 5 },
      { ...defaultSettings, tone: 'motivational' },
      [],
    )
    for (const msg of result.messages) {
      expect(msg.message.startsWith('Let\'s go!')).toBe(true)
    }
  })

  it('applies vietnamese tone prefix', () => {
    const result = generateProactiveMessagesWithSettings(
      { dueVocabularyCount: 5 },
      { ...defaultSettings, tone: 'vietnamese' },
      [],
    )
    for (const msg of result.messages) {
      expect(msg.message.startsWith('Chào bạn!')).toBe(true)
    }
  })

  it('does not apply tone prefix for simple tone', () => {
    const result = generateProactiveMessagesWithSettings(
      { dueVocabularyCount: 5 },
      { ...defaultSettings, tone: 'simple' },
      [],
    )
    for (const msg of result.messages) {
      expect(msg.message.startsWith('Hey there!')).toBe(false)
      expect(msg.message.startsWith('Let\'s go!')).toBe(false)
      expect(msg.message.startsWith('Chào bạn!')).toBe(false)
    }
  })

  it('respects cooldowns for rate-limited trigger types', () => {
    const recentDate = new Date()
    recentDate.setHours(recentDate.getHours() - 1)
    const existingMessages = [{
      id: 'recent-streak',
      triggerType: 'study_streak' as const,
      category: 'motivation' as const,
      title: 'Recent streak',
      message: 'You studied for X days',
      priority: 'medium' as const,
      isRead: true,
      isDismissed: false,
      isSnoozed: false,
      autoGenerated: true,
      createdAt: recentDate.toISOString(),
    }]
    const result = generateProactiveMessagesWithSettings(
      { learnerProfile: { studyStreak: 10 } },
      defaultSettings,
      existingMessages,
    )
    expect(result.messages.every(m => m.triggerType !== 'study_streak')).toBe(true)
  })

  it('throttles excess messages beyond daily limit', () => {
    const settings: ProactiveMessageSettings = {
      ...defaultSettings,
      maxMessagesPerDay: 1,
    }
    const result = generateProactiveMessagesWithSettings(
      {
        dueVocabularyCount: 10,
        dueMistakeCount: 5,
        dailyPlanReady: true,
      },
      settings,
      [],
    )
    expect(result.messages.length).toBeLessThanOrEqual(1)
    expect(result.throttled).toBeGreaterThanOrEqual(2)
  })

  it('prioritizes high urgency messages when throttling', () => {
    const nearDate = new Date()
    nearDate.setDate(nearDate.getDate() + 3)
    const settings: ProactiveMessageSettings = {
      ...defaultSettings,
      maxMessagesPerDay: 2,
    }
    const result = generateProactiveMessagesWithSettings(
      {
        dueVocabularyCount: 30,
        dueMistakeCount: 15,
        dailyPlanReady: true,
        learnerProfile: {
          examDate: nearDate.toISOString(),
          weakSkills: ['writing'],
          studyStreak: 5,
        },
      },
      settings,
      [],
    )
    expect(result.messages.length).toBeLessThanOrEqual(2)
    expect(result.messages[0].priority).toBe('high')
  })
})

// ─── isCurrentlyQuietHours ───────────────────────────────────────────────────

describe('isCurrentlyQuietHours', () => {
  it('returns true when current time is within quiet hours', () => {
    const settings: ProactiveMessageSettings = {
      ...defaultSettings,
      quietHoursStart: '00:00',
      quietHoursEnd: '23:59',
    }
    expect(isCurrentlyQuietHours(settings)).toBe(true)
  })

  it('returns false when quiet hours do not cover now', () => {
    const settings: ProactiveMessageSettings = {
      ...defaultSettings,
      quietHoursStart: '03:00',
      quietHoursEnd: '04:00',
    }
    expect(isCurrentlyQuietHours(settings)).toBe(false)
  })
})

// ─── generateContextSuggestions ───────────────────────────────────────────────

describe('generateContextSuggestions', () => {
  it('returns set-exam-date and start-journey suggestions for empty input', () => {
    const suggestions = generateContextSuggestions(baseInput, [])
    expect(suggestions.length).toBeGreaterThanOrEqual(1)
    expect(suggestions.some(s => s.title.includes('exam date'))).toBe(true)
  })

  it('suggests vocabulary review when words are due', () => {
    const suggestions = generateContextSuggestions({ dueVocabularyCount: 10 }, [])
    expect(suggestions.some(s => s.title.toLowerCase().includes('word'))).toBe(true)
  })

  it('suggests mistake review when mistakes are due', () => {
    const suggestions = generateContextSuggestions({ dueMistakeCount: 5 }, [])
    expect(suggestions.some(s => s.title.toLowerCase().includes('mistake'))).toBe(true)
  })

  it('suggests weak skill focus when weak skills present', () => {
    const suggestions = generateContextSuggestions({
      learnerProfile: { weakSkills: ['speaking'] },
    }, [])
    expect(suggestions.some(s => s.title.toLowerCase().includes('weak'))).toBe(true)
  })

  it('suggests setting exam date when not set', () => {
    const suggestions = generateContextSuggestions(baseInput, [])
    expect(suggestions.some(s => s.title.includes('exam date'))).toBe(true)
  })

  it('caps suggestions at 3', () => {
    const suggestions = generateContextSuggestions({
      dueVocabularyCount: 10,
      dueMistakeCount: 5,
      learnerProfile: { weakSkills: ['writing', 'speaking'], studyStreak: 7 },
    }, [])
    expect(suggestions.length).toBeLessThanOrEqual(3)
  })

  it('each suggestion has required fields', () => {
    const suggestions = generateContextSuggestions({
      dueVocabularyCount: 10,
      learnerProfile: { weakSkills: ['reading'] },
    }, [])
    for (const s of suggestions) {
      expect(s.title).toBeTruthy()
      expect(s.message).toBeTruthy()
      expect(s.actionLabel).toBeTruthy()
    }
  })
})
