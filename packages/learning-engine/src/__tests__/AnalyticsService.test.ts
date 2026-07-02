import { describe, it, expect } from 'vitest'
import { AnalyticsService } from '../analytics/AnalyticsService'

describe('AnalyticsService', () => {
  const service = new AnalyticsService()

  it('calculates study consistency with active days', () => {
    const today = new Date()
    const dates: string[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      dates.push(d.toISOString())
    }

    const consistency = service.getStudyConsistency(dates, [])
    expect(consistency.currentStreak).toBeGreaterThanOrEqual(1)
    expect(consistency.longestStreak).toBeGreaterThanOrEqual(7)
    expect(consistency.totalStudyDays).toBeGreaterThanOrEqual(7)
  })

  it('returns zero streak when no dates', () => {
    const consistency = service.getStudyConsistency([], [])
    expect(consistency.currentStreak).toBe(0)
    expect(consistency.longestStreak).toBe(0)
    expect(consistency.totalStudyDays).toBe(0)
  })

  it('builds weekly history for last 7 days', () => {
    const today = new Date()
    const dates = [today.toISOString()]

    const consistency = service.getStudyConsistency(dates, [])
    expect(consistency.weeklyHistory.length).toBe(7)
  })

  it('calculates skill balance with pro-rated hours', () => {
    const readingPractices = [
      { timeSpentSeconds: 3600, score: 8, totalQuestions: 10 } as any,
    ]
    const writingSessions = [
      { timeSpentMinutes: 60, estimatedBand: 6.5 } as any,
    ]

    const balance = service.getSkillBalance(readingPractices, [], writingSessions, [])
    const reading = balance.find(b => b.skill === 'reading')
    const writing = balance.find(b => b.skill === 'writing')

    expect(reading).toBeTruthy()
    expect(reading!.hours).toBeGreaterThan(0)
    expect(writing).toBeTruthy()
    expect(writing!.hours).toBeGreaterThan(0)
  })

  it('returns zero balances when no data', () => {
    const balance = service.getSkillBalance([], [], [], [])
    const allZero = balance.every(b => b.hours === 0 && b.percentage === 0)
    expect(allZero).toBe(true)
  })

  it('generates band progress history from mock tests', () => {
    const mockTests = [
      { date: '2024-01-01', overallBand: 6, listeningScore: 6, readingScore: 5.5, writingBand: 6, speakingBand: 6.5 } as any,
      { date: '2024-02-01', overallBand: 6.5, listeningScore: 6.5, readingScore: 6, writingBand: 6.5, speakingBand: 7 } as any,
    ]

    const history = service.getBandProgressHistory(mockTests)
    expect(history.length).toBe(2)
    expect(history[0].overall).toBe(6)
    expect(history[1].overall).toBe(6.5)
  })

  it('generates weekly reflection with improvements', () => {
    const skills = [
      { skill: 'reading' as const, sessions: 5, totalMinutes: 300, accuracy: 85, trend: 'improving' as const },
      { skill: 'writing' as const, sessions: 2, totalMinutes: 120, accuracy: 60, trend: 'declining' as const },
    ]
    const consistency = {
      currentStreak: 3,
      longestStreak: 10,
      totalStudyDays: 20,
      consistencyPercent: 40,
      weeklyHistory: [],
    }

    const reflection = service.getWeeklyReflection(skills, consistency, [])
    expect(reflection.weekStart).toBeTruthy()
    expect(reflection.weekEnd).toBeTruthy()
    expect(reflection.improvements.length).toBeGreaterThan(0)
    expect(reflection.suggestions.length).toBeGreaterThan(0)
    expect(reflection.weakAreas).toContain('writing')
  })
})
