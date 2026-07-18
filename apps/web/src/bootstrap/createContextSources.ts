import { loadUserConfiguration } from '@ielts/settings'
import { DatabaseService } from '../services/storage/Database'
import { mapNativeLanguage } from './createAiInfrastructure'
import { STORAGE_KEYS } from '@ielts/config'

interface ContextSourceDeps {
  getLearningEngine: () => any
}

export function createExamContextSource() {
  return async () => {
    try {
      const config = loadUserConfiguration()
      const examDate = config.study.examDate ?? null
      if (!examDate) return {}
      const daysUntil = Math.ceil((new Date(examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      return { examDate, daysUntilExam: Math.max(0, daysUntil), isUrgent: daysUntil <= 30, isFinalWeek: daysUntil <= 7 }
    } catch {
      return {}
    }
  }
}

export function createRoadmapContextSource() {
  return async () => {
    try {
      const tasks = await DatabaseService.getAll<any>('tasks')
      const todayStr = new Date().toISOString().slice(0, 10)
      const todayTasks = tasks.filter((t: any) => t.date?.slice(0, 10) === todayStr)
      return {
        active: tasks.length > 0,
        currentPhase: null,
        currentWeek: null,
        todayTasks: todayTasks.map((t: any) => ({
          id: t.id,
          title: t.title ?? '',
          skill: t.category ?? 'reading',
          estimatedMinutes: t.estimatedMinutes ?? 20,
          isCompleted: !!t.isDone,
          isMissed: false,
          dueDate: t.date,
        })),
        nextTasks: [],
        completedTasks: tasks.filter((t: any) => t.isDone).length,
        missedTasks: 0,
        weeklyStudyMinutesTarget: 300,
        weeklyStudyMinutesCompleted: 0,
      }
    } catch {
      return null
    }
  }
}

export function createProgressContextSource(deps: ContextSourceDeps) {
  return async () => {
    try {
      const le = deps.getLearningEngine()
      let records: any[]
      if (le) {
        const result = await le.getOutcomes()
        records = result.status === 'success' && result.data
          ? result.data.outcomes.map((o: any) => ({ ...o, type: 'learning-outcome' }))
          : []
      } else {
        records = await DatabaseService.getAll<any>('progressRecords')
      }
      const recent = records.filter((r: any) => r.type === 'learning-outcome')
      const overall = recent.length > 0
        ? Math.round(recent.reduce((s: number, r: any) => s + (r.value ?? 0), 0) / recent.length * 100)
        : 0
      const lastActiveKey = STORAGE_KEYS.localStorage.lastActiveAt
      const stored = localStorage.getItem(lastActiveKey)
      const lastActive = stored ? new Date(stored) : new Date()
      const inactiveDays = Math.floor((Date.now() - lastActive.getTime()) / 86400000)
      const tasks = await DatabaseService.getAll<any>('tasks').catch(() => [] as any[])
      const doneTasks = tasks.filter((t: any) => t.isDone)
      const weeklyCompletionPercent = tasks.length > 0 ? Math.round((doneTasks.length / tasks.length) * 100) : 0
      const today = new Date(); today.setHours(0, 0, 0, 0)
      let studyStreak = 0
      const doneDates = new Set(
        doneTasks.filter((t: any) => t.completedAt).map((t: any) => t.completedAt!.slice(0, 10)),
      )
      for (let i = 0; i < 365; i++) {
        const d = new Date(today); d.setDate(d.getDate() - i)
        if (doneDates.has(d.toISOString().slice(0, 10))) studyStreak++; else break
      }
      return { overallCompletionPercent: overall, skillProgress: {}, weeklyCompletionPercent, studyStreak, inactiveDays, consistency: 0 }
    } catch {
      return {}
    }
  }
}

export function createSkillStatesContextSource(deps: ContextSourceDeps) {
  return async () => {
    try {
      const le = deps.getLearningEngine()
      let records: any[]
      if (le) {
        const result = await le.getOutcomes()
        records = result.status === 'success' && result.data
          ? result.data.outcomes.map((o: any) => ({ ...o, type: 'learning-outcome' }))
          : []
      } else {
        records = await DatabaseService.getAll<any>('progressRecords')
      }
      const outcomes = records.filter(
        (r: any) => r.type === 'learning-outcome' || r.type === 'learning_session_completed',
      )
      const config = loadUserConfiguration()
      const currentBand = config.study.currentBand
      const targetBand = config.study.targetBand
      const bySkill: any = {}
      for (const skill of ['listening', 'reading', 'writing', 'speaking'] as const) {
        const skillOutcomes = outcomes.filter(
          (o: any) => o.category === skill || o.metadata?.includes(skill),
        )
        const sorted = [...skillOutcomes].sort(
          (a: any, b: any) =>
            new Date(a.createdAt ?? a.date ?? 0).getTime() -
            new Date(b.createdAt ?? b.date ?? 0).getTime(),
        )
        const recentPerf = skillOutcomes.length > 0
          ? Math.round(skillOutcomes.reduce((s: number, o: any) => s + (o.value ?? 0), 0) / skillOutcomes.length)
          : undefined
        let trend: 'improving' | 'declining' | 'stable' = 'stable'
        if (sorted.length >= 4) {
          const half = Math.floor(sorted.length / 2)
          const firstHalf = sorted.slice(0, half).reduce((s: number, o: any) => s + (o.value ?? 0), 0) / half
          const secondHalf = sorted.slice(half).reduce((s: number, o: any) => s + (o.value ?? 0), 0) / (sorted.length - half)
          const diff = secondHalf - firstHalf
          if (diff > 5) trend = 'improving'
          else if (diff < -5) trend = 'declining'
        } else if (sorted.length >= 2) {
          const first = sorted[0].value ?? 0
          const last = sorted[sorted.length - 1].value ?? 0
          const diff = last - first
          if (diff > 10) trend = 'improving'
          else if (diff < -10) trend = 'declining'
        }
        bySkill[skill] = {
          skill,
          currentBand: currentBand ?? undefined,
          targetBand: targetBand ?? undefined,
          gap: (targetBand ?? 0) - (currentBand ?? 0) > 0 ? (targetBand ?? 0) - (currentBand ?? 0) : undefined,
          recentPerformance: recentPerf,
          trend,
          confidence: skillOutcomes.length > 0 ? Math.min(1, 0.3 + skillOutcomes.length * 0.1) : 0.3,
          priorityScore: 0,
          frequentWeaknesses: [],
          recentStrengths: [],
        }
      }
      return bySkill
    } catch {
      return {}
    }
  }
}

export function createMistakesContextSource(deps: ContextSourceDeps) {
  return async () => {
    try {
      const le = deps.getLearningEngine()
      let all: any[]
      if (le) {
        const result = await le.getMistakes()
        all = result.status === 'success' && result.data ? result.data.mistakes : []
      } else {
        all = await DatabaseService.getAll<any>('mistakes')
      }
      const patternCount = new Map<string, { count: number; skill: string }>()
      for (const m of all) {
        const text = m.mistake ?? m.title ?? m.pattern ?? 'unknown'
        const key = `${text}|${m.skill ?? 'general'}`
        const existing = patternCount.get(key) ?? { count: 0, skill: m.skill ?? 'general' }
        existing.count++
        patternCount.set(key, existing)
      }
      const recurringPatterns = Array.from(patternCount.entries())
        .filter(([, v]) => v.count > 1)
        .map(([k, v]) => ({
          pattern: k.split('|')[0],
          skill: v.skill,
          frequency: v.count,
        }))
      const bySkill: Record<string, number> = {}
      for (const m of all) {
        const skill = m.skill ?? 'general'
        bySkill[skill] = (bySkill[skill] ?? 0) + 1
      }
      return {
        total: all.length,
        unreviewed: all.filter((m: any) => m.status === 'new' || m.reviewStatus === 'unreviewed').length,
        recentCount: all.filter(
          (m: any) => new Date(m.createdAt || m.occurredAt) > new Date(Date.now() - 7 * 86400000),
        ).length,
        recurringPatterns,
        bySkill,
      }
    } catch {
      return { total: 0, unreviewed: 0, recentCount: 0, recurringPatterns: [], bySkill: {} }
    }
  }
}

export function createVocabularyContextSource() {
  return async () => {
    try {
      const all = await DatabaseService.getAll<any>('vocabulary')
      return {
        totalSaved: all.length,
        dueForReview: all.filter((v: any) => v.nextReviewAt && v.nextReviewAt <= new Date().toISOString()).length,
        mastered: all.filter((v: any) => v.status === 'mastered').length,
        byTopic: {},
      }
    } catch {
      return { totalSaved: 0, dueForReview: 0, mastered: 0, byTopic: {} }
    }
  }
}

export function createActivityContextSource() {
  return async () => {
    try {
      const tasks = await DatabaseService.getAll<any>('tasks')
      const todayStr = new Date().toISOString().slice(0, 10)
      const lastActiveKey = STORAGE_KEYS.localStorage.lastActiveAt
      const stored = localStorage.getItem(lastActiveKey)
      const lastActiveAt = stored || new Date().toISOString()
      if (!stored) {
        localStorage.setItem(lastActiveKey, new Date().toISOString())
      }
      return {
        lastActiveAt,
        todayStudyMinutes: 0,
        weeklyStudyMinutes: 0,
        tasksCompletedToday: tasks.filter(
          (t: any) => t.isDone && t.completedAt?.slice(0, 10) === todayStr,
        ).length,
      }
    } catch {
      return { lastActiveAt: null, todayStudyMinutes: 0, weeklyStudyMinutes: 0, tasksCompletedToday: 0 }
    }
  }
}

export function createPreferencesContextSource() {
  return async () => {
    try {
      const config = loadUserConfiguration()
      return {
        preferredMode: 'general-teacher' as const,
        language: mapNativeLanguage(config.study.nativeLanguage),
        explanationLevel: 'detailed' as const,
        correctionStyle: 'gentle' as const,
        proactiveEnabled: true,
        maxProactiveMessagesPerDay: 5,
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00',
        allowedCategories: [],
      }
    } catch {
      return {}
    }
  }
}

export function createAllContextSources(deps: ContextSourceDeps) {
  return {
    getExamContext: createExamContextSource(),
    getRoadmapContext: createRoadmapContextSource(),
    getProgress: createProgressContextSource(deps),
    getSkillStates: createSkillStatesContextSource(deps),
    getMistakes: createMistakesContextSource(deps),
    getVocabulary: createVocabularyContextSource(),
    getActivity: createActivityContextSource(),
    getPreferences: createPreferencesContextSource(),
  }
}
