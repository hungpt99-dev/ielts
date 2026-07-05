import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PlanControls from '../PlanControls'
import * as useStudyPlanModule from '../../hooks/useStudyPlan'
import type { StudyPlanData, GenerationState, GenerationProgress } from '../../types'

function createPlan(overrides?: Partial<StudyPlanData>): StudyPlanData {
  return {
    id: 'plan-1',
    profileSnapshot: {
      currentBand: 5.5,
      targetBand: 7,
      examDate: '2026-08-01',
      dailyStudyMinutes: 120,
      preferredStudyDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
      restDays: ['sat', 'sun'],
      weakSkills: ['Writing', 'Speaking'],
      strongSkills: ['Reading', 'Vocabulary'],
      mainFocusSkills: ['Writing', 'Speaking'],
      studyIntensity: 'moderate',
      preferredLanguage: 'english',
      includeMockTests: true,
      includeVocabularyReview: true,
      includeGrammarReview: true,
      includeWeeklyProgressReview: true,
      includeFinalExamPreparationWeek: true,
      studyGoal: 'academic',
      preferredTopics: ['education', 'environment'],
    },
    calculatedMeta: {
      today: '2026-07-01',
      examDate: '2026-08-01',
      totalDays: 31,
      studyDays: 22,
      restDaysCount: 9,
      totalWeeks: 5,
      finalReviewPeriodDays: 7,
      mockTestSchedule: ['2026-07-15', '2026-07-22', '2026-07-29'],
      skillPriority: ['Writing', 'Speaking', 'Listening', 'Reading'],
    },
    globalStrategy: {
      planSummary: 'A comprehensive study plan',
      phaseBreakdown: [],
      weeklyGoals: [],
      mockTestSchedule: [],
      finalWeekStrategy: 'Focus on weak areas',
      adjustmentRules: [],
      createdAt: '2026-07-01T00:00:00.000Z',
    },
    dailyPlans: [],
    status: 'complete',
    progress: { generatedDays: 0, totalDays: 31, percentage: 0 },
    createdAt: '2026-07-01T00:00:00.000Z',
    updatedAt: '2026-07-01T00:00:00.000Z',
    ...overrides,
  }
}

function createGenerationState(overrides?: Partial<GenerationState>): GenerationState {
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
      totalChunks: 10,
      currentDayStart: 0,
      currentDayEnd: 0,
      totalDays: 31,
      generatedDays: 0,
      message: 'Creating global study strategy',
    },
    error: null,
    ...overrides,
  }
}

type MockContext = ReturnType<typeof useStudyPlanModule.useStudyPlan>

