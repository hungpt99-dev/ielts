import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildGlobalStrategyPrompt, generateGlobalStudyStrategy } from '../globalStrategyService'
import type { StudyPlanUserProfile, StudyPlanCalculatedMeta } from '../../types'
import type { ProviderConfig } from '@ielts/ai'

vi.mock('@ielts/ai', () => ({
  callAI: vi.fn(),
}))

import { callAI } from '@ielts/ai'
import type { AICallResult } from '@ielts/ai'

const mockProfile: StudyPlanUserProfile = {
  currentBand: 5.5,
  targetBand: 7.0,
  examDate: '2026-02-15',
  dailyStudyMinutes: 60,
  preferredStudyDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
  restDays: ['sat', 'sun'],
  weakSkills: ['Reading', 'Writing'],
  strongSkills: ['Speaking'],
  mainFocusSkills: ['Listening'],
  studyIntensity: 'moderate',
  preferredLanguage: 'english',
  includeMockTests: true,
  includeVocabularyReview: true,
  includeGrammarReview: true,
  includeWeeklyProgressReview: true,
  includeFinalExamPreparationWeek: true,
  studyGoal: 'academic',
  preferredTopics: ['Education', 'Technology'],
}

const mockMeta: StudyPlanCalculatedMeta = {
  today: '2026-01-01',
  examDate: '2026-02-15',
  totalDays: 46,
  studyDays: 33,
  restDaysCount: 13,
  totalWeeks: 7,
  finalReviewPeriodDays: 7,
  mockTestSchedule: ['2026-01-15', '2026-01-29'],
  skillPriority: ['Listening', 'Reading', 'Writing', 'Vocabulary', 'Grammar', 'Speaking'],
}

function mockGetConfig(): ProviderConfig | null {
  return {
    apiKey: 'test-key',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
  }
}

const validStrategyJson = {
  planSummary: 'A 6-week IELTS study plan focusing on listening improvement while building reading and writing skills through structured daily practice.',
  phaseBreakdown: [
    {
      phaseName: 'Foundation',
      description: 'Build core skills and assess current level',
      startDate: '2026-01-01',
      endDate: '2026-01-07',
      weekCount: 1,
      mainFocus: 'Diagnostic assessment and skill foundation',
      targetSkill: 'all',
      weeklyGoals: [
        {
          weekNumber: 1,
          startDate: '2026-01-01',
          endDate: '2026-01-07',
          focusArea: 'Diagnostic',
          goal: 'Complete diagnostic tests for all skills',
          keyActivities: ['Take full diagnostic test', 'Identify specific weak areas'],
          mockTestPlanned: false,
        },
      ],
    },
    {
      phaseName: 'Skill Improvement',
      description: 'Improve all core skills with emphasis on weak areas',
      startDate: '2026-01-08',
      endDate: '2026-01-28',
      weekCount: 3,
      mainFocus: 'Skill development and practice',
      targetSkill: 'Listening',
      weeklyGoals: [
        {
          weekNumber: 2,
          startDate: '2026-01-08',
          endDate: '2026-01-14',
          focusArea: 'Listening fundamentals',
          goal: 'Build listening stamina and section familiarity',
          keyActivities: ['Practice listening sections 1-2', 'Review question types'],
          mockTestPlanned: false,
        },
        {
          weekNumber: 3,
          startDate: '2026-01-15',
          endDate: '2026-01-21',
          focusArea: 'Reading and Writing',
          goal: 'Improve reading speed and writing structure',
          keyActivities: ['Timed reading practice', 'Essay structure review'],
          mockTestPlanned: true,
        },
        {
          weekNumber: 4,
          startDate: '2026-01-22',
          endDate: '2026-01-28',
          focusArea: 'Integrated practice',
          goal: 'Combine skills in timed conditions',
          keyActivities: ['Full skills practice', 'Speaking mock'],
          mockTestPlanned: false,
        },
      ],
    },
  ],
  weeklyGoals: [
    {
      weekNumber: 1,
      startDate: '2026-01-01',
      endDate: '2026-01-07',
      focusArea: 'Diagnostic',
      goal: 'Complete diagnostic tests for all skills',
      keyActivities: ['Take full diagnostic test', 'Identify specific weak areas'],
      mockTestPlanned: false,
    },
    {
      weekNumber: 2,
      startDate: '2026-01-08',
      endDate: '2026-01-14',
      focusArea: 'Listening fundamentals',
      goal: 'Build listening stamina and section familiarity',
      keyActivities: ['Practice listening sections 1-2', 'Review question types'],
      mockTestPlanned: false,
    },
  ],
  mockTestSchedule: [
    {
      weekNumber: 3,
      date: '2026-01-18',
      focus: 'Full IELTS Mock Test',
    },
  ],
  finalWeekStrategy: 'Focus on reviewing mistakes from mock tests and reinforcing key strategies for each section. Prioritize rest and confidence building.',
  adjustmentRules: [
    'If a day is missed, combine lighter tasks into the next study day.',
    'If mock test scores drop below 6.0, spend extra time on weak skills.',
    'In the final week, reduce new content and focus on review.',
  ],
}

