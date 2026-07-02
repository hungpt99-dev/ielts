import { describe, it, expect } from 'vitest'
import { NextBestActionService } from '../next-best-action/NextBestActionService'

describe('NextBestActionService', () => {
  const service = new NextBestActionService()

  it('suggests mock test when exam is within 7 days', () => {
    const actions = service.calculateNextBestActions(
      [],
      { vocabularyDue: [], mistakesDue: [], totalDue: 0 },
      { studyStreak: 5, examCountdownDays: 3 },
    )

    const mockTest = actions.find(a => a.actionType === 'mock-test')
    expect(mockTest).toBeTruthy()
    expect(mockTest!.priority).toBe(10)
  })

  it('suggests vocabulary review when due reviews exist', () => {
    const actions = service.calculateNextBestActions(
      [],
      { vocabularyDue: [{ vocabulary: {} as any, review: {} as any }], mistakesDue: [], totalDue: 1 },
      { studyStreak: 5, examCountdownDays: 30 },
    )

    const vocabReview = actions.find(a => a.actionType === 'vocabulary-review')
    expect(vocabReview).toBeTruthy()
  })

  it('suggests mistake review when mistakes due', () => {
    const mistakeDue = {
      mistake: { id: 'm1', skill: 'grammar' as const } as any,
      daysSinceLastReview: 3,
    }

    const actions = service.calculateNextBestActions(
      [],
      { vocabularyDue: [], mistakesDue: [mistakeDue], totalDue: 1 },
      { studyStreak: 5, examCountdownDays: 30 },
    )

    const mistakeReview = actions.find(a => a.actionType === 'mistake-review')
    expect(mistakeReview).toBeTruthy()
  })

  it('suggests weak skill practice for high severity weaknesses', () => {
    const weakSkills = [
      { skill: 'writing' as const, accuracy: 45, sessionCount: 3, severity: 'high' as const },
    ]

    const actions = service.calculateNextBestActions(
      weakSkills,
      { vocabularyDue: [], mistakesDue: [], totalDue: 0 },
      { studyStreak: 5, examCountdownDays: 30 },
    )

    const practice = actions.find(a => a.skill === 'writing')
    expect(practice).toBeTruthy()
  })

  it('suggests starting streak when streak is 0', () => {
    const actions = service.calculateNextBestActions(
      [],
      { vocabularyDue: [], mistakesDue: [], totalDue: 0 },
      { studyStreak: 0, examCountdownDays: 60 },
    )

    const startAction = actions.find(a => a.actionType === 'daily-lesson')
    expect(startAction).toBeTruthy()
  })

  it('returns daily practice as fallback', () => {
    const actions = service.calculateNextBestActions(
      [],
      { vocabularyDue: [], mistakesDue: [], totalDue: 0 },
      { studyStreak: 10, examCountdownDays: 60 },
    )

    expect(actions.length).toBeGreaterThanOrEqual(1)
    expect(actions[0].actionType).toBe('exercise')
  })

  it('sorts actions by priority descending', () => {
    const weakSkills = [
      { skill: 'writing' as const, accuracy: 40, sessionCount: 2, severity: 'high' as const },
    ]
    const mistakeDue = {
      mistake: { id: 'm1', skill: 'grammar' as const } as any,
      daysSinceLastReview: 5,
    }

    const actions = service.calculateNextBestActions(
      weakSkills,
      { vocabularyDue: [{ vocabulary: {} as any, review: {} as any }], mistakesDue: [mistakeDue], totalDue: 2 },
      { studyStreak: 3, examCountdownDays: 10 },
    )

    for (let i = 1; i < actions.length; i++) {
      expect(actions[i - 1].priority).toBeGreaterThanOrEqual(actions[i].priority)
    }
  })
})
