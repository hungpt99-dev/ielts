import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type {
  StudyPlanUserProfile,
  StudyPlanData,
  DailyPlanItem,
  GlobalStudyStrategy,
  StudyPlanCalculatedMeta,
  GenerationProgress,
} from '../types'

vi.mock('@ielts/ai', () => ({ callAI: vi.fn() }))
vi.mock('../services/dailyPlanService', () => ({ generateDailyPlanChunk: vi.fn() }))
vi.mock('../services/globalStrategyService', () => ({ generateGlobalStudyStrategy: vi.fn() }))

const planMap = vi.hoisted(() => new Map<string, StudyPlanData>())

const storeMock = vi.hoisted(() => ({
  saveProfileAndMeta: async (profile: StudyPlanUserProfile, meta: StudyPlanCalculatedMeta) => {
    const now = new Date().toISOString()
    const plan: StudyPlanData = {
      id: `plan-${Date.now()}-${crypto.randomUUID().slice(0, 6)}`,
      profileSnapshot: profile, calculatedMeta: meta,
      globalStrategy: { planSummary: '', phaseBreakdown: [], weeklyGoals: [], mockTestSchedule: [], finalWeekStrategy: '', adjustmentRules: [], createdAt: now },
      dailyPlans: [], status: 'draft',
      progress: { generatedDays: 0, totalDays: meta.totalDays, percentage: 0 },
      createdAt: now, updatedAt: now,
    }
    planMap.set(plan.id, plan)
    return plan
  },
  getPlan: async (id: string) => planMap.get(id) ?? null,
  saveGlobalStrategy: async (id: string, s: GlobalStudyStrategy) => {
    const p = planMap.get(id)
    if (p) planMap.set(id, { ...p, globalStrategy: s })
  },
  updatePlanMeta: async (id: string, c: Partial<Pick<StudyPlanData, 'status' | 'progress'>>) => {
    const p = planMap.get(id)
    if (p) planMap.set(id, { ...p, ...c })
  },
  saveDailyPlans: async (id: string, days: DailyPlanItem[]) => {
    const now = new Date().toISOString()
    const updated = days.map(d => ({ ...d, createdAt: d.createdAt || now, updatedAt: now }))
    const p = planMap.get(id)
    if (p) {
      const merged = p.dailyPlans.filter(e => !updated.some(u => u.dayNumber === e.dayNumber))
      merged.push(...updated)
      merged.sort((a, b) => a.dayNumber - b.dayNumber)
      planMap.set(id, { ...p, dailyPlans: merged })
    }
    return updated
  },
  getDailyPlans: async (id: string) => planMap.get(id)?.dailyPlans ?? [],
  deletePlan: async (id: string) => { planMap.delete(id) },
}))

vi.mock('../storage/studyPlanStore', () => ({
  StudyPlanStore: storeMock,
  destroyDb: async () => {},
}))

import { generateDailyPlanChunk } from '../services/dailyPlanService'
import { generateGlobalStudyStrategy } from '../services/globalStrategyService'
import { generateStudyPlan, continueGeneration, deletePlan, getGenerationState } from '../orchestrator'

const profile: StudyPlanUserProfile = {
  currentBand: 5.5, targetBand: 7.0, examDate: '2026-01-10',
  dailyStudyMinutes: 60,
  preferredStudyDays: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
  restDays: [], weakSkills: ['Reading', 'Writing'], strongSkills: ['Speaking'],
  mainFocusSkills: ['Listening'], studyIntensity: 'moderate',
  preferredLanguage: 'english', includeMockTests: false,
  includeVocabularyReview: true, includeGrammarReview: true,
  includeWeeklyProgressReview: false, includeFinalExamPreparationWeek: false,
  studyGoal: 'academic', preferredTopics: [],
}

function strategy(): GlobalStudyStrategy {
  return {
    planSummary: 'A focused plan.', phaseBreakdown: [{
      phaseName: 'Foundation', description: 'Build core skills',
      startDate: '2026-01-01', endDate: '2026-01-05', weekCount: 1,
      mainFocus: 'Foundation', targetSkill: 'all',
      weeklyGoals: [{ weekNumber: 1, startDate: '2026-01-01', endDate: '2026-01-05', focusArea: 'F', goal: 'Build core skills', keyActivities: ['Activity'], mockTestPlanned: false }],
    }],
    weeklyGoals: [{ weekNumber: 1, startDate: '2026-01-01', endDate: '2026-01-05', focusArea: 'F', goal: 'Build core skills', keyActivities: ['Activity'], mockTestPlanned: false }],
    mockTestSchedule: [], finalWeekStrategy: 'Review.',
    adjustmentRules: ['Adjust.'], createdAt: '2026-01-01T00:00:00.000Z',
  }
}

function day(n: number, date: string, planId = 'p'): DailyPlanItem {
  const now = '2026-01-01T00:00:00.000Z'
  return {
    id: `d${n}`, planId, date, dayNumber: n, weekNumber: Math.ceil(n / 7),
    phaseName: 'Foundation', mainGoal: `Day ${n}`,
    listeningTask: { id: `l${n}`, skill: 'Listening', title: 'Listen', description: '', estimatedMinutes: 20, category: 'Listening', isCompleted: false, notes: '' },
    readingTask: null, writingTask: null, speakingTask: null,
    vocabularyTask: null, grammarTask: null, reviewTask: null,
    optionalTasks: [], estimatedTotalMinutes: 20,
    priority: 'medium', difficulty: 'medium', status: 'not-started',
    aiTutorNote: '', completionChecklist: [], createdAt: now, updatedAt: now,
  }
}

