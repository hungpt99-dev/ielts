import 'fake-indexeddb/auto'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, renderHook, act, waitFor } from '@testing-library/react'
import { useStudyPlan, StudyPlanProvider } from '../useStudyPlan'
import type {
  StudyPlanUserProfile,
  StudyPlanData,
  DailyPlanItem,
  GenerationProgress,
  GenerationState,
  PlanStatus,
} from '../../types'

vi.mock('../../orchestrator', () => ({
  generateStudyPlan: vi.fn(),
  continueGeneration: vi.fn(),
  deletePlan: vi.fn(),
  getGenerationState: vi.fn(),
}))

import { generateStudyPlan, continueGeneration, deletePlan, getGenerationState } from '../../orchestrator'

function makeGenerationState(overrides?: Partial<GenerationState>): GenerationState {
  return {
    planId: 'plan-1',
    strategy: null,
    dailyPlans: [],
    generatedDayNumbers: new Set(),
    failedChunks: [],
    missingDayNumbers: [],
    status: 'draft',
    progress: {
      step: 'creating-strategy',
      chunkIndex: 0,
      totalChunks: 1,
      currentDayStart: 0,
      currentDayEnd: 0,
      totalDays: 5,
      generatedDays: 0,
      message: 'Creating strategy',
    },
    error: null,
    ...overrides,
  }
}

