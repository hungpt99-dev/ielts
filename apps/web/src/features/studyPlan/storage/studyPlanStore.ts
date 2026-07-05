import Dexie, { type Table } from 'dexie'
import { z } from 'zod'
import type {
  StudyPlanData,
  StudyPlanStoreEntry,
  DailyPlanItem,
  GlobalStudyStrategy,
  PlanPhaseName,
  DayPriority,
  DayDifficulty,
  DailyPlanStatus,
  StudyPlanUserProfile,
  StudyPlanCalculatedMeta,
  DailyStudyTask,
} from '../types'

const DB_NAME = 'ielts-study-plan'
const DB_VERSION = 1

const ISO_STRING_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/


export class StudyPlanStoreError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message)
    this.name = 'StudyPlanStoreError'
  }
}

const isoStringSchema = z.string().regex(ISO_STRING_REGEX, 'Must be ISO 8601 string')
const dateStringSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD')

const dailyPlanStatusSchema = z.enum([
  'not-started',
  'in-progress',
  'completed',
  'skipped',
  'partially-completed',
])

const dayPrioritySchema = z.enum(['low', 'medium', 'high', 'critical'])

const dayDifficultySchema = z.enum(['easy', 'medium', 'hard'])

const planPhaseNameSchema = z.enum([
  'Foundation',
  'Skill Improvement',
  'Weakness Fixing',
  'Mock Test',
  'Final Review',
])

const studySkillSchema = z.enum([
  'Vocabulary',
  'Reading',
  'Listening',
  'Writing',
  'Speaking',
  'Grammar',
])

const taskCategorySchema = z.enum([
  'Vocabulary',
  'Reading',
  'Listening',
  'Writing Task 1',
  'Writing Task 2',
  'Speaking Part 1',
  'Speaking Part 2',
  'Speaking Part 3',
  'Grammar',
  'Mock Test',
])

export const dailyStudyTaskSchema = z.object({
  id: z.string().min(1),
  skill: studySkillSchema,
  title: z.string().min(1),
  description: z.string(),
  estimatedMinutes: z.number().int().min(1),
  category: taskCategorySchema,
  isCompleted: z.boolean(),
  notes: z.string(),
})

export const dailyPlanItemSchema = z.object({
  id: z.string().min(1),
  planId: z.string().min(1),
  date: dateStringSchema,
  dayNumber: z.number().int().min(1),
  weekNumber: z.number().int().min(1),
  phaseName: planPhaseNameSchema,
  mainGoal: z.string().min(1),
  listeningTask: dailyStudyTaskSchema.nullable(),
  readingTask: dailyStudyTaskSchema.nullable(),
  writingTask: dailyStudyTaskSchema.nullable(),
  speakingTask: dailyStudyTaskSchema.nullable(),
  vocabularyTask: dailyStudyTaskSchema.nullable(),
  grammarTask: dailyStudyTaskSchema.nullable(),
  reviewTask: dailyStudyTaskSchema.nullable(),
  optionalTasks: z.array(dailyStudyTaskSchema),
  estimatedTotalMinutes: z.number().int().min(0),
  priority: dayPrioritySchema,
  difficulty: dayDifficultySchema,
  status: dailyPlanStatusSchema,
  aiTutorNote: z.string(),
  completionChecklist: z.array(z.string()),
  createdAt: isoStringSchema,
  updatedAt: isoStringSchema,
})

const planStatusSchema = z.enum([
  'draft',
  'generating',
  'complete',
  'partial',
  'failed',
  'cancelled',
])

const dayOfWeekSchema = z.enum([
  'mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun',
])

const studyIntensitySchema = z.enum([
  'light', 'moderate', 'intense', 'intensive',
])

const preferredLanguageSchema = z.enum([
  'english', 'vietnamese', 'both',
])

const phaseWeeklyGoalSchema = z.object({
  weekNumber: z.number().int().min(1),
  startDate: dateStringSchema,
  endDate: dateStringSchema,
  focusArea: z.string().min(3),
  goal: z.string().min(5),
  keyActivities: z.array(z.string()).min(1),
  mockTestPlanned: z.boolean(),
})

