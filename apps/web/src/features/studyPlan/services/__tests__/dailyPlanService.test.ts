import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  buildDailyPlanChunkPrompt,
  generateDailyPlanChunk,
  getTaskExplanation,
} from '../dailyPlanService'
import type {
  PlanChunkRequest,
  StudyPlanUserProfile,
  StudyPlanCalculatedMeta,
  DailyPlanItem,
} from '../../types'
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
  preferredTopics: [],
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

const mockStrategy = {
  planSummary: 'A focused 46-day IELTS study plan',
  phaseBreakdown: [
    {
      phaseName: 'Foundation' as const,
      description: 'Build core skills',
      startDate: '2026-01-01',
      endDate: '2026-01-07',
      weekCount: 1,
      mainFocus: 'Core skill building',
      targetSkill: 'all' as const,
      weeklyGoals: [
        {
          weekNumber: 1,
          startDate: '2026-01-01',
          endDate: '2026-01-07',
          focusArea: 'Foundation',
          goal: 'Build core IELTS skills',
          keyActivities: ['Practice listening', 'Read passages'],
          mockTestPlanned: false,
        },
      ],
    },
    {
      phaseName: 'Skill Improvement' as const,
      description: 'Improve all skills',
      startDate: '2026-01-08',
      endDate: '2026-01-28',
      weekCount: 3,
      mainFocus: 'Skill development',
      targetSkill: 'Listening',
      weeklyGoals: [
        {
          weekNumber: 2,
          startDate: '2026-01-08',
          endDate: '2026-01-14',
          focusArea: 'Listening',
          goal: 'Improve listening skills',
          keyActivities: ['Practice listening sections'],
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
      focusArea: 'Foundation',
      goal: 'Build core IELTS skills',
      keyActivities: ['Practice listening', 'Read passages'],
      mockTestPlanned: false,
    },
  ],
  mockTestSchedule: [
    { weekNumber: 3, date: '2026-01-18', focus: 'Full IELTS Mock Test' },
  ],
  finalWeekStrategy: 'Review all skills and practice mock tests',
  adjustmentRules: ['Adjust based on mock test results'],
  createdAt: '2026-01-01T00:00:00.000Z',
}

function createMockChunkRequest(overrides?: Partial<PlanChunkRequest>): PlanChunkRequest {
  return {
    userProfile: mockProfile,
    calculatedMeta: mockMeta,
    globalStrategy: mockStrategy,
    alreadyGeneratedDays: [],
    chunkStartDate: '2026-01-01',
    chunkEndDate: '2026-01-03',
    chunkDayNumbers: [1, 2, 3],
    chunkIndex: 0,
    totalChunks: 16,
    previousChunkSummary: null,
    ...overrides,
  }
}

function mockGetConfig(): ProviderConfig | null {
  return {
    apiKey: 'test-key',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
  }
}

function buildValidChunkResponse(): string {
  return JSON.stringify({
    days: [
      {
        date: '2026-01-01',
        dayNumber: 1,
        weekNumber: 1,
        phaseName: 'Foundation',
        mainGoal: 'Build foundational IELTS listening skills',
        listeningTask: { skill: 'Listening', title: 'Listen to conversation', description: 'Practice listening to a daily conversation', estimatedMinutes: 20, category: 'Listening' },
        readingTask: { skill: 'Reading', title: 'Read short passage', description: 'Read and answer questions', estimatedMinutes: 15, category: 'Reading' },
        writingTask: null,
        speakingTask: null,
        vocabularyTask: { skill: 'Vocabulary', title: 'Learn 10 new words', description: 'Study vocabulary list', estimatedMinutes: 10, category: 'Vocabulary' },
        grammarTask: null,
        reviewTask: null,
        estimatedTotalMinutes: 45,
        priority: 'medium',
        difficulty: 'medium',
        aiTutorNote: 'Focus on listening basics today',
        completionChecklist: ['Complete listening', 'Complete reading', 'Review vocabulary'],
      },
      {
        date: '2026-01-02',
        dayNumber: 2,
        weekNumber: 1,
        phaseName: 'Foundation',
        mainGoal: 'Build core reading comprehension',
        listeningTask: null,
        readingTask: { skill: 'Reading', title: 'Read IELTS passage', description: 'Practice skimming and scanning', estimatedMinutes: 25, category: 'Reading' },
        writingTask: { skill: 'Writing', title: 'Write Task 1 intro', description: 'Practice writing introduction paragraph', estimatedMinutes: 15, category: 'Writing Task 1' },
        speakingTask: null,
        vocabularyTask: { skill: 'Vocabulary', title: 'Review yesterday words', description: 'Spaced repetition review', estimatedMinutes: 10, category: 'Vocabulary' },
        grammarTask: null,
        reviewTask: null,
        estimatedTotalMinutes: 50,
        priority: 'medium',
        difficulty: 'medium',
        aiTutorNote: 'Reading is critical for overall score',
        completionChecklist: ['Complete reading', 'Complete writing', 'Review vocabulary'],
      },
      {
        date: '2026-01-03',
        dayNumber: 3,
        weekNumber: 1,
        phaseName: 'Foundation',
        mainGoal: 'Practice speaking fundamentals',
        listeningTask: { skill: 'Listening', title: 'Listen to lecture', description: 'Practice note-taking', estimatedMinutes: 20, category: 'Listening' },
        readingTask: null,
        writingTask: null,
        speakingTask: { skill: 'Speaking', title: 'Practice Part 1', description: 'Answer common Part 1 questions', estimatedMinutes: 15, category: 'Speaking Part 1' },
        vocabularyTask: null,
        grammarTask: { skill: 'Grammar', title: 'Review tenses', description: 'Practice verb tenses', estimatedMinutes: 10, category: 'Grammar' },
        reviewTask: null,
        estimatedTotalMinutes: 45,
        priority: 'medium',
        difficulty: 'medium',
        aiTutorNote: 'Speaking confidence comes from practice',
        completionChecklist: ['Complete listening', 'Complete speaking', 'Review grammar'],
      },
    ],
  })
}

describe('buildDailyPlanChunkPrompt', () => {
  it('returns system and user prompts', () => {
    const request = createMockChunkRequest()
    const result = buildDailyPlanChunkPrompt(request)
    expect(result.systemPrompt).toBeTruthy()
    expect(result.userPrompt).toBeTruthy()
    expect(result.systemPrompt).toContain('IELTS daily study plan generator')
    expect(result.userPrompt).toContain('Current Band: 5.5')
    expect(result.userPrompt).toContain('Target Band: 7')
    expect(result.userPrompt).toContain('Day 1 to Day 3')
    expect(result.userPrompt).toContain('Required Day Numbers: 1, 2, 3')
  })

  it('includes previous chunk summary when provided', () => {
    const request = createMockChunkRequest({
      chunkDayNumbers: [4, 5, 6],
      chunkStartDate: '2026-01-04',
      chunkEndDate: '2026-01-06',
      chunkIndex: 1,
      previousChunkSummary: 'Generated through Day 3 (2026-01-03). Phase: Foundation.',
    })
    const result = buildDailyPlanChunkPrompt(request)
    expect(result.userPrompt).toContain('Previous chunk summary')
    expect(result.userPrompt).toContain('Day 3')
  })

  it('includes already generated days context', () => {
    const request = createMockChunkRequest({
      alreadyGeneratedDays: [
        { dayNumber: 1, date: '2026-01-01', phase: 'Foundation' },
        { dayNumber: 2, date: '2026-01-02', phase: 'Foundation' },
      ],
    })
    const result = buildDailyPlanChunkPrompt(request)
    expect(result.userPrompt).toContain('Day 1')
    expect(result.userPrompt).toContain('Day 2')
  })

  it('includes phase map from global strategy', () => {
    const request = createMockChunkRequest()
    const result = buildDailyPlanChunkPrompt(request)
    expect(result.userPrompt).toContain('Foundation')
    expect(result.userPrompt).toContain('Skill Improvement')
  })

  it('includes mock test schedule when present', () => {
    const request = createMockChunkRequest()
    const result = buildDailyPlanChunkPrompt(request)
    expect(result.userPrompt).toContain('Mock Test')
  })
})

describe('generateDailyPlanChunk', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns error when AI config is null', async () => {
    const request = createMockChunkRequest()
    const result = await generateDailyPlanChunk(request, 'plan-1', () => null)
    expect(result.data).toBeNull()
    expect(result.error).toContain('not configured')
  })

  it('returns error when AI call fails', async () => {
    vi.mocked(callAI).mockResolvedValue({ content: null, error: 'API error' })
    const result = await generateDailyPlanChunk(createMockChunkRequest(), 'plan-1', mockGetConfig)
    expect(result.data).toBeNull()
    expect(result.error).toBe('API error')
  })

  it('returns error when AI returns empty content', async () => {
    vi.mocked(callAI).mockResolvedValue({ content: null, error: null })
    const result = await generateDailyPlanChunk(createMockChunkRequest(), 'plan-1', mockGetConfig)
    expect(result.data).toBeNull()
    expect(result.error).toContain('empty response')
  })

  it('returns error when AI content is not valid JSON', async () => {
    vi.mocked(callAI).mockResolvedValue({ content: 'not valid json', error: null })
    const result = await generateDailyPlanChunk(createMockChunkRequest(), 'plan-1', mockGetConfig)
    expect(result.data).toBeNull()
    expect(result.error).toContain('No JSON object found')
  })

  it('returns error when AI response is missing days array', async () => {
    vi.mocked(callAI).mockResolvedValue({
      content: JSON.stringify({ notDays: [] }),
      error: null,
    })
    const result = await generateDailyPlanChunk(createMockChunkRequest(), 'plan-1', mockGetConfig)
    expect(result.data).toBeNull()
    expect(result.error).toContain('missing the "days" array')
  })

  it('returns error when AI returns empty days array', async () => {
    vi.mocked(callAI).mockResolvedValue({
      content: JSON.stringify({ days: [] }),
      error: null,
    })
    const result = await generateDailyPlanChunk(createMockChunkRequest(), 'plan-1', mockGetConfig)
    expect(result.data).toBeNull()
    expect(result.error).toContain('empty days array')
  })

  it('returns error for invalid date format', async () => {
    vi.mocked(callAI).mockResolvedValue({
      content: JSON.stringify({
        days: [{
          date: '01-01-2026',
          dayNumber: 1,
          weekNumber: 1,
          phaseName: 'Foundation',
          mainGoal: 'Build foundation',
          estimatedTotalMinutes: 60,
          priority: 'medium',
          difficulty: 'medium',
          aiTutorNote: 'Note',
          completionChecklist: [],
        }],
      }),
      error: null,
    })
    const result = await generateDailyPlanChunk(createMockChunkRequest(), 'plan-1', mockGetConfig)
    expect(result.data).toBeNull()
    expect(result.error).toContain('Invalid date format')
  })

  it('returns error for missing dayNumber', async () => {
    vi.mocked(callAI).mockResolvedValue({
      content: JSON.stringify({
        days: [{
          date: '2026-01-01',
          dayNumber: 0,
          weekNumber: 1,
          phaseName: 'Foundation',
          mainGoal: 'Build foundation',
          estimatedTotalMinutes: 60,
          priority: 'medium',
          difficulty: 'medium',
          aiTutorNote: 'Note',
          completionChecklist: [],
        }],
      }),
      error: null,
    })
    const result = await generateDailyPlanChunk(createMockChunkRequest(), 'plan-1', mockGetConfig)
    expect(result.data).toBeNull()
    expect(result.error).toContain('dayNumber')
  })

  it('returns error for invalid phaseName', async () => {
    vi.mocked(callAI).mockResolvedValue({
      content: JSON.stringify({
        days: [{
          date: '2026-01-01',
          dayNumber: 1,
          weekNumber: 1,
          phaseName: 'InvalidPhase',
          mainGoal: 'Build foundation',
          estimatedTotalMinutes: 60,
          priority: 'medium',
          difficulty: 'medium',
          aiTutorNote: 'Note',
          completionChecklist: [],
        }],
      }),
      error: null,
    })
    const result = await generateDailyPlanChunk(createMockChunkRequest(), 'plan-1', mockGetConfig)
    expect(result.data).toBeNull()
    expect(result.error).toContain('Invalid phaseName')
  })

  it('returns error for too short mainGoal', async () => {
    vi.mocked(callAI).mockResolvedValue({
      content: JSON.stringify({
        days: [{
          date: '2026-01-01',
          dayNumber: 1,
          weekNumber: 1,
          phaseName: 'Foundation',
          mainGoal: 'Hi',
          estimatedTotalMinutes: 60,
          priority: 'medium',
          difficulty: 'medium',
          aiTutorNote: 'Note',
          completionChecklist: [],
        }],
      }),
      error: null,
    })
    const result = await generateDailyPlanChunk(createMockChunkRequest(), 'plan-1', mockGetConfig)
    expect(result.data).toBeNull()
    expect(result.error).toContain('mainGoal')
  })

  it('returns error for invalid priority', async () => {
    vi.mocked(callAI).mockResolvedValue({
      content: JSON.stringify({
        days: [{
          date: '2026-01-01',
          dayNumber: 1,
          weekNumber: 1,
          phaseName: 'Foundation',
          mainGoal: 'Build foundation',
          estimatedTotalMinutes: 60,
          priority: 'urgent',
          difficulty: 'medium',
          aiTutorNote: 'Note',
          completionChecklist: [],
        }],
      }),
      error: null,
    })
    const result = await generateDailyPlanChunk(createMockChunkRequest(), 'plan-1', mockGetConfig)
    expect(result.data).toBeNull()
    expect(result.error).toContain('Invalid priority')
  })

  it('returns error for invalid difficulty', async () => {
    vi.mocked(callAI).mockResolvedValue({
      content: JSON.stringify({
        days: [{
          date: '2026-01-01',
          dayNumber: 1,
          weekNumber: 1,
          phaseName: 'Foundation',
          mainGoal: 'Build foundation',
          estimatedTotalMinutes: 60,
          priority: 'medium',
          difficulty: 'expert',
          aiTutorNote: 'Note',
          completionChecklist: [],
        }],
      }),
      error: null,
    })
    const result = await generateDailyPlanChunk(createMockChunkRequest(), 'plan-1', mockGetConfig)
    expect(result.data).toBeNull()
    expect(result.error).toContain('Invalid difficulty')
  })

  it('returns error for negative estimatedTotalMinutes', async () => {
    vi.mocked(callAI).mockResolvedValue({
      content: JSON.stringify({
        days: [{
          date: '2026-01-01',
          dayNumber: 1,
          weekNumber: 1,
          phaseName: 'Foundation',
          mainGoal: 'Build foundation',
          estimatedTotalMinutes: -1,
          priority: 'medium',
          difficulty: 'medium',
          aiTutorNote: 'Note',
          completionChecklist: [],
        }],
      }),
      error: null,
    })
    const result = await generateDailyPlanChunk(createMockChunkRequest(), 'plan-1', mockGetConfig)
    expect(result.data).toBeNull()
    expect(result.error).toContain('estimatedTotalMinutes')
  })

  it('returns error when minutes > 0 but no tasks', async () => {
    vi.mocked(callAI).mockResolvedValue({
      content: JSON.stringify({
        days: [{
          date: '2026-01-01',
          dayNumber: 1,
          weekNumber: 1,
          phaseName: 'Foundation',
          mainGoal: 'Build foundation',
          listeningTask: null,
          readingTask: null,
          writingTask: null,
          speakingTask: null,
          vocabularyTask: null,
          grammarTask: null,
          reviewTask: null,
          estimatedTotalMinutes: 60,
          priority: 'medium',
          difficulty: 'medium',
          aiTutorNote: 'Note',
          completionChecklist: [],
        }],
      }),
      error: null,
    })
    const result = await generateDailyPlanChunk(createMockChunkRequest(), 'plan-1', mockGetConfig)
    expect(result.data).toBeNull()
    expect(result.error).toContain('no tasks assigned')
  })

  it('returns error for invalid task skill', async () => {
    vi.mocked(callAI).mockResolvedValue({
      content: JSON.stringify({
        days: [{
          date: '2026-01-01',
          dayNumber: 1,
          weekNumber: 1,
          phaseName: 'Foundation',
          mainGoal: 'Build foundation',
          listeningTask: { skill: 'Cooking', title: 'Listen', description: 'desc', estimatedMinutes: 20, category: 'Listening' },
          readingTask: null,
          writingTask: null,
          speakingTask: null,
          vocabularyTask: null,
          grammarTask: null,
          reviewTask: null,
          estimatedTotalMinutes: 20,
          priority: 'medium',
          difficulty: 'medium',
          aiTutorNote: 'Note',
          completionChecklist: [],
        }],
      }),
      error: null,
    })
    const result = await generateDailyPlanChunk(createMockChunkRequest(), 'plan-1', mockGetConfig)
    expect(result.data).toBeNull()
    expect(result.error).toContain('Invalid skill')
  })

  it('returns error for invalid task category', async () => {
    vi.mocked(callAI).mockResolvedValue({
      content: JSON.stringify({
        days: [{
          date: '2026-01-01',
          dayNumber: 1,
          weekNumber: 1,
          phaseName: 'Foundation',
          mainGoal: 'Build foundation',
          listeningTask: { skill: 'Listening', title: 'Listen', description: 'desc', estimatedMinutes: 20, category: 'Cooking' },
          readingTask: null,
          writingTask: null,
          speakingTask: null,
          vocabularyTask: null,
          grammarTask: null,
          reviewTask: null,
          estimatedTotalMinutes: 20,
          priority: 'medium',
          difficulty: 'medium',
          aiTutorNote: 'Note',
          completionChecklist: [],
        }],
      }),
      error: null,
    })
    const result = await generateDailyPlanChunk(createMockChunkRequest(), 'plan-1', mockGetConfig)
    expect(result.data).toBeNull()
    expect(result.error).toContain('Invalid category')
  })

  it('returns error for task with short title', async () => {
    vi.mocked(callAI).mockResolvedValue({
      content: JSON.stringify({
        days: [{
          date: '2026-01-01',
          dayNumber: 1,
          weekNumber: 1,
          phaseName: 'Foundation',
          mainGoal: 'Build foundation',
          listeningTask: { skill: 'Listening', title: 'AB', description: 'desc', estimatedMinutes: 20, category: 'Listening' },
          readingTask: null,
          writingTask: null,
          speakingTask: null,
          vocabularyTask: null,
          grammarTask: null,
          reviewTask: null,
          estimatedTotalMinutes: 20,
          priority: 'medium',
          difficulty: 'medium',
          aiTutorNote: 'Note',
          completionChecklist: [],
        }],
      }),
      error: null,
    })
    const result = await generateDailyPlanChunk(createMockChunkRequest(), 'plan-1', mockGetConfig)
    expect(result.data).toBeNull()
    expect(result.error).toContain('title')
  })

  it('successfully parses valid chunk response', async () => {
    vi.mocked(callAI).mockResolvedValue({
      content: buildValidChunkResponse(),
      error: null,
    })

    const result = await generateDailyPlanChunk(createMockChunkRequest(), 'plan-1', mockGetConfig)
    expect(result.error).toBeNull()
    expect(result.data).not.toBeNull()
    expect(result.data).toHaveLength(3)
    expect(result.data![0].dayNumber).toBe(1)
    expect(result.data![0].date).toBe('2026-01-01')
    expect(result.data![0].planId).toBe('plan-1')
    expect(result.data![1].dayNumber).toBe(2)
    expect(result.data![2].dayNumber).toBe(3)
  })

  it('handles AI response with extra text around JSON', async () => {
    vi.mocked(callAI).mockResolvedValue({
      content: `Here is your plan:\n${buildValidChunkResponse()}\nGood luck!`,
      error: null,
    })

    const result = await generateDailyPlanChunk(createMockChunkRequest(), 'plan-1', mockGetConfig)
    expect(result.error).toBeNull()
    expect(result.data).toHaveLength(3)
  })

  it('calls AI with correct parameters', async () => {
    vi.mocked(callAI).mockResolvedValue({
      content: buildValidChunkResponse(),
      error: null,
    })

    await generateDailyPlanChunk(createMockChunkRequest(), 'plan-1', mockGetConfig, {
      temperature: 0.5,
      maxTokens: 2048,
    })

    expect(callAI).toHaveBeenCalledTimes(1)
    const args = vi.mocked(callAI).mock.calls[0]
    expect(args[0]).toBeTruthy()
    expect(args[1]).toBeTruthy()
    expect(args[3]).toEqual({ temperature: 0.5, maxTokens: 2048 })
  })

  it('uses default temperature and maxTokens when options not provided', async () => {
    vi.mocked(callAI).mockResolvedValue({
      content: buildValidChunkResponse(),
      error: null,
    })

    await generateDailyPlanChunk(createMockChunkRequest(), 'plan-1', mockGetConfig)

    const args = vi.mocked(callAI).mock.calls[0]
    expect(args[3]).toEqual({ temperature: 0.7, maxTokens: 4096 })
  })

  it('returns validation errors from validateChunkDays', async () => {
    const response = JSON.parse(buildValidChunkResponse())
    response.days[0].dayNumber = 99

    vi.mocked(callAI).mockResolvedValue({
      content: JSON.stringify(response),
      error: null,
    })

    const result = await generateDailyPlanChunk(createMockChunkRequest(), 'plan-1', mockGetConfig)
    expect(result.data).toBeNull()
    expect(result.error).toContain('Chunk validation failed')
  })

  it('handles unknown errors gracefully', async () => {
    vi.mocked(callAI).mockRejectedValue(new Error('Network error'))
    const result = await generateDailyPlanChunk(createMockChunkRequest(), 'plan-1', mockGetConfig)
    expect(result.data).toBeNull()
    expect(result.error).toBe('Network error')
  })
})

