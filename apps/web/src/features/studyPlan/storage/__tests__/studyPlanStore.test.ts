import 'fake-indexeddb/auto'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { StudyPlanStore, destroyDb } from '../studyPlanStore'
import type {
  StudyPlanUserProfile,
  StudyPlanCalculatedMeta,
  DailyPlanItem,
  GlobalStudyStrategy,
} from '../../types'

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
  preferredTopics: [],
}

const mockMeta: StudyPlanCalculatedMeta = {
  today: '2026-01-01',
  examDate: '2026-02-15',
  totalDays: 46,
  studyDays: 33,
  restDaysCount: 13,
  totalWeeks: 7,
  finalReviewPeriodDays: 7,
  mockTestSchedule: ['2026-01-15', '2026-01-29'],
  skillPriority: ['Listening', 'Reading', 'Writing', 'Vocabulary', 'Grammar', 'Speaking'],
}

const mockStrategy: GlobalStudyStrategy = {
  planSummary: 'A comprehensive 46-day IELTS study plan.',
  phaseBreakdown: [
    {
      phaseName: 'Foundation',
      description: 'Build core IELTS skills',
      startDate: '2026-01-01',
      endDate: '2026-01-07',
      weekCount: 1,
      mainFocus: 'Skill foundation',
      targetSkill: 'all',
      weeklyGoals: [
        {
          weekNumber: 1,
          startDate: '2026-01-01',
          endDate: '2026-01-07',
          focusArea: 'Foundation',
          goal: 'Build core skills and assess current level',
          keyActivities: ['Take diagnostic test', 'Review IELTS format'],
          mockTestPlanned: false,
        },
      ],
    },
  ],
  weeklyGoals: [
    {
      weekNumber: 1,
      startDate: '2026-01-01',
      endDate: '2026-01-07',
      focusArea: 'Foundation',
      goal: 'Build core skills and assess current level',
      keyActivities: ['Take diagnostic test', 'Review IELTS format'],
      mockTestPlanned: false,
    },
  ],
  mockTestSchedule: [
    { weekNumber: 3, date: '2026-01-15', focus: 'Full IELTS Mock Test' },
  ],
  finalWeekStrategy: 'Review all skills and practice mock tests in the final week.',
  adjustmentRules: [
    'If a day is missed, combine lighter tasks into the next study day.',
  ],
  createdAt: '2026-01-01T00:00:00.000Z',
}

