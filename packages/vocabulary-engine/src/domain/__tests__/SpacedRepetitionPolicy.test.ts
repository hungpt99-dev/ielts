import { describe, it, expect } from 'vitest'
import {
  calculateNextReview,
  getDueReviewQueue,
  predictRecallProbability,
  REVIEW_RATING,
} from '../policies'
import type { ReviewRating, SpacedRepetitionInfo } from '../policies'

const MS_PER_DAY = 86_400_000

function makeSR(overrides: Partial<SpacedRepetitionInfo> = {}): SpacedRepetitionInfo {
  return {
    interval: 0,
    easeFactor: 2.5,
    repetitions: 0,
    stability: 0,
    difficulty: 0.5,
    nextReviewDate: new Date('2025-01-01T00:00:00.000Z'),
    lastReviewDate: new Date('2025-01-01T00:00:00.000Z'),
    history: [],
    ...overrides,
  }
}

describe('calculateNextReview — legacy SM-2 behavior with default params', () => {
  it('AGAIN resets to 1-day interval and penalizes ease factor', () => {
    const result = calculateNextReview(makeSR(), REVIEW_RATING.AGAIN)
    expect(result.interval).toBe(1)
    expect(result.repetitions).toBe(0)
    expect(result.easeFactor).toBe(2.3)
    expect(result.history).toHaveLength(1)
    expect(result.history[0].rating).toBe(REVIEW_RATING.AGAIN)
  })

  it('HARD schedules 1 day on first review and small EF penalty', () => {
    const result = calculateNextReview(makeSR(), REVIEW_RATING.HARD)
    expect(result.interval).toBe(1)
    expect(result.repetitions).toBe(1)
    expect(result.easeFactor).toBe(2.35)
  })

  it('GOOD schedules 1 day on first review and leaves EF unchanged', () => {
    const result = calculateNextReview(makeSR(), REVIEW_RATING.GOOD)
    expect(result.interval).toBe(1)
    expect(result.repetitions).toBe(1)
    expect(result.easeFactor).toBe(2.5)
  })

  it('EASY schedules 4 days on first review and rewards EF', () => {
    const result = calculateNextReview(makeSR(), REVIEW_RATING.EASY)
    expect(result.interval).toBe(4)
    expect(result.repetitions).toBe(1)
    expect(result.easeFactor).toBe(2.65)
  })

  it('second GOOD review jumps to 6 days', () => {
    const result = calculateNextReview(
      makeSR({ interval: 1, repetitions: 1, nextReviewDate: new Date('2025-01-02T00:00:00.000Z') }),
      REVIEW_RATING.GOOD,
    )
    expect(result.interval).toBe(6)
    expect(result.repetitions).toBe(2)
    expect(result.easeFactor).toBe(2.5)
  })

  it('third GOOD review multiplies by ease factor', () => {
    const result = calculateNextReview(
      makeSR({ interval: 6, repetitions: 2 }),
      REVIEW_RATING.GOOD,
    )
    expect(result.interval).toBe(15)
    expect(result.repetitions).toBe(3)
  })

  it('AGAIN after prior reviews resets interval and repetitions', () => {
    const result = calculateNextReview(
      makeSR({ interval: 6, repetitions: 2 }),
      REVIEW_RATING.AGAIN,
    )
    expect(result.interval).toBe(1)
    expect(result.repetitions).toBe(0)
    expect(result.easeFactor).toBe(2.3)
  })

  it('ease factor is clamped to a 1.3 floor', () => {
    const result = calculateNextReview(makeSR({ easeFactor: 1.31 }), REVIEW_RATING.AGAIN)
    expect(result.easeFactor).toBe(1.3)
  })

  it('sets nextReviewDate to UTC start of day plus interval days', () => {
    const now = new Date('2025-06-15T12:00:00.000Z')
    const result = calculateNextReview(makeSR(), REVIEW_RATING.GOOD, 2500, 0.5, 'FLASHCARD', now)
    const expectedNext = Date.UTC(2025, 5, 15) + MS_PER_DAY
    expect(result.nextReviewDate.getTime()).toBe(expectedNext)
    expect(result.lastReviewDate.getTime()).toBe(now.getTime())
  })
})

describe('calculateNextReview — response time adjustment', () => {
  it('fast recall produces a lower difficulty than slow recall', () => {
    const base = makeSR({ interval: 6, repetitions: 2 })
    const fast = calculateNextReview(base, REVIEW_RATING.GOOD, 1250, 0.5)
    const neutral = calculateNextReview(base, REVIEW_RATING.GOOD, 2500, 0.5)
    const slow = calculateNextReview(base, REVIEW_RATING.GOOD, 5000, 0.5)
    expect(fast.difficulty).toBeLessThan(neutral.difficulty)
    expect(slow.difficulty).toBeGreaterThan(neutral.difficulty)
  })

  it('fast recall schedules a longer interval than slow recall', () => {
    const base = makeSR({ interval: 6, repetitions: 2 })
    const fast = calculateNextReview(base, REVIEW_RATING.GOOD, 1250, 0.5)
    const slow = calculateNextReview(base, REVIEW_RATING.GOOD, 5000, 0.5)
    expect(fast.interval).toBeGreaterThan(slow.interval)
  })

  it('records response time in the review history', () => {
    const result = calculateNextReview(makeSR(), REVIEW_RATING.GOOD, 1800, 0.5)
    expect(result.history[0].responseTimeMs).toBe(1800)
  })
})

