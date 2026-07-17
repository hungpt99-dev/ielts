import { z } from 'zod'
import { BaseRepository } from './BaseRepository'

export const planSchema = z.object({
  id: z.string(),
  version: z.number(),
  profileSnapshot: z.string(),
  planningWindowSnapshot: z.string(),
  feasibilityStatus: z.string(),
  overallProgress: z.number().default(0),
  totalTasks: z.number().default(0),
  completedTasks: z.number().default(0),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const phaseSchema = z.object({
  id: z.string(),
  planId: z.string(),
  name: z.string(),
  description: z.string(),
  order: z.number(),
  targetRange: z.string(),
  createdAt: z.string(),
})

export const weekSchema = z.object({
  id: z.string(),
  phaseId: z.string(),
  weekNumber: z.number(),
  label: z.string(),
  focus: z.string(),
  goal: z.string(),
  createdAt: z.string(),
})

export const daySchema = z.object({
  id: z.string(),
  weekId: z.string(),
  date: z.string(),
  dayNumber: z.number(),
  createdAt: z.string(),
})

export interface PlanEntry {
  id: string
  version: number
  profileSnapshot: string
  planningWindowSnapshot: string
  feasibilityStatus: string
  overallProgress: number
  totalTasks: number
  completedTasks: number
  createdAt: string
  updatedAt: string
  [key: string]: unknown
}

export interface PhaseEntry {
  id: string
  planId: string
  name: string
  description: string
  order: number
  targetRange: string
  createdAt: string
  [key: string]: unknown
}

export interface WeekEntry {
  id: string
  phaseId: string
  weekNumber: number
  label: string
  focus: string
  goal: string
  createdAt: string
  [key: string]: unknown
}

export interface DayEntry {
  id: string
  weekId: string
  date: string
  dayNumber: number
  createdAt: string
  [key: string]: unknown
}

export class PlanRepository {
  private planRepo: BaseRepository<PlanEntry>
  private phaseRepo: BaseRepository<PhaseEntry>
  private weekRepo: BaseRepository<WeekEntry>
  private dayRepo: BaseRepository<DayEntry>

  constructor() {
    this.planRepo = new BaseRepository<PlanEntry>('plans', planSchema)
    this.phaseRepo = new BaseRepository<PhaseEntry>('phases', phaseSchema)
    this.weekRepo = new BaseRepository<WeekEntry>('weeks', weekSchema)
    this.dayRepo = new BaseRepository<DayEntry>('days', daySchema)
  }

  async savePlan(plan: PlanEntry): Promise<void> {
    const entry: Omit<PlanEntry, 'id'> & { id?: string } = { ...plan }
    await this.planRepo.create(entry)
  }

  async updatePlan(id: string, changes: Partial<PlanEntry>): Promise<void> {
    await this.planRepo.update(id, changes)
  }

  async getPlan(id: string): Promise<PlanEntry | undefined> {
    return this.planRepo.findById(id)
  }

  async getAllPlans(): Promise<PlanEntry[]> {
    return this.planRepo.findAll()
  }

  async savePhase(phase: PhaseEntry): Promise<void> {
    const entry: Omit<PhaseEntry, 'id'> & { id?: string } = { ...phase }
    await this.phaseRepo.create(entry)
  }

  async getPhasesByPlanId(planId: string): Promise<PhaseEntry[]> {
    return this.phaseRepo.queryByIndex('planId', planId)
  }

  async saveWeek(week: WeekEntry): Promise<void> {
    const entry: Omit<WeekEntry, 'id'> & { id?: string } = { ...week }
    await this.weekRepo.create(entry)
  }

  async getWeeksByPhaseId(phaseId: string): Promise<WeekEntry[]> {
    return this.weekRepo.queryByIndex('phaseId', phaseId)
  }

  async saveDay(day: DayEntry): Promise<void> {
    const entry: Omit<DayEntry, 'id'> & { id?: string } = { ...day }
    await this.dayRepo.create(entry)
  }

  async getDaysByWeekId(weekId: string): Promise<DayEntry[]> {
    return this.dayRepo.queryByIndex('weekId', weekId)
  }
}