describe('buildGlobalStrategyPrompt', () => {
  it('returns system and user prompts', () => {
    const result = buildGlobalStrategyPrompt(mockProfile, mockMeta)
    expect(result.systemPrompt).toBeTruthy()
    expect(result.userPrompt).toBeTruthy()
    expect(result.systemPrompt).toContain('IELTS study plan strategist')
    expect(result.userPrompt).toContain('Current Band: 5.5')
    expect(result.userPrompt).toContain('Target Band: 7')
    expect(result.userPrompt).toContain('Total Days: 46')
    expect(result.userPrompt).toContain('Respond with JSON only')
  })

  it('includes phase distribution guidance for long plans', () => {
    const result = buildGlobalStrategyPrompt(mockProfile, mockMeta)
    expect(result.userPrompt).toContain('all phases with appropriate durations')
  })

  it('includes phase distribution guidance for short plans', () => {
    const shortMeta = { ...mockMeta, totalDays: 5 }
    const result = buildGlobalStrategyPrompt(mockProfile, shortMeta)
    expect(result.userPrompt).toContain('Skill Improvement + Final Review only')
  })
})

describe('generateGlobalStudyStrategy', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns error when AI config is null', async () => {
    const result = await generateGlobalStudyStrategy(mockProfile, mockMeta, () => null)
    expect(result.data).toBeNull()
    expect(result.error).toContain('not configured')
  })

  it('returns error when AI call fails', async () => {
    vi.mocked(callAI).mockResolvedValue({ content: null, error: 'API error' })

    const result = await generateGlobalStudyStrategy(mockProfile, mockMeta, mockGetConfig)
    expect(result.data).toBeNull()
    expect(result.error).toBe('API error')
  })

  it('returns error when AI returns empty content', async () => {
    vi.mocked(callAI).mockResolvedValue({ content: null, error: null })

    const result = await generateGlobalStudyStrategy(mockProfile, mockMeta, mockGetConfig)
    expect(result.data).toBeNull()
    expect(result.error).toContain('empty response')
  })

  it('returns error when AI response is not valid JSON', async () => {
    vi.mocked(callAI).mockResolvedValue({ content: 'not json at all', error: null })

    const result = await generateGlobalStudyStrategy(mockProfile, mockMeta, mockGetConfig)
    expect(result.data).toBeNull()
    expect(result.error).toContain('could not be parsed')
  })

  it('returns error when AI response has invalid structure', async () => {
    vi.mocked(callAI).mockResolvedValue({
      content: JSON.stringify({ invalid: true }),
      error: null,
    })

    const result = await generateGlobalStudyStrategy(mockProfile, mockMeta, mockGetConfig)
    expect(result.data).toBeNull()
    expect(result.error).toContain('could not be parsed')
  })

  it('returns error when phaseBreakdown has invalid phase name', async () => {
    const invalid = JSON.parse(JSON.stringify(validStrategyJson))
    invalid.phaseBreakdown[0].phaseName = 'Invalid Phase'

    vi.mocked(callAI).mockResolvedValue({
      content: JSON.stringify(invalid),
      error: null,
    })

    const result = await generateGlobalStudyStrategy(mockProfile, mockMeta, mockGetConfig)
    expect(result.data).toBeNull()
    expect(result.error).toContain('could not be parsed')
  })

  it('returns parsed strategy on successful valid response', async () => {
    vi.mocked(callAI).mockResolvedValue({
      content: JSON.stringify(validStrategyJson),
      error: null,
    })

    const result = await generateGlobalStudyStrategy(mockProfile, mockMeta, mockGetConfig)
    expect(result.error).toBeNull()
    expect(result.data).not.toBeNull()
    expect(result.data!.planSummary).toBe(validStrategyJson.planSummary)
    expect(result.data!.phaseBreakdown).toHaveLength(2)
    expect(result.data!.weeklyGoals).toHaveLength(2)
    expect(result.data!.mockTestSchedule).toHaveLength(1)
    expect(result.data!.finalWeekStrategy).toBe(validStrategyJson.finalWeekStrategy)
    expect(result.data!.adjustmentRules).toHaveLength(3)
    expect(result.data!.createdAt).toBeTruthy()
  })

  it('handles AI response with extra text around JSON', async () => {
    vi.mocked(callAI).mockResolvedValue({
      content: `Some intro text\n${JSON.stringify(validStrategyJson)}\nSome outro text`,
      error: null,
    })

    const result = await generateGlobalStudyStrategy(mockProfile, mockMeta, mockGetConfig)
    expect(result.error).toBeNull()
    expect(result.data).not.toBeNull()
    expect(result.data!.planSummary).toBe(validStrategyJson.planSummary)
  })

  it('validates weeklyGoals fields strictly', async () => {
    const invalid = JSON.parse(JSON.stringify(validStrategyJson))
    invalid.weeklyGoals[0].goal = 'X'

    vi.mocked(callAI).mockResolvedValue({
      content: JSON.stringify(invalid),
      error: null,
    })

    const result = await generateGlobalStudyStrategy(mockProfile, mockMeta, mockGetConfig)
    expect(result.data).toBeNull()
  })

  it('validates phase weeklyGoals', async () => {
    const invalid = JSON.parse(JSON.stringify(validStrategyJson))
    invalid.phaseBreakdown[0].weeklyGoals = []

    vi.mocked(callAI).mockResolvedValue({
      content: JSON.stringify(invalid),
      error: null,
    })

    const result = await generateGlobalStudyStrategy(mockProfile, mockMeta, mockGetConfig)
    expect(result.data).toBeNull()
  })

  it('calls AI with correct parameters', async () => {
    vi.mocked(callAI).mockResolvedValue({
      content: JSON.stringify(validStrategyJson),
      error: null,
    })

    await generateGlobalStudyStrategy(mockProfile, mockMeta, mockGetConfig)

    expect(callAI).toHaveBeenCalledTimes(1)
    const args = vi.mocked(callAI).mock.calls[0]
    expect(args[0]).toBeTruthy()
    expect(args[1]).toBeTruthy()
    expect(args[2]).toBeTypeOf('function')
    expect(args[3]).toEqual({ temperature: 0.7, maxTokens: 2048 })
  })
})
