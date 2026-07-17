import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  isOnboardingComplete,
  completeOnboarding,
} from '../onboardingService'
import type { OnboardingData } from '../onboardingService'
import { STORAGE_KEYS } from '@ielts/config'

const mockId = 'onboard-char-test-uuid'
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

const mockDbData: Record<string, any[]> = { tasks: [] }

vi.mock('../../../services/repositories', () => ({
  taskRepo: {
    findAll: vi.fn(() => Promise.resolve(mockDbData.tasks ?? [])),
    bulkCreate: vi.fn((items: any[]) => {
      mockDbData.tasks.push(...items)
      return Promise.resolve()
    }),
  },
}))

vi.mock('../../../services/storage/Database', () => ({
  DatabaseService: {
    getAll: vi.fn((table: string) => Promise.resolve(mockDbData[table] ?? [])),
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

beforeEach(() => {
  localStorageMock.clear()
  idCounter = 0
  mockDbData.tasks = []
  vi.clearAllMocks()
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-07-03T10:00:00Z'))
})

afterEach(() => {
  vi.useRealTimers()
})

const validData: OnboardingData = {
  currentBand: 5.5,
  targetBand: 7.0,
  examDate: '2026-09-01',
  dailyStudyMinutes: 60,
  weakSkills: ['Writing', 'Speaking'],
  strongSkills: ['Reading'],
  preferredTopics: ['Environment', 'Education'],
  studyGoal: 'academic',
  preferredSchedule: ['mon', 'tue', 'wed', 'thu', 'fri'],
  preferredLanguage: 'en',
  tutorStyle: 'encouraging',
}

describe('completeOnboarding — characterization', () => {
  it('writes canonical settings with version field', async () => {
    await completeOnboarding(validData)
    const raw = localStorageMock.setItem.mock.calls.find(
      (c: any[]) => c[0] === STORAGE_KEYS.localStorage.userSettings,
    )
    expect(raw).toBeTruthy()
    const parsed = JSON.parse(raw![1])
    expect(parsed.version).toBe(1)
    expect(parsed.study.targetBand).toBe(7.0)
    expect(parsed.study.weakSkills).toEqual(['Writing', 'Speaking'])
    expect(parsed.ai.providerId).toBe('openai')
    expect(parsed.theme.mode).toBe('system')
    expect(parsed.notifications.enabled).toBe(true)
  })

  it('writes onboarding-complete flag', async () => {
    await completeOnboarding(validData)
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      STORAGE_KEYS.localStorage.onboardingComplete,
      'true',
    )
  })

  it('generates 28 tasks when no existing tasks', async () => {
    mockDbData.tasks = []
    await completeOnboarding(validData)
    expect(mockDbData.tasks.length).toBe(28)
  })

  it('does not generate tasks when tasks already exist', async () => {
    mockDbData.tasks = [{ id: 'existing', title: 'Existing task' }]
    await completeOnboarding(validData)
    expect(mockDbData.tasks.length).toBe(1)
  })

  it('first task is Vocabulary category', async () => {
    mockDbData.tasks = []
    await completeOnboarding(validData)
    expect(mockDbData.tasks[0].category).toBe('Vocabulary')
  })

  it('generated tasks span 28 unique dates starting from Monday of current week', async () => {
    mockDbData.tasks = []
    await completeOnboarding(validData)
    const dates = [...new Set(mockDbData.tasks.map((t: any) => t.date))]
    expect(dates.length).toBe(28)
    // July 3 2026 is Friday; Monday that week is June 29
    expect(dates[0]).toBe('2026-06-29')
  })

  it('all generated tasks have required fields', async () => {
    mockDbData.tasks = []
    await completeOnboarding(validData)
    for (const task of mockDbData.tasks) {
      expect(task.id).toBeTruthy()
      expect(task.title).toBeTruthy()
      expect(task.category).toMatch(/^(Vocabulary|Reading|Listening|Writing Task 2|Speaking Part 1|Grammar)$/)
      expect(['boolean']).toContain(typeof task.isDone)
      expect(['number']).toContain(typeof task.timeMinutes)
      expect(task.isDone).toBe(false)
    }
  })

  it('includes Speaking tasks when speaking is weak', async () => {
    mockDbData.tasks = []
    await completeOnboarding(validData)
    const speakingTasks = mockDbData.tasks.filter((t: any) => t.category === 'Speaking Part 1')
    expect(speakingTasks.length).toBeGreaterThan(0)
  })

  it('isOnboardingComplete returns true after completion', async () => {
    mockDbData.tasks = []
    await completeOnboarding(validData)
    expect(isOnboardingComplete()).toBe(true)
  })

  it('isOnboardingComplete returns false without settings', () => {
    localStorageMock.clear()
    expect(isOnboardingComplete()).toBe(false)
  })
})