describe('calculateNextReview — confidence weighting', () => {
  it('high confidence yields a longer interval than low confidence', () => {
    const base = makeSR({ interval: 6, repetitions: 2 })
    const high = calculateNextReview(base, REVIEW_RATING.GOOD, 2500, 1)
    const low = calculateNextReview(base, REVIEW_RATING.GOOD, 2500, 0)
    expect(high.interval).toBeGreaterThan(low.interval)
  })

  it('confidence out of range is clamped', () => {
    const base = makeSR({ interval: 6, repetitions: 2 })
    const clampedHigh = calculateNextReview(base, REVIEW_RATING.GOOD, 2500, 5)
    const neutral = calculateNextReview(base, REVIEW_RATING.GOOD, 2500, 0.5)
    expect(clampedHigh.interval).toBeGreaterThanOrEqual(neutral.interval)
  })

  it('records confidence score in the review history', () => {
    const result = calculateNextReview(makeSR(), REVIEW_RATING.GOOD, 2500, 0.8)
    expect(result.history[0].confidenceScore).toBe(0.8)
  })
})

describe('calculateNextReview — contextual production boost', () => {
  it('WRITING boosts interval by 1.5x', () => {
    const base = makeSR({ interval: 6, repetitions: 2 })
    const flashcard = calculateNextReview(base, REVIEW_RATING.GOOD)
    const writing = calculateNextReview(base, REVIEW_RATING.GOOD, 2500, 0.5, 'WRITING')
    expect(writing.interval).toBe(Math.round(flashcard.interval * 1.5))
  })

  it('SPEAKING boosts interval by 1.5x', () => {
    const base = makeSR({ interval: 6, repetitions: 2 })
    const flashcard = calculateNextReview(base, REVIEW_RATING.GOOD)
    const speaking = calculateNextReview(base, REVIEW_RATING.GOOD, 2500, 0.5, 'SPEAKING')
    expect(speaking.interval).toBe(Math.round(flashcard.interval * 1.5))
  })

  it('READING does not boost the interval', () => {
    const base = makeSR({ interval: 6, repetitions: 2 })
    const flashcard = calculateNextReview(base, REVIEW_RATING.GOOD)
    const reading = calculateNextReview(base, REVIEW_RATING.GOOD, 2500, 0.5, 'READING')
    expect(reading.interval).toBe(flashcard.interval)
  })

  it('AGAIN keeps a 1-day reset even in a production context', () => {
    const result = calculateNextReview(makeSR(), REVIEW_RATING.AGAIN, 2500, 0.5, 'WRITING')
    expect(result.interval).toBe(1)
  })
})

describe('calculateNextReview — monotonic intervals and edge cases', () => {
  it('intervals strictly increase for consistent GOOD ratings', () => {
    let sr = makeSR()
    let previous = 0
    for (let i = 0; i < 6; i++) {
      sr = calculateNextReview(sr, REVIEW_RATING.GOOD)
      expect(sr.interval).toBeGreaterThan(previous)
      previous = sr.interval
    }
  })

  it('intervals stay monotonic even with a slow response time', () => {
    let sr = makeSR()
    let previous = 0
    for (let i = 0; i < 6; i++) {
      sr = calculateNextReview(sr, REVIEW_RATING.GOOD, 5000, 0.5)
      expect(sr.interval).toBeGreaterThan(previous)
      previous = sr.interval
    }
  })

  it('handles intervals beyond 365 days', () => {
    const now = new Date('2025-01-01T12:00:00.000Z')
    const result = calculateNextReview(
      makeSR({ interval: 400, repetitions: 3 }),
      REVIEW_RATING.GOOD,
      2500,
      0.5,
      'FLASHCARD',
      now,
    )
    expect(result.interval).toBeGreaterThan(365)
    expect(result.nextReviewDate.getTime()).toBe(Date.UTC(2025, 0, 1) + result.interval * MS_PER_DAY)
  })

  it('caps the interval at MAX_INTERVAL_DAYS', () => {
    const result = calculateNextReview(
      makeSR({ interval: 36500, easeFactor: 2.5, repetitions: 10 }),
      REVIEW_RATING.EASY,
    )
    expect(result.interval).toBeLessThanOrEqual(36500)
  })

  it('first review initializes stability', () => {
    const result = calculateNextReview(makeSR(), REVIEW_RATING.GOOD)
    expect(result.stability).toBeGreaterThan(0)
  })

  it('is a pure function — same inputs produce same outputs', () => {
    const base = makeSR({ interval: 6, repetitions: 2 })
    const a = calculateNextReview(base, REVIEW_RATING.GOOD, 2000, 0.7, 'WRITING', new Date('2025-01-01T00:00:00.000Z'))
    const b = calculateNextReview(base, REVIEW_RATING.GOOD, 2000, 0.7, 'WRITING', new Date('2025-01-01T00:00:00.000Z'))
    expect(a).toEqual(b)
  })
})