const phaseBreakdownSchema = z.object({
  phaseName: planPhaseNameSchema,
  description: z.string().min(5),
  startDate: dateStringSchema,
  endDate: dateStringSchema,
  weekCount: z.number().int().min(1),
  mainFocus: z.string().min(5),
  targetSkill: z.union([studySkillSchema, z.literal('all')]),
  weeklyGoals: z.array(phaseWeeklyGoalSchema).min(1),
})

const globalStudyStrategySchema = z.object({
  planSummary: z.string().min(10),
  phaseBreakdown: z.array(phaseBreakdownSchema).min(1),
  weeklyGoals: z.array(phaseWeeklyGoalSchema).min(1),
  mockTestSchedule: z.array(z.object({
    weekNumber: z.number().int().min(1),
    date: dateStringSchema,
    focus: z.string().min(3),
  })),
  finalWeekStrategy: z.string().min(10),
  adjustmentRules: z.array(z.string().min(5)).min(1),
  createdAt: isoStringSchema,
})

const studyPlanUserProfileSchema = z.object({
  currentBand: z.number().min(0).max(9),
  targetBand: z.number().min(0).max(9),
  examDate: dateStringSchema,
  dailyStudyMinutes: z.number().int().min(1),
  preferredStudyDays: z.array(dayOfWeekSchema),
  restDays: z.array(dayOfWeekSchema),
  weakSkills: z.array(studySkillSchema),
  strongSkills: z.array(studySkillSchema),
  mainFocusSkills: z.array(studySkillSchema),
  studyIntensity: studyIntensitySchema,
  preferredLanguage: preferredLanguageSchema,
  includeMockTests: z.boolean(),
  includeVocabularyReview: z.boolean(),
  includeGrammarReview: z.boolean(),
  includeWeeklyProgressReview: z.boolean(),
  includeFinalExamPreparationWeek: z.boolean(),
  studyGoal: z.enum(['academic', 'general']),
  preferredTopics: z.array(z.string()),
})

const studyPlanCalculatedMetaSchema = z.object({
  today: dateStringSchema,
  examDate: dateStringSchema,
  totalDays: z.number().int().min(1),
  studyDays: z.number().int().min(0),
  restDaysCount: z.number().int().min(0),
  totalWeeks: z.number().int().min(1),
  finalReviewPeriodDays: z.number().int().min(0),
  mockTestSchedule: z.array(dateStringSchema),
  skillPriority: z.array(studySkillSchema),
})

export const studyPlanDataSchema = z.object({
  id: z.string().min(1),
  profileSnapshot: studyPlanUserProfileSchema,
  calculatedMeta: studyPlanCalculatedMetaSchema,
  globalStrategy: globalStudyStrategySchema,
  dailyPlans: z.array(dailyPlanItemSchema),
  status: planStatusSchema,
  progress: z.object({
    generatedDays: z.number().int().min(0),
    totalDays: z.number().int().min(0),
    percentage: z.number().min(0).max(100),
  }),
  createdAt: isoStringSchema,
  updatedAt: isoStringSchema,
})

export const studyPlanStoreEntrySchema = z.object({
  id: z.string().min(1),
  planData: studyPlanDataSchema,
  createdAt: isoStringSchema,
  updatedAt: isoStringSchema,
  version: z.number().int().min(1),
})

export interface StudyPlanDatabase {
  studyPlans: Table<StudyPlanStoreEntry, string>
  dailyPlans: Table<DailyPlanItem, string>
}

export class StudyPlanDexie extends Dexie implements StudyPlanDatabase {
  studyPlans!: Table<StudyPlanStoreEntry, string>
  dailyPlans!: Table<DailyPlanItem, string>

  constructor() {
    super(DB_NAME)
    this.version(DB_VERSION).stores({
      studyPlans: 'id, createdAt, updatedAt, version',
      dailyPlans: 'id, planId, date, dayNumber, weekNumber, phaseName, status, [planId+date], [planId+dayNumber], [planId+weekNumber], [planId+phaseName], [planId+status]',
    })
  }
}

