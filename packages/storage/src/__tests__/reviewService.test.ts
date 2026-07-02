import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { VocabReviewEntry, ReviewStats, ReviewRating } from '../reviewService'
import {
  addVocabularyToReview,
  getDueReviews,
  updateReview,
  getReviewStats,
} from '../reviewService'

function createMockStorage() {
  const store = new Map<string, unknown>()
  return {
    get: vi.fn(async (key: string) => store.get(key) ?? null) as (key: string) => Promise<VocabReviewEntry[] | null>,
    set: vi.fn(async (key: string, value: unknown) => { store.set(key, value) }) as (key: string, value: unknown) => Promise<void>,
    store,
  }
}

describe('reviewService', () => {
  let storage: ReturnType<typeof createMockStorage>

  beforeEach(() => {
    storage = createMockStorage()
  })

  describe('addVocabularyToReview', () => {
    it('creates a new review entry with SM-2 defaults', async () => {
      const entry = await addVocabularyToReview('vocab-1', storage.get, storage.set)
      expect(entry.vocabularyId).toBe('vocab-1')
      expect(entry.interval).toBe(1)
      expect(entry.easeFactor).toBe(2.5)
      expect(entry.repetitions).toBe(0)
      expect(entry.history).toEqual([])
      expect(entry.id).toBeTruthy()
    })

    it('appends to existing reviews', async () => {
      const existing: VocabReviewEntry[] = [{ id: 'existing', vocabularyId: 'v1', interval: 1, easeFactor: 2.5, repetitions: 0, nextReviewDate: '', lastReviewDate: '', history: [] }]
      storage.store.set('vocabularyReviews', existing)
      await addVocabularyToReview('vocab-2', storage.get, storage.set)
      expect(storage.set).toHaveBeenCalled()
      const saved = storage.store.get('vocabularyReviews') as VocabReviewEntry[]
      expect(saved).toHaveLength(2)
    })
  })

  describe('getDueReviews', () => {
    it('returns empty when no reviews exist', async () => {
      const due = await getDueReviews(storage.get)
      expect(due).toEqual([])
    })

    it('returns only overdue reviews sorted by date', async () => {
      const reviews: VocabReviewEntry[] = [
        { id: 'r1', vocabularyId: 'v1', interval: 1, easeFactor: 2.5, repetitions: 0, nextReviewDate: '2020-01-01T00:00:00.000Z', lastReviewDate: '', history: [] },
        { id: 'r2', vocabularyId: 'v2', interval: 1, easeFactor: 2.5, repetitions: 0, nextReviewDate: '2099-01-01T00:00:00.000Z', lastReviewDate: '', history: [] },
        { id: 'r3', vocabularyId: 'v3', interval: 1, easeFactor: 2.5, repetitions: 0, nextReviewDate: '2021-01-01T00:00:00.000Z', lastReviewDate: '', history: [] },
      ]
      storage.store.set('vocabularyReviews', reviews)
      const due = await getDueReviews(storage.get)
      expect(due).toHaveLength(2)
      expect(due[0].id).toBe('r1')
      expect(due[1].id).toBe('r3')
    })
  })

  describe('updateReview', () => {
    it('returns null for non-existent review', async () => {
      const result = await updateReview('nonexistent', 'good' as ReviewRating, storage.get, storage.set)
      expect(result).toBeNull()
    })

    it('handles "again" rating by resetting', async () => {
      const review: VocabReviewEntry = { id: 'r1', vocabularyId: 'v1', interval: 10, easeFactor: 2.5, repetitions: 3, nextReviewDate: '2020-01-01', lastReviewDate: '2020-01-01', history: [] }
      storage.store.set('vocabularyReviews', [review])
      const updated = await updateReview('r1', 'again' as ReviewRating, storage.get, storage.set)
      expect(updated!.repetitions).toBe(0)
      expect(updated!.interval).toBe(0)
      expect(updated!.easeFactor).toBeLessThan(2.5)
    })

    it('handles "good" rating with proper interval progression', async () => {
      const review: VocabReviewEntry = { id: 'r2', vocabularyId: 'v1', interval: 0, easeFactor: 2.5, repetitions: 0, nextReviewDate: '2020-01-01', lastReviewDate: '2020-01-01', history: [] }
      storage.store.set('vocabularyReviews', [review])
      const first = await updateReview('r2', 'good' as ReviewRating, storage.get, storage.set)
      expect(first!.interval).toBe(1)
      expect(first!.repetitions).toBe(1)

      await updateReview('r2', 'good' as ReviewRating, storage.get, storage.set)
      const second = await updateReview('r2', 'good' as ReviewRating, storage.get, storage.set)
      expect(second!.repetitions).toBe(3)
      expect(second!.interval).toBeGreaterThan(1)
    })

    it('handles "easy" rating with bonus interval', async () => {
      const review: VocabReviewEntry = { id: 'r3', vocabularyId: 'v1', interval: 0, easeFactor: 2.5, repetitions: 0, nextReviewDate: '2020-01-01', lastReviewDate: '2020-01-01', history: [] }
      storage.store.set('vocabularyReviews', [review])
      const updated = await updateReview('r3', 'easy' as ReviewRating, storage.get, storage.set)
      expect(updated!.interval).toBe(2)
      expect(updated!.easeFactor).toBeGreaterThan(2.5)
    })

    it('handles "hard" rating', async () => {
      const review: VocabReviewEntry = { id: 'r4', vocabularyId: 'v1', interval: 5, easeFactor: 2.5, repetitions: 2, nextReviewDate: '2020-01-01', lastReviewDate: '2020-01-01', history: [] }
      storage.store.set('vocabularyReviews', [review])
      const updated = await updateReview('r4', 'hard' as ReviewRating, storage.get, storage.set)
      expect(updated!.interval).toBeGreaterThanOrEqual(1)
      expect(updated!.easeFactor).toBeLessThan(2.5)
    })

    it('records history entry for each review', async () => {
      const review: VocabReviewEntry = { id: 'r5', vocabularyId: 'v1', interval: 1, easeFactor: 2.5, repetitions: 0, nextReviewDate: '2020-01-01', lastReviewDate: '2020-01-01', history: [] }
      storage.store.set('vocabularyReviews', [review])
      await updateReview('r5', 'good' as ReviewRating, storage.get, storage.set)
      const saved = (storage.store.get('vocabularyReviews') as VocabReviewEntry[])[0]
      expect(saved.history).toHaveLength(1)
    })
  })

  describe('getReviewStats', () => {
    it('returns zeros when no reviews', async () => {
      const stats = await getReviewStats(storage.get)
      expect(stats).toEqual({ dueCount: 0, totalCount: 0, masteredCount: 0, learningCount: 0 })
    })

    it('correctly identifies mastered vs learning', async () => {
      const reviews: VocabReviewEntry[] = [
        { id: 'r1', vocabularyId: 'v1', interval: 30, easeFactor: 2.5, repetitions: 6, nextReviewDate: '2020-01-01', lastReviewDate: '2020-01-01', history: [] },
        { id: 'r2', vocabularyId: 'v2', interval: 1, easeFactor: 2.5, repetitions: 0, nextReviewDate: '2099-01-01', lastReviewDate: '2099-01-01', history: [] },
      ]
      storage.store.set('vocabularyReviews', reviews)
      const stats = await getReviewStats(storage.get)
      expect(stats.totalCount).toBe(2)
      expect(stats.masteredCount).toBe(1)
      expect(stats.learningCount).toBe(1)
    })
  })
})
