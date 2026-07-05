import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type {
  StudyPlanData,
  DailyPlanItem,
  StudyPlanUserProfile,
  StudyPlanCalculatedMeta,
  GlobalStudyStrategy,
} from '../../types'
import DailyPlanList from '../DailyPlanList'
import * as useStudyPlanModule from '../../hooks/useStudyPlan'

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
  totalDays: 3,
  studyDays: 3,
  restDaysCount: 0,
  totalWeeks: 1,
  finalReviewPeriodDays: 0,
  mockTestSchedule: [],
  skillPriority: ['Listening', 'Reading', 'Writing', 'Vocabulary', 'Grammar', 'Speaking'],
}

const mockStrategy: GlobalStudyStrategy = {
  planSummary: 'A 3-day intensive study plan targeting band 7.0',
  phaseBreakdown: [
    {
      phaseName: 'Foundation',
      description: 'Build core skills',
      startDate: '2026-01-01',
      endDate: '2026-01-03',
      weekCount: 1,
      mainFocus: 'Skill foundation',
      targetSkill: 'all',
      weeklyGoals: [
        {
          weekNumber: 1,
          startDate: '2026-01-01',
          endDate: '2026-01-03',
          focusArea: 'Foundation',
          goal: 'Build foundation',
          keyActivities: ['Practice listening', 'Read passages'],
          mockTestPlanned: false,
        },
      ],
    },
  ],
  weeklyGoals: [
    {
      weekNumber: 1,
      startDate: '2026-01-01',
      endDate: '2026-01-03',
      focusArea: 'Foundation',
      goal: 'Build foundation',
      keyActivities: ['Practice listening', 'Read passages'],
      mockTestPlanned: false,
    },
  ],
  mockTestSchedule: [],
  finalWeekStrategy: 'Review all skills',
  adjustmentRules: ['Adjust based on progress'],
  createdAt: '2026-01-01T00:00:00.000Z',
}

