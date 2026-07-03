import type {
  TaskEntry,
  ReadingPracticeSession,
  ListeningPracticeSession,
  WritingSession,
  SpeakingSession,
  ProgressRecord,
} from '@ielts/storage'
import type {
  SkillProgress,
  ExerciseAccuracy,
  WeeklyProgress,
  DayProgress,
  ISOString,
} from '../types'

export class ProgressService {
  getWeeklyProgress(
    tasks: TaskEntry[],
    sessionDates: ISOString[],
    now: Date = new Date(),
  ): WeeklyProgress {
    const weekStart = this.getWeekStart(now)
    const weekEnd = this.getWeekEnd(now)

    const weekTasks = tasks.filter(t => {
      const d = t.date.slice(0, 10)
      return d >= weekStart && d <= weekEnd
    })

    const weekSessions = sessionDates.filter(d => {
      const ds = d.slice(0, 10)
      return ds >= weekStart && ds <= weekEnd
    })

    const dailyBreakdown = this.buildDailyBreakdown(weekTasks, weekSessions, weekStart, weekEnd)

    const totalMinutes = dailyBreakdown.reduce((sum, d) => sum + d.minutes, 0)
    const tasksCompleted = weekTasks.filter(t => t.isDone).length
    const daysActive = dailyBreakdown.filter(d => d.minutes > 0).length

    return {
      weekStart,
      weekEnd,
      totalMinutes,
      tasksCompleted,
      daysActive,
      dailyBreakdown,
    }
  }

  getSkillProgress(
    readingPractices: ReadingPracticeSession[],
    listeningPractices: ListeningPracticeSession[],
    writingSessions: WritingSession[],
    speakingSessions: SpeakingSession[],
    progressRecords: ProgressRecord[],
  ): SkillProgress[] {
    const skills: SkillProgress[] = []

    const readingAccuracy = this.computePracticeAccuracy(readingPractices)
    skills.push({
      skill: 'reading',
      sessions: readingPractices.length,
      totalMinutes: readingPractices.reduce((s, p) => s + (p.timeSpentSeconds || 0) / 60, 0),
      accuracy: readingAccuracy,
      trend: this.determineTrend(progressRecords, 'reading'),
    })

    const listeningAccuracy = this.computePracticeAccuracy(listeningPractices)
    skills.push({
      skill: 'listening',
      sessions: listeningPractices.length,
      totalMinutes: listeningPractices.reduce((s, p) => s + (p.timeSpentSeconds || 0) / 60, 0),
      accuracy: listeningAccuracy,
      trend: this.determineTrend(progressRecords, 'listening'),
    })

    const writingAccuracy = this.computeWritingAccuracy(writingSessions)
    skills.push({
      skill: 'writing',
      sessions: writingSessions.length,
      totalMinutes: writingSessions.reduce((s, w) => s + (w.timeSpentMinutes || 0), 0),
      accuracy: writingAccuracy,
      trend: this.determineTrend(progressRecords, 'writing'),
    })

    const speakingAccuracy = this.computeSpeakingAccuracy(speakingSessions)
    skills.push({
      skill: 'speaking',
      sessions: speakingSessions.length,
      totalMinutes: speakingSessions.reduce((s, sp) => s + (sp.durationSeconds || 0) / 60, 0),
      accuracy: speakingAccuracy,
      trend: this.determineTrend(progressRecords, 'speaking'),
    })

    skills.push({
      skill: 'vocabulary',
      sessions: 0,
      totalMinutes: 0,
      accuracy: 0,
      trend: 'stable',
    })

    skills.push({
      skill: 'grammar',
      sessions: 0,
      totalMinutes: 0,
      accuracy: 0,
      trend: 'stable',
    })

    return skills
  }

