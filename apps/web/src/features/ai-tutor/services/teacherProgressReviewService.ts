import { AIProgressReviewController } from '@ielts/ai-tutor'
import type { ProgressReviewData, SkillProgress, WeaknessReport, WeakSkill, RepeatedMistake, VocabularyStatus, ReviewSummary, StudyConsistency } from '@ielts/ai-tutor'
import { callAI } from '@ielts/ai'
import { buildPersonalizationContext, analyzeWeakSkills } from '../../personalization/personalizationService'
import type { PersonalizationContext, SkillType, WeakSkillAnalysis } from '../../personalization/types'
import { loadConfiguration } from '../../configuration/storage'
import { loadAppSettings } from '../../../services/storage/SettingsStorage'
import { OPENAI_BASE_URL, DEFAULT_MODEL } from '@ielts/settings'
import type { ProviderConfig } from '@ielts/ai'
import type { AiProviderConfig as ConfigAiProviderConfig } from '../../configuration/models'

export interface SkillBreakdown {
  skill: SkillType
  accuracy: number
  mistakeCount: number
  trend: 'improving' | 'declining' | 'stable'
  daysSincePractice: number
  taskCount: number
  isWeak: boolean
}

export interface ProgressReview {
  summary: string
  improvements: string[]
  struggles: string[]
  focusAreas: string[]
  streak: number
  weeklyCompletion: number
  totalStudyHours: number
  mistakesReviewed: number
  vocabLearned: number
  weakSkills: string[]
  examCountdown: number
  skillBreakdown: SkillBreakdown[]
  weeklyTasksDone: number
  weeklyTasksTotal: number
  vocabDueReview: number
  vocabMastered: number
  mistakesUnresolved: number
  mistakesRecent: number
  todayUnfinished: number
  isExamUrgent: boolean
  skillProgress: { skill: string; status: string; sessions: number; accuracy: number; trend: string; analysis: string }[]
  studyPlanAdherence: string
  tutorFeedback: string
}

function buildProviderConfig(): ProviderConfig | null {
  try {
    const config = loadConfiguration()
    const activeProviderId = config.advanced.activeProviderId
    const activeProvider = config.advanced.providers[activeProviderId]

    const mapProvider = (p: ConfigAiProviderConfig): ProviderConfig => ({
      apiKey: p.apiKey,
      baseUrl: p.baseUrl,
      model: p.model,
      temperature: p.temperature,
      maxTokens: p.maxTokens,
    })

    if (activeProvider?.apiKey) return mapProvider(activeProvider)

    if (activeProvider?.fallbackProvider) {
      const fallback = config.advanced.providers[activeProvider.fallbackProvider]
      if (fallback?.apiKey) return mapProvider(fallback)
    }

    for (const provider of Object.values(config.advanced.providers)) {
      if (provider.apiKey) return mapProvider(provider)
    }
  } catch {}

  const settings = loadAppSettings()
  if (!settings.aiApiKey) return null
  return {
    apiKey: settings.aiApiKey,
    baseUrl: settings.aiBaseUrl || settings.aiEndpoint || OPENAI_BASE_URL,
    model: settings.aiModel || DEFAULT_MODEL,
  }
}

function toSnakeSkill(skill: SkillType): SkillProgress['skill'] {
  return skill.toLowerCase() as SkillProgress['skill']
}

function computeConsistency(ctx: PersonalizationContext): StudyConsistency {
  const streak = ctx.progress.studyStreak
  const done = ctx.progress.weeklyTasksDone
  const total = ctx.progress.weeklyTasksTotal
  const consistencyPercent = total > 0 ? Math.round((done / total) * 100) : 0

  return {
    currentStreak: streak,
    longestStreak: streak,
    totalStudyDays: streak,
    consistencyPercent,
    weeklyHistory: [],
  }
}

