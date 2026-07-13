import type { LearnerContext } from '@ielts/shared'
import type { LearnerStateSnapshot, MistakePattern, SkillState } from '../domain/entities/learner-context'
import type { LearnerProfile } from '../domain/entities/learner-profile'
import type { IELTSSection } from '../domain/value-objects'

type SharedRoadmapTask = NonNullable<LearnerContext['studyPlan']>['todayTasks'][number]

const ALL_SECTIONS: IELTSSection[] = ['listening', 'reading', 'writing', 'speaking', 'grammar', 'vocabulary']

export function toSharedLearnerContext(state: LearnerStateSnapshot): LearnerContext {
  return {
    generatedAt: state.generatedAt,

    profile: mapProfile(state.profile),

    exam: {
      examDate: state.exam.examDate,
      daysUntilExam: state.exam.daysUntilExam,
      isUrgent: state.exam.isUrgent,
      isFinalWeek: state.exam.isFinalWeek,
    },

    studyPlan: state.roadmap ? {
      active: state.roadmap.active,
      currentPhase: state.roadmap.currentPhase,
      currentWeek: state.roadmap.currentWeek,
      todayTasks: state.roadmap.todayTasks.map(mapRoadmapTask),
      nextTasks: state.roadmap.nextTasks.map(mapRoadmapTask),
      completedTasks: state.roadmap.completedTasks,
      missedTasks: state.roadmap.missedTasks,
      weeklyStudyMinutesTarget: state.roadmap.weeklyStudyMinutesTarget,
      weeklyStudyMinutesCompleted: state.roadmap.weeklyStudyMinutesCompleted,
    } : undefined,

    progress: {
      overallCompletionPercent: state.progress.overallCompletionPercent,
      weeklyCompletionPercent: state.progress.weeklyCompletionPercent,
      skillProgress: mapSkillProgress(state.progress.skillProgress),
      studyStreak: state.progress.studyStreak,
      inactiveDays: state.progress.inactiveDays,
      consistency: state.progress.consistency,
      trendBySkill: mapTrendBySkill(state.skillStates),
    },

    skillStates: mapSkillStates(state.skillStates),

    weaknesses: flattenWeaknesses(state.skillStates),

    strengths: flattenStrengths(state.skillStates),

    mistakeSummary: {
      total: state.mistakeSummary.total,
      unreviewed: state.mistakeSummary.unreviewed,
      recentCount: state.mistakeSummary.recentCount,
      recurringPatterns: state.mistakeSummary.recurringPatterns.map(mapMistakePattern),
      bySkill: state.mistakeSummary.bySkill,
      recentMistakes: [],
    },

    vocabularySummary: {
      totalSaved: state.vocabularySummary.totalSaved,
      dueForReview: state.vocabularySummary.dueForReview,
      mastered: state.vocabularySummary.mastered,
      byTopic: state.vocabularySummary.byTopic,
      items: [],
    },

    activitySummary: {
      lastActiveAt: state.activitySummary.lastActiveAt,
      todayStudyMinutes: state.activitySummary.todayStudyMinutes,
      weeklyStudyMinutes: state.activitySummary.weeklyStudyMinutes,
      tasksCompletedToday: state.activitySummary.tasksCompletedToday,
    },

    recentAttempts: [],
    previousFeedback: [],
    relevantContent: [],

    preferences: {
      preferredMode: state.preferences.preferredMode,
      language: state.preferences.language,
      explanationLevel: state.preferences.explanationLevel,
      correctionStyle: state.preferences.correctionStyle,
      proactiveEnabled: state.preferences.proactiveEnabled,
      maxProactiveMessagesPerDay: state.preferences.maxProactiveMessagesPerDay,
      allowedCategories: state.preferences.allowedCategories,
      preferredLearningMethods: [],
      preferredTaskTypes: [],
    },

    constraints: {
      items: state.currentConstraints.map(c => ({ type: c.type, details: c.details })),
      offlineOnly: state.currentConstraints.some(c => c.type === 'offline'),
      aiAvailable: !state.currentConstraints.some(c => c.type === 'no-ai'),
    },

    contextQuality: {
      status: state.contextQuality.status,
      missingSources: state.contextQuality.missingSources,
      staleSources: state.contextQuality.staleSources,
      warnings: state.contextQuality.warnings,
    },
  }
}