  getExerciseAccuracy(
    readingPractices: ReadingPracticeSession[],
    listeningPractices: ListeningPracticeSession[],
    writingSessions: WritingSession[],
    speakingSessions: SpeakingSession[],
  ): ExerciseAccuracy[] {
    const results: ExerciseAccuracy[] = []

    const rAcc = this.computePracticeAccuracy(readingPractices)
    results.push({
      skill: 'reading',
      totalExercises: readingPractices.length,
      correctAnswers: readingPractices.reduce((s, p) => s + (p.score || 0), 0),
      accuracyPercent: rAcc,
    })

    const lAcc = this.computePracticeAccuracy(listeningPractices)
    results.push({
      skill: 'listening',
      totalExercises: listeningPractices.length,
      correctAnswers: listeningPractices.reduce((s, p) => s + (p.score || 0), 0),
      accuracyPercent: lAcc,
    })

    const wAcc = this.computeWritingAccuracy(writingSessions)
    const wTotal = writingSessions.length
    results.push({
      skill: 'writing',
      totalExercises: wTotal,
      correctAnswers: wTotal > 0 ? Math.round(writingSessions.reduce((s, w) => s + (w.estimatedBand || 0), 0) / wTotal * 10) : 0,
      accuracyPercent: wAcc,
    })

    const sAcc = this.computeSpeakingAccuracy(speakingSessions)
    const sTotal = speakingSessions.length
    results.push({
      skill: 'speaking',
      totalExercises: sTotal,
      correctAnswers: sTotal > 0 ? Math.round(speakingSessions.reduce((s, sp) => s + (sp.selfRating || 0), 0) / sTotal * 10) : 0,
      accuracyPercent: sAcc,
    })

    return results
  }

  private getWeekStart(now: Date): string {
    const d = new Date(now)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    d.setDate(diff)
    return d.toISOString().slice(0, 10)
  }

  private getWeekEnd(now: Date): string {
    const d = new Date(now)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    d.setDate(diff + 6)
    return d.toISOString().slice(0, 10)
  }

  private buildDailyBreakdown(
    tasks: TaskEntry[],
    sessionDates: ISOString[],
    weekStart: string,
    weekEnd: string,
  ): DayProgress[] {
    const days: DayProgress[] = []
    const start = new Date(weekStart)
    const end = new Date(weekEnd)

    const sessionCountByDay = new Map<string, number>()
    for (const d of sessionDates) {
      const day = d.slice(0, 10)
      sessionCountByDay.set(day, (sessionCountByDay.get(day) || 0) + 1)
    }

    const tasksByDay = new Map<string, TaskEntry[]>()
    for (const t of tasks) {
      const day = t.date.slice(0, 10)
      if (!tasksByDay.has(day)) tasksByDay.set(day, [])
      tasksByDay.get(day)!.push(t)
    }

    const current = new Date(start)
    while (current <= end) {
      const dayStr = current.toISOString().slice(0, 10)
      const dayTasks = tasksByDay.get(dayStr) || []
      const totalMinutes = dayTasks.reduce((s, t) => s + (t.timeMinutes || 0), 0)
      days.push({
        date: dayStr,
        minutes: totalMinutes,
        tasksDone: dayTasks.filter(t => t.isDone).length,
      })
      current.setDate(current.getDate() + 1)
    }

    return days
  }

  private computePracticeAccuracy(
    practices: (ReadingPracticeSession | ListeningPracticeSession)[],
  ): number {
    if (practices.length === 0) return 0
    const totalCorrect = practices.reduce((s, p) => s + (p.score || 0), 0)
    const totalQuestions = practices.reduce((s, p) => s + (p.totalQuestions || 0), 0)
    if (totalQuestions === 0) return 0
    return Math.round((totalCorrect / totalQuestions) * 100)
  }

  private computeWritingAccuracy(sessions: WritingSession[]): number {
    if (sessions.length === 0) return 0
    const avgBand = sessions.reduce((s, w) => s + (w.estimatedBand || 0), 0) / sessions.length
    return Math.round((avgBand / 9) * 100)
  }

  private computeSpeakingAccuracy(sessions: SpeakingSession[]): number {
    if (sessions.length === 0) return 0
    const avgRating = sessions.reduce((s, sp) => s + (sp.selfRating || 0), 0) / sessions.length
    return Math.round((avgRating / 10) * 100)
  }

  private determineTrend(
    records: ProgressRecord[],
    skill: string,
  ): 'improving' | 'declining' | 'stable' {
    const skillRecords = records
      .filter(r => r.skill === skill)
      .sort((a, b) => a.date.localeCompare(b.date))

    if (skillRecords.length < 2) return 'stable'

    const recent = skillRecords.slice(-2)
    const diff = recent[1].value - recent[0].value

    if (diff > 0.05) return 'improving'
    if (diff < -0.05) return 'declining'
    return 'stable'
  }
}
