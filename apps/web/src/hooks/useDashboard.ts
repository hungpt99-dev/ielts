import { useState, useEffect, useCallback } from 'react'
import type { DashboardData, WeeklyStudyDay, TaskEntry } from '../models'
import { DatabaseService } from '../services/storage/Database'
import type {
  ReadingSession, ListeningSession, WritingSession, SpeakingSession,
  VocabReviewEntry,
} from '../models'

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
): number {
  const readingHours = reading.reduce((s, r) => s + (r.timeSpentMinutes || 0), 0)
  const listeningHours = listening.reduce((s, l) => s + (l.durationMinutes || 0), 0)
  const writingHours = writing.reduce((s, w) => s + (w.timeSpentMinutes || 0), 0)
  const speakingHours = speaking.reduce((s, sp) => s + (sp.durationSeconds || 0) / 60, 0)
  return Math.round((readingHours + listeningHours + writingHours + speakingHours) / 60 * 10) / 10
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

export interface DashboardState {
  data: DashboardData | null
  weeklyChart: WeeklyStudyDay[]
  loading: boolean
  error: string | null
  refresh: () => void
}

export function useDashboard(): DashboardState {
  const [data, setData] = useState<DashboardData | null>(null)
  const [weeklyChart, setWeeklyChart] = useState<WeeklyStudyDay[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [tasks, reviews, reading, listening, writing, speaking] = await Promise.all([
        DatabaseService.getAll<TaskEntry>('tasks'),
        DatabaseService.getAll<VocabReviewEntry>('vocabularyReviews'),
        DatabaseService.getAll<ReadingSession>('readingSessions'),
        DatabaseService.getAll<ListeningSession>('listeningSessions'),
        DatabaseService.getAll<WritingSession>('writingSessions'),
        DatabaseService.getAll<SpeakingSession>('speakingSessions'),
      ])

      const todayTasks = await DatabaseService.getTasksForDate(getToday())
      const streak = computeStreak(tasks)
      const weeklyProgress = computeWeeklyProgress(tasks)
      const totalStudyHours = computeTotalStudyHours(reading, listening, writing, speaking)
      const dueReviews = countDueReviews(reviews)
      const todayFocus = getTodayFocus(todayTasks)
      const recentSessions = countRecentSessions(reading, listening, writing, speaking)

      const settingsRaw = localStorage.getItem('ielts-settings')
      let targetBand = 7.0
      let currentBand = 5.5
      let weakSkills: string[] = []
      if (settingsRaw) {
        try {
          const s = JSON.parse(settingsRaw)
          targetBand = s.targetBand ?? 7.0
          currentBand = s.currentBand ?? 5.5
          weakSkills = s.weakSkills ?? []
        } catch { /* ignore */ }
      }

      setData({
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
      })

      // Build weekly chart data
      const weekStart = getWeekStart(new Date())
      const weekDates = getDatesBetween(weekStart, new Date())
      const chart: WeeklyStudyDay[] = weekDates.map(date => {
        const dayTasks = tasks.filter(t => t.date.slice(0, 10) === date)
        const minutes = dayTasks.reduce((s, t) => s + (t.timeMinutes || 0), 0)
        return {
          date,
          minutes,
          tasksDone: dayTasks.filter(t => t.isDone).length,
        }
      })
      setWeeklyChart(chart)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { data, weeklyChart, loading, error, refresh: load }
}