function createMockDay(overrides: Partial<DailyPlanItem> & { dayNumber: number; date: string }): DailyPlanItem {
  return {
    id: `day-${overrides.dayNumber}`,
    planId: 'plan-1',
    date: overrides.date,
    dayNumber: overrides.dayNumber,
    weekNumber: 1,
    phaseName: 'Foundation' as const,
    mainGoal: 'Practice core skills',
    listeningTask: {
      id: `listen-${overrides.dayNumber}`,
      skill: 'Listening',
      title: 'Listen to IELTS conversation',
      description: 'Practice listening',
      estimatedMinutes: 20,
      category: 'Listening',
      isCompleted: false,
      notes: '',
    },
    readingTask: {
      id: `read-${overrides.dayNumber}`,
      skill: 'Reading',
      title: 'Read IELTS passage',
      description: 'Practice reading',
      estimatedMinutes: 20,
      category: 'Reading',
      isCompleted: false,
      notes: '',
    },
    writingTask: null,
    speakingTask: null,
    vocabularyTask: null,
    grammarTask: null,
    reviewTask: null,
    optionalTasks: [],
    estimatedTotalMinutes: 40,
    priority: 'medium' as const,
    difficulty: 'medium' as const,
    status: 'not-started' as const,
    aiTutorNote: 'Focus on time management',
    completionChecklist: ['Finish listening', 'Finish reading'],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function createMockPlan(overrides?: Partial<StudyPlanData>): StudyPlanData {
  const day1 = createMockDay({ dayNumber: 1, date: '2026-01-01' })
  const day2 = createMockDay({ dayNumber: 2, date: '2026-01-02', status: 'in-progress', listeningTask: { ...day1.listeningTask!, isCompleted: true } })
  const day3 = createMockDay({ dayNumber: 3, date: '2026-01-03', status: 'completed', listeningTask: { ...day1.listeningTask!, isCompleted: true }, readingTask: { ...day1.readingTask!, isCompleted: true }, estimatedTotalMinutes: 40 })

  return {
    id: 'plan-1',
    profileSnapshot: mockProfile,
    calculatedMeta: mockMeta,
    globalStrategy: mockStrategy,
    dailyPlans: [day1, day2, day3],
    status: 'complete',
    progress: { generatedDays: 3, totalDays: 3, percentage: 100 },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-03T00:00:00.000Z',
    ...overrides,
  }
}

function createDefaultState() {
  const plan = createMockPlan()
  return {
    state: {
      plan,
      generationState: null,
      isGenerating: false,
      currentProgress: null,
      progressMessages: [],
      error: null,
      planList: [plan],
    },
    actions: {
      startGeneration: vi.fn(),
      cancelGeneration: vi.fn(),
      resumeGeneration: vi.fn(),
      retryFailedChunk: vi.fn(),
      regenerateFullPlan: vi.fn(),
      updateDailyPlanStatus: vi.fn().mockResolvedValue(undefined),
      updateDailyPlan: vi.fn().mockResolvedValue(undefined),
      deletePlan: vi.fn(),
      loadPlan: vi.fn(),
      loadAllPlans: vi.fn(),
    },
  }
}

describe('DailyPlanList', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('shows loading spinner when generating and no plan', () => {
    vi.spyOn(useStudyPlanModule, 'useStudyPlan').mockReturnValue({
      state: {
        plan: null,
        generationState: null,
        isGenerating: true,
        currentProgress: null,
        progressMessages: [],
        error: null,
        planList: [],
      },
      actions: {} as ReturnType<typeof createDefaultState>['actions'],
    })

    render(<DailyPlanList />)
    expect(screen.getByText('Generating your study plan...')).toBeTruthy()
  })

  it('shows empty state when no plan exists', () => {
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
      actions: {} as ReturnType<typeof createDefaultState>['actions'],
    })

    render(<DailyPlanList />)
    expect(screen.getByText('No study plan yet')).toBeTruthy()
  })

  it('renders all days with no gaps or duplicates', () => {
    const ctx = createDefaultState()
    vi.spyOn(useStudyPlanModule, 'useStudyPlan').mockReturnValue(ctx)

    render(<DailyPlanList />)

    const dayLabels = screen.getAllByText(/^Day \d+$/)
    expect(dayLabels).toHaveLength(3)

    const dayNumbers = dayLabels.map(el => el.textContent)
    expect(dayNumbers).toContain('Day 1')
    expect(dayNumbers).toContain('Day 2')
    expect(dayNumbers).toContain('Day 3')
  })

  it('displays summary stats correctly', () => {
    const ctx = createDefaultState()
    vi.spyOn(useStudyPlanModule, 'useStudyPlan').mockReturnValue(ctx)

    render(<DailyPlanList />)

    expect(screen.getByText('Total days')).toBeTruthy()
    expect(screen.getByText('33%')).toBeTruthy()
    expect(screen.getByText('Total minutes')).toBeTruthy()
  })

  it('displays phase accordion with phase name', () => {
    const ctx = createDefaultState()
    vi.spyOn(useStudyPlanModule, 'useStudyPlan').mockReturnValue(ctx)

    render(<DailyPlanList />)

    expect(screen.getByText('Foundation')).toBeTruthy()
  })

  it('displays day details including date, main goal, and tasks', () => {
    const ctx = createDefaultState()
    vi.spyOn(useStudyPlanModule, 'useStudyPlan').mockReturnValue(ctx)

    render(<DailyPlanList />)

    const goals = screen.getAllByText('Practice core skills')
    expect(goals.length).toBe(3)

    const listenTasks = screen.getAllByText('Listen to IELTS conversation')
    expect(listenTasks.length).toBe(3)

    const readTasks = screen.getAllByText('Read IELTS passage')
    expect(readTasks.length).toBe(3)
  })

  it('shows status badge for each day', () => {
    const ctx = createDefaultState()
    vi.spyOn(useStudyPlanModule, 'useStudyPlan').mockReturnValue(ctx)

    render(<DailyPlanList />)

    const notStarted = screen.getAllByText('Not started')
    const inProgress = screen.getAllByText('In progress')
    const completed = screen.getAllByText('Completed')

    const badgeNotStarted = notStarted.filter(el => el.tagName === 'SPAN')
    const badgeInProgress = inProgress.filter(el => el.tagName === 'SPAN')
    const badgeCompleted = completed.filter(el => el.tagName === 'SPAN')

    expect(badgeNotStarted.length).toBe(1)
    expect(badgeInProgress.length).toBe(1)
    expect(badgeCompleted.length).toBe(1)
  })

  it('calls updateDailyPlanStatus when status is changed', async () => {
    const ctx = createDefaultState()
    vi.spyOn(useStudyPlanModule, 'useStudyPlan').mockReturnValue(ctx)

    render(<DailyPlanList />)

    const statusSelects = screen.getAllByRole('combobox')
    expect(statusSelects.length).toBeGreaterThan(0)

    fireEvent.change(statusSelects[0], { target: { value: 'in-progress' } })
    expect(ctx.actions.updateDailyPlanStatus).toHaveBeenCalledWith('plan-1', '2026-01-01', 'in-progress')
  })

  it('calls updateDailyPlan when task checkbox is toggled', async () => {
    const ctx = createDefaultState()
    vi.spyOn(useStudyPlanModule, 'useStudyPlan').mockReturnValue(ctx)

    render(<DailyPlanList />)

    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes.length).toBeGreaterThan(0)

    fireEvent.click(checkboxes[0])
    expect(ctx.actions.updateDailyPlan).toHaveBeenCalled()
  })

  it('shows no daily plans empty state when plan has no dailyPlans', () => {
    const plan = createMockPlan({ dailyPlans: [] })
    vi.spyOn(useStudyPlanModule, 'useStudyPlan').mockReturnValue({
      state: {
        plan,
        generationState: null,
        isGenerating: false,
        currentProgress: null,
        progressMessages: [],
        error: null,
        planList: [plan],
      },
      actions: {} as ReturnType<typeof createDefaultState>['actions'],
    })

    render(<DailyPlanList />)
    expect(screen.getByText('No daily plans yet')).toBeTruthy()
  })

  it('renders the AI tutor note when visible', () => {
    const ctx = createDefaultState()
    vi.spyOn(useStudyPlanModule, 'useStudyPlan').mockReturnValue(ctx)

    render(<DailyPlanList />)

    const showNoteButtons = screen.getAllByText('Show AI note')
    expect(showNoteButtons.length).toBeGreaterThan(0)

    fireEvent.click(showNoteButtons[0])
    expect(screen.getByText('Focus on time management')).toBeTruthy()
  })

  it('renders checklist items when expanded', () => {
    const ctx = createDefaultState()
    vi.spyOn(useStudyPlanModule, 'useStudyPlan').mockReturnValue(ctx)

    render(<DailyPlanList />)

    const checklistButtons = screen.getAllByText(/Show checklist/)
    expect(checklistButtons.length).toBeGreaterThan(0)

    fireEvent.click(checklistButtons[0])
    expect(screen.getByText('Finish listening')).toBeTruthy()
    expect(screen.getByText('Finish reading')).toBeTruthy()
  })

  it('displays priority and difficulty badges', () => {
    const ctx = createDefaultState()
    vi.spyOn(useStudyPlanModule, 'useStudyPlan').mockReturnValue(ctx)

    render(<DailyPlanList />)

    expect(screen.getAllByText('medium').length).toBeGreaterThan(0)
  })
})
