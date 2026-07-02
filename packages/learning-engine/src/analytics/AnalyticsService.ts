import type {
  MockTestEntry,
  WritingSession,
  SpeakingSession,
  ReadingPracticeSession,
  ListeningPracticeSession,
} from '@ielts/storage'
import type {
  StudyConsistency,
  WeeklyStudyDay,
  WeeklyReflection,
  SkillProgress,
  SkillBalance,
  BandProgress,
  ISOString,
  StudySkill,
} from '../types'

export class AnalyticsService {
  getStudyConsistency(
    sessionDates: ISOString[],
    taskDates: ISOString[],
    now: Date = new Date(),
  ): StudyConsistency {
    const allDays = new Set<string>()
    for (const d of sessionDates) allDays.add(d.slice(0, 10))
    for (const d of taskDates) {
      allDays.add(d.slice(0, 10))
    }

    const sortedDays = Array.from(allDays).sort().reverse()

    let currentStreak = 0
    const today = now.toISOString().slice(0, 10)
    const yesterday = new Date(now.getTime() - 86400000).toISOString().slice(0, 10)

    if (sortedDays.length > 0 && (sortedDays[0] === today || sortedDays[0] === yesterday)) {
      let expectedDate = new Date(sortedDays[0])
      for (const day of sortedDays) {
        if (day === expectedDate.toISOString().slice(0, 10)) {
          currentStreak++
          expectedDate.setDate(expectedDate.getDate() - 1)
        } else {
          break
        }
      }
    }

    let longestStreak = 0
    let tempStreak = sortedDays.length > 0 ? 1 : 0
    for (let i = 1; i < sortedDays.length; i++) {
      const prevDate = new Date(sortedDays[i - 1])
      const currDate = new Date(sortedDays[i])
      const diffMs = prevDate.getTime() - currDate.getTime()
      const diffDays = Math.round(diffMs / 86400000)

      if (diffDays === 1) {
        tempStreak++
      } else {
        longestStreak = Math.max(longestStreak, tempStreak)
        tempStreak = 1
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak)

    const totalStudyDays = allDays.size

    const yearStart = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10)
    const daysSinceYearStart = Math.floor((now.getTime() - new Date(yearStart).getTime()) / 86400000) + 1
    const consistencyPercent = daysSinceYearStart > 0
      ? Math.round((totalStudyDays / daysSinceYearStart) * 100)
      : 0

    const weeklyHistory = this.buildWeeklyHistory(allDays, now)

    return {
      currentStreak,
      longestStreak,
      totalStudyDays,
      consistencyPercent,
      weeklyHistory,
    }
  }

  getWeeklyReflection(
    skills: SkillProgress[],
    consistency: StudyConsistency,
    bandHistory: BandProgress[],
    now: Date = new Date(),
  ): WeeklyReflection {
    const weekStart = this.getWeekStart(now)
    const weekEnd = this.getWeekEnd(now)

    const recentSkills = skills

    const totalStudyMinutes = recentSkills.reduce((s, sk) => s + sk.totalMinutes, 0)
    const weakAreas = recentSkills
      .filter(s => s.accuracy < 70 && s.sessions > 0)
      .map(s => s.skill)

    const improvements = this.generateImprovements(recentSkills, consistency)
    const suggestions = this.generateSuggestions(weakAreas, bandHistory)

    return {
      weekStart,
      weekEnd,
      totalStudyMinutes,
      totalTasksCompleted: consistency.totalStudyDays,
      activeDays: consistency.currentStreak,
      consistencyScore: consistency.consistencyPercent,
      skillBreakdown: recentSkills,
      weakAreas,
      improvements,
      suggestions,
    }
  }

