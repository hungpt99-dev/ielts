import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AITutorService } from '../aiTutorService'
import type { PersonalizationContext } from '../../personalization/types'

const mockId = 'test-uuid-00000000'
vi.stubGlobal('crypto', {
  randomUUID: () => mockId,
})

const mockTaskData = vi.hoisted(() => ({ value: [] as any[] }))
const mockVocabData = vi.hoisted(() => ({ value: [] as any[] }))
const mockMistakeData = vi.hoisted(() => ({ value: [] as any[] }))

const mockCallAI = vi.hoisted(() =>
  vi.fn((_systemPrompt: string, userPrompt: string) => {
    const lower = (userPrompt || '').toLowerCase()
    if (lower.includes('what should i study') || lower.includes('recommend')) {
      return Promise.resolve({ content: 'I recommend focusing on your Writing skills today based on your progress.', error: null })
    }
    if (lower.includes('weak') || lower.includes('struggl')) {
      return Promise.resolve({ content: 'Your weakest area is Writing with 5 recorded mistakes.', error: null })
    }
    if (lower.includes('exam') || lower.includes('when is') || lower.includes('test date')) {
      return Promise.resolve({ content: 'Your IELTS exam is in 60 days.', error: null })
    }
    if (lower.includes('doing') || lower.includes('progress') || lower.includes('streak') || lower.includes('how am i') || lower.includes('consistency')) {
      return Promise.resolve({ content: 'Your current streak is 5 days.', error: null })
    }
    return Promise.resolve({ content: null, error: 'Unable to answer that question.' })
  })
)

vi.mock('@ielts/ai', () => ({
  callAI: mockCallAI,
}))

vi.mock('../../../services/storage/Database', () => ({
  DatabaseService: {
    getAll: (table: string) => {
      if (table === 'tasks') return Promise.resolve(mockTaskData.value)
      if (table === 'vocabulary') return Promise.resolve(mockVocabData.value)
      if (table === 'mistakes') return Promise.resolve(mockMistakeData.value)
      return Promise.resolve([])
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
    aiApiKey: 'test-key',
    aiProvider: 'openai' as const,
    aiEndpoint: '',
    aiModel: 'gpt-4o-mini',
    darkMode: false,
    aiEnabled: true,
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
    id: 'day-1',
    date: new Date().toISOString().slice(0, 10),
    dayNumber: 1,
    skillFocus: 'Vocabulary',
    taskId: 'task-1',
    isComplete: false,
    objective: 'Learn 10 environment vocabulary words',
  }),
}))

vi.mock('../../personalization/personalizationService', () => ({
  buildPersonalizationContext: vi.fn(),
  analyzeWeakSkills: vi.fn(),
  generateRecommendations: vi.fn(),
  getTodayRecommendation: vi.fn(),
  getAITutorContext: vi.fn(),
  getReasonLabel: vi.fn(),
}))

beforeEach(() => {
  mockTaskData.value = []
  mockVocabData.value = []
  mockMistakeData.value = []
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-07-03T10:00:00Z'))
})

afterEach(() => {
  vi.useRealTimers()
})

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

