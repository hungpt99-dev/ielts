import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { completeOnboardingUseCase } from '../complete-onboarding'
import { STORAGE_KEYS } from '@ielts/config'

const mockId = 'uc-onboard-uuid'
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

vi.mock('@ielts/storage', () => ({
  PlanRepository: vi.fn().mockImplementation(() => ({
    savePlan: vi.fn().mockResolvedValue(undefined),
    savePhase: vi.fn().mockResolvedValue(undefined),
    saveWeek: vi.fn().mockResolvedValue(undefined),
    saveDay: vi.fn().mockResolvedValue(undefined),
  })),
  APP_SCHEMA: { versions: [] },
}))

vi.mock('@ielts/learning-engine', () => {
  const buildNormalizedProfile = vi.fn((input: any) => ({
    ...input.settings,
    currentSkillBands: {},
    targetSkillBands: {},
    startDate: input.overrides?.planStartDate,
    timezone: input.overrides?.timezone,
  }))

  class DailyPlanEngine {
    generatePlan(profile: any) {
      return {
        status: 'success',
        plan: {
          id: 'plan-1',
          version: 1,
          phases: [
            { id: 'phase-1', title: 'Foundation', description: 'Build basics', order: 1 },
          ],
          weeks: [
            { id: 'week-1', phaseId: 'phase-1', weekNumber: 1, title: 'Week 1', focus: 'Vocabulary' },
          ],
          tasks: [
            { id: 'task-1', weekId: 'week-1', date: '2026-07-03', title: 'Learn vocabulary', skill: 'vocabulary' },
          ],
          planningWindow: {},
          feasibility: { status: 'comfortable' },
        },
      }
    }
  }

  return { DailyPlanEngine, buildNormalizedProfile }
})

beforeEach(() => {
  localStorageMock.clear()
  vi.clearAllMocks()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('completeOnboardingUseCase', () => {
  const validInput = {
    currentBand: 5.5,
    targetBand: 7.0,
    examDate: '2026-09-01',
    dailyStudyMinutes: 60,
    weakSkills: ['Writing', 'Speaking'],
    strongSkills: ['Reading'],
    preferredTopics: ['Environment', 'Education'],
    studyGoal: 'academic' as const,
    preferredSchedule: ['mon', 'tue', 'wed', 'thu', 'fri'] as ('mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun')[],
    preferredLanguage: 'en',
    tutorStyle: 'encouraging' as const,
  }

  it('returns success when onboarding completes', async () => {
    const result = await completeOnboardingUseCase(validInput)
    expect(result.success).toBe(true)
    expect(result.isComplete).toBe(true)
  })

  it('writes canonical settings to localStorage', async () => {
    await completeOnboardingUseCase(validInput)
    const raw = localStorageMock.getItem(STORAGE_KEYS.localStorage.userSettings)
    expect(raw).toBeTruthy()
    const parsed = JSON.parse(raw!)
    expect(parsed.version).toBe(1)
    expect(parsed.study.targetBand).toBe(7.0)
    expect(parsed.study.currentBand).toBe(5.5)
  })

  it('returns planId from plan generation', async () => {
    const result = await completeOnboardingUseCase(validInput)
    expect(result).toHaveProperty('planId')
  })

  it('reports tasksCreated from plan generation', async () => {
    const result = await completeOnboardingUseCase(validInput)
    expect(result.tasksCreated).toBeGreaterThanOrEqual(0)
  })
})