async function getAIReview(ctx: PersonalizationContext): Promise<{
  report: AITutorReport | null
  rawReview: RawReviewData
}> {
  const weakAnalyses = analyzeWeakSkills(ctx)
  const skillProgress: SkillProgress[] = weakAnalyses.map(a => ({
    skill: toSnakeSkill(a.skill),
    sessions: a.taskCount,
    totalMinutes: a.taskCount * 20,
    accuracy: a.accuracy,
    trend: a.trend,
  }))

  const weakSkills: WeakSkill[] = weakAnalyses
    .filter(a => a.isWeak || a.accuracy < 60)
    .map(a => ({
      skill: toSnakeSkill(a.skill),
      accuracy: a.accuracy,
      sessionCount: a.taskCount,
      severity: a.accuracy < 40 ? 'high' : a.accuracy < 70 ? 'medium' : 'low' as const,
    }))

  const repeatedMistakes: RepeatedMistake[] = ctx.mistakes.total > 0
    ? Object.entries(ctx.mistakes.bySkill).map(([skill, count]) => ({
        pattern: `Errors in ${skill}`,
        skill,
        frequency: count,
        suggestion: `Review ${skill} fundamentals and practice with targeted exercises.`,
      }))
    : []

  const weaknessReport: WeaknessReport = {
    weakSkills,
    repeatedMistakes,
    frequentMistakeCategories: Object.entries(ctx.mistakes.bySkill).map(([skill, totalMistakes]) => ({
      skill,
      totalMistakes,
      unresolvedCount: ctx.mistakes.dueForReview,
      resolvedCount: totalMistakes - ctx.mistakes.dueForReview,
    })),
  }

  const vocabularyStatus: VocabularyStatus = {
    total: ctx.vocabulary.totalWords,
    new: ctx.vocabulary.recentCount,
    learning: ctx.vocabulary.learningCount,
    reviewing: ctx.vocabulary.dueForReview,
    mastered: ctx.vocabulary.masteredCount,
  }

  const consistency = computeConsistency(ctx)
  const summary: ReviewSummary = {
    totalStudyMinutes: Math.round(ctx.progress.totalStudyHours * 60),
    totalTasksCompleted: ctx.tasks.completedCount,
    totalSessions: ctx.progress.weeklyTasksDone,
    daysActive: ctx.progress.studyStreak,
    totalVocabularySaved: ctx.vocabulary.totalWords,
    totalVocabularyMastered: ctx.vocabulary.masteredCount,
    totalMistakes: ctx.mistakes.total,
    resolvedMistakes: ctx.mistakes.total - ctx.mistakes.dueForReview,
    studyConsistency: consistency,
  }

  const recommendations: string[] = []
  if (ctx.progress.todayUnfinished > 0) {
    recommendations.push(`Complete ${ctx.progress.todayUnfinished} unfinished task${ctx.progress.todayUnfinished > 1 ? 's' : ''}`)
  }
  if (ctx.vocabulary.dueForReview > 0) {
    recommendations.push(`Review ${ctx.vocabulary.dueForReview} vocabulary word${ctx.vocabulary.dueForReview > 1 ? 's' : ''} due for spaced repetition`)
  }
  if (ctx.mistakes.dueForReview > 0) {
    recommendations.push(`Review ${ctx.mistakes.dueForReview} unresolved mistake${ctx.mistakes.dueForReview > 1 ? 's' : ''}`)
  }
  for (const skill of ctx.profile.weakSkills) {
    recommendations.push(`Practice ${skill} — your weakest skill area`)
  }
  if (ctx.exam.isUrgent) {
    recommendations.push('Take mock tests and focus on time management with exam approaching')
  }
  if (recommendations.length === 0) {
    recommendations.push('Start a new lesson to continue building your skills')
  }

  const tutorFeedback = ctx.progress.studyStreak > 0
    ? `You've studied for ${ctx.progress.studyStreak} consecutive days, showing great consistency. ${ctx.profile.weakSkills.length > 0 ? `Focus on ${ctx.profile.weakSkills.join(' and ')} to maximize your band score improvement.` : 'Keep up the balanced practice across all skills.'}`
    : 'Start your learning journey today. Every session builds momentum toward your IELTS goal.'

  const data: ProgressReviewData = {
    dateRange: {
      start: new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10),
      end: new Date().toISOString().slice(0, 10),
    },
    summary,
    skillProgress,
    weaknessReport,
    vocabularyStatus,
    progressTrend: ctx.mistakes.recent < 3 && ctx.vocabulary.dueForReview === 0 ? 'improving' : 'stable',
    recommendations,
    tutorFeedback,
  }

  const providerConfig = buildProviderConfig()

  if (!providerConfig) {
    const controller = new AIProgressReviewController(() =>
      Promise.resolve({ content: null, error: 'AI not configured' })
    )
    const result = await controller.generateReview(data)
    return {
      report: null,
      rawReview: result.success ? result.report : result.fallback,
    }
  }

  const controller = new AIProgressReviewController(
    (systemPrompt: string, userPrompt: string) =>
      callAI(systemPrompt, userPrompt, () => providerConfig!, {
        temperature: 0.7,
        maxTokens: 1500,
      }),
  )

  const result = await controller.generateReview(data)
  const report: AITutorReport | null = result.success
    ? {
        overallSummary: result.report.overallSummary,
        improvements: result.report.improvements,
        struggles: result.report.struggles,
        skillProgress: result.report.skillProgress,
        studyPlanAdherence: result.report.studyPlanAdherence,
        recommendedFocus: result.report.recommendedFocus,
        tutorFeedback: result.report.tutorFeedback,
        vocabularySummary: result.report.vocabularyReviewStatus.summary,
        vocabularyRecommendation: result.report.vocabularyReviewStatus.recommendation,
      }
    : null

  return { report, rawReview: result.fallback }
}