  getSkillBalance(
    readingPractices: ReadingPracticeSession[],
    listeningPractices: ListeningPracticeSession[],
    writingSessions: WritingSession[],
    speakingSessions: SpeakingSession[],
  ): SkillBalance[] {
    const totalHours = (
      (readingPractices.reduce((s, p) => s + (p.timeSpentSeconds || 0), 0) +
        listeningPractices.reduce((s, p) => s + (p.timeSpentSeconds || 0), 0)) / 3600 +
      writingSessions.reduce((s, w) => s + (w.timeSpentMinutes || 0), 0) / 60 +
      speakingSessions.reduce((s, sp) => s + (sp.durationSeconds || 0), 0) / 3600
    )

    if (totalHours === 0) {
      return [
        { skill: 'reading', sessions: 0, hours: 0, percentage: 0 },
        { skill: 'listening', sessions: 0, hours: 0, percentage: 0 },
        { skill: 'writing', sessions: 0, hours: 0, percentage: 0 },
        { skill: 'speaking', sessions: 0, hours: 0, percentage: 0 },
        { skill: 'vocabulary', sessions: 0, hours: 0, percentage: 0 },
        { skill: 'grammar', sessions: 0, hours: 0, percentage: 0 },
      ]
    }

    const readingHours = readingPractices.reduce((s, p) => s + (p.timeSpentSeconds || 0), 0) / 3600
    const listeningHours = listeningPractices.reduce((s, p) => s + (p.timeSpentSeconds || 0), 0) / 3600
    const writingHours = writingSessions.reduce((s, w) => s + (w.timeSpentMinutes || 0), 0) / 60
    const speakingHours = speakingSessions.reduce((s, sp) => s + (sp.durationSeconds || 0), 0) / 3600

    const balances: SkillBalance[] = [
      { skill: 'reading', sessions: readingPractices.length, hours: Math.round(readingHours * 10) / 10, percentage: Math.round((readingHours / totalHours) * 100) },
      { skill: 'listening', sessions: listeningPractices.length, hours: Math.round(listeningHours * 10) / 10, percentage: Math.round((listeningHours / totalHours) * 100) },
      { skill: 'writing', sessions: writingSessions.length, hours: Math.round(writingHours * 10) / 10, percentage: Math.round((writingHours / totalHours) * 100) },
      { skill: 'speaking', sessions: speakingSessions.length, hours: Math.round(speakingHours * 10) / 10, percentage: Math.round((speakingHours / totalHours) * 100) },
      { skill: 'vocabulary', sessions: 0, hours: 0, percentage: 0 },
      { skill: 'grammar', sessions: 0, hours: 0, percentage: 0 },
    ]

    return balances
  }

  getBandProgressHistory(mockTests: MockTestEntry[]): BandProgress[] {
    return mockTests
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(m => ({
        date: m.date,
        overall: m.overallBand || 0,
        listening: m.listeningScore || 0,
        reading: m.readingScore || 0,
        writing: m.writingBand || 0,
        speaking: m.speakingBand || 0,
      }))
  }

  private buildWeeklyHistory(
    allDays: Set<string>,
    now: Date,
  ): WeeklyStudyDay[] {
    const history: WeeklyStudyDay[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const dayStr = d.toISOString().slice(0, 10)
      history.push({
        date: dayStr,
        studied: allDays.has(dayStr),
        minutes: 0,
      })
    }
    return history
  }

  private generateImprovements(
    skills: SkillProgress[],
    _consistency: StudyConsistency,
  ): string[] {
    const improvements: string[] = []

    const improving = skills.filter(s => s.trend === 'improving')
    if (improving.length > 0) {
      improvements.push(`${improving.map(s => s.skill).join(', ')} skills are improving. Keep up the good work!`)
    }

    const declining = skills.filter(s => s.trend === 'declining' && s.sessions > 0)
    if (declining.length > 0) {
      improvements.push(`Focus on ${declining.map(s => s.skill).join(', ')} skills which need attention.`)
    }

    if (improvements.length === 0) {
      improvements.push('Consistent practice is the key to IELTS success.')
    }

    return improvements
  }

  private generateSuggestions(
    weakAreas: StudySkill[],
    _bandHistory: BandProgress[],
  ): string[] {
    const suggestions: string[] = []

    if (weakAreas.includes('reading')) {
      suggestions.push('Practice skimming and scanning techniques daily.')
    }
    if (weakAreas.includes('listening')) {
      suggestions.push('Listen to English podcasts and take notes.')
    }
    if (weakAreas.includes('writing')) {
      suggestions.push('Write one essay per day and review structure.')
    }
    if (weakAreas.includes('speaking')) {
      suggestions.push('Practice speaking with IELTS topics for 10 minutes daily.')
    }
    if (weakAreas.includes('vocabulary')) {
      suggestions.push('Learn 10 new words daily using spaced repetition.')
    }
    if (weakAreas.includes('grammar')) {
      suggestions.push('Review one grammar topic each day.')
    }

    if (suggestions.length === 0) {
      suggestions.push('Keep your current study routine. Consistency is key!')
    }

    return suggestions
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
}