describe('getDueReviewQueue', () => {
  function startOfUtcDay(date: Date): Date {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  }

  it('returns reviews due by start of today, sorted oldest first', () => {
    const todayStart = startOfUtcDay(new Date()).getTime()
    const entries = [
      makeSR({ nextReviewDate: new Date(todayStart + 2 * MS_PER_DAY) }),
      makeSR({ nextReviewDate: new Date(todayStart - MS_PER_DAY) }),
      makeSR({ nextReviewDate: new Date(todayStart) }),
      makeSR({ nextReviewDate: new Date(todayStart + 3 * MS_PER_DAY) }),
    ]
    const queue = getDueReviewQueue(entries)
    expect(queue).toHaveLength(2)
    expect(queue[0]).toBe(entries[1])
    expect(queue[1]).toBe(entries[2])
  })

  it('respects the limit', () => {
    const todayStart = startOfUtcDay(new Date()).getTime()
    const entries = [
      makeSR({ nextReviewDate: new Date(todayStart - MS_PER_DAY) }),
      makeSR({ nextReviewDate: new Date(todayStart) }),
    ]
    const queue = getDueReviewQueue(entries, 1)
    expect(queue).toHaveLength(1)
    expect(queue[0]).toBe(entries[0])
  })

  it('returns an empty array when nothing is due', () => {
    const todayStart = startOfUtcDay(new Date()).getTime()
    const queue = getDueReviewQueue([makeSR({ nextReviewDate: new Date(todayStart + MS_PER_DAY) })])
    expect(queue).toHaveLength(0)
  })
})

describe('predictRecallProbability', () => {
  it('returns 1 when target is before or at the last review date', () => {
    const sr = makeSR({ stability: 10 })
    expect(predictRecallProbability(sr, new Date('2024-12-31T00:00:00.000Z'))).toBe(1)
    expect(predictRecallProbability(sr, new Date('2025-01-01T00:00:00.000Z'))).toBe(1)
  })

  it('decays exponentially with elapsed time', () => {
    const sr = makeSR({ stability: 10, lastReviewDate: new Date('2025-01-01T00:00:00.000Z') })
    const probability = predictRecallProbability(sr, new Date('2025-01-11T00:00:00.000Z'))
    expect(probability).toBeCloseTo(Math.exp(-1), 5)
  })

  it('predicts ~0.9 recall at the next review date', () => {
    const sr = makeSR({ stability: 100, interval: 10, lastReviewDate: new Date('2025-01-01T00:00:00.000Z') })
    const probability = predictRecallProbability(sr, new Date('2025-01-11T00:00:00.000Z'))
    expect(probability).toBeCloseTo(Math.exp(-0.1), 5)
  })

  it('stays within [0, 1] for far-future targets', () => {
    const sr = makeSR({ stability: 10, lastReviewDate: new Date('2025-01-01T00:00:00.000Z') })
    const probability = predictRecallProbability(sr, new Date('2030-01-01T00:00:00.000Z'))
    expect(probability).toBeGreaterThanOrEqual(0)
    expect(probability).toBeLessThan(1)
  })
})

describe('calculateNextReview — combined enhancements', () => {
  it('applies response time, confidence, and production context together', () => {
    const base = makeSR({ interval: 6, repetitions: 2 })
    const result = calculateNextReview(base, REVIEW_RATING.GOOD, 1250, 0.8, 'WRITING')
    const flashcard = calculateNextReview(base, REVIEW_RATING.GOOD, 1250, 0.8, 'FLASHCARD')
    expect(result.interval).toBe(Math.round(flashcard.interval * 1.5))
    expect(result.difficulty).toBeLessThan(base.difficulty)
    expect(result.history[0].context).toBe('WRITING')
  })

  it('covers every rating in a review cycle', () => {
    const ratings: ReviewRating[] = [
      REVIEW_RATING.GOOD,
      REVIEW_RATING.GOOD,
      REVIEW_RATING.HARD,
      REVIEW_RATING.EASY,
      REVIEW_RATING.AGAIN,
    ]
    let sr = makeSR()
    for (const rating of ratings) {
      sr = calculateNextReview(sr, rating)
    }
    expect(sr.history).toHaveLength(ratings.length)
    expect(sr.interval).toBeGreaterThan(0)
    expect(sr.easeFactor).toBeGreaterThanOrEqual(1.3)
  })
})
