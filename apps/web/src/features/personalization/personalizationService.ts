import { DatabaseService } from '../../services/storage/Database'
import { loadAppSettings } from '../../services/storage/SettingsStorage'
import { loadRoadmap, getTodayTask } from '../roadmap/roadmapService'
import type { TaskEntry, VocabularyEntry, VocabReviewEntry, MistakeEntry } from '../../models'
import type {
  PersonalizationContext,
  Recommendation,
  WeakSkillAnalysis,
  SkillType,
  RecommendationReason,
} from './types'

function getToday(): string {
  return new Date().toISOString().slice(0, 10)
}

function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function generateId(): string {
  return crypto.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
}

function computeStreak(tasks: TaskEntry[]): number {
  let streak = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const doneDates = new Set(
    tasks
      .filter(t => t.isDone && t.completedAt)
      .map(t => t.completedAt!.slice(0, 10))
  )
  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    if (doneDates.has(key)) {
      streak++
    } else {
      break
    }
  }
  return streak
}

function computeWeeklyProgress(tasks: TaskEntry[]): { done: number; total: number } {
  const weekStart = getWeekStart(new Date())
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)
  const weekTasks = tasks.filter(t => {
    const d = t.date.slice(0, 10)
    return d >= weekStart.toISOString().slice(0, 10) && d <= weekEnd.toISOString().slice(0, 10)
  })
  return {
    done: weekTasks.filter(t => t.isDone).length,
    total: weekTasks.length,
  }
}

function countDueReviews(reviews: VocabReviewEntry[]): number {
  const today = getToday()
  return reviews.filter(r => r.nextReviewDate.slice(0, 10) <= today).length
}

function getExamCountdown(examDate: string): number {
  if (!examDate) return 0
  const exam = new Date(examDate.slice(0, 10) + 'T00:00:00.000Z')
  if (isNaN(exam.getTime())) return 0
  const now = new Date()
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const diff = exam.getTime() - today.getTime()
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
}

const SKILL_TYPES: SkillType[] = ['Vocabulary', 'Reading', 'Listening', 'Writing', 'Speaking', 'Grammar']