beforeEach(() => {
  planMap.clear()
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'))
})

afterEach(() => {
  vi.useRealTimers()
})

describe('generateStudyPlan', () => {
  it('fails when AI config returns null', async () => {
    const r = await generateStudyPlan({ profile, getConfig: () => null })
    expect(r.error).toBeTruthy()
    expect(r.state.status).toBe('failed')
  })

  it('fails when strategy generation errors', async () => {
    vi.mocked(generateGlobalStudyStrategy).mockResolvedValue({ data: null, error: 'Strategy failed' })
    const r = await generateStudyPlan({ profile, getConfig: () => ({ apiKey: 'k', baseUrl: 'u', model: 'm' }) })
    expect(r.error).toContain('Strategy failed')
    expect(r.state.status).toBe('failed')
  })

  it('fails after 3 chunk retries', async () => {
    vi.mocked(generateGlobalStudyStrategy).mockResolvedValue({ data: strategy(), error: null })
    vi.mocked(generateDailyPlanChunk).mockResolvedValue({ data: null, error: 'API error' })

    const r = await generateStudyPlan({
      profile: { ...profile, examDate: '2026-01-04' },
      getConfig: () => ({ apiKey: 'k', baseUrl: 'u', model: 'm' }),
      chunkSize: 10,
    })
    expect(r.state.status).toBe('failed')
    expect(r.error).toContain('3 retries')
    expect(generateDailyPlanChunk).toHaveBeenCalledTimes(3)
  })

  it('handles cancellation via abort signal', async () => {
    vi.mocked(generateGlobalStudyStrategy).mockResolvedValue({ data: strategy(), error: null })
    const ac = new AbortController()
    vi.mocked(generateDailyPlanChunk).mockImplementation(async () => {
      ac.abort()
      return { data: [day(1, '2026-01-01')], error: null }
    })

    const r = await generateStudyPlan({
      profile: { ...profile, examDate: '2026-01-04' },
      getConfig: () => ({ apiKey: 'k', baseUrl: 'u', model: 'm' }),
      signal: ac.signal, chunkSize: 10,
    })
    expect(r.state.status).toBe('cancelled')
    expect(r.error).toContain('cancelled')
  })

  it('calls onProgress', async () => {
    vi.mocked(generateGlobalStudyStrategy).mockResolvedValue({ data: strategy(), error: null })
    vi.mocked(generateDailyPlanChunk).mockResolvedValue({
      data: [day(1, '2026-01-01'), day(2, '2026-01-02'), day(3, '2026-01-03'), day(4, '2026-01-04')],
      error: null,
    })

    const calls: GenerationProgress[] = []
    const r = await generateStudyPlan({
      profile: { ...profile, examDate: '2026-01-04' },
      getConfig: () => ({ apiKey: 'k', baseUrl: 'u', model: 'm' }),
      onProgress: (p) => calls.push(p), chunkSize: 10,
    })
    expect(calls.length).toBeGreaterThan(0)
    expect(calls[0].step).toBe('creating-strategy')
    expect(r.plan?.dailyPlans).toHaveLength(4)
  })
})

describe('continueGeneration', () => {
  it('returns error for non-existent plan', async () => {
    const r = await continueGeneration('nonexistent', () => ({ apiKey: 'k', baseUrl: 'u', model: 'm' }))
    expect(r.plan).toBeNull()
    expect(r.error).toContain('not found')
  })
})

describe('deletePlan', () => {
  it('deletes a plan', async () => {
    const plan = await storeMock.saveProfileAndMeta(profile, {
      today: '2026-01-01', examDate: '2026-01-04', totalDays: 4, studyDays: 4,
      restDaysCount: 0, totalWeeks: 1, finalReviewPeriodDays: 0,
      mockTestSchedule: [], skillPriority: ['Listening'],
    })
    await expect(deletePlan(plan.id)).resolves.toBeUndefined()
  })

  it('does not throw for non-existent plan', async () => {
    await expect(deletePlan('nonexistent')).resolves.toBeUndefined()
  })
})

describe('getGenerationState', () => {
  it('returns null for non-existent plan', async () => {
    expect(await getGenerationState('nonexistent')).toBeNull()
  })

  it('returns state for existing plan', async () => {
    const plan = await storeMock.saveProfileAndMeta(profile, {
      today: '2026-01-01', examDate: '2026-01-04', totalDays: 4, studyDays: 4,
      restDaysCount: 0, totalWeeks: 1, finalReviewPeriodDays: 0,
      mockTestSchedule: [], skillPriority: ['Listening'],
    })
    await storeMock.saveDailyPlans(plan.id, [day(1, '2026-01-01', plan.id), day(2, '2026-01-02', plan.id)])
    const state = await getGenerationState(plan.id)
    expect(state).not.toBeNull()
    expect(state!.dailyPlans).toHaveLength(2)
  })
})
