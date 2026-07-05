import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import PlanGenerationProgress from '../PlanGenerationProgress'
import * as useStudyPlanModule from '../../hooks/useStudyPlan'
import type { GenerationProgress } from '../../types'

function createProgress(overrides?: Partial<GenerationProgress>): GenerationProgress {
  return {
    step: 'creating-strategy',
    chunkIndex: 0,
    totalChunks: 10,
    currentDayStart: 0,
    currentDayEnd: 0,
    totalDays: 30,
    generatedDays: 0,
    message: 'Creating global study strategy',
    ...overrides,
  }
}

function createGeneratingState(overrides?: Record<string, unknown>) {
  return {
    state: {
      plan: null,
      generationState: { status: 'generating' },
      isGenerating: true,
      currentProgress: createProgress(),
      progressMessages: [
        { message: 'Planning your IELTS study journey', timestamp: 1000 },
      ],
      error: null,
      planList: [],
    },
    actions: {} as Record<string, unknown>,
    ...overrides,
  }
}

describe('PlanGenerationProgress', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders nothing when not generating', () => {
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
      actions: {},
    } as ReturnType<typeof useStudyPlanModule.useStudyPlan>)

    const { container } = render(<PlanGenerationProgress />)
    expect(container.firstChild).toBeNull()
  })

  it('renders progress message and day count during strategy creation', () => {
    vi.spyOn(useStudyPlanModule, 'useStudyPlan').mockReturnValue(
      createGeneratingState() as ReturnType<typeof useStudyPlanModule.useStudyPlan>
    )

    render(<PlanGenerationProgress />)

    expect(screen.getByText('Creating global study strategy')).toBeTruthy()
    expect(screen.getByText('0/30 days')).toBeTruthy()
    expect(screen.getByText('Creating strategy')).toBeTruthy()
  })

  it('renders generating-chunk step with correct day range', () => {
    const progress = createProgress({
      step: 'generating-chunk',
      generatedDays: 3,
      currentDayStart: 4,
      currentDayEnd: 6,
      message: 'Generating days 4 to 6 of 30',
    })

    vi.spyOn(useStudyPlanModule, 'useStudyPlan').mockReturnValue({
      state: {
        plan: null,
        generationState: { status: 'generating' },
        isGenerating: true,
        currentProgress: progress,
        progressMessages: [
          { message: 'Creating global study strategy', timestamp: 1000 },
          { message: 'Generating days 4 to 6 of 30', timestamp: 2000 },
        ],
        error: null,
        planList: [],
      },
      actions: {},
    } as ReturnType<typeof useStudyPlanModule.useStudyPlan>)

    render(<PlanGenerationProgress />)

    expect(screen.getAllByText('Generating days 4 to 6 of 30').length).toBeGreaterThan(0)
    expect(screen.getByText('3/30 days')).toBeTruthy()
    expect(screen.getAllByText('Days 4–6').length).toBeGreaterThan(0)
  })

  it('renders validating-chunk step with correct labels', () => {
    const progress = createProgress({
      step: 'validating-chunk',
      generatedDays: 6,
      currentDayStart: 4,
      currentDayEnd: 6,
      message: 'Validating days 4 to 6',
    })

    vi.spyOn(useStudyPlanModule, 'useStudyPlan').mockReturnValue({
      state: {
        plan: null,
        generationState: { status: 'generating' },
        isGenerating: true,
        currentProgress: progress,
        progressMessages: [
          { message: 'Creating global study strategy', timestamp: 1000 },
          { message: 'Validating days 4 to 6', timestamp: 2000 },
        ],
        error: null,
        planList: [],
      },
      actions: {},
    } as ReturnType<typeof useStudyPlanModule.useStudyPlan>)

    render(<PlanGenerationProgress />)

    expect(screen.getAllByText('Validating days 4 to 6').length).toBeGreaterThan(0)
    expect(screen.getByText('Validating days')).toBeTruthy()
  })

  it('renders finalizing step when complete', () => {
    const progress = createProgress({
      step: 'finalizing',
      generatedDays: 30,
      currentDayStart: 30,
      currentDayEnd: 30,
      message: 'Your IELTS study plan is ready!',
    })

    vi.spyOn(useStudyPlanModule, 'useStudyPlan').mockReturnValue({
      state: {
        plan: null,
        generationState: { status: 'generating' },
        isGenerating: true,
        currentProgress: progress,
        progressMessages: [
          { message: 'Creating global study strategy', timestamp: 1000 },
          { message: 'Your IELTS study plan is ready!', timestamp: 3000 },
        ],
        error: null,
        planList: [],
      },
      actions: {},
    } as ReturnType<typeof useStudyPlanModule.useStudyPlan>)

    render(<PlanGenerationProgress />)

    expect(screen.getAllByText('Your IELTS study plan is ready!').length).toBeGreaterThan(0)
    expect(screen.getByText('30/30 days')).toBeTruthy()
    expect(screen.getByText('Finalizing')).toBeTruthy()
  })

  it('displays error when generation fails', () => {
    vi.spyOn(useStudyPlanModule, 'useStudyPlan').mockReturnValue({
      state: {
        plan: null,
        generationState: { status: 'generating' },
        isGenerating: true,
        currentProgress: createProgress(),
        progressMessages: [
          { message: 'Creating global study strategy', timestamp: 1000 },
          { message: 'Error: AI service unavailable', timestamp: 2000 },
        ],
        error: 'AI service unavailable',
        planList: [],
      },
      actions: {},
    } as ReturnType<typeof useStudyPlanModule.useStudyPlan>)

    render(<PlanGenerationProgress />)

    expect(screen.getByText('AI service unavailable')).toBeTruthy()
  })

  it('shows recent activity messages', () => {
    vi.spyOn(useStudyPlanModule, 'useStudyPlan').mockReturnValue({
      state: {
        plan: null,
        generationState: { status: 'generating' },
        isGenerating: true,
        currentProgress: createProgress({ step: 'generating-chunk', generatedDays: 3, currentDayStart: 4, currentDayEnd: 6, message: 'Generating days 4 to 6 of 30' }),
        progressMessages: [
          { message: 'Planning your IELTS study journey', timestamp: 1000 },
          { message: 'Creating global study strategy', timestamp: 2000 },
          { message: 'Generating days 1 to 3 of 30', timestamp: 3000 },
          { message: 'Generating days 4 to 6 of 30', timestamp: 4000 },
        ],
        error: null,
        planList: [],
      },
      actions: {},
    } as ReturnType<typeof useStudyPlanModule.useStudyPlan>)

    render(<PlanGenerationProgress />)

    expect(screen.getByText('Recent activity')).toBeTruthy()
  })

  it('renders all step indicators', () => {
    vi.spyOn(useStudyPlanModule, 'useStudyPlan').mockReturnValue(
      createGeneratingState() as ReturnType<typeof useStudyPlanModule.useStudyPlan>
    )

    render(<PlanGenerationProgress />)

    expect(screen.getByText('Creating strategy')).toBeTruthy()
    expect(screen.getByText('Generating days')).toBeTruthy()
    expect(screen.getByText('Validating days')).toBeTruthy()
    expect(screen.getByText('Repairing days')).toBeTruthy()
    expect(screen.getByText('Finalizing')).toBeTruthy()
  })
})