function mapProfile(p: LearnerProfile): LearnerContext['profile'] {
  return {
    currentOverallBand: p.currentOverallBand ?? undefined,
    targetOverallBand: p.targetOverallBand ?? undefined,
    currentSkillBands: (p.currentSkillBands ?? {}) as Partial<Record<IELTSSection, number>>,
    targetSkillBands: (p.targetSkillBands ?? {}) as Partial<Record<IELTSSection, number>>,
    examDate: p.examDate ?? undefined,
    examType: p.examType ?? undefined,
    timezone: p.timezone,
    preferredLanguage: p.preferredLanguage,
    studyIntensity: p.studyIntensity,
    weakSkills: p.weakSkills,
    strongSkills: p.strongSkills,
  }
}

function mapRoadmapTask(t: { id: string; title: string; skill: IELTSSection; estimatedMinutes: number; isCompleted: boolean; isMissed: boolean; dueDate: string }): SharedRoadmapTask {
  return {
    id: t.id,
    title: t.title,
    skill: t.skill,
    estimatedMinutes: t.estimatedMinutes,
    isCompleted: t.isCompleted,
    isMissed: t.isMissed,
    dueDate: t.dueDate,
  }
}

function mapSkillProgress(
  sp: Record<string, { currentBand?: number | null; targetBand?: number | null; trend?: string; exercisesCompleted?: number; accuracy?: number | null }>,
): LearnerContext['progress']['skillProgress'] {
  const result: LearnerContext['progress']['skillProgress'] = {}
  for (const section of ALL_SECTIONS) {
    const entry = sp[section]
    if (entry) {
      result[section] = {
        currentBand: entry.currentBand ?? undefined,
        targetBand: entry.targetBand ?? undefined,
        exercisesCompleted: entry.exercisesCompleted ?? 0,
        trend: entry.trend ?? 'unknown',
        recentAccuracy: entry.accuracy ?? undefined,
      }
    }
  }
  return result
}

function mapTrendBySkill(states: Record<string, SkillState>): Partial<Record<IELTSSection, string>> {
  const result: Partial<Record<IELTSSection, string>> = {}
  for (const section of ALL_SECTIONS) {
    const s = states[section]
    if (s) result[section] = s.trend
  }
  return result
}

function mapSkillStates(states: Record<string, SkillState>): LearnerContext['skillStates'] {
  const result: LearnerContext['skillStates'] = {} as LearnerContext['skillStates']
  for (const section of ALL_SECTIONS) {
    const s = states[section]
    result[section] = {
      skill: section,
      currentBand: s?.currentBand,
      targetBand: s?.targetBand,
      gap: s?.gap,
      recentPerformance: s?.recentPerformance,
      trend: s?.trend ?? 'unknown',
      confidence: s?.confidence ?? 1,
      priorityScore: s?.priorityScore ?? 0,
      frequentWeaknesses: s?.frequentWeaknesses ?? [],
      recentStrengths: s?.recentStrengths ?? [],
      lastPracticedAt: s?.lastPracticedAt,
    }
  }
  return result
}

function flattenWeaknesses(states: Record<string, SkillState>): LearnerContext['weaknesses'] {
  const result: LearnerContext['weaknesses'] = []
  for (const section of ALL_SECTIONS) {
    const s = states[section]
    if (s?.frequentWeaknesses) {
      for (const w of s.frequentWeaknesses) {
        result.push({ skill: section, description: w, severity: 3 })
      }
    }
  }
  return result
}

function flattenStrengths(states: Record<string, SkillState>): LearnerContext['strengths'] {
  const result: LearnerContext['strengths'] = []
  for (const section of ALL_SECTIONS) {
    const s = states[section]
    if (s?.recentStrengths) {
      for (const st of s.recentStrengths) {
        result.push({ skill: section, description: st })
      }
    }
  }
  return result
}

function mapMistakePattern(p: MistakePattern): LearnerContext['mistakeSummary']['recurringPatterns'][0] {
  return {
    pattern: p.pattern,
    skill: p.skill,
    frequency: p.frequency,
    examples: p.examples,
  }
}
