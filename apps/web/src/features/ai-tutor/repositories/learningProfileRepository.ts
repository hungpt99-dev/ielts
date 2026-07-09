import { buildPersonalizationContext } from '../../personalization/personalizationService'
import type { PersonalizationContext, SkillType } from '../../personalization/types'

export interface RawLearningProfile {
  targetBandDisplay: string
  currentBand: number
  targetBandNum: number
  examDate: string
  examCountdown: number
  weakSkillsDisplay: string
  weakSkillsList: SkillType[]
  savedWords: number
  mistakesToReview: number
  studyStreak: number
  weeklyTasksDone: number
  weeklyTasksTotal: number
  totalStudyHours: number
  roadmapProgress: number
  dailyStudyMinutes: number
  vocabMastered: number
  vocabDueReview: number
  context: PersonalizationContext
}

export async function loadLearningProfile(): Promise<RawLearningProfile> {
  const ctx = await buildPersonalizationContext()
  return {
    targetBandDisplay: ctx.profile.targetBand > 0
      ? `Band ${ctx.profile.currentBand} → ${ctx.profile.targetBand}`
      : '',
    currentBand: ctx.profile.currentBand,
    targetBandNum: ctx.profile.targetBand,
    examDate: ctx.profile.examDate || '',
    examCountdown: ctx.exam.countdownDays,
    weakSkillsDisplay: ctx.profile.weakSkills.length > 0
      ? ctx.profile.weakSkills.join(', ')
      : 'None identified',
    weakSkillsList: ctx.profile.weakSkills,
    savedWords: ctx.vocabulary.totalWords,
    mistakesToReview: ctx.mistakes.dueForReview,
    studyStreak: ctx.progress.studyStreak,
    weeklyTasksDone: ctx.progress.weeklyTasksDone,
    weeklyTasksTotal: ctx.progress.weeklyTasksTotal,
    totalStudyHours: ctx.progress.totalStudyHours,
    roadmapProgress: ctx.progress.roadmapProgress,
    dailyStudyMinutes: ctx.profile.dailyStudyMinutes,
    vocabMastered: ctx.vocabulary.masteredCount,
    vocabDueReview: ctx.vocabulary.dueForReview,
    context: ctx,
  }
}
