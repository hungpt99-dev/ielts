import type { LearnerContext } from '@ielts/shared'
import type { LearningContext, SkillProgress, LearningWeakness, LearningStrength, LearningMistakeSummary, LearningVocabularySummary, LearningContentSummary, LearningAttemptSummary, LearningFeedbackSummary, LearningContextQuality } from '../../domain/entities/learning-context'
import type { IELTSSection } from '../../domain/value-objects'

const ALL_SECTIONS: IELTSSection[] = ['listening', 'reading', 'writing', 'speaking', 'grammar', 'vocabulary']

export function toSharedLearnerContext(ctx: LearningContext): LearnerContext {
  return {
    generatedAt: ctx.generatedAt,

    profile: {
      currentOverallBand: ctx.learner.currentOverallBand,
      targetOverallBand: ctx.learner.targetOverallBand,
      currentSkillBands: ctx.learner.currentSkillBands as Partial<Record<IELTSSection, number>>,
      targetSkillBands: ctx.learner.targetSkillBands as Partial<Record<IELTSSection, number>>,
      examDate: ctx.learner.examDate,
      timezone: ctx.learner.timezone,
      preferredLanguage: ctx.preferences.preferredLanguage,
      weakSkills: extractWeakSkills(ctx.weaknesses),
      strongSkills: extractStrongSkills(ctx.strengths),
    },

    exam: {
      examDate: ctx.learner.examDate ?? null,
      daysUntilExam: null,
      isUrgent: false,
      isFinalWeek: false,
    },

    studyPlan: ctx.studyPlan ? {
      active: true,
      currentPhase: null,
      currentWeek: null,
      roadmapId: ctx.studyPlan.roadmapId,
      todayTasks: [],
      nextTasks: [],
      completedTasks: 0,
      missedTasks: 0,
      weeklyStudyMinutesTarget: 0,
      weeklyStudyMinutesCompleted: 0,
      taskObjective: ctx.studyPlan.taskObjective,
      taskReason: ctx.studyPlan.taskReason,
      allocatedMinutes: ctx.studyPlan.allocatedMinutes,
    } : undefined,

    progress: {
      overallCompletionPercent: ctx.progress.overallProgress ?? 0,
      skillProgress: mapSkillProgress(ctx.progress.skillProgress),
      studyStreak: ctx.progress.learningStreak ?? 0,
      recentStudyMinutes: ctx.progress.recentStudyMinutes,
      trendBySkill: ctx.progress.trendBySkill as Partial<Record<IELTSSection, string>>,
    },

    skillStates: buildSkillStates(ctx),

    weaknesses: ctx.weaknesses.map(mapWeakness),
    strengths: ctx.strengths.map(mapStrength),

    mistakeSummary: {
      total: ctx.recentMistakes.length,
      unreviewed: ctx.recentMistakes.length,
      recentCount: ctx.recentMistakes.length,
      recurringPatterns: [],
      bySkill: aggregateBySkill(ctx.recentMistakes),
      recentMistakes: ctx.recentMistakes.map(mapRecentMistake),
    },

    vocabularySummary: {
      totalSaved: ctx.savedVocabulary.length,
      dueForReview: ctx.savedVocabulary.filter(v => v.dueForReview).length,
      mastered: ctx.savedVocabulary.filter(v => v.mastery >= 4).length,
      byTopic: aggregateVocabByTopic(ctx.savedVocabulary),
      items: ctx.savedVocabulary.map(mapVocabularyItem),
    },

    activitySummary: {
      lastActiveAt: null,
      todayStudyMinutes: 0,
      weeklyStudyMinutes: 0,
      tasksCompletedToday: 0,
    },

    recentAttempts: ctx.recentAttempts.map(mapAttempt),
    previousFeedback: ctx.previousFeedback.map(mapFeedback),
    relevantContent: ctx.relevantContent.map(mapContent),

    preferences: {
      preferredLearningMethods: ctx.preferences.preferredLearningMethods,
      preferredTaskTypes: ctx.preferences.preferredTaskTypes,
      language: ctx.preferences.preferredLanguage,
      preferredDifficulty: ctx.preferences.preferredDifficulty,
      maximumSessionMinutes: ctx.preferences.maximumSessionMinutes,
    },

    constraints: {
      items: [],
      availableMinutes: ctx.constraints.availableMinutes,
      offlineOnly: ctx.constraints.offlineOnly,
      aiAvailable: ctx.constraints.aiAvailable,
    },

    contextQuality: mapContextQuality(ctx.contextQuality),
  }
}