describe('getTaskExplanation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const taskInput = {
    taskTitle: 'Listen to IELTS conversation',
    taskDescription: 'Practice listening to a daily conversation about travel',
    taskMinutes: 20,
    taskLabel: 'Listening Task',
    dayNumber: 1,
    date: '2026-01-01',
    phaseName: 'Foundation' as const,
    mainGoal: 'Build foundational listening skills',
    estimatedTotalMinutes: 60,
  }

  it('returns error when AI config is null', async () => {
    const result = await getTaskExplanation(taskInput, () => null)
    expect(result.explanation).toBe('')
    expect(result.error).toContain('not configured')
  })

  it('returns error when AI call fails', async () => {
    vi.mocked(callAI).mockResolvedValue({ content: null, error: 'API error' })
    const result = await getTaskExplanation(taskInput, mockGetConfig)
    expect(result.explanation).toBe('')
    expect(result.error).toBe('API error')
  })

  it('returns error when AI returns empty content', async () => {
    vi.mocked(callAI).mockResolvedValue({ content: null, error: null })
    const result = await getTaskExplanation(taskInput, mockGetConfig)
    expect(result.explanation).toBe('')
    expect(result.error).toContain('empty response')
  })

  it('returns error when response is not valid JSON', async () => {
    vi.mocked(callAI).mockResolvedValue({ content: 'not json', error: null })
    const result = await getTaskExplanation(taskInput, mockGetConfig)
    expect(result.explanation).toBe('')
    expect(result.error).toContain('valid JSON')
  })

  it('returns error when response is missing explanation field', async () => {
    vi.mocked(callAI).mockResolvedValue({
      content: JSON.stringify({ notExplanation: 'text' }),
      error: null,
    })
    const result = await getTaskExplanation(taskInput, mockGetConfig)
    expect(result.explanation).toBe('')
    expect(result.error).toContain('missing explanation')
  })

  it('returns explanation on successful response', async () => {
    vi.mocked(callAI).mockResolvedValue({
      content: JSON.stringify({ explanation: 'This task builds listening stamina for the exam.' }),
      error: null,
    })
    const result = await getTaskExplanation(taskInput, mockGetConfig)
    expect(result.error).toBeNull()
    expect(result.explanation).toBe('This task builds listening stamina for the exam.')
  })

  it('handles extra text around JSON response', async () => {
    vi.mocked(callAI).mockResolvedValue({
      content: `Some text\n${JSON.stringify({ explanation: 'Good explanation' })}\nMore text`,
      error: null,
    })
    const result = await getTaskExplanation(taskInput, mockGetConfig)
    expect(result.error).toBeNull()
    expect(result.explanation).toBe('Good explanation')
  })

  it('calls AI with correct parameters', async () => {
    vi.mocked(callAI).mockResolvedValue({
      content: JSON.stringify({ explanation: 'Explanation text' }),
      error: null,
    })

    await getTaskExplanation(taskInput, mockGetConfig)

    expect(callAI).toHaveBeenCalledTimes(1)
    const args = vi.mocked(callAI).mock.calls[0]
    expect(args[0]).toContain('IELTS tutor')
    expect(args[1]).toContain('Explain why this task')
    expect(args[3]).toEqual({ temperature: 0.5, maxTokens: 512 })
  })

  it('handles unknown errors gracefully', async () => {
    vi.mocked(callAI).mockRejectedValue(new Error('Network failure'))
    const result = await getTaskExplanation(taskInput, mockGetConfig)
    expect(result.explanation).toBe('')
    expect(result.error).toBe('Network failure')
  })
})
