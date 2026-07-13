import type {
  TaskEntry,
  ReadingSession,
  ListeningSession,
  WritingSession,
  SpeakingSession,
  VocabularyEntry,
  VocabReviewEntry,
  MistakeEntry,
  MockTestEntry,
  ProgressRecord,
  AppSettings,
} from '../../models'
import { DatabaseService } from '../../services/storage/Database'
import { loadRoadmap, recalculateProgress } from '../roadmap/roadmapService'
import { getLearningEngine } from '../../services/engineBootstrap'

const PROGRESS_SNAPSHOT_KEY = 'ielts-progress-snapshot'

function getWeekId(dateStr: string): string {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  const year = d.getFullYear()
  const start = new Date(year, 0, 1)
  const diff = d.getTime() - start.getTime()
  const week = Math.ceil((diff / 86400000 + start.getDay() + 1) / 7)
  return `${year}-W${week}`
}

function getMonthLabel(dateStr: string): string {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[d.getMonth()]} ${d.getFullYear()}`
}

function getWeekLabel(dateStr: string): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const match = dateStr.match(/^(\d{4})-W(\d{1,2})$/)
  if (match) {
    const year = parseInt(match[1], 10)
    const week = parseInt(match[2], 10)
    const jan1 = new Date(year, 0, 1)
    const days = (week - 1) * 7
    const start = new Date(jan1)
    start.setDate(jan1.getDate() + days - jan1.getDay() + 1)
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    return `${months[start.getMonth()].slice(0, 3)}${start.getDate()}-${months[end.getMonth()].slice(0, 3)}${end.getDate()}`
  }
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  const start = new Date(d)
  start.setDate(d.getDate() - d.getDay() + 1)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  return `${months[start.getMonth()].slice(0, 3)}${start.getDate()}-${months[end.getMonth()].slice(0, 3)}${end.getDate()}`
}

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

function computeStreak(tasks: TaskEntry[]): { current: number; longest: number } {
  const doneDates = new Set(
    tasks
      .filter(t => t.isDone && t.completedAt)
      .map(t => t.completedAt!.slice(0, 10))
  )
  let current = 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    if (doneDates.has(key)) {
      current++
    } else {
      break
    }
  }
  let longest = 0
  let run = 0
  const sorted = [...doneDates].sort()
  for (let i = 0; i < sorted.length; i++) {
    if (i === 0) {
      run = 1
    } else {
      const prev = new Date(sorted[i - 1])
      const curr = new Date(sorted[i])
      const diffDays = (curr.getTime() - prev.getTime()) / 86400000
      if (diffDays === 1) {
        run++
      } else {
        run = 1
      }
    }
    longest = Math.max(longest, run)
  }
  return { current, longest }
}

function computeWeeklyProgressSummary(tasks: TaskEntry[]): WeeklyProgressSummary[] {
  const now = new Date()
  const eightWeeksAgo = new Date(now)
  eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56)
  const weekTasks = tasks.filter(t => new Date(t.date) >= eightWeeksAgo)
  const studyDaysByWeek = new Map<string, StudyDayEntry[]>()
  const weekMinutesMap = new Map<string, number>()
  const weekTasksDone = new Map<string, number>()
  const weekDaySets = new Map<string, Set<string>>()

  for (const t of weekTasks) {
    const w = getWeekId(t.date)
    if (!w) continue
    if (!studyDaysByWeek.has(w)) studyDaysByWeek.set(w, [])
    if (!weekDaySets.has(w)) weekDaySets.set(w, new Set())
    if (t.isDone) {
      weekDaySets.get(w)!.add(t.date.slice(0, 10))
    }
    weekMinutesMap.set(w, (weekMinutesMap.get(w) || 0) + (t.timeMinutes || 0))
    if (t.isDone) {
      weekTasksDone.set(w, (weekTasksDone.get(w) || 0) + 1)
    }
  }

  return Array.from(studyDaysByWeek.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8)
    .map(([weekId]) => ({
      weekId,
      weekLabel: getWeekLabel(weekId),
      daysActive: weekDaySets.get(weekId)?.size ?? 0,
      totalMinutes: weekMinutesMap.get(weekId) ?? 0,
      tasksCompleted: weekTasksDone.get(weekId) ?? 0,
      dailyBreakdown: [],
    }))
}

function computeSkillProgress(
  reading: ReadingSession[],
  listening: ListeningSession[],
  writing: WritingSession[],
  speaking: SpeakingSession[],
  progressRecords: ProgressRecord[],
): SkillProgressSummary[] {
  function getAccuracy(sessions: { accuracy?: number; score?: number; totalQuestions?: number }[]): number {
    if (sessions.length === 0) return 0
    const totalScore = sessions.reduce((s, p) => s + (p.score ?? p.accuracy ?? 0), 0)
    const maxPossible = sessions.reduce((s, p) => s + (p.totalQuestions ?? 100), 0)
    return maxPossible > 0 ? Math.round((totalScore / maxPossible) * 100) : 0
  }

  function getTrend(skill: string): 'improving' | 'declining' | 'stable' {
    const filtered = progressRecords
      .filter(r => r.skill === skill)
      .sort((a, b) => a.date.localeCompare(b.date))
    if (filtered.length < 2) return 'stable'
    const recent = filtered.slice(-2)
    const diff = recent[1].value - recent[0].value
    if (diff > 0.05) return 'improving'
    if (diff < -0.05) return 'declining'
    return 'stable'
  }

  const readingMins = reading.reduce((s, r) => s + (r.timeSpentMinutes || 0), 0)
  const listeningMins = listening.reduce((s, l) => s + (l.durationMinutes || 0), 0)
  const writingMins = writing.reduce((s, w) => s + (w.timeSpentMinutes || 0), 0)
  const speakingMins = speaking.reduce((s, sp) => s + (sp.durationSeconds || 0) / 60, 0)

  return [
    { skill: 'Reading', sessions: reading.length, totalMinutes: readingMins, accuracy: getAccuracy(reading), trend: getTrend('reading') },
    { skill: 'Listening', sessions: listening.length, totalMinutes: listeningMins, accuracy: getAccuracy(listening), trend: getTrend('listening') },
    { skill: 'Writing', sessions: writing.length, totalMinutes: writingMins, accuracy: writing.length > 0 ? Math.round(writing.reduce((s, w) => s + (w.estimatedBand || 0), 0) / writing.length * 10) : 0, trend: getTrend('writing') },
    { skill: 'Speaking', sessions: speaking.length, totalMinutes: Math.round(speakingMins), accuracy: speaking.length > 0 ? Math.round(speaking.reduce((s, sp) => s + (sp.selfRating || 0), 0) / speaking.length * 20) : 0, trend: getTrend('speaking') },
    { skill: 'Vocabulary', sessions: 0, totalMinutes: 0, accuracy: 0, trend: 'stable' },
    { skill: 'Grammar', sessions: 0, totalMinutes: 0, accuracy: 0, trend: 'stable' },
  ]
}

function computeMonthlySummary(
  tasks: TaskEntry[],
  reading: ReadingSession[],
  listening: ListeningSession[],
  writing: WritingSession[],
  speaking: SpeakingSession[],
  vocabulary: VocabularyEntry[],
  mockTests: MockTestEntry[],
): MonthlySummary[] {
  const monthlyHours = new Map<string, number>()
  const monthlySessions = new Map<string, number>()
  const monthlyVocab = new Map<string, number>()
  const monthlyMockTests = new Map<string, number>()
  const monthlyBands = new Map<string, number[]>()

  const addMonth = (date: string, map: Map<string, number>, val: number) => {
    const ml = getMonthLabel(date)
    if (ml) map.set(ml, (map.get(ml) || 0) + val)
  }

  for (const t of tasks) {
    if (t.isDone && t.date) addMonth(t.date, monthlyHours, t.timeMinutes || 0)
  }
  for (const s of reading) addMonth(s.createdAt, monthlySessions, 1)
  for (const s of listening) addMonth(s.createdAt, monthlySessions, 1)
  for (const s of writing) addMonth(s.createdAt, monthlySessions, 1)
  for (const s of speaking) addMonth(s.createdAt, monthlySessions, 1)
  for (const v of vocabulary) addMonth(v.createdAt, monthlyVocab, 1)
  for (const m of mockTests) {
    addMonth(m.date, monthlyMockTests, 1)
    const ml = getMonthLabel(m.date)
    if (ml) {
      if (!monthlyBands.has(ml)) monthlyBands.set(ml, [])
      monthlyBands.get(ml)!.push(m.overallBand)
    }
  }

  const sortedMonths = [...new Set([
    ...monthlyHours.keys(), ...monthlySessions.keys(),
    ...monthlyVocab.keys(), ...monthlyMockTests.keys(),
  ])].sort().slice(-6)

  return sortedMonths.map(month => {
    const bands = monthlyBands.get(month) || []
    return {
      month,
      totalHours: Math.round(((monthlyHours.get(month) || 0) / 60) * 10) / 10,
      sessions: monthlySessions.get(month) || 0,
      vocabLearned: monthlyVocab.get(month) || 0,
      mockTests: monthlyMockTests.get(month) || 0,
      avgBand: bands.length > 0 ? Math.round((bands.reduce((a, b) => a + b, 0) / bands.length) * 10) / 10 : 0,
    }
  })
}

function computeWeakSkills(mistakes: MistakeEntry[]): { skill: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const m of mistakes) {
    if (m.skill) {
      counts.set(m.skill, (counts.get(m.skill) || 0) + 1)
    }
  }
  return Array.from(counts.entries())
    .sort(([, a], [, b]) => b - a)
    .map(([skill, count]) => ({
      skill: skill.charAt(0).toUpperCase() + skill.slice(1),
      count,
    }))
}

function computeRecentActivity(
  tasks: TaskEntry[],
  vocabulary: VocabularyEntry[],
  reading: ReadingSession[],
): { date: string; description: string; type: 'task' | 'vocab' | 'session' | 'review' }[] {
  const activity: { date: string; description: string; type: 'task' | 'vocab' | 'session' | 'review' }[] = []
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const since = sevenDaysAgo.toISOString()

  for (const t of tasks) {
    if (t.isDone && t.completedAt && t.completedAt >= since) {
      activity.push({ date: t.completedAt.slice(0, 10), description: `Completed: ${t.title}`, type: 'task' })
    }
  }
  for (const v of vocabulary) {
    if (v.createdAt >= since) {
      activity.push({ date: v.createdAt.slice(0, 10), description: `Saved word: ${v.word}`, type: 'vocab' })
    }
  }
  for (const r of reading) {
    if (r.createdAt >= since) {
      activity.push({ date: r.createdAt.slice(0, 10), description: `Reading: ${r.title}`, type: 'session' })
    }
  }

  activity.sort((a, b) => b.date.localeCompare(a.date))
  return activity.slice(0, 20)
}

async function tryEngineProgress(): Promise<Partial<ProgressSnapshot> | null> {
  try {
    const engine = getLearningEngine()
    if (!engine) return null

    const sessionSummary = await engine.getRecommendedActivity({})
    if (sessionSummary.status !== 'success') return null

    return null
  } catch {
    return null
  }
}

export async function computeProgressSnapshot(): Promise<ProgressSnapshot> {
  const [
    tasks, reading, listening, writing, speaking,
    vocabulary, reviews, mockTests, mistakes,
    progressRecords,
  ] = await Promise.all([
    DatabaseService.getAll<TaskEntry>('tasks'),
    DatabaseService.getAll<ReadingSession>('readingSessions'),
    DatabaseService.getAll<ListeningSession>('listeningSessions'),
    DatabaseService.getAll<WritingSession>('writingSessions'),
    DatabaseService.getAll<SpeakingSession>('speakingSessions'),
    DatabaseService.getAll<VocabularyEntry>('vocabulary'),
    DatabaseService.getAll<VocabReviewEntry>('vocabularyReviews'),
    DatabaseService.getAll<MockTestEntry>('mockTests'),
    DatabaseService.getAll<MistakeEntry>('mistakes'),

    DatabaseService.getAll<ProgressRecord>('progressRecords'),
  ])

  const totalTasksCompleted = tasks.filter(t => t.isDone).length
  const totalStudyMinutes = tasks.reduce((s, t) => s + (t.isDone ? (t.timeMinutes || 0) : 0), 0)
  const { current: currentStreak, longest: longestStreak } = computeStreak(tasks)
  const weeklyProgress = computeWeeklyProgressSummary(tasks)
  const skillProgress = computeSkillProgress(reading, listening, writing, speaking, progressRecords)
  const monthlySummary = computeMonthlySummary(tasks, reading, listening, writing, speaking, vocabulary, mockTests)
  const weakSkills = computeWeakSkills(mistakes)
  const recentActivity = computeRecentActivity(tasks, vocabulary, reading)

  let roadmapProgress = 0
  try {
    const roadmap = loadRoadmap()
    if (roadmap) {
      const updated = recalculateProgress(roadmap, tasks)
      roadmapProgress = updated.overallProgress
    }
  } catch {}

  return {
    version: 2,
    totalTasksCompleted,
    totalStudyMinutes,
    currentStreak,
    longestStreak,
    weeklyProgress,
    skillProgress,
    vocabLearned: vocabulary.length,
    vocabReviewed: reviews.length,
    monthlySummary,
    roadmapProgress,
    weakSkills,
    recentActivity,
    generatedAt: new Date().toISOString(),
  }
}

export function saveProgressSnapshot(snapshot: ProgressSnapshot): void {
  try {
    localStorage.setItem(PROGRESS_SNAPSHOT_KEY + '-v2', JSON.stringify(snapshot))
  } catch (err) {
    console.error('Failed to save progress snapshot:', err)
  }
}

export function loadProgressSnapshot(): ProgressSnapshot | null {
  try {
    const raw = localStorage.getItem(PROGRESS_SNAPSHOT_KEY + '-v2')
    if (!raw) {
      const legacy = localStorage.getItem(PROGRESS_SNAPSHOT_KEY)
      if (legacy) {
        const parsed = JSON.parse(legacy) as ProgressSnapshot
        parsed.version = 2
        return parsed
      }
      return null
    }
    return JSON.parse(raw) as ProgressSnapshot
  } catch {
    return null
  }
}

export function getProgressForDashboard(snapshot: ProgressSnapshot, settings: AppSettings) {
  const whatToStudy: string[] = []

  if (snapshot.weakSkills.length > 0) {
    whatToStudy.push(`Focus on ${snapshot.weakSkills[0].skill} — your weakest skill`)
  }
  if (snapshot.currentStreak === 0) {
    whatToStudy.push('Complete a task today to start your study streak')
  }
  if (snapshot.monthlySummary.length > 0) {
    const currentMonth = snapshot.monthlySummary[snapshot.monthlySummary.length - 1]
    const weeklyGoal = (settings.dailyStudyMinutes || 30) * 7
    const weeklyHoursGoal = weeklyGoal / 60
    if (currentMonth.totalHours < weeklyHoursGoal) {
      whatToStudy.push(`You need more study hours this week (${currentMonth.totalHours.toFixed(1)}h of ${weeklyHoursGoal.toFixed(1)}h)`)
    }
  }

  return {
    totalHours: Math.round(snapshot.totalStudyMinutes / 60 * 10) / 10,
    currentStreak: snapshot.currentStreak,
    longestStreak: snapshot.longestStreak,
    roadmapProgress: snapshot.roadmapProgress,
    vocabLearned: snapshot.vocabLearned,
    tasksCompleted: snapshot.totalTasksCompleted,
    whatToStudyAdvice: whatToStudy,
  }
}

export async function getWeakSkillAdvice(): Promise<{ skill: string; count: number }[]> {
  const mistakes = await DatabaseService.getAll<MistakeEntry>('mistakes')
  return computeWeakSkills(mistakes)
}

export async function getWeeklyChartData(): Promise<{ day: string; minutes: number; tasks: number }[]> {
  const tasks = await DatabaseService.getAll<TaskEntry>('tasks')
  const today = new Date()
  const weekStart = new Date(today)
  const day = weekStart.getDay()
  const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1)
  weekStart.setDate(diff)
  weekStart.setHours(0, 0, 0, 0)

  const days: { day: string; minutes: number; tasks: number }[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + i)
    const dateStr = d.toISOString().slice(0, 10)
    const dayTasks = tasks.filter(t => t.date.slice(0, 10) === dateStr)
    days.push({
      day: d.toLocaleDateString('en', { weekday: 'short' }),
      minutes: dayTasks.reduce((s, t) => s + (t.timeMinutes || 0), 0),
      tasks: dayTasks.filter(t => t.isDone).length,
    })
  }
  return days
}

export async function ensureProgressSnapshot(): Promise<ProgressSnapshot> {
  const existing = loadProgressSnapshot()
  if (existing) {
    const today = new Date().toISOString().slice(0, 10)
    const snapshotDate = existing.generatedAt.slice(0, 10)
    if (snapshotDate === today) {
      return existing
    }
  }
  const snapshot = await computeProgressSnapshot()
  saveProgressSnapshot(snapshot)
  return snapshot
}
