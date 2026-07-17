import { describe, it, expect, vi, beforeEach } from 'vitest'
import { STORAGE_KEYS } from '@ielts/config'

const mockId = 'dash-char-test-uuid'
let idCounter = 0
vi.stubGlobal('crypto', {
  randomUUID: () => `${mockId}-${++idCounter}`,
})

const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: vi.fn(() => { store = {} }),
    get length() { return Object.keys(store).length },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  }
})()

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock })

const mockDbData: Record<string, any[]> = {
  tasks: [],
  vocabularyReviews: [],
  readingSessions: [],
  listeningSessions: [],
  writingSessions: [],
  speakingSessions: [],
  mistakes: [],
  vocabulary: [],
}

const mockGetTasksForDate = vi.fn()

vi.mock('../../../services/repositories', () => ({
  taskRepo: {
    findAll: vi.fn(() => Promise.resolve(mockDbData.tasks ?? [])),
  },
  vocabReviewRepo: {
    findAll: vi.fn(() => Promise.resolve(mockDbData.vocabularyReviews ?? [])),
  },
  mistakeRepo: {
    findAll: vi.fn(() => Promise.resolve(mockDbData.mistakes ?? [])),
  },
  vocabularyRepo: {
    findAll: vi.fn(() => Promise.resolve(mockDbData.vocabulary ?? [])),
  },
}))