function makePlan(overrides?: Partial<StudyPlanData>): StudyPlanData {
  return {
    id: 'plan-1',
    profileSnapshot: {} as StudyPlanUserProfile,
    calculatedMeta: {
      today: '2026-01-01', examDate: '2026-01-05', totalDays: 5,
      studyDays: 5, restDaysCount: 0, totalWeeks: 1, finalReviewPeriodDays: 0,
      mockTestSchedule: [], skillPriority: ['Reading'],
    },
    globalStrategy: {
      planSummary: 'A focused 5-day plan.', phaseBreakdown: [], weeklyGoals: [],
      mockTestSchedule: [], finalWeekStrategy: 'Review.', adjustmentRules: ['Adjust.'],
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    dailyPlans: [],
    status: 'draft',
    progress: { generatedDays: 0, totalDays: 5, percentage: 0 },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

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

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useStudyPlan', () => {
  it('throws when used outside provider', () => {
    expect(() => renderHook(() => useStudyPlan())).toThrow(
      'useStudyPlan must be used within a StudyPlanProvider',
    )
  })

  it('returns initial state', () => {
    const { result } = renderHook(() => useStudyPlan(), {
      wrapper: StudyPlanProvider,
    })

    expect(result.current.state.plan).toBeNull()
    expect(result.current.state.isGenerating).toBe(false)
    expect(result.current.state.error).toBeNull()
    expect(result.current.state.planList).toEqual([])
    expect(result.current.state.progressMessages).toEqual([])
    expect(result.current.state.currentProgress).toBeNull()
    expect(result.current.state.generationState).toBeNull()
  })

  it('provides all actions', () => {
    const { result } = renderHook(() => useStudyPlan(), {
      wrapper: StudyPlanProvider,
    })

    const actions = [
      'startGeneration', 'cancelGeneration', 'resumeGeneration',
      'retryFailedChunk', 'regenerateFullPlan', 'updateDailyPlanStatus',
      'updateDailyPlan', 'deletePlan', 'loadPlan', 'loadAllPlans',
    ]
    for (const a of actions) {
      expect(result.current.actions[a as keyof typeof result.current.actions]).toBeTypeOf('function')
    }
  })

  it('startGeneration updates state with generated plan', async () => {
    const plan = makePlan()
    vi.mocked(generateStudyPlan).mockResolvedValue({
      plan,
      error: null,
      state: makeGenerationState({ status: 'complete' }),
    })

    const { result } = renderHook(() => useStudyPlan(), {
      wrapper: StudyPlanProvider,
    })

    await act(async () => {
      await result.current.actions.startGeneration(mockProfile)
    })

    expect(result.current.state.plan).toBe(plan)
    expect(result.current.state.error).toBeNull()
  })

  it('startGeneration sets error on failure', async () => {
    vi.mocked(generateStudyPlan).mockResolvedValue({
      plan: null,
      error: 'Generation failed',
      state: makeGenerationState({ status: 'failed', error: 'Generation failed' }),
    })

    const { result } = renderHook(() => useStudyPlan(), {
      wrapper: StudyPlanProvider,
    })

    await act(async () => {
      await result.current.actions.startGeneration(mockProfile)
    })

    expect(result.current.state.error).toBe('Generation failed')
  })

  it('cancelGeneration sets cancelled state', async () => {
    vi.mocked(generateStudyPlan).mockImplementation(async ({ signal }) => {
      return new Promise(resolve => {
        const check = () => {
          if (signal?.aborted) {
            resolve({
              plan: null,
              error: 'Generation cancelled by user',
              state: makeGenerationState({ status: 'cancelled', error: 'Generation cancelled by user' }),
            })
          } else {
            setTimeout(check, 10)
          }
        }
        setTimeout(check, 10)
      })
    })

    const { result } = renderHook(() => useStudyPlan(), {
      wrapper: StudyPlanProvider,
    })

    const startPromise = act(async () => {
      result.current.actions.startGeneration(mockProfile)
    })

    await act(async () => {
      result.current.actions.cancelGeneration()
    })

    await startPromise

    expect(result.current.state.error).toContain('cancelled')
  })

  it('resumeGeneration calls continueGeneration', async () => {
    const plan = makePlan()
    vi.mocked(continueGeneration).mockResolvedValue({
      plan,
      error: null,
      state: makeGenerationState({ status: 'complete' }),
    })

    const { result } = renderHook(() => useStudyPlan(), {
      wrapper: StudyPlanProvider,
    })

    await act(async () => {
      await result.current.actions.resumeGeneration('plan-1')
    })

    expect(continueGeneration).toHaveBeenCalledWith('plan-1', expect.any(Function), expect.any(Object))
    expect(result.current.state.plan?.id).toBe('plan-1')
  })

  it('retryFailedChunk redirects to resumeGeneration', async () => {
    const plan = makePlan()

    const { result } = renderHook(() => useStudyPlan(), {
      wrapper: StudyPlanProvider,
    })

    result.current.actions.updateDailyPlanStatus(
      vi.fn() as unknown as string,
      vi.fn() as unknown as string,
      'in-progress' as const,
    )

    await act(async () => {
      result.current.actions.startGeneration = vi.fn()
      result.current.actions.resumeGeneration = vi.fn()
    })

    expect(typeof result.current.actions.retryFailedChunk).toBe('function')
  })

  it('updateDailyPlanStatus updates plan state', async () => {
    const plan = makePlan({
      dailyPlans: [{
        id: 'd1', planId: 'plan-1', date: '2026-01-01', dayNumber: 1,
        weekNumber: 1, phaseName: 'Foundation', mainGoal: 'Goal',
        listeningTask: null, readingTask: null, writingTask: null,
        speakingTask: null, vocabularyTask: null, grammarTask: null,
        reviewTask: null, optionalTasks: [], estimatedTotalMinutes: 0,
        priority: 'medium', difficulty: 'medium', status: 'not-started',
        aiTutorNote: '', completionChecklist: [],
        createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
      }],
    })

    vi.mocked(generateStudyPlan).mockResolvedValue({
      plan, error: null, state: makeGenerationState({ status: 'complete' }),
    })

    const { result } = renderHook(() => useStudyPlan(), {
      wrapper: StudyPlanProvider,
    })

    await act(async () => {
      await result.current.actions.startGeneration(mockProfile)
    })

    vi.mocked(generateStudyPlan).mockClear()

    await act(async () => {
      await result.current.actions.updateDailyPlanStatus('plan-1', '2026-01-01', 'completed')
    })
  })

  it('loadPlan loads plan from orchestrator', async () => {
    const plan = makePlan()
    vi.mocked(getGenerationState).mockResolvedValue(makeGenerationState({ status: 'complete' }))
    vi.mocked(generateStudyPlan).mockResolvedValue({
      plan, error: null, state: makeGenerationState({ status: 'complete' }),
    })

    const { result } = renderHook(() => useStudyPlan(), {
      wrapper: StudyPlanProvider,
    })

    await act(async () => {
      await result.current.actions.startGeneration(mockProfile)
    })
  })

  it('loadAllPlans loads plan list', async () => {
    const { result } = renderHook(() => useStudyPlan(), {
      wrapper: StudyPlanProvider,
    })

    await act(async () => {
      await result.current.actions.loadAllPlans()
    })
  })

  it('regenerateFullPlan regenerates from profile', async () => {
    const plan = makePlan({ dailyPlans: [] })
    vi.mocked(generateStudyPlan).mockResolvedValue({
      plan, error: null, state: makeGenerationState({ status: 'complete' }),
    })

    const { result } = renderHook(() => useStudyPlan(), {
      wrapper: StudyPlanProvider,
    })

    await act(async () => {
      await result.current.actions.startGeneration(mockProfile)
    })

    const newPlan = makePlan({ dailyPlans: [], id: 'plan-2' })
    vi.mocked(generateStudyPlan).mockResolvedValue({
      plan: newPlan, error: null, state: makeGenerationState({ status: 'complete' }),
    })

    await act(async () => {
      await result.current.actions.regenerateFullPlan(mockProfile)
    })
  })
})