function extractWeakSkills(weaknesses: LearningWeakness[]): IELTSSection[] {
  return [...new Set(weaknesses.filter(w => w.severity >= 3).map(w => w.skill))]
}

function extractStrongSkills(strengths: LearningStrength[]): IELTSSection[] {
  return [...new Set(strengths.map(s => s.skill))]
}

function mapSkillProgress(sp: Partial<Record<string, SkillProgress>>): LearnerContext['progress']['skillProgress'] {
  const result: LearnerContext['progress']['skillProgress'] = {} as LearnerContext['progress']['skillProgress']
  for (const section of ALL_SECTIONS) {
    const entry = sp[section]
    if (entry) {
      result[section] = {
        currentBand: entry.currentBand,
        targetBand: entry.targetBand,
        recentAccuracy: entry.recentAccuracy,
        exercisesCompleted: entry.exercisesCompleted,
        trend: entry.trend,
      }
    }
  }
  return result
}

function buildSkillStates(ctx: LearningContext): LearnerContext['skillStates'] {
  const result: LearnerContext['skillStates'] = {} as LearnerContext['skillStates']
  for (const section of ALL_SECTIONS) {
    const progress = ctx.progress.skillProgress[section]
    const weakEntries = ctx.weaknesses.filter(w => w.skill === section)
    const strongEntries = ctx.strengths.filter(s => s.skill === section)
    result[section] = {
      skill: section,
      currentBand: progress?.currentBand,
      targetBand: progress?.targetBand,
      trend: progress?.trend ?? 'unknown',
      confidence: 1,
      priorityScore: weakEntries.length > 0 ? Math.min(weakEntries.length * 2, 10) : 0,
      frequentWeaknesses: weakEntries.map(w => w.description),
      recentStrengths: strongEntries.map(s => s.description),
      lastPracticedAt: undefined,
    }
  }
  return result
}

function mapWeakness(w: LearningWeakness): LearnerContext['weaknesses'][0] {
  return { skill: w.skill, description: w.description, severity: w.severity }
}

function mapStrength(s: LearningStrength): LearnerContext['strengths'][0] {
  return { skill: s.skill, description: s.description }
}

function mapRecentMistake(m: LearningMistakeSummary): LearnerContext['mistakeSummary']['recentMistakes'][0] {
  return { skill: m.skill, category: m.category, frequency: m.frequency, lastOccurred: m.lastOccurred }
}

function aggregateBySkill(mistakes: LearningMistakeSummary[]): Partial<Record<IELTSSection, number>> {
  const result: Partial<Record<IELTSSection, number>> = {}
  for (const m of mistakes) {
    result[m.skill] = (result[m.skill] ?? 0) + m.frequency
  }
  return result
}

function mapVocabularyItem(v: LearningVocabularySummary): LearnerContext['vocabularySummary']['items'][0] {
  return { wordId: v.wordId, word: v.word, mastery: v.mastery, dueForReview: v.dueForReview, topic: v.topic }
}

function aggregateVocabByTopic(items: LearningVocabularySummary[]): Record<string, number> {
  const result: Record<string, number> = {}
  for (const item of items) {
    const topic = item.topic ?? 'general'
    result[topic] = (result[topic] ?? 0) + 1
  }
  return result
}

function mapAttempt(a: LearningAttemptSummary): LearnerContext['recentAttempts'][0] {
  return { sessionId: a.sessionId, exerciseId: a.exerciseId, score: a.score, maximumScore: a.maximumScore, completedAt: a.completedAt }
}

function mapFeedback(f: LearningFeedbackSummary): LearnerContext['previousFeedback'][0] {
  return { attemptId: f.attemptId, overallFeedback: f.overallFeedback, strengths: f.strengths, weaknesses: f.weaknesses }
}

function mapContent(c: LearningContentSummary): LearnerContext['relevantContent'][0] {
  return { id: c.id, type: c.type, title: c.title, topic: c.topic }
}

function mapContextQuality(q: LearningContextQuality): LearnerContext['contextQuality'] {
  return { status: q.status, missingSources: q.missingSources, warnings: q.warnings }
}