interface AITutorReport {
  overallSummary: string
  improvements: string[]
  struggles: string[]
  skillProgress: { skill: string; status: string; sessions: number; accuracy: number; trend: string; analysis: string }[]
  studyPlanAdherence: string
  recommendedFocus: string[]
  tutorFeedback: string
  vocabularySummary: string
  vocabularyRecommendation: string
}

interface RawReviewData {
  overallSummary: string
  improvements: string[]
  struggles: string[]
  repeatedMistakes: { pattern: string; skill: string; frequency: number; analysis: string }[]
  vocabularyReviewStatus: { summary: string; totalSaved: number; mastered: number; stillLearning: number; recommendation: string }
  skillProgress: { skill: string; status: string; sessions: number; accuracy: number; trend: string; analysis: string }[]
  studyPlanAdherence: string
  recommendedFocus: string[]
  tutorFeedback: string
}

interface AICacheEntry {
  improvements: string[]
  struggles: string[]
  skillProgress: { skill: string; status: string; sessions: number; accuracy: number; trend: string; analysis: string }[]
  studyPlanAdherence: string
  recommendedFocus: string[]
  tutorFeedback: string
  cachedAt: number
}

let aiReviewCache: AICacheEntry | null = null
const AI_CACHE_TTL = 5 * 60 * 1000

function getCachedAIReview(): AICacheEntry | null {
  if (!aiReviewCache) return null
  if (Date.now() - aiReviewCache.cachedAt > AI_CACHE_TTL) {
    aiReviewCache = null
    return null
  }
  return aiReviewCache
}

function setCachedAIReview(data: Omit<AICacheEntry, 'cachedAt'>): void {
  aiReviewCache = { ...data, cachedAt: Date.now() }
}

export function invalidateAIReviewCache(): void {
  aiReviewCache = null
}

