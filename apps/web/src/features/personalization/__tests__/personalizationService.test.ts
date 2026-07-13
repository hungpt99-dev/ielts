import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  buildPersonalizationContext,
  analyzeWeakSkills,
  generateRecommendations,
  getTodayRecommendation,
  getAITutorContext,
  getReasonLabel,
} from '../personalizationService'
import type { PersonalizationContext } from '../types'

const mockId = 'test-uuid-00000000'
vi.stubGlobal('crypto', {
  randomUUID: () => mockId,
})

const mockTasks = vi.hoisted(() => ({
  getAll: vi.fn(),
}))

const mockReviews = vi.hoisted(() => ({
  getAll: vi.fn(),
}))

const mockMistakes = vi.hoisted(() => ({
  getAll: vi.fn(),
}))

const mockVocabulary = vi.hoisted(() => ({
  getAll: vi.fn(),
}))

vi.mock('../../../services/storage/Database', () => ({
  DatabaseService: {
    getAll: (table: string) => {
      if (table === 'tasks') return mockTasks.getAll()
      if (table === 'vocabularyReviews') return mockReviews.getAll()
      if (table === 'mistakes') return mockMistakes.getAll()
      if (table === 'vocabulary') return mockVocabulary.getAll()
      return []
    },
  },
}))

vi.mock('../../../services/storage/SettingsStorage', () => ({
  loadAppSettings: () => ({
    targetBand: 7.0,
    currentBand: 5.5,
    examDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    dailyStudyMinutes: 60,
    weakSkills: ['Writing', 'Speaking'],
    preferredTopics: ['Environment', 'Education'],
    studyReminder: 'Time to study!',
    studyGoal: 'academic' as const,
    preferredSchedule: ['mon', 'tue', 'wed', 'thu', 'fri'],
    aiApiKey: '',
    aiProvider: 'openai' as const,
    aiEndpoint: '',
    aiModel: 'gpt-4o-mini',
    darkMode: false,
    aiEnabled: false,
  }),
}))

vi.mock('../../roadmap/roadmapService', () => ({
  loadRoadmap: () => ({
    phases: [
      {
        id: 'phase-1',
        name: 'Foundation',
        description: 'Building basic skills',
        order: 0,
        targetRange: '5.0-6.0',
        weeks: [
          {
            id: 'week-1',
            weekNumber: 1,
            label: 'Week 1',
            focus: 'Vocabulary & Grammar',
            goal: 'Build core vocabulary',
            days: [
              {
                id: 'day-1',
                date: new Date().toISOString().slice(0, 10),
                dayNumber: 1,
                skillFocus: 'Vocabulary',
                taskId: 'task-1',
                isComplete: false,
                objective: 'Learn 10 environment vocabulary words',
              },
              {
                id: 'day-2',
                date: new Date().toISOString().slice(0, 10),
                dayNumber: 2,
                skillFocus: 'Grammar',
                taskId: 'task-2',
                isComplete: false,
                objective: 'Review complex sentences',
              },
            ],
            isComplete: false,
            completedTasks: 0,
            totalTasks: 7,
          },
        ],
        isComplete: false,
        completedTasks: 0,
        totalTasks: 28,
      },
    ],
    currentPhaseIndex: 0,
    currentWeekIndex: 0,
    overallProgress: 15,
    totalTasks: 28,
    completedTasks: 4,
    generatedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }),
  getTodayTask: () => ({
    day: {
      id: 'day-1',
      date: new Date().toISOString().slice(0, 10),
      dayNumber: 1,
      tasks: [{
        id: 'task-1',
        taskId: null,
        skillFocus: 'Vocabulary',
        objective: 'Learn 10 environment vocabulary words',
        isComplete: false,
      }],
    },
    task: {
      id: 'task-1',
      taskId: null,
      skillFocus: 'Vocabulary',
      objective: 'Learn 10 environment vocabulary words',
      isComplete: false,
    },
  }),
}))