vi.mock('../../../services/storage/Database', () => ({
  DatabaseService: {
    getAll: vi.fn((table: string) => Promise.resolve(mockDbData[table] ?? [])),
    getTasksForDate: mockGetTasksForDate,
    getById: vi.fn((table: string, id: string) => Promise.resolve(mockDbData[table]?.find((r: any) => r.id === id) ?? undefined)),
    bulkAdd: vi.fn((table: string, items: any[]) => {
      const target = mockDbData[table] ?? []
      target.push(...items)
      mockDbData[table] = target
      return Promise.resolve()
    }),
    add: vi.fn((table: string, item: any) => {
      const target = mockDbData[table] ?? []
      target.push(item)
      mockDbData[table] = target
      return Promise.resolve(item.id)
    }),
    update: vi.fn((table: string, id: string, changes: any) => Promise.resolve()),
    remove: vi.fn((table: string, id: string) => {
      if (mockDbData[table]) mockDbData[table] = mockDbData[table].filter((r: any) => r.id !== id)
      return Promise.resolve()
    }),
    put: vi.fn((table: string, item: any) => {
      const target = mockDbData[table] ?? []
      const idx = target.findIndex((r: any) => r.id === item.id)
      if (idx >= 0) target[idx] = item
      else target.push(item)
      mockDbData[table] = target
      return Promise.resolve()
    }),
    count: vi.fn((table: string) => Promise.resolve((mockDbData[table] ?? []).length)),
    get: vi.fn(),
    safePut: vi.fn(),
    safeGetAll: vi.fn(),
    safeGetById: vi.fn((table: string, id: string) => Promise.resolve(mockDbData[table]?.find((r: any) => r.id === id) ?? undefined)),
    exportAll: vi.fn().mockResolvedValue({}),
    importAll: vi.fn().mockResolvedValue(undefined),
    resetAll: vi.fn().mockResolvedValue(undefined),
    clearAll: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('@ielts/storage', () => {
  const createSessionRepo = (table: string) =>
    vi.fn().mockImplementation(() => ({
      findAll: vi.fn(() => Promise.resolve(mockDbData[table] ?? [])),
    }))

  return {
    ReadingSessionRepository: createSessionRepo('readingSessions'),
    ListeningSessionRepository: createSessionRepo('listeningSessions'),
    WritingSessionRepository: createSessionRepo('writingSessions'),
    SpeakingSessionRepository: createSessionRepo('speakingSessions'),
    APP_SCHEMA: { versions: [] },
    ValidationError: class extends Error {},
  }
})

vi.mock('../../../services/engineBootstrap', () => ({
  initializeAITutorEngine: vi.fn(() => Promise.resolve(null)),
}))

vi.mock('../../roadmap/roadmapService', () => ({
  loadRoadmap: vi.fn(() => null),
  recalculateProgress: vi.fn(() => ({ overallProgress: 0 })),
}))

beforeEach(() => {
  localStorageMock.clear()
  idCounter = 0
  for (const key of Object.keys(mockDbData)) {
    mockDbData[key] = []
  }
  mockGetTasksForDate.mockReset()
  mockGetTasksForDate.mockResolvedValue([])
  vi.clearAllMocks()
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-07-03T10:00:00Z'))
})

afterEach(() => {
  vi.useRealTimers()
})

describe('loadDashboardData — characterization', () => {
  it('returns data and weeklyChart with expected shape', async () => {
    localStorageMock.setItem(STORAGE_KEYS.localStorage.userSettings, JSON.stringify({
      study: {
        targetBand: 7.0,
        currentBand: 5.5,
        examDate: '2026-09-01',
        dailyStudyMinutes: 60,
        weakSkills: ['Writing'],
        studyGoal: 'academic',
      },
    }))

    const { loadDashboardData } = await import('../dashboardService')
    const result = await loadDashboardData()

    expect(result).toHaveProperty('data')
    expect(result).toHaveProperty('weeklyChart')
    expect(result.data).toHaveProperty('todayTasks')
    expect(result.data).toHaveProperty('studyStreak')
    expect(result.data).toHaveProperty('weeklyProgress')
    expect(result.data).toHaveProperty('totalStudyHours')
    expect(result.data).toHaveProperty('targetBand')
    expect(result.data).toHaveProperty('currentBand')
    expect(result.data).toHaveProperty('weakSkills')
    expect(result.data).toHaveProperty('dueReviews')
    expect(result.data).toHaveProperty('todayFocus')
    expect(result.data).toHaveProperty('recentSessions')
    expect(result.data).toHaveProperty('examDate')
    expect(result.data).toHaveProperty('studyGoal')
    expect(result.data).toHaveProperty('dailyStudyMinutes')
    expect(result.data).toHaveProperty('recentMistakes')
    expect(result.data).toHaveProperty('savedVocabularyCount')
    expect(result.data).toHaveProperty('aiSuggestion')
    expect(result.data).toHaveProperty('roadmapProgress')
    expect(result.data).toHaveProperty('examCountdown')
  })

  it('returns zero values when no data exists', async () => {
    localStorageMock.setItem(STORAGE_KEYS.localStorage.userSettings, JSON.stringify({
      targetBand: 6.5,
      currentBand: 5.0,
      examDate: '',
      dailyStudyMinutes: 30,
      weakSkills: [],
      studyGoal: 'academic',
    }))

    const { loadDashboardData } = await import('../dashboardService')
    const result = await loadDashboardData()

    expect(result.data.studyStreak).toBe(0)
    expect(result.data.totalStudyHours).toBe(0)
    expect(result.data.dueReviews).toBe(0)
    expect(result.data.savedVocabularyCount).toBe(0)
    expect(result.data.recentMistakes).toBe(0)
  })

  it('reads settings from localStorage with fallback', async () => {
    localStorageMock.setItem(STORAGE_KEYS.localStorage.userSettings, JSON.stringify({
      targetBand: 7.5,
      currentBand: 6.0,
      examDate: '2026-10-01',
      dailyStudyMinutes: 120,
      weakSkills: ['Reading'],
      studyGoal: 'academic',
    }))

    const { loadDashboardData } = await import('../dashboardService')
    const result = await loadDashboardData()

    expect(result.data.targetBand).toBe(7.5)
    expect(result.data.currentBand).toBe(6.0)
    expect(result.data.examDate).toBe('2026-10-01')
    expect(result.data.dailyStudyMinutes).toBe(120)
  })

  it('computes streak from completed tasks', async () => {
    const today = new Date('2026-07-03T10:00:00Z')
    mockDbData.tasks = Array.from({ length: 5 }, (_, i) => {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      return {
        id: `task-${i}`,
        title: `Task ${i}`,
        category: 'Vocabulary',
        date: d.toISOString().split('T')[0],
        isDone: true,
        timeMinutes: 10,
        completedAt: d.toISOString(),
        createdAt: d.toISOString(),
        updatedAt: d.toISOString(),
      }
    })

    localStorageMock.setItem(STORAGE_KEYS.localStorage.userSettings, JSON.stringify({
      study: { targetBand: 7.0, currentBand: 5.5 },
    }))

    const { loadDashboardData } = await import('../dashboardService')
    const result = await loadDashboardData()

    expect(result.data.studyStreak).toBe(4)
  })

  it('computes weekly progress from this weeks tasks', async () => {
    const monday = new Date('2026-06-29T00:00:00Z')
    mockDbData.tasks = [
      {
        id: 'wk-task-1', title: 'Week task', category: 'Reading',
        date: monday.toISOString().split('T')[0],
        isDone: true, timeMinutes: 20,
        completedAt: new Date().toISOString(),
        createdAt: '', updatedAt: '',
      },
      {
        id: 'wk-task-2', title: 'Week task 2', category: 'Writing',
        date: new Date('2026-07-01').toISOString().split('T')[0],
        isDone: false, timeMinutes: 15,
        completedAt: null, createdAt: '', updatedAt: '',
      },
    ]

    localStorageMock.setItem(STORAGE_KEYS.localStorage.userSettings, JSON.stringify({
      study: { targetBand: 7.0, currentBand: 5.5 },
    }))

    const { loadDashboardData } = await import('../dashboardService')
    const result = await loadDashboardData()

    expect(result.data.weeklyProgress.done).toBe(1)
    expect(result.data.weeklyProgress.total).toBe(2)
  })
})
