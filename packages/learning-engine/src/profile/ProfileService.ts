import type { ProfileData, ISOString, ProfileSettings } from '../types'

function daysBetween(a: Date, b: Date): number {
  const msDiff = a.getTime() - b.getTime()
  return Math.floor(msDiff / (1000 * 60 * 60 * 24))
}

function getDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export class ProfileService {
  getProfileData(
    settings: ProfileSettings,
    sessionDates: ISOString[],
    taskDates: ISOString[] = [],
  ): ProfileData {
    const targetBand = settings.targetBand
    const currentBand = settings.currentBand
    const bandProgress = this.calculateBandProgress(currentBand, targetBand)
    const examDate = settings.examDate || null
    const examCountdownDays = examDate ? this.getExamCountdown(examDate) : null
    const studyStreak = this.calculateStudyStreak(sessionDates, taskDates)
    const lastStudyDate = sessionDates.length > 0
      ? [...sessionDates].sort().reverse()[0]
      : null

    return {
      targetBand,
      currentBand,
      bandProgress,
      examDate,
      examCountdownDays,
      studyStreak,
      lastStudyDate,
      dailyStudyMinutes: settings.dailyStudyMinutes,
    }
  }

  calculateBandProgress(currentBand: number, targetBand: number): number {
    if (targetBand <= 0 || targetBand <= currentBand) return 100
    const baseline = 0
    const progress = ((currentBand - baseline) / (targetBand - baseline)) * 100
    return Math.min(100, Math.max(0, Math.round(progress * 10) / 10))
  }

  getExamCountdown(examDate: string): number {
    const examDateOnly = examDate.slice(0, 10)
    const exam = new Date(examDateOnly + 'T00:00:00.000Z')
    if (isNaN(exam.getTime())) return 0
    const now = new Date()
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    return Math.max(0, daysBetween(exam, todayStart))
  }

  calculateStudyStreak(sessionDates: ISOString[], taskDates: ISOString[] = []): number {
    const allDates = [...sessionDates, ...taskDates]
    if (allDates.length === 0) return 0

    const uniqueDays = new Set<string>()
    for (const date of allDates) {
      uniqueDays.add(date.slice(0, 10))
    }

    const sortedDays = Array.from(uniqueDays).sort().reverse()

    let streak = 0
    const today = getDateOnly(new Date())
    const yesterday = getDateOnly(new Date(Date.now() - 86400000))

    if (sortedDays[0] !== today && sortedDays[0] !== yesterday) {
      return 0
    }

    let expectedDate = new Date(sortedDays[0])
    for (const day of sortedDays) {
      const dayDate = getDateOnly(expectedDate)
      if (day === dayDate) {
        streak++
        expectedDate.setDate(expectedDate.getDate() - 1)
      } else {
        break
      }
    }

    return streak
  }
}
