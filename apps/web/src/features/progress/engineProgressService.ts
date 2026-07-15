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
      const [mistakesResult, outcomesResult, exercisesResult] = await Promise.all([
        engine.getMistakes().catch(() => null),
        engine.getOutcomes().catch(() => null),
        engine.getExercises().catch(() => null),
      ])

      const mistakes = mistakesResult?.status === 'success' && mistakesResult.data ? mistakesResult.data.mistakes : []
      const outcomes = outcomesResult?.status === 'success' && outcomesResult.data ? outcomesResult.data.outcomes : []

      const snapshot = await legacyCompute()
      if (mistakes.length > 0) {
        const bySkill: Record<string, number> = {}
        for (const m of mistakes) {
          const skill = m.skill || m.source?.split(' - ')[0]?.toLowerCase() || 'general'
          bySkill[skill] = (bySkill[skill] || 0) + 1
        }
        snapshot.weakSkills = Object.entries(bySkill)
          .map(([skill, count]) => ({ skill, count }))
          .sort((a, b) => b.count - a.count)
      }
      return snapshot
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
