import { describe, it, expect } from 'vitest'
import { ProfileService } from '../profile/ProfileService'

describe('ProfileService', () => {
  const service = new ProfileService()

  const baseSettings = {
    targetBand: 7,
    currentBand: 5.5,
    examDate: '',
    dailyStudyMinutes: 60,
    weakSkills: [],
    preferredTopics: [],
  }

  it('calculates band progress correctly', () => {
    expect(service.calculateBandProgress(5.5, 7)).toBeCloseTo(78.6, 0)
    expect(service.calculateBandProgress(7, 7)).toBe(100)
    expect(service.calculateBandProgress(0, 9)).toBeCloseTo(0, 0)
    expect(service.calculateBandProgress(4.5, 9)).toBe(50)
  })

  it('calculates exam countdown correctly', () => {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 30)

    const countdown = service.getExamCountdown(futureDate.toISOString())
    expect(countdown).toBeGreaterThanOrEqual(29)
    expect(countdown).toBeLessThanOrEqual(31)
  })

  it('returns 0 for past exam date', () => {
    const pastDate = new Date('2020-01-01')
    expect(service.getExamCountdown(pastDate.toISOString())).toBe(0)
  })

  it('calculates study streak from session dates', () => {
    const today = new Date()
    const dates: string[] = []

    for (let i = 0; i < 5; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      dates.push(d.toISOString())
    }

    expect(service.calculateStudyStreak(dates)).toBe(5)
  })

  it('returns 0 streak when no sessions', () => {
    expect(service.calculateStudyStreak([])).toBe(0)
  })

  it('returns 0 streak when last session is not today or yesterday', () => {
    const oldDate = new Date()
    oldDate.setDate(oldDate.getDate() - 3)
    expect(service.calculateStudyStreak([oldDate.toISOString()])).toBe(0)
  })

  it('builds complete profile data', () => {
    const settings = { ...baseSettings, examDate: new Date(Date.now() + 30 * 86400000).toISOString() }
    const sessionDates = [new Date().toISOString()]

    const profile = service.getProfileData(settings, sessionDates)
    expect(profile.targetBand).toBe(7)
    expect(profile.currentBand).toBe(5.5)
    expect(profile.bandProgress).toBeGreaterThan(0)
    expect(profile.examCountdownDays).toBeGreaterThan(0)
    expect(profile.studyStreak).toBeGreaterThanOrEqual(1)
    expect(profile.lastStudyDate).toBeTruthy()
  })
})
