import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { TaskEntry } from '../../../models'
import { STORAGE_KEYS } from '@ielts/config'
import * as roadmapService from '../roadmapService'

const mockId = 'roadmap-char-test-uuid'
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
  readingPracticeSessions: [],
  listeningPracticeSessions: [],
  writingSessions: [],
  speakingSessions: [],
  grammarNotes: [],
  mistakes: [],
  vocabulary: [],
  vocabularyReviews: [],
  progressRecords: [],
}

vi.mock('../../../services/storage/Database', () => ({
  DatabaseService: {
    getAll: vi.fn((table: string) => Promise.resolve(mockDbData[table] ?? [])),
    bulkAdd: vi.fn((table: string, items: any[]) => {
      const target = mockDbData[table] ?? []
      target.push(...items)
      mockDbData[table] = target
      return Promise.resolve()
    }),
    addTask: vi.fn((item: any) => {
      const id = crypto.randomUUID()
      const entry = { ...item, id, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
      mockDbData.tasks.push(entry)
      return Promise.resolve(entry)
    }),
    add: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    put: vi.fn(),
    get: vi.fn(),
    getById: vi.fn(),
    safePut: vi.fn(),
    safeGetAll: vi.fn(),
  },
}))

vi.mock('../../services/engineBootstrap', () => ({
  getLearningEngine: vi.fn(() => null),
}))

beforeEach(() => {
  localStorageMock.clear()
  idCounter = 0
  for (const key of Object.keys(mockDbData)) {
    mockDbData[key] = []
  }
  vi.clearAllMocks()
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-07-03T10:00:00Z'))
})

afterEach(() => {
  vi.useRealTimers()
})

function makeSettings(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    study: {
      targetBand: 7.0,
      currentBand: 5.5,
      examDate: '2026-09-01',
      dailyStudyMinutes: 60,
      weakSkills: ['Writing', 'Speaking'],
      studyGoal: 'academic',
      preferredSchedule: ['mon', 'tue', 'wed', 'thu', 'fri'],
    },
    targetBand: 7.0,
    currentBand: 5.5,
    examDate: '2026-09-01',
    dailyStudyMinutes: 60,
    weakSkills: ['Writing', 'Speaking'],
    preferredTopics: ['Environment', 'Education'],
    studyGoal: 'academic',
    preferredSchedule: ['mon', 'tue', 'wed', 'thu', 'fri'],
    ...overrides,
  }
}

describe('generateRoadmap — characterization', () => {
  it('produces RoadmapData with expected shape', async () => {
    const settings = makeSettings()
    const tasks: TaskEntry[] = []
    const roadmap = await roadmapService.generateRoadmap(settings, tasks)
    expect(roadmap).toHaveProperty('phases')
    expect(roadmap).toHaveProperty('currentPhaseIndex')
    expect(roadmap).toHaveProperty('currentWeekIndex')
    expect(roadmap).toHaveProperty('overallProgress')
    expect(roadmap).toHaveProperty('totalTasks')
    expect(roadmap).toHaveProperty('completedTasks')
    expect(roadmap).toHaveProperty('generatedAt')
    expect(roadmap).toHaveProperty('updatedAt')
  })

  it('creates 3-4 phases for a 60-day study window', async () => {
    const settings = makeSettings()
    const tasks: TaskEntry[] = []
    const roadmap = await roadmapService.generateRoadmap(settings, tasks)
    expect(roadmap.phases.length).toBeGreaterThanOrEqual(3)
    expect(roadmap.phases.length).toBeLessThanOrEqual(4)
  })

  it('each phase has unique name and weeks', async () => {
    const settings = makeSettings()
    const tasks: TaskEntry[] = []
    const roadmap = await roadmapService.generateRoadmap(settings, tasks)
    for (const phase of roadmap.phases) {
      expect(phase.id).toBeTruthy()
      expect(phase.name).toBeTruthy()
      expect(phase.weeks.length).toBeGreaterThan(0)
      for (const week of phase.weeks) {
        expect(week.id).toBeTruthy()
        expect(week.days.length).toBeGreaterThan(0)
        for (const day of week.days) {
          expect(day.id).toBeTruthy()
          expect(day.taskIds.length).toBeGreaterThan(0)
        }
      }
    }
  })

  it('totalTasks equals sum of all week tasks', async () => {
    const settings = makeSettings()
    const tasks: TaskEntry[] = []
    const roadmap = await roadmapService.generateRoadmap(settings, tasks)
    const sumWeekTasks = roadmap.phases.reduce(
      (ps, p) => ps + p.weeks.reduce((ws, w) => ws + w.totalTasks, 0),
      0,
    )
    expect(roadmap.totalTasks).toBe(sumWeekTasks)
  })

  it('recalculates progress from existing completed tasks', async () => {
    const settings = makeSettings()
    const existingTasks: TaskEntry[] = [
      {
        id: 'done-1', title: 'Learn vocabulary', category: 'Vocabulary',
        date: '2026-07-03T00:00:00.000Z', isDone: true, isRecurring: false,
        timeMinutes: 10, notes: '', createdAt: '', updatedAt: '',
        completedAt: new Date().toISOString(),
      },
    ]
    const roadmap = await roadmapService.generateRoadmap(settings, existingTasks)
    expect(roadmap.completedTasks).toBeGreaterThan(0)
  })
})

describe('saveRoadmap / loadRoadmap — characterization', () => {
  it('saves and loads roadmap from localStorage', async () => {
    const settings = makeSettings()
    const tasks: TaskEntry[] = []
    const roadmap = await roadmapService.generateRoadmap(settings, tasks)
    roadmapService.saveRoadmap(roadmap)
    const loaded = roadmapService.loadRoadmap()
    expect(loaded).toBeTruthy()
    expect(loaded!.phases.length).toBe(roadmap.phases.length)
    expect(loaded!.totalTasks).toBe(roadmap.totalTasks)
  })

  it('returns null when no roadmap saved', () => {
    const loaded = roadmapService.loadRoadmap()
    expect(loaded).toBeNull()
  })
})

describe('getTodayTask — characterization', () => {
  it('returns day with undefined task when no task matches today', async () => {
    const settings = makeSettings()
    const tasks: TaskEntry[] = []
    const roadmap = await roadmapService.generateRoadmap(settings, tasks)
    const result = roadmapService.getTodayTask(roadmap, tasks)
    expect(result).not.toBeNull()
    expect(result!.task).toBeUndefined()
  })
})
