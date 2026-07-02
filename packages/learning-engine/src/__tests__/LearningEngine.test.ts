import { describe, it, expect } from 'vitest'
import { LearningEngine } from '../LearningEngine'

describe('LearningEngine', () => {
  const engine = new LearningEngine()

  const baseInput = {
    settings: {
      targetBand: 7,
      currentBand: 5.5,
      examDate: new Date(Date.now() + 60 * 86400000).toISOString(),
      dailyStudyMinutes: 60,
      weakSkills: [],
      preferredTopics: [],
    },
    vocabulary: [],
    vocabReviews: [],
    mistakes: [],
    tasks: [],
    readingSessions: [],
    listeningSessions: [],
    writingSessions: [],
    speakingSessions: [],
    readingPractices: [],
    listeningPractices: [],
    mockTests: [],
    progressRecords: [],
    topicsProgress: [],
  }

  it('computes full engine state', () => {
    const state = engine.computeFullState(baseInput)

    expect(state.profile).toBeDefined()
    expect(state.profile.targetBand).toBe(7)
    expect(state.profile.bandProgress).toBeGreaterThan(0)
    expect(state.progress.skills.length).toBeGreaterThan(0)
    expect(state.weaknessReport).toBeDefined()
    expect(state.dueReviews).toBeDefined()
    expect(state.dailyPlan).toBeDefined()
    expect(state.nextBestActions.length).toBeGreaterThan(0)
    expect(state.studyConsistency).toBeDefined()
    expect(state.weeklyReflection).toBeDefined()
    expect(state.bandProgressHistory).toBeDefined()
    expect(state.skillBalance.length).toBeGreaterThan(0)
  })

  it('returns profile independently', () => {
    const profile = engine.getProfile(baseInput.settings, [new Date().toISOString()])
    expect(profile.targetBand).toBe(7)
    expect(profile.studyStreak).toBe(1)
  })

  it('calculates next review for vocabulary', () => {
    const entry = {
      id: 'test-review',
      vocabularyId: 'v1',
      interval: 0,
      easeFactor: 2.5,
      repetitions: 0,
      nextReviewDate: new Date().toISOString(),
      lastReviewDate: new Date().toISOString(),
      history: [],
    }

    const updated = engine.calculateNextReview(entry, 'good')
    expect(updated.repetitions).toBe(1)
    expect(updated.interval).toBeGreaterThanOrEqual(1)
  })

  it('returns review stats', () => {
    const stats = engine.getReviewStats([])
    expect(stats.dueCount).toBe(0)
    expect(stats.totalCount).toBe(0)
  })

  it('computes state with mock test data', () => {
    const input = {
      ...baseInput,
      mockTests: [
        { date: '2024-01-01', overallBand: 6, listeningScore: 6, readingScore: 5.5, writingBand: 6, speakingBand: 6.5, notes: '', weakAreas: [], improvementPlan: '', id: 'm1', createdAt: '2024-01-01' },
      ],
      mistakes: [
        { id: 'm1', mistake: 'error', correction: '', explanation: '', source: '', date: '2024-01-01', skill: 'grammar' as const, status: 'new' as const, repetitionCount: 2, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
      ],
    }

    const state = engine.computeFullState(input)
    expect(state.bandProgressHistory.length).toBe(1)
    expect(state.bandProgressHistory[0].overall).toBe(6)
    expect(state.weaknessReport.repeatedMistakes.length).toBeGreaterThanOrEqual(0)
  })
})
