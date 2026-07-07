import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { LearningEvent } from '../../learningEvents/types'
import { ProactiveTutorContextBuilder } from '../ProactiveTutorContextBuilder'

const { mockLoadAppSettings, mockGetDueCount, mockFindActivePlan, mockCountInWindow, mockFindByDateRange } = vi.hoisted(() => ({
  mockLoadAppSettings: vi.fn(() => ({
    targetBand: 7,
    currentBand: 5.5,
    examDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    dailyStudyMinutes: 60,
    weakSkills: ['writing', 'speaking'],
    preferredTopics: [],
    studyReminder: '',
    studyGoal: 'academic' as const,
    preferredSchedule: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
    aiApiKey: '',
    aiProvider: 'openai',
    aiBaseUrl: '',
    aiEndpoint: '',
    aiModel: '',
    darkMode: false,
    aiEnabled: false,
  })),
  mockGetDueCount: vi.fn().mockResolvedValue(0),
  mockFindActivePlan: vi.fn().mockResolvedValue(null),
  mockCountInWindow: vi.fn().mockResolvedValue(0),
  mockFindByDateRange: vi.fn().mockResolvedValue([]),
}))

vi.mock('../../../services/storage/SettingsStorage', () => ({
  loadAppSettings: mockLoadAppSettings,
}))

vi.mock('@ielts/storage', () => ({
  VocabReviewRepository: vi.fn(() => ({
    getDueCount: mockGetDueCount,
  })),
  CustomStudyPlanRepository: vi.fn(() => ({
    findActive: mockFindActivePlan,
  })),
}))

vi.mock('../../learningEvents/learningEventRepository', () => ({
  learningEventRepository: {
    countInWindow: mockCountInWindow,
    findByDateRange: mockFindByDateRange,
  },
}))

vi.mock('../CooldownManager', () => ({
  cooldownManager: {
    getState: vi.fn(() => ({
      global: { lastMessageAt: null },
      byEventType: {},
    })),
  },
}))

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

describe('ProactiveTutorContextBuilder', () => {
  let builder: ProactiveTutorContextBuilder

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    builder = new ProactiveTutorContextBuilder()
  })

  describe('buildContext', () => {
    it('returns a ProactiveTutorContext with all required fields', async () => {
      const context = await builder.buildContext()

      expect(context).toHaveProperty('sessionVocabularyCount')
      expect(context).toHaveProperty('dailyVocabularySaved')
      expect(context).toHaveProperty('weeklyVocabularySaved')
      expect(context).toHaveProperty('dueVocabularyCount')
      expect(context).toHaveProperty('sessionMistakeCount')
      expect(context).toHaveProperty('dailyMistakeSaved')
      expect(context).toHaveProperty('repeatedMistakeCount')
      expect(context).toHaveProperty('dailyTasksCompleted')
      expect(context).toHaveProperty('dailyTasksSkipped')
      expect(context).toHaveProperty('consecutiveMissedDays')
      expect(context).toHaveProperty('currentStreak')
      expect(context).toHaveProperty('totalStreak')
      expect(context).toHaveProperty('targetBand')
      expect(context).toHaveProperty('examDate')
      expect(context).toHaveProperty('daysUntilExam')
      expect(context).toHaveProperty('todayPlanComplete')
      expect(context).toHaveProperty('pendingTasksCount')
      expect(context).toHaveProperty('weakSkills')
      expect(context).toHaveProperty('lastActiveAt')
      expect(context).toHaveProperty('inactiveMinutes')
      expect(context).toHaveProperty('recentAccuracy')
    })

    it('extracts repeatedMistakeCount from event payload', async () => {
      const event = makeEvent({
        eventType: 'repeated_mistake_detected',
        payload: {
          eventType: 'repeated_mistake_detected',
          mistakeId: 'm-1',
          mistake: 'article error',
          skill: 'grammar',
          repetitionCount: 5,
        },
      })

      const context = await builder.buildContext(event)
      expect(context.repeatedMistakeCount).toBe(5)
    })

    it('returns 0 repeatedMistakeCount for non-mistake events', async () => {
      const context = await builder.buildContext(makeEvent())
      expect(context.repeatedMistakeCount).toBe(0)
    })

    it('loads app settings for targetBand, examDate, weakSkills', async () => {
      const context = await builder.buildContext()
      expect(context.targetBand).toBe(7)
      expect(context.daysUntilExam).toBeGreaterThan(0)
      expect(context.weakSkills).toEqual(['writing', 'speaking'])
    })

    it('handles empty examDate in settings', async () => {
      mockLoadAppSettings.mockReturnValueOnce({
        targetBand: 0,
        currentBand: 0,
        examDate: '',
        dailyStudyMinutes: 0,
        weakSkills: [],
        preferredTopics: [],
        studyReminder: '',
        studyGoal: 'academic',
        preferredSchedule: [],
        aiApiKey: '',
        aiProvider: 'openai',
        aiBaseUrl: '',
        aiEndpoint: '',
        aiModel: '',
        darkMode: false,
        aiEnabled: false,
      })

      const context = await builder.buildContext()
      expect(context.targetBand).toBeNull()
      expect(context.examDate).toBeNull()
      expect(context.daysUntilExam).toBeNull()
    })

    it('calls vocab review repository to get due count', async () => {
      mockGetDueCount.mockResolvedValueOnce(5)
      const context = await builder.buildContext()
      expect(context.dueVocabularyCount).toBe(5)
    })

    it('reads streak values from localStorage', async () => {
      localStorage.setItem('ielts-proactive-streak', JSON.stringify({ current: 7, total: 30 }))
      localStorage.setItem('ielts-proactive-consecutive-missed', '2')

      const context = await builder.buildContext()
      expect(context.currentStreak).toBe(7)
      expect(context.totalStreak).toBe(30)
      expect(context.consecutiveMissedDays).toBe(2)
    })

    it('calculates inactiveMinutes from lastActiveAt', async () => {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
      localStorage.setItem('ielts-proactive-last-active', tenMinutesAgo)

      const context = await builder.buildContext()
      expect(context.inactiveMinutes).toBeGreaterThanOrEqual(9)
      expect(context.inactiveMinutes).toBeLessThanOrEqual(11)
    })
  })

  describe('buildEngineInput', () => {
    it('returns a RuleEngineInput with context, cooldown state, and page info', async () => {
      const event = makeEvent()
      const input = await builder.buildEngineInput(event, {
        currentPage: '/vocabulary',
        isUserChattingWithTutor: false,
      })

      expect(input.event).toBe(event)
      expect(input.context).toBeDefined()
      expect(input.cooldownState).toBeDefined()
      expect(input.cooldownState.global).toBeDefined()
      expect(input.currentPage).toBe('/vocabulary')
      expect(input.isUserChattingWithTutor).toBe(false)
    })
  })
})