export async function getTeacherProgressReview(ctx?: PersonalizationContext): Promise<ProgressReview> {
  const resolvedCtx = ctx ?? await buildPersonalizationContext()
  const weakSkillAnalyses = analyzeWeakSkills(resolvedCtx)

  const skillBreakdown: SkillBreakdown[] = weakSkillAnalyses.map(a => ({
    skill: a.skill,
    accuracy: a.accuracy,
    mistakeCount: a.mistakeCount,
    trend: a.trend,
    daysSincePractice: a.daysSincePractice,
    taskCount: a.taskCount,
    isWeak: resolvedCtx.profile.weakSkills.includes(a.skill),
  }))

  const cachedAI = getCachedAIReview()
  let aiReport: {
    overallSummary: string
    improvements: string[]
    struggles: string[]
    skillProgress: { skill: string; status: string; sessions: number; accuracy: number; trend: string; analysis: string }[]
    studyPlanAdherence: string
    recommendedFocus: string[]
    tutorFeedback: string
    vocabularySummary: string
    vocabularyRecommendation: string
  }

  if (cachedAI) {
    const cachedSummary = cachedAI.improvements.length > 0 || cachedAI.struggles.length > 0
      ? `Your AI Tutor has reviewed your recent progress. ${cachedAI.studyPlanAdherence ? cachedAI.studyPlanAdherence.split('.')[0] + '.' : 'Keep up the good work!'}`
      : 'Your AI Tutor has reviewed your recent progress. Keep up the good work!'

    aiReport = {
      overallSummary: cachedSummary,
      improvements: cachedAI.improvements,
      struggles: cachedAI.struggles,
      skillProgress: cachedAI.skillProgress,
      studyPlanAdherence: cachedAI.studyPlanAdherence,
      recommendedFocus: cachedAI.recommendedFocus,
      tutorFeedback: cachedAI.tutorFeedback,
      vocabularySummary: '',
      vocabularyRecommendation: '',
    }
  } else {
    const { report, rawReview } = await getAIReview(resolvedCtx)

    aiReport = report ?? {
      overallSummary: rawReview.overallSummary,
      improvements: rawReview.improvements,
      struggles: rawReview.struggles,
      skillProgress: rawReview.skillProgress,
      studyPlanAdherence: rawReview.studyPlanAdherence,
      recommendedFocus: rawReview.recommendedFocus,
      tutorFeedback: rawReview.tutorFeedback,
      vocabularySummary: rawReview.vocabularyReviewStatus.summary,
      vocabularyRecommendation: rawReview.vocabularyReviewStatus.recommendation,
    }

    setCachedAIReview({
      improvements: aiReport.improvements,
      struggles: aiReport.struggles,
      skillProgress: aiReport.skillProgress,
      studyPlanAdherence: aiReport.studyPlanAdherence,
      recommendedFocus: aiReport.recommendedFocus,
      tutorFeedback: aiReport.tutorFeedback,
    })
  }

  const focusAreas = [
    ...aiReport.recommendedFocus,
    ...(resolvedCtx.vocabulary.dueForReview > 0 ? [`Vocabulary review: ${resolvedCtx.vocabulary.dueForReview} words due`] : []),
    ...(resolvedCtx.mistakes.dueForReview > 0 ? [`Mistake review: ${resolvedCtx.mistakes.dueForReview} unresolved`] : []),
  ]

  return {
    summary: aiReport.overallSummary,
    improvements: aiReport.improvements,
    struggles: aiReport.struggles,
    focusAreas,
    streak: resolvedCtx.progress.studyStreak,
    weeklyCompletion: resolvedCtx.progress.weeklyTasksTotal > 0
      ? Math.round((resolvedCtx.progress.weeklyTasksDone / resolvedCtx.progress.weeklyTasksTotal) * 100)
      : 0,
    totalStudyHours: resolvedCtx.progress.totalStudyHours,
    mistakesReviewed: resolvedCtx.mistakes.total,
    vocabLearned: resolvedCtx.vocabulary.totalWords,
    weakSkills: resolvedCtx.profile.weakSkills,
    examCountdown: resolvedCtx.exam.countdownDays,
    skillBreakdown,
    weeklyTasksDone: resolvedCtx.progress.weeklyTasksDone,
    weeklyTasksTotal: resolvedCtx.progress.weeklyTasksTotal,
    vocabDueReview: resolvedCtx.vocabulary.dueForReview,
    vocabMastered: resolvedCtx.vocabulary.masteredCount,
    mistakesUnresolved: resolvedCtx.mistakes.dueForReview,
    mistakesRecent: resolvedCtx.mistakes.recent,
    todayUnfinished: resolvedCtx.progress.todayUnfinished,
    isExamUrgent: resolvedCtx.exam.isUrgent,
    skillProgress: aiReport.skillProgress,
    studyPlanAdherence: aiReport.studyPlanAdherence,
    tutorFeedback: aiReport.tutorFeedback,
  }
}
