import { describe, it, expect } from 'vitest'
import {
  SpacedRepetitionScheduler,
  ReviewEligibilityChecker,
  DefaultSchedulerStrategy,
  AdaptiveSchedulerStrategy,
  createDefaultReviewScheduler,
} from '../reviewScheduler'
import type { ExerciseResult, ExerciseAttempt, ExerciseReviewRecord } from '../models'

describe('SpacedRepetitionScheduler', () => {
  const scheduler = new SpacedRepetitionScheduler()

  it('resets on "again" rating', () => {
    const result = scheduler.schedule({ rating: 'again', interval: 10, easeFactor: 2.5, repetitions: 5 })
    expect(result.interval).toBe(1)
    expect(result.repetitions).toBe(0)
    expect(result.easeFactor).toBeLessThan(2.5)
    expect(new Date(result.nextReviewAt)).toBeInstanceOf(Date)
  })

  it('increases interval on "good" rating for first review', () => {
    const result = scheduler.schedule({ rating: 'good', interval: 0, easeFactor: 2.5, repetitions: 0 })
    expect(result.interval).toBe(1)
    expect(result.repetitions).toBe(1)
  })

  it('increases interval on "good" rating for second review', () => {
    const result = scheduler.schedule({ rating: 'good', interval: 1, easeFactor: 2.5, repetitions: 1 })
    expect(result.interval).toBe(4)
    expect(result.repetitions).toBe(2)
  })

  it('uses ease factor for subsequent reviews on "good"', () => {
    const result = scheduler.schedule({ rating: 'good', interval: 4, easeFactor: 2.5, repetitions: 2 })
    expect(result.interval).toBe(10)
    expect(result.repetitions).toBe(3)
  })

  it('increases ease factor on "easy" rating', () => {
    const result = scheduler.schedule({ rating: 'easy', interval: 4, easeFactor: 2.5, repetitions: 2 })
    expect(result.easeFactor).toBeGreaterThan(2.5)
    expect(result.interval).toBeGreaterThan(10)
  })

  it('decreases ease factor on "hard" rating', () => {
    const result = scheduler.schedule({ rating: 'hard', interval: 10, easeFactor: 2.5, repetitions: 3 })
    expect(result.easeFactor).toBeLessThan(2.5)
    expect(result.interval).toBe(12)
  })

  it('shortens interval when accuracy is low', () => {
    const result = scheduler.schedule({ rating: 'good', interval: 10, easeFactor: 2.5, repetitions: 3, accuracy: 40 })
    expect(result.interval).toBeLessThan(25)
  })

  it('does not let ease factor drop below minimum', () => {
    let ef = 2.5
    for (let i = 0; i < 20; i++) {
      const result = scheduler.schedule({ rating: 'again', interval: 1, easeFactor: ef, repetitions: 0 })
      ef = result.easeFactor
    }
    expect(ef).toBeGreaterThanOrEqual(1.3)
  })
})

describe('ReviewEligibilityChecker', () => {
  const checker = new ReviewEligibilityChecker()
  const now = new Date().toISOString()
  const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  function makeRecord(overrides?: Partial<ExerciseReviewRecord>): ExerciseReviewRecord {
    return {
      id: 'rec1',
      exerciseId: 'ex1',
      resultId: 'res1',
      lastReviewedAt: now,
      nextReviewAt: now,
      interval: 1,
      easeFactor: 2.5,
      repetitions: 0,
      history: [],
      createdAt: now,
      updatedAt: now,
      ...overrides,
    }
  }

  it('classifies due now reviews correctly', () => {
    const result = checker.check([
      makeRecord({ nextReviewAt: new Date(Date.now() - 3600000).toISOString() }),
      makeRecord({ nextReviewAt: future }),
    ])
    expect(result.dueNow).toHaveLength(1)
    expect(result.notDue).toHaveLength(1)
  })

  it('classifies due soon reviews', () => {
    const soon = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
    const result = checker.check([
      makeRecord({ nextReviewAt: soon }),
      makeRecord({ nextReviewAt: future }),
    ])
    expect(result.dueSoon).toHaveLength(1)
    expect(result.notDue).toHaveLength(1)
  })

  it('handles empty input', () => {
    const result = checker.check([])
    expect(result.dueNow).toHaveLength(0)
    expect(result.dueSoon).toHaveLength(0)
    expect(result.notDue).toHaveLength(0)
  })
})