describe('PlanControls', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders nothing when idle and no plan exists', () => {
    vi.spyOn(useStudyPlanModule, 'useStudyPlan').mockReturnValue({
      state: {
        plan: null,
        generationState: null,
        isGenerating: false,
        currentProgress: null,
        progressMessages: [],
        error: null,
        planList: [],
      },
      actions: {
        cancelGeneration: vi.fn(),
        resumeGeneration: vi.fn(),
        retryFailedChunk: vi.fn(),
        regenerateFullPlan: vi.fn(),
        startGeneration: vi.fn(),
        updateDailyPlanStatus: vi.fn(),
        updateDailyPlan: vi.fn(),
        deletePlan: vi.fn(),
        loadPlan: vi.fn(),
        loadAllPlans: vi.fn(),
      } as unknown as MockContext['actions'],
    } as MockContext)

    const { container } = render(<PlanControls />)
    expect(container.firstChild).toBeNull()
  })

  it('renders Cancel button when generating', () => {
    const mockCancel = vi.fn()

    vi.spyOn(useStudyPlanModule, 'useStudyPlan').mockReturnValue({
      state: {
        plan: null,
        generationState: createGenerationState({ status: 'generating' }),
        isGenerating: true,
        currentProgress: null,
        progressMessages: [],
        error: null,
        planList: [],
      },
      actions: {
        cancelGeneration: mockCancel,
        resumeGeneration: vi.fn(),
        retryFailedChunk: vi.fn(),
        regenerateFullPlan: vi.fn(),
        startGeneration: vi.fn(),
        updateDailyPlanStatus: vi.fn(),
        updateDailyPlan: vi.fn(),
        deletePlan: vi.fn(),
        loadPlan: vi.fn(),
        loadAllPlans: vi.fn(),
      } as unknown as MockContext['actions'],
    } as MockContext)

    render(<PlanControls />)
    const btn = screen.getByRole('button', { name: 'Cancel' })
    expect(btn).toBeTruthy()
    btn.click()
    expect(mockCancel).toHaveBeenCalledOnce()
  })

  it('renders only Cancel when generating even if plan exists', () => {
    vi.spyOn(useStudyPlanModule, 'useStudyPlan').mockReturnValue({
      state: {
        plan: createPlan({ status: 'partial' }),
        generationState: createGenerationState({ status: 'generating' }),
        isGenerating: true,
        currentProgress: null,
        progressMessages: [],
        error: null,
        planList: [],
      },
      actions: {
        cancelGeneration: vi.fn(),
        resumeGeneration: vi.fn(),
        retryFailedChunk: vi.fn(),
        regenerateFullPlan: vi.fn(),
        startGeneration: vi.fn(),
        updateDailyPlanStatus: vi.fn(),
        updateDailyPlan: vi.fn(),
        deletePlan: vi.fn(),
        loadPlan: vi.fn(),
        loadAllPlans: vi.fn(),
      } as unknown as MockContext['actions'],
    } as MockContext)

    render(<PlanControls />)
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Resume' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Regenerate' })).toBeNull()
  })

  it('renders Resume button when plan is partial', () => {
    const mockResume = vi.fn()

    vi.spyOn(useStudyPlanModule, 'useStudyPlan').mockReturnValue({
      state: {
        plan: createPlan({ status: 'partial' }),
        generationState: null,
        isGenerating: false,
        currentProgress: null,
        progressMessages: [],
        error: null,
        planList: [],
      },
      actions: {
        cancelGeneration: vi.fn(),
        resumeGeneration: mockResume,
        retryFailedChunk: vi.fn(),
        regenerateFullPlan: vi.fn(),
        startGeneration: vi.fn(),
        updateDailyPlanStatus: vi.fn(),
        updateDailyPlan: vi.fn(),
        deletePlan: vi.fn(),
        loadPlan: vi.fn(),
        loadAllPlans: vi.fn(),
      } as unknown as MockContext['actions'],
    } as MockContext)

    render(<PlanControls />)
    const btn = screen.getByRole('button', { name: 'Resume' })
    expect(btn).toBeTruthy()
    btn.click()
    expect(mockResume).toHaveBeenCalledWith('plan-1')
  })

  it('renders Resume button when plan is cancelled', () => {
    vi.spyOn(useStudyPlanModule, 'useStudyPlan').mockReturnValue({
      state: {
        plan: createPlan({ status: 'cancelled' }),
        generationState: null,
        isGenerating: false,
        currentProgress: null,
        progressMessages: [],
        error: null,
        planList: [],
      },
      actions: {
        cancelGeneration: vi.fn(),
        resumeGeneration: vi.fn(),
        retryFailedChunk: vi.fn(),
        regenerateFullPlan: vi.fn(),
        startGeneration: vi.fn(),
        updateDailyPlanStatus: vi.fn(),
        updateDailyPlan: vi.fn(),
        deletePlan: vi.fn(),
        loadPlan: vi.fn(),
        loadAllPlans: vi.fn(),
      } as unknown as MockContext['actions'],
    } as MockContext)

    render(<PlanControls />)
    expect(screen.getByRole('button', { name: 'Resume' })).toBeTruthy()
  })

  it('does not render Resume when plan is complete', () => {
    vi.spyOn(useStudyPlanModule, 'useStudyPlan').mockReturnValue({
      state: {
        plan: createPlan({ status: 'complete' }),
        generationState: null,
        isGenerating: false,
        currentProgress: null,
        progressMessages: [],
        error: null,
        planList: [],
      },
      actions: {
        cancelGeneration: vi.fn(),
        resumeGeneration: vi.fn(),
        retryFailedChunk: vi.fn(),
        regenerateFullPlan: vi.fn(),
        startGeneration: vi.fn(),
        updateDailyPlanStatus: vi.fn(),
        updateDailyPlan: vi.fn(),
        deletePlan: vi.fn(),
        loadPlan: vi.fn(),
        loadAllPlans: vi.fn(),
      } as unknown as MockContext['actions'],
    } as MockContext)

    render(<PlanControls />)
    expect(screen.queryByRole('button', { name: 'Resume' })).toBeNull()
  })

  it('does not render Resume when plan is failed', () => {
    vi.spyOn(useStudyPlanModule, 'useStudyPlan').mockReturnValue({
      state: {
        plan: createPlan({ status: 'failed' }),
        generationState: null,
        isGenerating: false,
        currentProgress: null,
        progressMessages: [],
        error: null,
        planList: [],
      },
      actions: {
        cancelGeneration: vi.fn(),
        resumeGeneration: vi.fn(),
        retryFailedChunk: vi.fn(),
        regenerateFullPlan: vi.fn(),
        startGeneration: vi.fn(),
        updateDailyPlanStatus: vi.fn(),
        updateDailyPlan: vi.fn(),
        deletePlan: vi.fn(),
        loadPlan: vi.fn(),
        loadAllPlans: vi.fn(),
      } as unknown as MockContext['actions'],
    } as MockContext)

    render(<PlanControls />)
    expect(screen.queryByRole('button', { name: 'Resume' })).toBeNull()
  })

  it('renders Retry Failed button when failed chunks exist', () => {
    const mockRetry = vi.fn()

    vi.spyOn(useStudyPlanModule, 'useStudyPlan').mockReturnValue({
      state: {
        plan: createPlan({ status: 'partial' }),
        generationState: createGenerationState({ failedChunks: [0] }),
        isGenerating: false,
        currentProgress: null,
        progressMessages: [],
        error: null,
        planList: [],
      },
      actions: {
        cancelGeneration: vi.fn(),
        resumeGeneration: vi.fn(),
        retryFailedChunk: mockRetry,
        regenerateFullPlan: vi.fn(),
        startGeneration: vi.fn(),
        updateDailyPlanStatus: vi.fn(),
        updateDailyPlan: vi.fn(),
        deletePlan: vi.fn(),
        loadPlan: vi.fn(),
        loadAllPlans: vi.fn(),
      } as unknown as MockContext['actions'],
    } as MockContext)

    render(<PlanControls />)
    const btn = screen.getByRole('button', { name: 'Retry Failed' })
    expect(btn).toBeTruthy()
    btn.click()
    expect(mockRetry).toHaveBeenCalledOnce()
  })

  it('does not render Retry Failed when failedChunks is empty', () => {
    vi.spyOn(useStudyPlanModule, 'useStudyPlan').mockReturnValue({
      state: {
        plan: createPlan({ status: 'partial' }),
        generationState: createGenerationState({ failedChunks: [] }),
        isGenerating: false,
        currentProgress: null,
        progressMessages: [],
        error: null,
        planList: [],
      },
      actions: {
        cancelGeneration: vi.fn(),
        resumeGeneration: vi.fn(),
        retryFailedChunk: vi.fn(),
        regenerateFullPlan: vi.fn(),
        startGeneration: vi.fn(),
        updateDailyPlanStatus: vi.fn(),
        updateDailyPlan: vi.fn(),
        deletePlan: vi.fn(),
        loadPlan: vi.fn(),
        loadAllPlans: vi.fn(),
      } as unknown as MockContext['actions'],
    } as MockContext)

    render(<PlanControls />)
    expect(screen.queryByRole('button', { name: 'Retry Failed' })).toBeNull()
  })

  it('renders Regenerate button when plan exists', () => {
    const mockRegenerate = vi.fn()

    vi.spyOn(useStudyPlanModule, 'useStudyPlan').mockReturnValue({
      state: {
        plan: createPlan({ status: 'complete' }),
        generationState: null,
        isGenerating: false,
        currentProgress: null,
        progressMessages: [],
        error: null,
        planList: [],
      },
      actions: {
        cancelGeneration: vi.fn(),
        resumeGeneration: vi.fn(),
        retryFailedChunk: vi.fn(),
        regenerateFullPlan: mockRegenerate,
        startGeneration: vi.fn(),
        updateDailyPlanStatus: vi.fn(),
        updateDailyPlan: vi.fn(),
        deletePlan: vi.fn(),
        loadPlan: vi.fn(),
        loadAllPlans: vi.fn(),
      } as unknown as MockContext['actions'],
    } as MockContext)

    render(<PlanControls />)
    const btn = screen.getByRole('button', { name: 'Regenerate' })
    expect(btn).toBeTruthy()
    btn.click()
    expect(mockRegenerate).toHaveBeenCalledWith(
      expect.objectContaining({ currentBand: 5.5, targetBand: 7 }),
    )
  })

  it('renders multiple buttons when multiple actions are available', async () => {
    vi.spyOn(useStudyPlanModule, 'useStudyPlan').mockReturnValue({
      state: {
        plan: createPlan({ status: 'partial' }),
        generationState: createGenerationState({ failedChunks: [2] }),
        isGenerating: false,
        currentProgress: null,
        progressMessages: [],
        error: null,
        planList: [],
      },
      actions: {
        cancelGeneration: vi.fn(),
        resumeGeneration: vi.fn(),
        retryFailedChunk: vi.fn(),
        regenerateFullPlan: vi.fn(),
        startGeneration: vi.fn(),
        updateDailyPlanStatus: vi.fn(),
        updateDailyPlan: vi.fn(),
        deletePlan: vi.fn(),
        loadPlan: vi.fn(),
        loadAllPlans: vi.fn(),
      } as unknown as MockContext['actions'],
    } as MockContext)

    render(<PlanControls />)

    expect(screen.getByRole('button', { name: 'Resume' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Retry Failed' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Regenerate' })).toBeTruthy()
  })
})
