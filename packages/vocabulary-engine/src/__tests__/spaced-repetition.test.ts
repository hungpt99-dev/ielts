import { describe, it, expect } from 'vitest'
import {
  getInitialReviewEntry,
  calculateNextReview,
  getDailyReviewQueue,
  getDueReviewEntries,
} from '../domain/policies/spaced-repetition'
import type { VocabReviewEntry } from '@ielts/storage'

function makeReview(overrides: Partial<VocabReviewEntry> = {}): VocabReviewEntry {
  const now = new Date().toISOString()
  return {
    id: 'review-1',
    vocabularyId: 'vocab-1',
    interval: 0,
    easeFactor: 2.5,
    repetitions: 0,
    nextReviewDate: now,
    lastReviewDate: now,
    history: [],
    ...overrides,
  }
}

describe('spaced-repetition policies', () => {
  describe('getInitialReviewEntry', () => {
    it('creates an initial review with default SM-2 values', () => {
      const now = new Date('2026-01-01T00:00:00Z')
      const entry = getInitialReviewEntry('vocab-1', now)
      expect(entry.vocabularyId).toBe('vocab-1')
      expect(entry.interval).toBe(0)
      expect(entry.easeFactor).toBe(2.5)
      expect(entry.repetitions).toBe(0)
      expect(entry.history).toEqual([])
    })
  })

  describe('calculateNextReview', () => {
    it('applies the again rating: resets repetitions and reduces ease factor', () => {
      const now = new Date('2026-01-10T00:00:00Z')
      const entry = makeReview({ interval: 10, easeFactor: 2.5, repetitions: 4 })
      const next = calculateNextReview(entry, 'again', now)
      expect(next.interval).toBe(1)
      expect(next.repetitions).toBe(0)
      expect(next.easeFactor).toBeCloseTo(2.3)
      expect(next.history).toHaveLength(1)
      expect(next.history[0].rating).toBe('again')
    })

    it('applies the easy rating with a 1.3 interval bonus', () => {
      const now = new Date('2026-01-10T00:00:00Z')
      const entry = makeReview({ interval: 10, easeFactor: 2.5, repetitions: 3 })
      const next = calculateNextReview(entry, 'easy', now)
      expect(next.interval).toBe(Math.round(10 * 2.5 * 1.3))
      expect(next.easeFactor).toBeCloseTo(2.65)
    })

    it('clamps ease factor at the 1.3 floor', () => {
      const now = new Date('2026-01-10T00:00:00Z')
      const entry = makeReview({ interval: 1, easeFactor: 1.3, repetitions: 0 })
      const next = calculateNextReview(entry, 'again', now)
      expect(next.easeFactor).toBe(1.3)
    })
  })

  describe('getDailyReviewQueue', () => {
    it('returns due and new words while excluding mastered words', () => {
      const now = '2026-01-10T00:00:00.000Z'
      const vocabulary = [
        { id: 'v1', word: 'due', status: 'learning' as const, topic: 'general' },
        { id: 'v2', word: 'new', status: 'new' as const, topic: 'general' },
        { id: 'v3', word: 'mastered', status: 'mastered' as const, topic: 'general' },
      ]
      const reviews = [
        { id: 'r1', vocabularyId: 'v1', nextReviewDate: '2026-01-05T00:00:00.000Z' } as VocabReviewEntry,
      ]
      const queue = getDailyReviewQueue(vocabulary as never, reviews, now)
      expect(queue.map(q => q.vocab.id).sort()).toEqual(['v1', 'v2'])
    })

    it('excludes words whose next review is in the future', () => {
      const now = '2026-01-10T00:00:00.000Z'
      const vocabulary = [{ id: 'v1', word: 'future', status: 'learning' as const, topic: 'general' }]
      const reviews = [
        { id: 'r1', vocabularyId: 'v1', nextReviewDate: '2026-01-20T00:00:00.000Z' } as VocabReviewEntry,
      ]
      const queue = getDailyReviewQueue(vocabulary as never, reviews, now)
      expect(queue).toHaveLength(0)
    })
  })

  describe('getDueReviewEntries', () => {
    it('sorts due reviews by next review date ascending', () => {
      const today = new Date('2026-01-10T00:00:00Z')
      const reviews = [
        makeReview({ id: 'r1', nextReviewDate: '2026-01-09T00:00:00.000Z' }),
        makeReview({ id: 'r2', nextReviewDate: '2026-01-08T00:00:00.000Z' }),
      ]
      const due = getDueReviewEntries(reviews, today)
      expect(due.map(r => r.id)).toEqual(['r2', 'r1'])
    })
  })
})