describe('DefaultSchedulerStrategy', () => {
  const strategy = new DefaultSchedulerStrategy()

  function makeResult(overrides?: Partial<ExerciseResult>): ExerciseResult {
    return {
      id: 'res1',
      exerciseId: 'ex1',
      attemptId: 'att1',
      skill: 'grammar',
      topic: 'Test',
      score: 5,
      total: 5,
      accuracy: 100,
      timeSpentSeconds: 120,
      questions: [],
      mistakes: [],
      review: { nextReviewAt: '', interval: 0, easeFactor: 2.5, repetitions: 0 },
      createdAt: new Date().toISOString(),
      ...overrides,
    }
  }

  function makeAttempt(): ExerciseAttempt {
    return {
      id: 'att1',
      exerciseId: 'ex1',
      skill: 'grammar',
      status: 'completed',
      answers: [],
      totalScore: 5,
      maxScore: 5,
      accuracy: 100,
      timeSpentSeconds: 120,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    }
  }

  it('schedules easy review for high accuracy', () => {
    const result = strategy.schedule(makeResult({ accuracy: 95 }), makeAttempt())
    expect(result.interval).toBeGreaterThanOrEqual(1)
    expect(result.exerciseId).toBe('ex1')
  })

  it('schedules hard review when mistakes exist', () => {
    const result = strategy.schedule(
      makeResult({
        accuracy: 80,
        mistakes: [{ questionId: 'q1', question: 'test', userAnswer: 'wrong', correctAnswer: 'right', explanation: 'test', skill: 'grammar' }],
      }),
      makeAttempt(),
    )
    expect(result.interval).toBeGreaterThanOrEqual(1)
  })

  it('schedules again for low accuracy', () => {
    const result = strategy.schedule(makeResult({ accuracy: 30 }), makeAttempt())
    expect(result.interval).toBe(1)
    expect(result.repetitions).toBe(0)
  })
})

describe('AdaptiveSchedulerStrategy', () => {
  const strategy = new AdaptiveSchedulerStrategy()

  function makeResult(overrides?: Partial<ExerciseResult>): ExerciseResult {
    return {
      id: 'res1',
      exerciseId: 'ex1',
      attemptId: 'att1',
      skill: 'grammar',
      topic: 'Test',
      score: 5,
      total: 5,
      accuracy: 100,
      timeSpentSeconds: 120,
      questions: [],
      mistakes: [],
      review: { nextReviewAt: '', interval: 0, easeFactor: 2.5, repetitions: 0 },
      createdAt: new Date().toISOString(),
      ...overrides,
    }
  }

  function makeAttempt(overrides?: Partial<ExerciseAttempt>): ExerciseAttempt {
    return {
      id: 'att1',
      exerciseId: 'ex1',
      skill: 'grammar',
      status: 'completed',
      answers: [],
      totalScore: 5,
      maxScore: 5,
      accuracy: 100,
      timeSpentSeconds: 120,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      ...overrides,
    }
  }

  it('schedules easy for fast, accurate completion', () => {
    const result = strategy.schedule(makeResult({ accuracy: 95 }), makeAttempt({ timeSpentSeconds: 60 }))
    expect(result.interval).toBeGreaterThanOrEqual(1)
  })

  it('schedules hard for slow, low-accuracy completion', () => {
    const result = strategy.schedule(makeResult({ accuracy: 60 }), makeAttempt({ timeSpentSeconds: 600 }))
    expect(result.interval).toBeLessThanOrEqual(1)
  })

  it('adjusts interval when time ratio is high', () => {
    const fast = strategy.schedule(makeResult({ accuracy: 75 }), makeAttempt({ timeSpentSeconds: 60 }))
    const slow = strategy.schedule(makeResult({ accuracy: 75 }), makeAttempt({ timeSpentSeconds: 600 }))
    expect(slow.interval).toBeLessThanOrEqual(fast.interval)
  })
})

describe('ReviewScheduler', () => {
  const scheduler = createDefaultReviewScheduler()

  it('creates initial review record', () => {
    const review = scheduler.createInitialReview('ex1', 'res1')
    expect(review.exerciseId).toBe('ex1')
    expect(review.resultId).toBe('res1')
    expect(review.interval).toBe(1)
    expect(review.repetitions).toBe(0)
  })

  it('updates review record with rating', () => {
    const review = scheduler.createInitialReview('ex1', 'res1')
    const updated = scheduler.updateReview(review, 'good', 80)
    expect(updated.interval).toBeGreaterThanOrEqual(1)
    expect(updated.repetitions).toBe(1)
    expect(updated.history).toHaveLength(1)
    expect(updated.updatedAt).toBeDefined()
  })

  it('sorts review records by priority', () => {
    const now = new Date()
    const reviews = [
      scheduler.createInitialReview('ex1', 'res1'),
      { ...scheduler.createInitialReview('ex2', 'res2'), nextReviewAt: new Date(now.getTime() + 86400000).toISOString() },
    ]
    const sorted = scheduler.getPriorityOrder(reviews)
    expect(sorted[0].exerciseId).toBe('ex1')
    expect(sorted[1].exerciseId).toBe('ex2')
  })

  it('returns stats', () => {
    const reviews = [scheduler.createInitialReview('ex1', 'res1')]
    const stats = scheduler.getStats(reviews)
    expect(stats.total).toBe(1)
    expect(stats.dueNow).toBeGreaterThanOrEqual(0)
    expect(stats.averageEaseFactor).toBeGreaterThan(0)
  })
})