function createMockDay(dayNumber: number, date: string, planId: string, overrides?: Partial<DailyPlanItem>): DailyPlanItem {
  const now = '2026-01-01T00:00:00.000Z'
  return {
    id: `day-${dayNumber}`,
    planId,
    date,
    dayNumber,
    weekNumber: Math.ceil(dayNumber / 7),
    phaseName: dayNumber <= 7 ? 'Foundation' : 'Skill Improvement',
    mainGoal: `Main goal for day ${dayNumber}`,
    listeningTask: { id: `l-${dayNumber}`, skill: 'Listening', title: 'Listen', description: 'desc', estimatedMinutes: 20, category: 'Listening', isCompleted: false, notes: '' },
    readingTask: null,
    writingTask: null,
    speakingTask: null,
    vocabularyTask: null,
    grammarTask: null,
    reviewTask: null,
    optionalTasks: [],
    estimatedTotalMinutes: 20,
    priority: 'medium',
    difficulty: 'medium',
    status: 'not-started',
    aiTutorNote: '',
    completionChecklist: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

describe('StudyPlanStore', () => {
  beforeEach(async () => {
    vi.useRealTimers()
    destroyDb()
    await StudyPlanStore.clearAll()
  })

  afterEach(() => {
    destroyDb()
  })

  describe('saveProfileAndMeta', () => {
    it('creates a new plan with correct structure', async () => {
      const plan = await StudyPlanStore.saveProfileAndMeta(mockProfile, mockMeta)
      expect(plan.id).toBeTruthy()
      expect(plan.profileSnapshot).toEqual(mockProfile)
      expect(plan.calculatedMeta).toEqual(mockMeta)
      expect(plan.status).toBe('draft')
      expect(plan.globalStrategy).toBeTruthy()
      expect(plan.dailyPlans).toEqual([])
      expect(plan.createdAt).toBeTruthy()
      expect(plan.updatedAt).toBeTruthy()
    })
  })

  describe('savePlan and getPlan', () => {
    it('saves and retrieves a plan', async () => {
      const created = await StudyPlanStore.saveProfileAndMeta(mockProfile, mockMeta)
      const retrieved = await StudyPlanStore.getPlan(created.id)
      expect(retrieved).not.toBeNull()
      expect(retrieved!.id).toBe(created.id)
      expect(retrieved!.profileSnapshot.currentBand).toBe(5.5)
    })

    it('returns null for non-existent plan', async () => {
      const plan = await StudyPlanStore.getPlan('non-existent')
      expect(plan).toBeNull()
    })
  })

  describe('getAllPlans', () => {
    it('returns all plans', async () => {
      const plan1 = await StudyPlanStore.saveProfileAndMeta(mockProfile, mockMeta)
      const plan2 = await StudyPlanStore.saveProfileAndMeta(
        { ...mockProfile, currentBand: 6.0 },
        mockMeta,
      )
      const plans = await StudyPlanStore.getAllPlans()
      expect(plans.length).toBe(2)
      expect(plans.some(p => p.id === plan1.id)).toBe(true)
      expect(plans.some(p => p.id === plan2.id)).toBe(true)
    })

    it('returns empty array when no plans exist', async () => {
      const plans = await StudyPlanStore.getAllPlans()
      expect(plans).toEqual([])
    })
  })

  describe('planExists', () => {
    it('returns true for existing plan', async () => {
      const plan = await StudyPlanStore.saveProfileAndMeta(mockProfile, mockMeta)
      const exists = await StudyPlanStore.planExists(plan.id)
      expect(exists).toBe(true)
    })

    it('returns false for non-existent plan', async () => {
      const exists = await StudyPlanStore.planExists('non-existent')
      expect(exists).toBe(false)
    })
  })

  describe('updatePlanMeta', () => {
    it('updates plan status and progress', async () => {
      const plan = await StudyPlanStore.saveProfileAndMeta(mockProfile, mockMeta)
      await StudyPlanStore.updatePlanMeta(plan.id, {
        status: 'complete',
        progress: { generatedDays: 46, totalDays: 46, percentage: 100 },
      })
      const updated = await StudyPlanStore.getPlan(plan.id)
      expect(updated!.status).toBe('complete')
      expect(updated!.progress.percentage).toBe(100)
    })

    it('throws for non-existent plan', async () => {
      await expect(
        StudyPlanStore.updatePlanMeta('non-existent', { status: 'complete' }),
      ).rejects.toThrow()
    })
  })

  describe('saveGlobalStrategy', () => {
    it('saves and retrieves global strategy', async () => {
      const plan = await StudyPlanStore.saveProfileAndMeta(mockProfile, mockMeta)
      await StudyPlanStore.saveGlobalStrategy(plan.id, mockStrategy)
      const retrieved = await StudyPlanStore.getGlobalStrategy(plan.id)
      expect(retrieved).not.toBeNull()
      expect(retrieved!.planSummary).toBe(mockStrategy.planSummary)
      expect(retrieved!.phaseBreakdown).toHaveLength(1)
    })

    it('throws for non-existent plan', async () => {
      await expect(
        StudyPlanStore.saveGlobalStrategy('non-existent', mockStrategy),
      ).rejects.toThrow()
    })
  })

  describe('daily plan CRUD', () => {
    let planId: string

    beforeEach(async () => {
      const plan = await StudyPlanStore.saveProfileAndMeta(mockProfile, mockMeta)
      planId = plan.id
    })

    it('saves and retrieves a single daily plan', async () => {
      const day = createMockDay(1, '2026-01-01', planId)
      const saved = await StudyPlanStore.saveDailyPlan(planId, day)
      expect(saved.id).toBe(day.id)
      expect(saved.dayNumber).toBe(1)
      expect(saved.planId).toBe(planId)

      const retrieved = await StudyPlanStore.getDailyPlan(planId, '2026-01-01')
      expect(retrieved).not.toBeNull()
      expect(retrieved!.id).toBe(day.id)
    })

    it('returns null for non-existent daily plan', async () => {
      const day = await StudyPlanStore.getDailyPlan(planId, '2099-01-01')
      expect(day).toBeNull()
    })

    it('saves multiple daily plans at once', async () => {
      const days = [
        createMockDay(1, '2026-01-01', planId),
        createMockDay(2, '2026-01-02', planId),
        createMockDay(3, '2026-01-03', planId),
      ]
      const saved = await StudyPlanStore.saveDailyPlans(planId, days)
      expect(saved).toHaveLength(3)

      const allDays = await StudyPlanStore.getDailyPlans(planId)
      expect(allDays).toHaveLength(3)
      expect(allDays[0].dayNumber).toBe(1)
      expect(allDays[2].dayNumber).toBe(3)
    })

    it('retrieves daily plan by day number', async () => {
      const day = createMockDay(5, '2026-01-05', planId)
      await StudyPlanStore.saveDailyPlan(planId, day)
      const retrieved = await StudyPlanStore.getDailyPlanByDayNumber(planId, 5)
      expect(retrieved).not.toBeNull()
      expect(retrieved!.dayNumber).toBe(5)
    })

    it('updates daily plan status', async () => {
      const day = createMockDay(1, '2026-01-01', planId)
      await StudyPlanStore.saveDailyPlan(planId, day)
      await StudyPlanStore.updateDailyPlanStatus(planId, '2026-01-01', 'completed')
      const updated = await StudyPlanStore.getDailyPlan(planId, '2026-01-01')
      expect(updated!.status).toBe('completed')
    })

    it('updates daily plan fields', async () => {
      const day = createMockDay(1, '2026-01-01', planId)
      await StudyPlanStore.saveDailyPlan(planId, day)
      await StudyPlanStore.updateDailyPlan(planId, '2026-01-01', {
        mainGoal: 'Updated goal',
        estimatedTotalMinutes: 120,
      })
      const updated = await StudyPlanStore.getDailyPlan(planId, '2026-01-01')
      expect(updated!.mainGoal).toBe('Updated goal')
      expect(updated!.estimatedTotalMinutes).toBe(120)
    })

    it('deletes a daily plan', async () => {
      const day = createMockDay(1, '2026-01-01', planId)
      await StudyPlanStore.saveDailyPlan(planId, day)
      await StudyPlanStore.deleteDailyPlan(planId, '2026-01-01')
      const retrieved = await StudyPlanStore.getDailyPlan(planId, '2026-01-01')
      expect(retrieved).toBeNull()
    })

    it('does not throw when deleting non-existent daily plan', async () => {
      await expect(
        StudyPlanStore.deleteDailyPlan(planId, '2099-01-01'),
      ).resolves.toBeUndefined()
    })
  })

  describe('query methods', () => {
    let planId: string

    beforeEach(async () => {
      const plan = await StudyPlanStore.saveProfileAndMeta(mockProfile, mockMeta)
      planId = plan.id

      const days = [
        createMockDay(1, '2026-01-01', planId),
        createMockDay(2, '2026-01-02', planId, { status: 'in-progress' }),
        createMockDay(3, '2026-01-03', planId, { status: 'completed' }),
        createMockDay(4, '2026-01-04', planId, { status: 'skipped' }),
        createMockDay(5, '2026-01-05', planId),
        createMockDay(8, '2026-01-08', planId, {
          weekNumber: 2,
          phaseName: 'Skill Improvement',
        }),
        createMockDay(9, '2026-01-09', planId, {
          weekNumber: 2,
          phaseName: 'Skill Improvement',
          status: 'partially-completed',
        }),
      ]
      await StudyPlanStore.saveDailyPlans(planId, days)
    })

    it('getGeneratedDayNumbers returns correct set', async () => {
      const generated = await StudyPlanStore.getGeneratedDayNumbers(planId)
      expect(generated.has(1)).toBe(true)
      expect(generated.has(2)).toBe(true)
      expect(generated.has(5)).toBe(true)
      expect(generated.has(8)).toBe(true)
      expect(generated.has(99)).toBe(false)
    })

    it('getMissingDayNumbers returns missing numbers', async () => {
      const expected = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      const missing = await StudyPlanStore.getMissingDayNumbers(planId, expected)
      expect(missing).toContain(6)
      expect(missing).toContain(7)
      expect(missing).toContain(10)
      expect(missing).not.toContain(1)
    })

    it('getDaysInDateRange returns filtered results', async () => {
      const days = await StudyPlanStore.getDaysInDateRange(planId, '2026-01-02', '2026-01-04')
      expect(days).toHaveLength(3)
      expect(days[0].dayNumber).toBe(2)
      expect(days[2].dayNumber).toBe(4)
    })

    it('getDaysByWeek returns days for specific week', async () => {
      const week1 = await StudyPlanStore.getDaysByWeek(planId, 1)
      expect(week1.length).toBeGreaterThanOrEqual(1)
      expect(week1.every(d => d.weekNumber === 1)).toBe(true)

      const week2 = await StudyPlanStore.getDaysByWeek(planId, 2)
      expect(week2.length).toBeGreaterThanOrEqual(1)
      expect(week2.every(d => d.weekNumber === 2)).toBe(true)
    })

    it('getDaysByPhase returns days for specific phase', async () => {
      const foundationDays = await StudyPlanStore.getDaysByPhase(planId, 'Foundation')
      expect(foundationDays.length).toBeGreaterThanOrEqual(1)
      expect(foundationDays.every(d => d.phaseName === 'Foundation')).toBe(true)
    })

    it('getDaysByStatus returns days with given status', async () => {
      const completed = await StudyPlanStore.getDaysByStatus(planId, 'completed')
      expect(completed).toHaveLength(1)
      expect(completed[0].status).toBe('completed')

      const notStarted = await StudyPlanStore.getDaysByStatus(planId, 'not-started')
      expect(notStarted.length).toBeGreaterThanOrEqual(1)
    })

    it('getIncompleteDays returns days that are not complete/skipped', async () => {
      const incomplete = await StudyPlanStore.getIncompleteDays(planId)
      expect(incomplete.every(d => d.status !== 'completed' && d.status !== 'skipped')).toBe(true)
    })

    it('getDaysCountByStatus returns correct counts', async () => {
      const counts = await StudyPlanStore.getDaysCountByStatus(planId)
      expect(counts['not-started']).toBeGreaterThanOrEqual(1)
      expect(counts['in-progress']).toBe(1)
      expect(counts['completed']).toBe(1)
      expect(counts['skipped']).toBe(1)
      expect(counts['partially-completed']).toBe(1)
    })
  })

  describe('deletePlan', () => {
    it('deletes plan and all its daily plans', async () => {
      const plan = await StudyPlanStore.saveProfileAndMeta(mockProfile, mockMeta)
      const days = [
        createMockDay(1, '2026-01-01', plan.id),
        createMockDay(2, '2026-01-02', plan.id),
      ]
      await StudyPlanStore.saveDailyPlans(plan.id, days)

      await StudyPlanStore.deletePlan(plan.id)

      const retrieved = await StudyPlanStore.getPlan(plan.id)
      expect(retrieved).toBeNull()

      const allDays = await StudyPlanStore.getDailyPlans(plan.id)
      expect(allDays).toEqual([])
    })
  })

  describe('getGenerationProgress', () => {
    it('returns progress for existing plan', async () => {
      const plan = await StudyPlanStore.saveProfileAndMeta(mockProfile, mockMeta)
      const days = [createMockDay(1, '2026-01-01', plan.id)]
      await StudyPlanStore.saveDailyPlans(plan.id, days)

      const progress = await StudyPlanStore.getGenerationProgress(plan.id)
      expect(progress).not.toBeNull()
      expect(progress!.generatedDays).toBe(1)
      expect(progress!.totalDays).toBe(46)
    })

    it('returns null for non-existent plan', async () => {
      const progress = await StudyPlanStore.getGenerationProgress('non-existent')
      expect(progress).toBeNull()
    })
  })

  describe('getStats, getPlanCount, getDailyPlanCount', () => {
    it('returns correct counts', async () => {
      const plan = await StudyPlanStore.saveProfileAndMeta(mockProfile, mockMeta)
      await StudyPlanStore.saveDailyPlans(plan.id, [
        createMockDay(1, '2026-01-01', plan.id),
        createMockDay(2, '2026-01-02', plan.id),
      ])

      const planCount = await StudyPlanStore.getPlanCount()
      expect(planCount).toBe(1)

      const dailyCount = await StudyPlanStore.getDailyPlanCount(plan.id)
      expect(dailyCount).toBe(2)

      const stats = await StudyPlanStore.getStats()
      expect(stats.studyPlans).toBe(1)
      expect(stats.dailyPlanItems).toBe(2)
    })
  })

  describe('getLatestPlan', () => {
    it('returns the most recently updated plan', async () => {
      const plan1 = await StudyPlanStore.saveProfileAndMeta(
        { ...mockProfile, currentBand: 5.0 },
        mockMeta,
      )

      await new Promise(resolve => setTimeout(resolve, 5))

      const plan2 = await StudyPlanStore.saveProfileAndMeta(
        { ...mockProfile, currentBand: 6.0 },
        mockMeta,
      )

      const latest = await StudyPlanStore.getLatestPlan()
      expect(latest).not.toBeNull()
      expect(latest!.id).toBe(plan2.id)
    })
  })

  describe('getPlansByStatus', () => {
    it('filters plans by status', async () => {
      await StudyPlanStore.saveProfileAndMeta(mockProfile, mockMeta)

      const drafts = await StudyPlanStore.getPlansByStatus('draft')
      expect(drafts.length).toBeGreaterThanOrEqual(1)
      expect(drafts.every(p => p.status === 'draft')).toBe(true)
    })
  })

  describe('deleteDailyPlans', () => {
    it('deletes all daily plans for a plan', async () => {
      const plan = await StudyPlanStore.saveProfileAndMeta(mockProfile, mockMeta)
      await StudyPlanStore.saveDailyPlans(plan.id, [
        createMockDay(1, '2026-01-01', plan.id),
        createMockDay(2, '2026-01-02', plan.id),
      ])

      await StudyPlanStore.deleteDailyPlans(plan.id)
      const days = await StudyPlanStore.getDailyPlans(plan.id)
      expect(days).toEqual([])

      const retrieved = await StudyPlanStore.getPlan(plan.id)
      expect(retrieved).not.toBeNull()
    })
  })
})
