import { getLearningEngine } from '../../services/engineBootstrap'
import {
  computeProgressSnapshot as legacyCompute,
  saveProgressSnapshot as legacySave,
  loadProgressSnapshot as legacyLoad,
} from './progressService'

export interface StudyDayEntry {
  date: string
  minutes: number
  tasksDone: number
}

export interface WeeklyProgressSummary {
  weekLabel: string
  weekId: string
  daysActive: number
  totalMinutes: number
  tasksCompleted: number
  dailyBreakdown: StudyDayEntry[]
}

export interface SkillProgressSummary {
  skill: string
  sessions: number
  totalMinutes: number
  accuracy: number
  trend: 'improving' | 'declining' | 'stable'
}

export interface MonthlySummary {
  month: string
  totalHours: number
  sessions: number
  vocabLearned: number
  mockTests: number
  avgBand: number
}

export interface ProgressSnapshot {
  version: number
  totalTasksCompleted: number
  totalStudyMinutes: number
  currentStreak: number
  longestStreak: number
  weeklyProgress: WeeklyProgressSummary[]
  skillProgress: SkillProgressSummary[]
  vocabLearned: number
  vocabReviewed: number
  monthlySummary: MonthlySummary[]
  roadmapProgress: number
  weakSkills: { skill: string; count: number }[]
  recentActivity: {
    date: string
    description: string
    type: 'task' | 'vocab' | 'session' | 'review'
  }[]
  generatedAt: string
}

export const DEFAULT_SNAPSHOT: ProgressSnapshot = {
  version: 2,
  totalTasksCompleted: 0,
  totalStudyMinutes: 0,
  currentStreak: 0,
  longestStreak: 0,
  weeklyProgress: [],
  skillProgress: [],
  vocabLearned: 0,
  vocabReviewed: 0,
  monthlySummary: [],
  roadmapProgress: 0,
  weakSkills: [],
  recentActivity: [],
  generatedAt: new Date().toISOString(),
}

export async function computeProgressSnapshot(): Promise<ProgressSnapshot> {
  const engine = getLearningEngine()
  if (engine) {
    try {
      return await legacyCompute()
    } catch (error) {
  console.error('apps/web/src/features/progress/engineProgressService.ts error:', error);
    }
  }
  return legacyCompute()
}

export function saveProgressSnapshot(snapshot: ProgressSnapshot): void {
  legacySave(snapshot as any)
}

export function loadProgressSnapshot(): ProgressSnapshot | null {
  return legacyLoad()
}