describe('AITutorService', () => {
  const service = new AITutorService()

  describe('getDailyBriefing', () => {
    it('returns greeting with unfinished tasks priority', async () => {
      const ctx = createMockContext()
      const briefing = await service.getDailyBriefing(ctx)
      expect(briefing.greeting).toContain('2 tasks')
    })

    it('returns streak greeting when no unfinished tasks', async () => {
      const ctx = createMockContext({
        progress: { ...createMockContext().progress, todayUnfinished: 0, studyStreak: 5 },
        tasks: { ...createMockContext().tasks, today: [] },
      })
      const briefing = await service.getDailyBriefing(ctx)
      expect(briefing.greeting).toContain('5')
    })

    it('includes unfinished tasks in greeting', async () => {
      const ctx = createMockContext()
      const briefing = await service.getDailyBriefing(ctx)
      expect(briefing.focusArea).toContain('Writing')
    })

    it('includes weak skill reminder when weak skills exist', async () => {
      const ctx = createMockContext()
      const briefing = await service.getDailyBriefing(ctx)
      expect(briefing.weakSkillReminder).toContain('Writing')
    })

    it('includes exam countdown when date is set', async () => {
      const ctx = createMockContext()
      const briefing = await service.getDailyBriefing(ctx)
      expect(briefing.examCountdownMessage).toContain('60')
    })

    it('greets new user with no streak and no tasks', async () => {
      const ctx = createMockContext({
        progress: { ...createMockContext().progress, studyStreak: 0, todayUnfinished: 0 },
        tasks: { ...createMockContext().tasks, today: [] },
      })
      const briefing = await service.getDailyBriefing(ctx)
      expect(briefing.greeting).toContain('Ready to start')
    })

    it('provides exam soon message for urgent exam', async () => {
      const ctx = createMockContext({ exam: { countdownDays: 5, isUrgent: true, isExamSoon: true } })
      const briefing = await service.getDailyBriefing(ctx)
      expect(briefing.examCountdownMessage).toContain('5')
      expect(briefing.examCountdownMessage).toContain('mock tests')
    })
  })

  describe('suggestTasks', () => {
    it('returns high priority for unfinished tasks', () => {
      const ctx = createMockContext()
      const suggestions = service.suggestTasks(ctx)
      const highPriority = suggestions.filter(s => s.priority === 'high')
      expect(highPriority.length).toBeGreaterThan(0)
    })

    it('sorts by priority ascending', () => {
      const ctx = createMockContext()
      const suggestions = service.suggestTasks(ctx)
      const order: Record<string, number> = { high: 0, medium: 1, low: 2 }
      for (let i = 1; i < suggestions.length; i++) {
        expect(order[suggestions[i - 1].priority]).toBeLessThanOrEqual(order[suggestions[i].priority])
      }
    })

    it('includes context explanation for each suggestion', () => {
      const ctx = createMockContext()
      const suggestions = service.suggestTasks(ctx)
      for (const s of suggestions) {
        expect(s.contextExplanation).toBeTruthy()
        expect(s.contextExplanation.length).toBeGreaterThan(10)
      }
    })

    it('returns exam urgency suggestion when exam is near', () => {
      const ctx = createMockContext({
        exam: { countdownDays: 15, isUrgent: true, isExamSoon: false },
        progress: { ...createMockContext().progress, todayUnfinished: 0 },
        vocabulary: { ...createMockContext().vocabulary, dueForReview: 0 },
        mistakes: { ...createMockContext().mistakes, dueForReview: 0 },
      })
      const suggestions = service.suggestTasks(ctx)
      expect(suggestions.some(s => s.reason === 'exam_urgency')).toBe(true)
    })

    it('returns vocabulary review suggestion when due', () => {
      const ctx = createMockContext({
        progress: { ...createMockContext().progress, todayUnfinished: 0 },
        vocabulary: { ...createMockContext().vocabulary, dueForReview: 8 },
      })
      const suggestions = service.suggestTasks(ctx)
      expect(suggestions.some(s => s.reason === 'due_review')).toBe(true)
    })

    it('returns default suggestion when nothing else matches', () => {
      const empty = createMockContext({
        progress: { studyStreak: 0, roadmapProgress: 0, todayUnfinished: 0, weeklyTasksDone: 0, weeklyTasksTotal: 0, totalStudyHours: 0 },
        vocabulary: { totalWords: 0, dueForReview: 0, recentCount: 0, masteredCount: 0, learningCount: 0 },
        mistakes: { total: 0, recent: 0, bySkill: {}, dueForReview: 0, topSkill: null },
        exam: { countdownDays: 0, isUrgent: false, isExamSoon: false },
        profile: { ...createMockContext().profile, weakSkills: [] },
        tasks: { today: [], pending: [], completedCount: 0 },
        roadmap: { exists: false, currentPhaseName: '', phaseProgress: 0, currentSkillFocus: null, nextTaskTitle: null, nextTaskSkill: null },
      })
      const suggestions = service.suggestTasks(empty)
      expect(suggestions.length).toBeGreaterThan(0)
      expect(suggestions[0].reason).toBe('recommended_content')
    })
  })

  describe('getProactiveMessage', () => {
    it('returns reminder when tasks are unfinished', async () => {
      const ctx = createMockContext()
      const msg = await service.getProactiveMessage(ctx)
      expect(msg).not.toBeNull()
      expect(msg!.type).toBe('reminder')
    })

    it('returns tip when new vocabulary was saved', async () => {
      const ctx = createMockContext({
        progress: { ...createMockContext().progress, todayUnfinished: 0 },
        vocabulary: { ...createMockContext().vocabulary, recentCount: 8 },
      })
      const msg = await service.getProactiveMessage(ctx)
      expect(msg).not.toBeNull()
      expect(msg!.type).toBe('tip')
      expect(msg!.message).toContain('saved')
    })

    it('returns motivation for exam soon', async () => {
      const ctx = createMockContext({
        progress: { ...createMockContext().progress, todayUnfinished: 0 },
        vocabulary: { ...createMockContext().vocabulary, recentCount: 0 },
        exam: { countdownDays: 3, isUrgent: true, isExamSoon: true },
      })
      const msg = await service.getProactiveMessage(ctx)
      expect(msg).not.toBeNull()
      expect(msg!.type).toBe('motivation')
    })

    it('returns null when no interesting trigger', async () => {
      const ctx = createMockContext({
        progress: { studyStreak: 2, roadmapProgress: 0, todayUnfinished: 0, weeklyTasksDone: 0, weeklyTasksTotal: 0, totalStudyHours: 0 },
        vocabulary: { totalWords: 0, dueForReview: 0, recentCount: 0, masteredCount: 0, learningCount: 0 },
        mistakes: { total: 0, recent: 0, bySkill: {}, dueForReview: 0, topSkill: null },
        exam: { countdownDays: 100, isUrgent: false, isExamSoon: false },
        profile: { ...createMockContext().profile, weakSkills: [] },
        tasks: { today: [], pending: [], completedCount: 0 },
        roadmap: { exists: false, currentPhaseName: '', phaseProgress: 0, currentSkillFocus: null, nextTaskTitle: null, nextTaskSkill: null },
      })
      const msg = await service.getProactiveMessage(ctx)
      expect(msg).toBeNull()
    })
  })

  describe('reviewRecentMistakes', () => {
    it('returns mistake reviews from context', async () => {
      mockMistakeData.value = [
        { id: 'm1', skill: 'grammar', text: 'Incorrect verb tense', status: 'unresolved', date: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'm2', skill: 'vocabulary', text: 'Wrong word choice', status: 'new', date: new Date().toISOString(), updatedAt: new Date().toISOString() },
      ]
      const ctx = createMockContext()
      const reviews = await service.reviewRecentMistakes(ctx)
      expect(reviews.length).toBeGreaterThan(0)
      for (const review of reviews) {
        expect(review.explanation).toBeTruthy()
        expect(review.suggestion).toBeTruthy()
        expect(review.example).toBeTruthy()
      }
    })

    it('returns placeholder when no mistakes exist', async () => {
      const ctx = createMockContext({ mistakes: { ...createMockContext().mistakes, total: 0, bySkill: {} } })
      const reviews = await service.reviewRecentMistakes(ctx)
      expect(reviews.length).toBe(1)
      expect(reviews[0].mistake).toContain('No unresolved mistakes')
    })
  })

  describe('generateExerciseFromVocabulary', () => {
    it('returns default exercise when no vocabulary saved', async () => {
      const ctx = createMockContext({ vocabulary: { ...createMockContext().vocabulary, totalWords: 0 } })
      const exercises = await service.generateExerciseFromVocabulary(3, ctx)
      expect(exercises.length).toBeGreaterThan(0)
    })

    it('generates exercises from saved vocabulary', async () => {
      mockVocabData.value = [
        { id: 'v1', word: 'sustainable', meaning: 'can be maintained over time', createdAt: new Date().toISOString() },
        { id: 'v2', word: 'biodiversity', meaning: 'variety of life in an ecosystem', createdAt: new Date().toISOString() },
        { id: 'v3', word: 'curriculum', meaning: 'subjects in a course', createdAt: new Date().toISOString() },
      ]

      const ctx = createMockContext({ vocabulary: { ...createMockContext().vocabulary, totalWords: 3 } })
      const exercises = await service.generateExerciseFromVocabulary(2, ctx)
      expect(exercises.length).toBeGreaterThan(0)
      for (const ex of exercises) {
        expect(ex.instructions).toBeTruthy()
        expect(ex.estimatedMinutes).toBeGreaterThan(0)
        expect(ex.wordsToUse).toBeDefined()
      }
    })
  })

  describe('answerQuestion', () => {
    it('answers what to study question', async () => {
      const ctx = createMockContext()
      const answer = await service.answerQuestion('What should I study today?', ctx)
      expect(answer).not.toBeNull()
      expect(answer).toContain('recommend')
    })

    it('answers weak skills question', async () => {
      const ctx = createMockContext()
      const answer = await service.answerQuestion('What are my weak skills?', ctx)
      expect(answer).not.toBeNull()
      expect(answer).toContain('Writing')
    })

    it('answers exam date question', async () => {
      const ctx = createMockContext()
      const answer = await service.answerQuestion('When is my exam?', ctx)
      expect(answer).not.toBeNull()
      expect(answer).toContain('60')
    })

    it('answers progress question', async () => {
      const ctx = createMockContext()
      const answer = await service.answerQuestion('How am I doing?', ctx)
      expect(answer).not.toBeNull()
      expect(answer).toContain('streak')
    })

    it('returns null for unrecognized question', async () => {
      const ctx = createMockContext()
      const answer = await service.answerQuestion('What is the capital of France?', ctx)
      expect(answer).toBeNull()
    })
  })
})