function createMockContext(overrides?: Partial<PersonalizationContext>): PersonalizationContext {
  const base: PersonalizationContext = {
    profile: {
      targetBand: 7.0,
      currentBand: 5.5,
      examDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      dailyStudyMinutes: 60,
      weakSkills: ['Writing', 'Speaking'],
      studyGoal: 'academic',
      preferredSchedule: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
    },
    progress: {
      studyStreak: 5,
      roadmapProgress: 15,
      todayUnfinished: 2,
      weeklyTasksDone: 3,
      weeklyTasksTotal: 7,
      totalStudyHours: 12.5,
    },
    vocabulary: {
      totalWords: 45,
      dueForReview: 8,
      recentCount: 3,
      masteredCount: 12,
      learningCount: 33,
    },
    mistakes: {
      total: 12,
      recent: 4,
      bySkill: { Writing: 5, Grammar: 3, Speaking: 2, Reading: 1, Vocabulary: 1 },
      dueForReview: 6,
      topSkill: 'Writing',
    },
    exam: {
      countdownDays: 60,
      isUrgent: false,
      isExamSoon: false,
    },
    tasks: {
      today: [
        { id: 't1', title: 'Task 1', category: 'Writing', date: new Date().toISOString(), isDone: false, timeMinutes: 20 } as any,
        { id: 't2', title: 'Task 2', category: 'Vocabulary', date: new Date().toISOString(), isDone: false, timeMinutes: 15 } as any,
      ],
      pending: [
        { id: 't1', title: 'Task 1', category: 'Writing', date: new Date().toISOString(), isDone: false } as any,
        { id: 't3', title: 'Task 3', category: 'Reading', date: new Date().toISOString(), isDone: false } as any,
      ],
      completedCount: 10,
    },
    roadmap: {
      exists: true,
      currentPhaseName: 'Foundation',
      phaseProgress: 15,
      currentSkillFocus: 'Vocabulary',
      nextTaskTitle: 'Learn 10 environment vocabulary words',
      nextTaskSkill: 'Vocabulary',
    },
  }
  return { ...base, ...overrides }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('buildPersonalizationContext', () => {
  it('returns a valid context with default data', async () => {
    mockTasks.getAll.mockResolvedValue([])
    mockReviews.getAll.mockResolvedValue([])
    mockMistakes.getAll.mockResolvedValue([])
    mockVocabulary.getAll.mockResolvedValue([])

    const ctx = await buildPersonalizationContext()
    expect(ctx).toBeDefined()
    expect(ctx.profile.targetBand).toBe(7.0)
    expect(ctx.profile.currentBand).toBe(5.5)
    expect(ctx.vocabulary.totalWords).toBe(0)
    expect(ctx.mistakes.total).toBe(0)
    expect(ctx.progress.todayUnfinished).toBe(0)
  })

  it('computes vocabulary counts correctly', async () => {
    mockTasks.getAll.mockResolvedValue([])
    mockReviews.getAll.mockResolvedValue([
      { interval: 25, repetitions: 6, nextReviewDate: new Date().toISOString() },
      { interval: 3, repetitions: 2, nextReviewDate: new Date(Date.now() - 86400000).toISOString() },
      { interval: 1, repetitions: 1, nextReviewDate: new Date(Date.now() - 86400000).toISOString() },
    ])
    mockMistakes.getAll.mockResolvedValue([])
    mockVocabulary.getAll.mockResolvedValue([
      { id: 'v1', createdAt: new Date().toISOString() },
      { id: 'v2', createdAt: new Date(Date.now() - 86400000 * 3).toISOString() },
    ])

    const ctx = await buildPersonalizationContext()
    expect(ctx.vocabulary.totalWords).toBe(2)
    expect(ctx.vocabulary.masteredCount).toBe(1)
    expect(ctx.vocabulary.dueForReview).toBe(3)
  })
})

describe('analyzeWeakSkills', () => {
  it('prioritizes user-declared weak skills', () => {
    const ctx = createMockContext()
    const result = analyzeWeakSkills(ctx)
    expect(result[0].skill).toBe('Writing')
    expect(result[1].skill).toBe('Speaking')
  })

  it('sorts by mistake count when no weak skills declared', () => {
    const ctx = createMockContext({
      profile: { ...createMockContext().profile, weakSkills: [] },
      mistakes: {
        total: 10,
        recent: 5,
        bySkill: { Grammar: 5, Reading: 3, Writing: 2 },
        dueForReview: 5,
        topSkill: 'Grammar',
      },
    })
    const result = analyzeWeakSkills(ctx)
    expect(result[0].skill).toBe('Grammar')
    expect(result[1].skill).toBe('Reading')
  })
})

describe('generateRecommendations', () => {
  it('returns recommendations for unfinished tasks', () => {
    const ctx = createMockContext()
    const recs = generateRecommendations(ctx)
    expect(recs.length).toBeGreaterThan(0)
    expect(recs.some(r => r.reason === 'roadmap_next')).toBe(true)
  })

  it('returns vocabulary review when due', () => {
    const ctx = createMockContext({ vocabulary: { ...createMockContext().vocabulary, dueForReview: 8 } })
    const recs = generateRecommendations(ctx)
    expect(recs.some(r => r.reason === 'due_review' && r.skill === 'Vocabulary')).toBe(true)
  })

  it('returns mistake review when due', () => {
    const ctx = createMockContext({ mistakes: { ...createMockContext().mistakes, dueForReview: 6 } })
    const recs = generateRecommendations(ctx)
    expect(recs.some(r => r.reason === 'low_accuracy')).toBe(true)
  })

  it('returns weak skill practice recommendation', () => {
    const ctx = createMockContext({
      progress: { ...createMockContext().progress, todayUnfinished: 0 },
      vocabulary: { ...createMockContext().vocabulary, dueForReview: 0 },
      mistakes: { ...createMockContext().mistakes, dueForReview: 0 },
    })
    const recs = generateRecommendations(ctx)
    expect(recs.some(r => r.reason === 'weak_skill')).toBe(true)
  })

  it('returns exam urgency recommendation when exam is near', () => {
    const ctx = createMockContext({ exam: { countdownDays: 15, isUrgent: true, isExamSoon: false } })
    const recs = generateRecommendations(ctx)
    expect(recs.some(r => r.reason === 'exam_urgency')).toBe(true)
  })

  it('returns default recommendation when nothing else matches', () => {
    const emptyCtx = createMockContext({
      progress: { studyStreak: 0, roadmapProgress: 0, todayUnfinished: 0, weeklyTasksDone: 0, weeklyTasksTotal: 0, totalStudyHours: 0 },
      vocabulary: { totalWords: 0, dueForReview: 0, recentCount: 0, masteredCount: 0, learningCount: 0 },
      mistakes: { total: 0, recent: 0, bySkill: {}, dueForReview: 0, topSkill: null },
      exam: { countdownDays: 0, isUrgent: false, isExamSoon: false },
      profile: { ...createMockContext().profile, weakSkills: [] },
      tasks: { today: [], pending: [], completedCount: 0 },
      roadmap: { exists: false, currentPhaseName: '', phaseProgress: 0, currentSkillFocus: null, nextTaskTitle: null, nextTaskSkill: null },
    })
    const recs = generateRecommendations(emptyCtx)
    expect(recs.length).toBeGreaterThan(0)
    expect(recs[0].reason).toBe('recommended_content')
  })

  it('sorts recommendations by priority', () => {
    const ctx = createMockContext({
      exam: { countdownDays: 15, isUrgent: true, isExamSoon: false },
      progress: { ...createMockContext().progress, todayUnfinished: 0 },
      vocabulary: { ...createMockContext().vocabulary, dueForReview: 0, recentCount: 0 },
      mistakes: { ...createMockContext().mistakes, dueForReview: 0 },
    })
    const recs = generateRecommendations(ctx)
    for (let i = 1; i < recs.length; i++) {
      const prev = recs[i - 1].priority
      const curr = recs[i].priority
      const order = { high: 0, medium: 1, low: 2 }
      expect(order[prev]).toBeLessThanOrEqual(order[curr])
    }
  })
})

describe('getTodayRecommendation', () => {
  it('includes unfinished tasks in the recommendation', () => {
    const ctx = createMockContext({
      vocabulary: { ...createMockContext().vocabulary, dueForReview: 0 },
    })
    const text = getTodayRecommendation(ctx)
    expect(text).toContain('Complete')
    expect(text).toContain('Writing')
  })

  it('mentions weak skills when present', () => {
    const ctx = createMockContext({
      tasks: { ...createMockContext().tasks, today: [] },
      progress: { ...createMockContext().progress, todayUnfinished: 0 },
      vocabulary: { ...createMockContext().vocabulary, dueForReview: 0 },
    })
    const text = getTodayRecommendation(ctx)
    expect(text.toLowerCase()).toContain('writing')
  })

  it('returns default text when nothing is pending', () => {
    const ctx = createMockContext({
      progress: { studyStreak: 0, roadmapProgress: 0, todayUnfinished: 0, weeklyTasksDone: 0, weeklyTasksTotal: 0, totalStudyHours: 0 },
      vocabulary: { totalWords: 0, dueForReview: 0, recentCount: 0, masteredCount: 0, learningCount: 0 },
      mistakes: { total: 0, recent: 0, bySkill: {}, dueForReview: 0, topSkill: null },
      exam: { countdownDays: 0, isUrgent: false, isExamSoon: false },
      profile: { ...createMockContext().profile, weakSkills: [] },
      tasks: { today: [], pending: [], completedCount: 0 },
      roadmap: { exists: false, currentPhaseName: '', phaseProgress: 0, currentSkillFocus: null, nextTaskTitle: null, nextTaskSkill: null },
    })
    const text = getTodayRecommendation(ctx)
    expect(text).toBeTruthy()
    expect(text.length).toBeGreaterThan(10)
  })
})

describe('getAITutorContext', () => {
  it('includes all relevant learning data', async () => {
    const ctx = createMockContext()
    const context = await getAITutorContext(ctx)
    expect(context).toContain('IELTS')
    expect(context).toContain('Target band: 7')
    expect(context).toContain('Current band: 5.5')
    expect(context).toContain('Foundation')
    expect(context).toContain('Writing')
    expect(context).toContain('Vocabulary')
  })

  it('builds context from scratch when no context passed', async () => {
    mockTasks.getAll.mockResolvedValue([])
    mockReviews.getAll.mockResolvedValue([])
    mockMistakes.getAll.mockResolvedValue([])
    mockVocabulary.getAll.mockResolvedValue([])

    const context = await getAITutorContext()
    expect(context).toBeTruthy()
    expect(context).toContain('User IELTS goal')
  })
})

describe('getReasonLabel', () => {
  it('returns readable label for each reason', () => {
    expect(getReasonLabel('weak_skill')).toBe('Weak skill needs attention')
    expect(getReasonLabel('exam_urgency')).toBe('Exam is approaching')
    expect(getReasonLabel('due_review')).toBe('Items due for review')
    expect(getReasonLabel('recommended_content')).toBe('Recommended for your level')
  })
})
