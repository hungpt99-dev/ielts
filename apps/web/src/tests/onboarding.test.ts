import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  isOnboardingComplete,
  completeOnboarding,
} from '../features/onboarding/onboardingService'

const mockId = 'test-uuid-00000000'
vi.stubGlobal('crypto', {
  randomUUID: () => mockId,
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

vi.mock('../services/storage/Database', () => ({
  DatabaseService: {
    getAll: vi.fn((table: string) => {
      return Promise.resolve(mockDbData[table] ?? [])
    }),
    bulkAdd: vi.fn((table: string, items: any[]) => {
      const target = mockDbData[table] ?? []
      target.push(...items)
      mockDbData[table] = target
      return Promise.resolve()
    }),
    add: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
    put: vi.fn(),
    get: vi.fn(),
    getById: vi.fn(),
  },
}))

vi.mock('../services/storage/SettingsStorage', () => ({
  saveAppSettings: vi.fn(),
  loadAppSettings: vi.fn(() => ({
    targetBand: 7.0,
    currentBand: 5.5,
    examDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    dailyStudyMinutes: 60,
    weakSkills: [],
    preferredTopics: [],
    studyReminder: 'Time to study IELTS!',
    studyGoal: 'academic' as const,
    preferredSchedule: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
    aiApiKey: '',
    aiProvider: 'openai' as const,
    aiEndpoint: '',
    aiModel: 'gpt-4o-mini',
    darkMode: false,
    aiEnabled: false,
  })),
  removeAppSettings: vi.fn(),
}))

beforeEach(() => {
  localStorageMock.clear()
  mockDbData.tasks = []
  vi.clearAllMocks()
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-07-03T10:00:00Z'))
})

afterEach(() => {
  vi.useRealTimers()
})

describe('isOnboardingComplete', () => {
  it('returns false when no settings in localStorage', () => {
    expect(isOnboardingComplete()).toBe(false)
  })

  it('returns false when settings is empty JSON', () => {
    localStorageMock.setItem('ielts-settings', '{}')
    expect(isOnboardingComplete()).toBe(false)
  })

  it('returns false when targetBand is missing', () => {
    localStorageMock.setItem('ielts-settings', JSON.stringify({ currentBand: 5.5 }))
    expect(isOnboardingComplete()).toBe(false)
  })

  it('returns false when currentBand is missing', () => {
    localStorageMock.setItem('ielts-settings', JSON.stringify({ targetBand: 7.0 }))
    expect(isOnboardingComplete()).toBe(false)
  })

  it('returns false when examDate is missing', () => {
    localStorageMock.setItem('ielts-settings', JSON.stringify({ targetBand: 7.0, currentBand: 5.5 }))
    expect(isOnboardingComplete()).toBe(false)
  })

  it('returns false when dailyStudyMinutes is missing', () => {
    localStorageMock.setItem('ielts-settings', JSON.stringify({ targetBand: 7.0, currentBand: 5.5, examDate: '2026-09-01' }))
    expect(isOnboardingComplete()).toBe(false)
  })

  it('returns false when weakSkills is not an array', () => {
    localStorageMock.setItem('ielts-settings', JSON.stringify({ targetBand: 7.0, currentBand: 5.5, examDate: '2026-09-01', dailyStudyMinutes: 60, weakSkills: 'writing' }))
    expect(isOnboardingComplete()).toBe(false)
  })

  it('returns true when all required fields are present', () => {
    localStorageMock.setItem('ielts-settings', JSON.stringify({
      targetBand: 7.0,
      currentBand: 5.5,
      examDate: '2026-09-01',
      dailyStudyMinutes: 60,
      weakSkills: ['Writing'],
      studyGoal: 'academic',
    }))
    expect(isOnboardingComplete()).toBe(true)
  })

  it('returns false when localStorage data is corrupted JSON', () => {
    localStorageMock.setItem('ielts-settings', '{broken json')
    expect(isOnboardingComplete()).toBe(false)
  })
})

describe('completeOnboarding', () => {
  const validData = {
    currentBand: 5.5,
    targetBand: 7.0,
    examDate: '2026-09-01',
    dailyStudyMinutes: 60,
    weakSkills: ['Writing', 'Speaking'],
    preferredTopics: ['Environment', 'Education'],
    studyGoal: 'academic' as const,
    preferredSchedule: ['mon', 'tue', 'wed', 'thu', 'fri'] as ('mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun')[],
  }

  it('saves app settings and marks onboarding as complete', async () => {
    await completeOnboarding(validData)
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'ielts-onboarding-complete',
      'true',
    )
  })

  it('generates 28 roadmap tasks when no existing tasks', async () => {
    mockDbData.tasks = []
    await completeOnboarding(validData)
    expect(mockDbData.tasks.length).toBe(28)
  })

  it('does not generate tasks when tasks already exist', async () => {
    mockDbData.tasks = [{ id: 'existing', title: 'Existing task' }]
    await completeOnboarding(validData)
    expect(mockDbData.tasks.length).toBe(1)
  })

  it('generated tasks have required fields', async () => {
    mockDbData.tasks = []
    await completeOnboarding(validData)
    for (const task of mockDbData.tasks) {
      expect(task.id).toBeTruthy()
      expect(task.title).toBeTruthy()
      expect(task.date).toBeTruthy()
      expect(task.category).toBeTruthy()
      expect(typeof task.isDone).toBe('boolean')
      expect(typeof task.timeMinutes).toBe('number')
    }
  })

  it('generated tasks span 28 days', async () => {
    mockDbData.tasks = []
    await completeOnboarding(validData)
    const dates = mockDbData.tasks.map((t: any) => t.date).sort()
    const uniqueDates = [...new Set(dates)]
    expect(uniqueDates.length).toBe(28)
  })

  it('first task is Vocabulary category', async () => {
    mockDbData.tasks = []
    await completeOnboarding(validData)
    expect(mockDbData.tasks[0].category).toBe('Vocabulary')
  })

  it('includes Writing tasks when writing is a weak skill', async () => {
    mockDbData.tasks = []
    await completeOnboarding(validData)
    const writingTasks = mockDbData.tasks.filter((t: any) => t.category === 'Writing Task 2')
    expect(writingTasks.length).toBeGreaterThan(0)
  })

  it('includes Speaking tasks when speaking is a weak skill', async () => {
    mockDbData.tasks = []
    await completeOnboarding(validData)
    const speakingTasks = mockDbData.tasks.filter((t: any) => t.category === 'Speaking Part 1')
    expect(speakingTasks.length).toBeGreaterThan(0)
  })

  it('handles empty weak skills gracefully', async () => {
    mockDbData.tasks = []
    await completeOnboarding({ ...validData, weakSkills: [] })
    expect(mockDbData.tasks.length).toBe(28)
  })

  it('handles academic study goal correctly', async () => {
    mockDbData.tasks = []
    await completeOnboarding({ ...validData, studyGoal: 'academic' })
    expect(mockDbData.tasks.length).toBe(28)
  })

  it('handles general study goal correctly', async () => {
    mockDbData.tasks = []
    await completeOnboarding({ ...validData, studyGoal: 'general' })
    expect(mockDbData.tasks.length).toBe(28)
  })
})
