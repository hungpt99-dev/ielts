import type {
  DashboardData,
  TaskEntry,
  ReadingSession,
  ListeningSession,
  WritingSession,
  SpeakingSession,
  VocabReviewEntry,
  MistakeEntry,
  VocabularyEntry,
  WeeklyStudyDay,
} from '../../models'
import { DatabaseService } from '../../services/storage/Database'
import { STORAGE_KEYS } from '@ielts/config'
import { loadRoadmap } from '../roadmap/roadmapService'

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

function getDatesBetween(start: Date, end: Date): string[] {
  const dates: string[] = []
  const current = new Date(start)
  while (current <= end) {
    dates.push(current.toISOString().slice(0, 10))
    current.setDate(current.getDate() + 1)
  }
  return dates
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

function computeTotalStudyHours(
  reading: ReadingSession[],
  listening: ListeningSession[],
  writing: WritingSession[],
  speaking: SpeakingSession[],
  tasks?: TaskEntry[],
): number {
  const readingHours = reading.reduce((s, r) => s + (r.timeSpentMinutes || 0), 0)
  const listeningHours = listening.reduce((s, l) => s + (l.durationMinutes || 0), 0)
  const writingHours = writing.reduce((s, w) => s + (w.timeSpentMinutes || 0), 0)
  const speakingHours = speaking.reduce((s, sp) => s + (sp.durationSeconds || 0) / 60, 0)
  const taskMinutes = tasks
    ? tasks.filter(t => t.isDone).reduce((s, t) => s + (t.timeMinutes || 0), 0)
    : 0
  return Math.round((readingHours + listeningHours + writingHours + speakingHours + taskMinutes) / 60 * 10) / 10
}

function countDueReviews(reviews: VocabReviewEntry[]): number {
  const today = getToday()
  return reviews.filter(r => r.nextReviewDate.slice(0, 10) <= today).length
}

function getTodayFocus(tasks: TaskEntry[]): string {
  const todayTasks = tasks.filter(t => t.date.slice(0, 10) === getToday() && !t.isDone)
  if (todayTasks.length === 0) return 'Great job! All tasks completed. Focus on review.'
  const categories = [...new Set(todayTasks.map(t => t.category))]
  return `Focus on: ${categories.slice(0, 3).join(', ')}`
}

function countRecentSessions(
  reading: ReadingSession[],
  listening: ListeningSession[],
  writing: WritingSession[],
  speaking: SpeakingSession[],
): { reading: number; listening: number; writing: number; speaking: number } {
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const since = weekAgo.toISOString()
  return {
    reading: reading.filter(s => s.createdAt >= since).length,
    listening: listening.filter(s => s.createdAt >= since).length,
    writing: writing.filter(s => s.createdAt >= since).length,
    speaking: speaking.filter(s => s.createdAt >= since).length,
  }
}

function countRecentMistakes(mistakes: MistakeEntry[]): number {
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const since = weekAgo.toISOString()
  return mistakes.filter(m => m.createdAt >= since).length
}

function getAiSuggestion(
  todayUnfinished: number,
  weakSkills: string[],
  streak: number,
  dueReviews: number,
  recentMistakes: number,
  examCountdown: number,
): string {
  if (todayUnfinished > 0) {
    return `You have ${todayUnfinished} task${todayUnfinished > 1 ? 's' : ''} to complete today. Start with the most important one.`
  }
  if (dueReviews > 0) {
    return `You have ${dueReviews} vocabulary review${dueReviews > 1 ? 's' : ''} due. Reviewing helps reinforce what you learned.`
  }
  if (weakSkills.length > 0) {
    return `Focus on your weakest skill: ${weakSkills[0]}. Consistent practice will improve your band score.`
  }
  if (recentMistakes > 0) {
    return `Review your ${recentMistakes} recent mistake${recentMistakes > 1 ? 's' : ''} to avoid repeating them.`
  }
  if (examCountdown > 0 && examCountdown <= 30) {
    return `Your exam is in ${examCountdown} days. Prioritize mock tests and weak area review.`
  }
  return 'Keep up the great work! Consistency is key to IELTS success.'
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

function getRoadmapProgress(): number {
  try {
    const roadmap = loadRoadmap()
    if (!roadmap) return 0
    return roadmap.overallProgress
  } catch (error) {
    console.error('apps/web/src/features/dashboard/dashboardService.ts error:', error);
    return 0
  }
}

export async function loadDashboardData(): Promise<{
  data: DashboardData
  weeklyChart: WeeklyStudyDay[]
}> {
  const [tasks, reviews, reading, listening, writing, speaking, mistakes, vocabulary] = await Promise.all([
    DatabaseService.getAll<TaskEntry>('tasks'),
    DatabaseService.getAll<VocabReviewEntry>('vocabularyReviews'),
    DatabaseService.getAll<ReadingSession>('readingSessions'),
    DatabaseService.getAll<ListeningSession>('listeningSessions'),
    DatabaseService.getAll<WritingSession>('writingSessions'),
    DatabaseService.getAll<SpeakingSession>('speakingSessions'),
    DatabaseService.getAll<MistakeEntry>('mistakes'),
    DatabaseService.getAll<VocabularyEntry>('vocabulary'),
  ])

  const todayTasks = await DatabaseService.getTasksForDate(getToday())
  const streak = computeStreak(tasks)
  const weeklyProgress = computeWeeklyProgress(tasks)
  const totalStudyHours = computeTotalStudyHours(reading, listening, writing, speaking, tasks)
  const dueReviews = countDueReviews(reviews)
  const todayFocus = getTodayFocus(todayTasks)
  const recentSessions = countRecentSessions(reading, listening, writing, speaking)
  const recentMistakes = countRecentMistakes(mistakes)
  const savedVocabularyCount = vocabulary.length

  const settings = (() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.localStorage.userSettings)
      return raw ? JSON.parse(raw) : {}
    } catch { return {} }
  })()
  const targetBand = settings.targetBand
  const currentBand = settings.currentBand
  const weakSkills = settings.weakSkills
  const examDate = settings.examDate
  const studyGoal = settings.studyGoal
  const dailyStudyMinutes = settings.dailyStudyMinutes
  const examCountdown = getExamCountdown(examDate)

  const todayUnfinished = todayTasks.filter(t => !t.isDone)
  const roadmapProgress = getRoadmapProgress()
  const aiSuggestion = getAiSuggestion(
    todayUnfinished.length,
    weakSkills,
    streak,
    dueReviews,
    recentMistakes,
    examCountdown,
  )

  const data: DashboardData = {
    todayTasks,
    studyStreak: streak,
    weeklyProgress,
    totalStudyHours,
    targetBand,
    currentBand,
    weakSkills,
    dueReviews,
    todayFocus,
    recentSessions,
    examDate,
    studyGoal,
    dailyStudyMinutes,
    recentMistakes,
    savedVocabularyCount,
    aiSuggestion,
    roadmapProgress,
    examCountdown,
  }

  const weekStart = getWeekStart(new Date())
  const weekDates = getDatesBetween(weekStart, new Date())
  const weeklyChart: WeeklyStudyDay[] = weekDates.map(date => {
    const dayTasks = tasks.filter(t => t.date.slice(0, 10) === date)
    const minutes = dayTasks.reduce((s, t) => s + (t.timeMinutes || 0), 0)
    return {
      date,
      minutes,
      tasksDone: dayTasks.filter(t => t.isDone).length,
    }
  })

  return { data, weeklyChart }
}