export async function buildPersonalizationContext(): Promise<PersonalizationContext> {
  const settings = loadAppSettings()

  const [tasks, reviews, mistakes, vocabulary] = await Promise.all([
    DatabaseService.getAll<TaskEntry>('tasks'),
    DatabaseService.getAll<VocabReviewEntry>('vocabularyReviews'),
    DatabaseService.getAll<MistakeEntry>('mistakes'),
    DatabaseService.getAll<VocabularyEntry>('vocabulary'),
  ])

  const todayStr = getToday()
  const todayTasks = tasks.filter(t => t.date.slice(0, 10) === todayStr)
  const pendingTasks = tasks.filter(t => !t.isDone)
  const streak = computeStreak(tasks)
  const weeklyProgress = computeWeeklyProgress(tasks)
  const dueReviews = countDueReviews(reviews)
  const completedTasks = tasks.filter(t => t.isDone)
  const totalStudyHours = tasks.reduce((s, t) => s + (t.timeMinutes || 0), 0) / 60

  const mistakesBySkill = mistakes.reduce<Record<string, number>>((acc, m) => {
    const skill = capitalizeSkill(m.skill)
    acc[skill] = (acc[skill] || 0) + 1
    return acc
  }, {})

  const recentMistakes = mistakes.filter(m => {
    const d = new Date(m.date)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return d >= weekAgo
  }).length

  const mistakesDueForReview = mistakes.filter(m => {
    if (m.status === 'resolved') return false
    if (m.status === 'new') return true
    const daysSinceUpdate = Math.floor(
      (Date.now() - new Date(m.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
    )
    return daysSinceUpdate >= 1
  }).length

  const topMistakeSkill = Object.entries(mistakesBySkill)
    .sort((a, b) => b[1] - a[1])[0]?.[0] as SkillType | null ?? null

  const examDate = settings.examDate
  const countdownDays = getExamCountdown(examDate)

  const roadmap = loadRoadmap()
  const todayRoadmapTask = roadmap ? getTodayTask(roadmap) : null
  const currentPhase = roadmap?.phases[roadmap.currentPhaseIndex]

  return {
    profile: {
      targetBand: settings.targetBand,
      currentBand: settings.currentBand,
      examDate: settings.examDate,
      dailyStudyMinutes: settings.dailyStudyMinutes,
      weakSkills: settings.weakSkills as SkillType[],
      studyGoal: settings.studyGoal,
      preferredSchedule: settings.preferredSchedule as PersonalizationContext['profile']['preferredSchedule'],
    },
    progress: {
      studyStreak: streak,
      roadmapProgress: roadmap?.overallProgress ?? 0,
      todayUnfinished: todayTasks.filter(t => !t.isDone).length,
      weeklyTasksDone: weeklyProgress.done,
      weeklyTasksTotal: weeklyProgress.total,
      totalStudyHours: Math.round(totalStudyHours * 10) / 10,
    },
    vocabulary: {
      totalWords: vocabulary.length,
      dueForReview: dueReviews,
      recentCount: vocabulary.filter(v => {
        const d = new Date(v.createdAt)
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        return d >= weekAgo
      }).length,
      masteredCount: reviews.filter(r => r.interval >= 21 && r.repetitions >= 5).length,
      learningCount: reviews.filter(r => r.interval < 21 || r.repetitions < 5).length,
    },
    mistakes: {
      total: mistakes.length,
      recent: recentMistakes,
      bySkill: mistakesBySkill,
      dueForReview: mistakesDueForReview,
      topSkill: topMistakeSkill,
    },
    exam: {
      countdownDays,
      isUrgent: countdownDays > 0 && countdownDays <= 30,
      isExamSoon: countdownDays > 0 && countdownDays <= 7,
    },
    tasks: {
      today: todayTasks,
      pending: pendingTasks,
      completedCount: completedTasks.length,
    },
    roadmap: {
      exists: roadmap !== null,
      currentPhaseName: currentPhase?.name ?? '',
      phaseProgress: roadmap?.overallProgress ?? 0,
      currentSkillFocus: todayRoadmapTask?.skillFocus ?? null,
      nextTaskTitle: todayRoadmapTask?.objective ?? null,
      nextTaskSkill: (todayRoadmapTask?.skillFocus as SkillType) ?? null,
    },
  }
}

export function analyzeWeakSkills(ctx: PersonalizationContext): WeakSkillAnalysis[] {
  const analyses: WeakSkillAnalysis[] = []

  for (const skill of SKILL_TYPES) {
    const skillMistakes = ctx.mistakes.bySkill[skill] ?? 0
    const isWeakSetting = ctx.profile.weakSkills.includes(skill)
    const skillTasks = ctx.tasks.pending.filter(t => t.category === skill)
    const accuracy = skillTasks.length > 0
      ? 100 - Math.min(100, skillMistakes * 15)
      : isWeakSetting ? 40 : 70

    const daysSincePractice = ctx.tasks.completedCount > 0 ? 0 : 7

    analyses.push({
      skill,
      accuracy,
      mistakeCount: skillMistakes,
      trend: isWeakSetting ? 'declining' : 'stable',
      daysSincePractice,
      taskCount: skillTasks.length,
    })
  }

  return analyses.sort((a, b) => {
    const weakPriority = (s: SkillType) => ctx.profile.weakSkills.includes(s) ? 0 : 1
    const aWeak = weakPriority(a.skill)
    const bWeak = weakPriority(b.skill)
    if (aWeak !== bWeak) return aWeak - bWeak
    return b.mistakeCount - a.mistakeCount
  })
}

export function getReasonLabel(reason: RecommendationReason): string {
  const labels: Record<RecommendationReason, string> = {
    weak_skill: 'Weak skill needs attention',
    exam_urgency: 'Exam is approaching',
    missed_task: 'Missed from previous day',
    due_review: 'Items due for review',
    low_accuracy: 'Low accuracy detected',
    streak_maintenance: 'Keep your streak going',
    skill_balance: 'Balance your skill practice',
    spaced_repetition: 'Time to review for retention',
    roadmap_next: 'Next in your roadmap',
    recommended_content: 'Recommended for your level',
  }
  return labels[reason]
}

export function generateRecommendations(ctx: PersonalizationContext): Recommendation[] {
  const recommendations: Recommendation[] = []
  const weakSkills = analyzeWeakSkills(ctx)
  const weakSkillPriority = weakSkills.filter(w => ctx.profile.weakSkills.includes(w.skill))

  if (ctx.exam.isUrgent && weakSkillPriority.length > 0) {
    const topWeak = weakSkillPriority[0]
    recommendations.push({
      id: generateId(),
      type: 'practice',
      skill: topWeak.skill,
      title: `Urgent: Improve ${topWeak.skill}`,
      description: `Your exam is in ${ctx.exam.countdownDays} days. Focus on your weakest skill: ${topWeak.skill}.`,
      reason: 'exam_urgency',
      priority: 'high',
      estimatedMinutes: Math.min(30, ctx.profile.dailyStudyMinutes),
      actionLabel: `Practice ${topWeak.skill}`,
      actionPath: `/${topWeak.skill.toLowerCase()}`,
    })
  }

  if (ctx.progress.todayUnfinished > 0) {
    recommendations.push({
      id: generateId(),
      type: 'task',
      skill: 'Reading' as SkillType,
      title: 'Complete Today\'s Tasks',
      description: `You have ${ctx.progress.todayUnfinished} unfinished task${ctx.progress.todayUnfinished > 1 ? 's' : ''} for today. Finish them to stay on track.`,
      reason: 'roadmap_next',
      priority: 'high',
      estimatedMinutes: 15 * ctx.progress.todayUnfinished,
      actionLabel: 'Open Today\'s Tasks',
      actionPath: '/plan',
    })
  }

  if (ctx.vocabulary.dueForReview > 0) {
    recommendations.push({
      id: generateId(),
      type: 'review',
      skill: 'Vocabulary',
      title: `Review ${ctx.vocabulary.dueForReview} Vocabulary Word${ctx.vocabulary.dueForReview > 1 ? 's' : ''}`,
      description: `You have ${ctx.vocabulary.dueForReview} word${ctx.vocabulary.dueForReview > 1 ? 's' : ''} due for review. Spaced repetition helps long-term retention.`,
      reason: 'due_review',
      priority: ctx.vocabulary.dueForReview > 10 ? 'high' : 'medium',
      estimatedMinutes: Math.min(15, ctx.vocabulary.dueForReview * 2),
      actionLabel: 'Review Now',
      actionPath: '/vocabulary',
    })
  }

  if (ctx.mistakes.dueForReview > 0) {
    recommendations.push({
      id: generateId(),
      type: 'review',
      skill: ctx.mistakes.topSkill ?? 'Grammar',
      title: `Review ${ctx.mistakes.dueForReview} Mistake${ctx.mistakes.dueForReview > 1 ? 's' : ''}`,
      description: ctx.mistakes.topSkill
        ? `You have ${ctx.mistakes.dueForReview} mistake${ctx.mistakes.dueForReview > 1 ? 's' : ''} to review, mostly in ${ctx.mistakes.topSkill}.`
        : `You have ${ctx.mistakes.dueForReview} mistake${ctx.mistakes.dueForReview > 1 ? 's' : ''} due for review.`,
      reason: 'low_accuracy',
      priority: ctx.mistakes.dueForReview > 5 ? 'high' : 'medium',
      estimatedMinutes: Math.min(10, ctx.mistakes.dueForReview * 2),
      actionLabel: 'Open Mistakes',
      actionPath: '/mistakes',
    })
  }

  if (weakSkillPriority.length > 0) {
    const weakSkill = weakSkillPriority[0]
    if (!recommendations.some(r => r.skill === weakSkill.skill && r.reason === 'weak_skill')) {
      recommendations.push({
        id: generateId(),
        type: 'practice',
        skill: weakSkill.skill,
        title: `Practice ${weakSkill.skill}`,
        description: `${weakSkill.skill} is marked as your weak area. Targeted practice will help improve your band score.`,
        reason: 'weak_skill',
        priority: 'medium',
        estimatedMinutes: 20,
        actionLabel: `Practice ${weakSkill.skill}`,
        actionPath: `/${weakSkill.skill.toLowerCase()}`,
      })
    }
  }

  if (ctx.progress.studyStreak > 0 && ctx.progress.studyStreak % 7 === 0) {
    recommendations.push({
      id: generateId(),
      type: 'practice',
      skill: 'Reading' as SkillType,
      title: `🔥 ${ctx.progress.studyStreak}-Day Streak! Keep Going`,
      description: `You've studied for ${ctx.progress.studyStreak} consecutive days. Maintain your momentum.`,
      reason: 'streak_maintenance',
      priority: 'low',
      estimatedMinutes: 10,
      actionLabel: 'Continue Learning',
      actionPath: '/dashboard',
    })
  }

  if (ctx.vocabulary.recentCount > 0) {
    recommendations.push({
      id: generateId(),
      type: 'exercise',
      skill: 'Vocabulary',
      title: `Practice ${Math.min(ctx.vocabulary.recentCount, 5)} New Word${ctx.vocabulary.recentCount > 1 ? 's' : ''}`,
      description: `You saved ${ctx.vocabulary.recentCount} new word${ctx.vocabulary.recentCount > 1 ? 's' : ''} recently. Practice them with exercises.`,
      reason: 'spaced_repetition',
      priority: 'medium',
      estimatedMinutes: 10,
      actionLabel: 'Practice Now',
      actionPath: '/vocabulary',
    })
  }

  if (ctx.roadmap.currentSkillFocus && ctx.progress.todayUnfinished === 0) {
    recommendations.push({
      id: generateId(),
      type: 'content',
      skill: ctx.roadmap.currentSkillFocus as SkillType,
      title: `Study ${ctx.roadmap.currentSkillFocus}`,
      description: `Your roadmap focus today is ${ctx.roadmap.currentSkillFocus}. Explore related lessons and exercises.`,
      reason: 'roadmap_next',
      priority: 'medium',
      estimatedMinutes: 20,
      actionLabel: `Open ${ctx.roadmap.currentSkillFocus}`,
      actionPath: `/${ctx.roadmap.currentSkillFocus.toLowerCase()}`,
    })
  }

  if (recommendations.length === 0) {
    recommendations.push({
      id: generateId(),
      type: 'content',
      skill: 'Reading',
      title: 'Daily IELTS Reading Practice',
      description: 'No pending tasks or reviews. Take a short reading exercise to maintain your skills.',
      reason: 'recommended_content',
      priority: 'low',
      estimatedMinutes: 15,
      actionLabel: 'Start Reading',
      actionPath: '/reading',
    })
  }

  return recommendations.sort((a, b) => {
    const priorityOrder: Record<RecommendationPriority, number> = { high: 0, medium: 1, low: 2 }
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })
}

export function getTodayRecommendation(ctx: PersonalizationContext): string {
  const parts: string[] = []

  if (ctx.progress.todayUnfinished > 0) {
    const taskCount = ctx.progress.todayUnfinished
    const categories = [...new Set(ctx.tasks.today.map(t => t.category))]
    parts.push(`Complete ${taskCount} task${taskCount > 1 ? 's' : ''} today (${categories.slice(0, 3).join(', ')})`)
  }

  if (ctx.vocabulary.dueForReview > 0) {
    parts.push(`Review ${ctx.vocabulary.dueForReview} vocabulary word${ctx.vocabulary.dueForReview > 1 ? 's' : ''}`)
  }

  if (ctx.exam.isUrgent) {
    parts.push(`Exam in ${ctx.exam.countdownDays} days — focus on weak areas`)
  }

  if (ctx.progress.studyStreak > 0) {
    parts.push(`Maintain your ${ctx.progress.studyStreak}-day streak`)
  }

  const weakSkills = ctx.profile.weakSkills
  if (weakSkills.length > 0 && !parts.some(p => p.toLowerCase().includes(weakSkills[0].toLowerCase()))) {
    parts.push(`Practice ${weakSkills[0]} — your weakest skill`)
  }

  if (parts.length === 0) {
    return 'Take a short IELTS reading exercise or learn 5 new vocabulary words.'
  }

  return parts.join('. ') + '.'
}

export async function getAITutorContext(ctx?: PersonalizationContext): Promise<string> {
  const context = ctx ?? await buildPersonalizationContext()
  const weakSkills = analyzeWeakSkills(context)
  const topWeak = weakSkills.filter(w => context.profile.weakSkills.includes(w.skill))

  const lines: string[] = [
    `User IELTS goal: ${context.profile.studyGoal === 'academic' ? 'Academic' : 'General'}`,
    `Current band: ${context.profile.currentBand}, Target band: ${context.profile.targetBand}`,
    `Days until exam: ${context.exam.countdownDays > 0 ? String(context.exam.countdownDays) : 'Not set'}`,
    `Daily study time: ${context.profile.dailyStudyMinutes} minutes`,
    `Study streak: ${context.progress.studyStreak} days`,
    `Vocabulary saved: ${context.vocabulary.totalWords}, Due for review: ${context.vocabulary.dueForReview}`,
    `Unresolved mistakes: ${context.mistakes.total}`,
    `Roadmap progress: ${context.progress.roadmapProgress}%`,
  ]

  if (topWeak.length > 0) {
    lines.push(`Weak skills: ${topWeak.map(w => `${w.skill} (${w.mistakeCount} mistakes)`).join(', ')}`)
  }

  if (context.tasks.todayUnfinished > 0) {
    const categories = [...new Set(context.tasks.today.map(t => t.category))]
    lines.push(`Today's unfinished tasks: ${categories.join(', ')}`)
  }

  if (context.roadmap.currentPhaseName) {
    lines.push(`Current roadmap phase: ${context.roadmap.currentPhaseName}`)
  }

  return lines.join('\n')
}

function capitalizeSkill(skill: string): string {
  if (skill === 'vocabulary') return 'Vocabulary'
  if (skill === 'grammar') return 'Grammar'
  if (skill === 'reading') return 'Reading'
  if (skill === 'listening') return 'Listening'
  if (skill === 'writing') return 'Writing'
  if (skill === 'speaking') return 'Speaking'
  return skill.charAt(0).toUpperCase() + skill.slice(1)
}