let dbInstance: StudyPlanDexie | null = null

export function getDb(): StudyPlanDexie {
  if (!dbInstance) {
    dbInstance = new StudyPlanDexie()
  }
  return dbInstance
}

export function destroyDb(): void {
  if (dbInstance) {
    dbInstance.close()
    dbInstance = null
  }
}

async function safeStore<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    throw new StudyPlanStoreError(
      `Study plan storage operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error,
    )
  }
}

function nowISO(): string {
  return new Date().toISOString()
}

function generateId(): string {
  return crypto.randomUUID()
}

export const StudyPlanStore = {

  async savePlan(plan: StudyPlanData): Promise<StudyPlanStoreEntry> {
    return safeStore(async () => {
      const parsed = studyPlanDataSchema.parse(plan)

      const db = getDb()
      const now = nowISO()

      const existing = await db.studyPlans.get(plan.id)

      const entry: StudyPlanStoreEntry = {
        id: parsed.id,
        planData: {
          ...parsed,
          updatedAt: now,
          dailyPlans: [],
        },
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
        version: existing ? existing.version + 1 : 1,
      }

      const validated = studyPlanStoreEntrySchema.parse(entry)
      await db.studyPlans.put(validated)
      return validated
    })
  },

  async getPlan(planId: string): Promise<StudyPlanData | null> {
    return safeStore(async () => {
      const db = getDb()
      const entry = await db.studyPlans.get(planId)
      if (!entry) return null

      const dailyPlans = await db.dailyPlans
        .where('planId')
        .equals(planId)
        .sortBy('dayNumber')

      return {
        ...entry.planData,
        dailyPlans,
        updatedAt: entry.updatedAt,
      }
    })
  },

  async getAllPlans(): Promise<StudyPlanData[]> {
    return safeStore(async () => {
      const db = getDb()
      const entries = await db.studyPlans.toArray()

      const planIds = entries.map(e => e.id)
      const dailyPlanMap = new Map<string, DailyPlanItem[]>()

      if (planIds.length > 0) {
        const allDaily = await db.dailyPlans
          .where('planId')
          .anyOf(planIds)
          .toArray()

        for (const day of allDaily) {
          const existing = dailyPlanMap.get(day.planId) ?? []
          existing.push(day)
          dailyPlanMap.set(day.planId, existing)
        }
      }

      return entries.map(entry => ({
        ...entry.planData,
        dailyPlans: dailyPlanMap.get(entry.id) ?? [],
        updatedAt: entry.updatedAt,
      }))
    })
  },

  async deletePlan(planId: string): Promise<void> {
    return safeStore(async () => {
      const db = getDb()
      await db.transaction('rw', [db.studyPlans, db.dailyPlans], async () => {
        await db.dailyPlans.where('planId').equals(planId).delete()
        await db.studyPlans.delete(planId)
      })
    })
  },

  async updatePlanMeta(
    planId: string,
    changes: Partial<Pick<StudyPlanData, 'status' | 'progress'>>,
  ): Promise<void> {
    return safeStore(async () => {
      const db = getDb()
      const existing = await db.studyPlans.get(planId)
      if (!existing) {
        throw new StudyPlanStoreError(`Plan not found: ${planId}`)
      }
      const now = nowISO()
      await db.studyPlans.update(planId, {
        planData: {
          ...existing.planData,
          ...changes,
          updatedAt: now,
        },
        updatedAt: now,
        version: existing.version + 1,
      })
    })
  },

  async planExists(planId: string): Promise<boolean> {
    return safeStore(async () => {
      const db = getDb()
      const count = await db.studyPlans.where('id').equals(planId).count()
      return count > 0
    })
  },

  async saveGlobalStrategy(
    planId: string,
    strategy: GlobalStudyStrategy,
  ): Promise<void> {
    return safeStore(async () => {
      const db = getDb()
      const existing = await db.studyPlans.get(planId)
      if (!existing) {
        throw new StudyPlanStoreError(`Plan not found: ${planId}`)
      }
      const now = nowISO()
      const validated = globalStudyStrategySchema.parse(strategy)
      await db.studyPlans.update(planId, {
        planData: {
          ...existing.planData,
          globalStrategy: validated,
          updatedAt: now,
        },
        updatedAt: now,
        version: existing.version + 1,
      })
    })
  },

  async getGlobalStrategy(planId: string): Promise<GlobalStudyStrategy | null> {
    return safeStore(async () => {
      const db = getDb()
      const entry = await db.studyPlans.get(planId)
      return entry?.planData.globalStrategy ?? null
    })
  },

  async saveDailyPlan(planId: string, day: DailyPlanItem): Promise<DailyPlanItem> {
    return safeStore(async () => {
      const parsed = dailyPlanItemSchema.parse(day)
      const db = getDb()

      const existing = await db.dailyPlans.get(parsed.id)
      const now = nowISO()

      const entry: DailyPlanItem = {
        ...parsed,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      }

      await db.dailyPlans.put(entry)
      return entry
    })
  },

  async saveDailyPlans(planId: string, days: DailyPlanItem[]): Promise<DailyPlanItem[]> {
    return safeStore(async () => {
      const db = getDb()
      const now = nowISO()
      const existingDays = new Map<string, DailyPlanItem>()
      const existingById = await db.dailyPlans
        .where('planId')
        .equals(planId)
        .toArray()
      for (const d of existingById) {
        existingDays.set(d.id, d)
      }

      const entries: DailyPlanItem[] = days.map(day => {
        const existing = existingDays.get(day.id)
        const parsed = dailyPlanItemSchema.parse(day)
        return {
          ...parsed,
          createdAt: existing?.createdAt ?? now,
          updatedAt: now,
        }
      })

      await db.dailyPlans.bulkPut(entries)
      return entries
    })
  },

  async getDailyPlans(planId: string): Promise<DailyPlanItem[]> {
    return safeStore(async () => {
      const db = getDb()
      return await db.dailyPlans
        .where('planId')
        .equals(planId)
        .sortBy('dayNumber')
    })
  },

  async getDailyPlan(planId: string, date: string): Promise<DailyPlanItem | null> {
    return safeStore(async () => {
      const db = getDb()
      const results = await db.dailyPlans
        .where('[planId+date]')
        .equals([planId, date])
        .toArray()
      return results[0] ?? null
    })
  },

  async getDailyPlanByDayNumber(planId: string, dayNumber: number): Promise<DailyPlanItem | null> {
    return safeStore(async () => {
      const db = getDb()
      const results = await db.dailyPlans
        .where('[planId+dayNumber]')
        .equals([planId, dayNumber])
        .toArray()
      return results[0] ?? null
    })
  },

  async updateDailyPlanStatus(
    planId: string,
    date: string,
    status: DailyPlanStatus,
  ): Promise<void> {
    return safeStore(async () => {
      const db = getDb()
      const results = await db.dailyPlans
        .where('[planId+date]')
        .equals([planId, date])
        .toArray()

      if (results.length === 0) {
        throw new StudyPlanStoreError(`Daily plan not found for plan ${planId} on ${date}`)
      }

      const parsedStatus = dailyPlanStatusSchema.parse(status)
      const now = nowISO()
      await db.dailyPlans.update(results[0].id, {
        status: parsedStatus,
        updatedAt: now,
      })
    })
  },

  async updateDailyPlan(
    planId: string,
    date: string,
    changes: Partial<DailyPlanItem>,
  ): Promise<void> {
    return safeStore(async () => {
      const db = getDb()
      const results = await db.dailyPlans
        .where('[planId+date]')
        .equals([planId, date])
        .toArray()

      if (results.length === 0) {
        throw new StudyPlanStoreError(`Daily plan not found for plan ${planId} on ${date}`)
      }

      const now = nowISO()
      await db.dailyPlans.update(results[0].id, {
        ...changes,
        updatedAt: now,
      })
    })
  },

  async deleteDailyPlan(planId: string, date: string): Promise<void> {
    return safeStore(async () => {
      const db = getDb()
      const results = await db.dailyPlans
        .where('[planId+date]')
        .equals([planId, date])
        .toArray()

      if (results.length > 0) {
        await db.dailyPlans.delete(results[0].id)
      }
    })
  },

  async getGeneratedDayNumbers(planId: string): Promise<Set<number>> {
    return safeStore(async () => {
      const db = getDb()
      const days = await db.dailyPlans
        .where('planId')
        .equals(planId)
        .toArray()
      return new Set(days.map(d => d.dayNumber))
    })
  },

  async getMissingDayNumbers(
    planId: string,
    expectedDayNumbers: number[],
  ): Promise<number[]> {
    const generated = await this.getGeneratedDayNumbers(planId)
    return expectedDayNumbers.filter(n => !generated.has(n))
  },

  async getDaysInDateRange(
    planId: string,
    startDate: string,
    endDate: string,
  ): Promise<DailyPlanItem[]> {
    return safeStore(async () => {
      const db = getDb()
      const all = await db.dailyPlans
        .where('planId')
        .equals(planId)
        .toArray()
      return all
        .filter(d => d.date >= startDate && d.date <= endDate)
        .sort((a, b) => a.dayNumber - b.dayNumber)
    })
  },

  async getDaysByWeek(planId: string, weekNumber: number): Promise<DailyPlanItem[]> {
    return safeStore(async () => {
      const db = getDb()
      return await db.dailyPlans
        .where('[planId+weekNumber]')
        .equals([planId, weekNumber])
        .sortBy('dayNumber')
    })
  },

  async getDaysByPhase(planId: string, phaseName: PlanPhaseName): Promise<DailyPlanItem[]> {
    return safeStore(async () => {
      const db = getDb()
      const parsed = planPhaseNameSchema.parse(phaseName)
      return await db.dailyPlans
        .where('[planId+phaseName]')
        .equals([planId, parsed])
        .sortBy('dayNumber')
    })
  },

  async getDaysByStatus(planId: string, status: DailyPlanStatus): Promise<DailyPlanItem[]> {
    return safeStore(async () => {
      const db = getDb()
      const parsed = dailyPlanStatusSchema.parse(status)
      return await db.dailyPlans
        .where('[planId+status]')
        .equals([planId, parsed])
        .sortBy('dayNumber')
    })
  },

  async getIncompleteDays(planId: string): Promise<DailyPlanItem[]> {
    return safeStore(async () => {
      const db = getDb()
      const all = await db.dailyPlans
        .where('planId')
        .equals(planId)
        .toArray()
      return all
        .filter(d => d.status === 'not-started' || d.status === 'in-progress' || d.status === 'partially-completed')
        .sort((a, b) => a.dayNumber - b.dayNumber)
    })
  },

  async getDaysCountByStatus(planId: string): Promise<Record<DailyPlanStatus, number>> {
    return safeStore(async () => {
      const db = getDb()
      const all = await db.dailyPlans
        .where('planId')
        .equals(planId)
        .toArray()
      const counts: Record<string, number> = {
        'not-started': 0,
        'in-progress': 0,
        'completed': 0,
        'skipped': 0,
        'partially-completed': 0,
      }
      for (const d of all) {
        counts[d.status] = (counts[d.status] ?? 0) + 1
      }
      return counts as Record<DailyPlanStatus, number>
    })
  },

  async getGenerationProgress(planId: string): Promise<{
    generatedDays: number
    totalDays: number
    percentage: number
  } | null> {
    return safeStore(async () => {
      const db = getDb()
      const entry = await db.studyPlans.get(planId)
      if (!entry) return null

      const generatedCount = await db.dailyPlans
        .where('planId')
        .equals(planId)
        .count()

      const totalDays = entry.planData.calculatedMeta.totalDays
      const percentage = totalDays > 0 ? Math.round((generatedCount / totalDays) * 100) : 0

      return {
        generatedDays: generatedCount,
        totalDays,
        percentage,
      }
    })
  },

  async clearAll(): Promise<void> {
    return safeStore(async () => {
      const db = getDb()
      await Promise.all([
        db.studyPlans.clear(),
        db.dailyPlans.clear(),
      ])
    })
  },

  async getPlanCount(): Promise<number> {
    return safeStore(async () => {
      const db = getDb()
      return await db.studyPlans.count()
    })
  },

  async getDailyPlanCount(planId: string): Promise<number> {
    return safeStore(async () => {
      const db = getDb()
      return await db.dailyPlans
        .where('planId')
        .equals(planId)
        .count()
    })
  },

  async getLatestPlan(): Promise<StudyPlanData | null> {
    return safeStore(async () => {
      const db = getDb()
      const entry = await db.studyPlans
        .orderBy('updatedAt')
        .reverse()
        .first()

      if (!entry) return null

      const dailyPlans = await db.dailyPlans
        .where('planId')
        .equals(entry.id)
        .sortBy('dayNumber')

      return {
        ...entry.planData,
        dailyPlans,
        updatedAt: entry.updatedAt,
      }
    })
  },

  async getPlansByStatus(planStatus: StudyPlanData['status']): Promise<StudyPlanData[]> {
    return safeStore(async () => {
      const db = getDb()
      const all = await db.studyPlans.toArray()
      return all
        .filter(e => e.planData.status === planStatus)
        .map(entry => ({
          ...entry.planData,
          dailyPlans: [],
          updatedAt: entry.updatedAt,
        }))
    })
  },

  async saveProfileAndMeta(
    profile: StudyPlanUserProfile,
    calculatedMeta: StudyPlanCalculatedMeta,
  ): Promise<StudyPlanData> {
    return safeStore(async () => {
      const now = nowISO()
      const planId = generateId()

      const pSummary = 'Plan focuses on building core IELTS skills through structured daily practice and targeted improvement.'
      const pGoal = 'Build core skills and establish a consistent study routine for IELTS preparation.'
      const placeholderPhase = {
        phaseName: 'Foundation' as const,
        description: 'Build core IELTS skills through structured practice and assessment.',
        startDate: calculatedMeta.today,
        endDate: calculatedMeta.examDate,
        weekCount: calculatedMeta.totalWeeks,
        mainFocus: 'Core skill development and practice',
        targetSkill: 'all' as const,
        weeklyGoals: [{
          weekNumber: 1,
          startDate: calculatedMeta.today,
          endDate: calculatedMeta.examDate,
          focusArea: 'Core Skills',
          goal: pGoal,
          keyActivities: ['Review IELTS format', 'Practice core skills'],
          mockTestPlanned: false,
        }],
      }

      const plan: StudyPlanData = {
        id: planId,
        profileSnapshot: studyPlanUserProfileSchema.parse(profile),
        calculatedMeta: studyPlanCalculatedMetaSchema.parse(calculatedMeta),
        globalStrategy: {
          planSummary: pSummary,
          phaseBreakdown: [placeholderPhase],
          weeklyGoals: [...placeholderPhase.weeklyGoals],
          mockTestSchedule: [],
          finalWeekStrategy: 'Review all core skills and reinforce weak areas before the exam.',
          adjustmentRules: ['Follow the daily plan consistently and adjust based on progress.'],
          createdAt: now,
        },
        dailyPlans: [],
        status: 'draft',
        progress: {
          generatedDays: 0,
          totalDays: calculatedMeta.totalDays,
          percentage: 0,
        },
        createdAt: now,
        updatedAt: now,
      }

      const entry: StudyPlanStoreEntry = {
        id: planId,
        planData: studyPlanDataSchema.parse(plan),
        createdAt: now,
        updatedAt: now,
        version: 1,
      }

      await getDb().studyPlans.put(studyPlanStoreEntrySchema.parse(entry))
      return plan
    })
  },

  async deleteDailyPlans(planId: string): Promise<void> {
    return safeStore(async () => {
      const db = getDb()
      await db.dailyPlans.where('planId').equals(planId).delete()
    })
  },

  async getStats(): Promise<Record<string, number>> {
    return safeStore(async () => {
      const db = getDb()
      const [plans, dailyItems] = await Promise.all([
        db.studyPlans.count(),
        db.dailyPlans.count(),
      ])
      return {
        studyPlans: plans,
        dailyPlanItems: dailyItems,
      }
    })
  },
}

export default StudyPlanStore
