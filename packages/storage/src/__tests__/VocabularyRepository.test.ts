import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import 'fake-indexeddb/auto'
import { initDb, destroyDb, getDb } from '../db'
import { APP_SCHEMA } from '../migrations'
import { VocabularyRepository, VocabReviewRepository } from '../repositories'
import type { VocabularyEntry, VocabReviewEntry } from '../repositories/VocabularyRepository'

function setupDb() {
  destroyDb()
  initDb(APP_SCHEMA)
}

async function clearData() {
  const db = getDb()
  await db.table('vocabulary').clear()
  await db.table('vocabularyReviews').clear()
}

function makeVocab(overrides: Partial<VocabularyEntry> = {}): Omit<VocabularyEntry, 'id'> {
  const now = new Date().toISOString()
  return {
    word: 'test',
    meaning: 'a procedure intended to establish quality',
    meaningVi: '',
    pronunciation: '/tɛst/',
    partOfSpeech: 'noun',
    topic: 'general',
    exampleSentence: 'This is a test.',
    collocations: [],
    synonyms: [],
    antonyms: [],
    wordFamily: [],
    personalNote: '',
    difficulty: 'medium',
    status: 'new',
    tags: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  } as Omit<VocabularyEntry, 'id'>
}

function makeReview(overrides: Partial<VocabReviewEntry> = {}): Omit<VocabReviewEntry, 'id'> {
  const now = new Date().toISOString()
  return {
    vocabularyId: 'vocab-1',
    interval: 1,
    easeFactor: 2.5,
    repetitions: 0,
    nextReviewDate: now,
    lastReviewDate: now,
    history: [],
    ...overrides,
  } as Omit<VocabReviewEntry, 'id'>
}

describe('VocabularyRepository', () => {
  let repo: VocabularyRepository

  beforeEach(async () => {
    setupDb()
    await clearData()
    repo = new VocabularyRepository()
  })

  afterEach(() => {
    destroyDb()
  })

  describe('findByTopic', () => {
    it('filters vocabulary by topic', async () => {
      await repo.create(makeVocab({ word: 'apple', topic: 'food' }))
      await repo.create(makeVocab({ word: 'car', topic: 'transport' }))
      const results = await repo.findByTopic('food')
      expect(results).toHaveLength(1)
      expect(results[0].word).toBe('apple')
    })
  })

  describe('findByStatus', () => {
    it('filters vocabulary by status', async () => {
      await repo.create(makeVocab({ word: 'new-word', status: 'new' }))
      await repo.create(makeVocab({ word: 'learning-word', status: 'learning' }))
      const results = await repo.findByStatus('new')
      expect(results).toHaveLength(1)
    })
  })

  describe('findByDifficulty', () => {
    it('filters vocabulary by difficulty', async () => {
      await repo.create(makeVocab({ word: 'easy-word', difficulty: 'easy' }))
      await repo.create(makeVocab({ word: 'hard-word', difficulty: 'hard' }))
      const results = await repo.findByDifficulty('hard')
      expect(results).toHaveLength(1)
    })
  })

  describe('getStats', () => {
    it('returns stats with counts by status and difficulty', async () => {
      await repo.create(makeVocab({ word: 'w1', status: 'new', difficulty: 'easy' }))
      await repo.create(makeVocab({ word: 'w2', status: 'new', difficulty: 'medium' }))
      await repo.create(makeVocab({ word: 'w3', status: 'learning', difficulty: 'hard' }))
      const stats = await repo.getStats()
      expect(stats.total).toBe(3)
      expect(stats.byStatus.new).toBe(2)
      expect(stats.byStatus.learning).toBe(1)
      expect(stats.byDifficulty.easy).toBe(1)
      expect(stats.byDifficulty.medium).toBe(1)
      expect(stats.byDifficulty.hard).toBe(1)
    })

    it('returns empty stats when no vocabulary', async () => {
      const stats = await repo.getStats()
      expect(stats.total).toBe(0)
      expect(stats.byStatus).toEqual({})
      expect(stats.byDifficulty).toEqual({})
    })
  })
})

describe('VocabReviewRepository', () => {
  let repo: VocabReviewRepository

  beforeEach(async () => {
    setupDb()
    await clearData()
    repo = new VocabReviewRepository()
  })

  afterEach(() => {
    destroyDb()
  })

  describe('findByVocabularyId', () => {
    it('finds review by vocabulary id', async () => {
      const review = await repo.create(makeReview({ vocabularyId: 'v1' }))
      const found = await repo.findByVocabularyId('v1')
      expect(found).toBeDefined()
      expect(found!.id).toBe(review.id)
    })

    it('returns undefined when no review exists', async () => {
      const found = await repo.findByVocabularyId('nonexistent')
      expect(found).toBeUndefined()
    })
  })

  describe('findDueReviews', () => {
    it('returns reviews with past due date', async () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1)
      await repo.create(makeReview({ nextReviewDate: pastDate.toISOString() }))
      const futureDate = new Date(Date.now() + 86400000)
      await repo.create(makeReview({ nextReviewDate: futureDate.toISOString() }))
      const due = await repo.findDueReviews()
      expect(due.length).toBeGreaterThanOrEqual(1)
    })

    it('returns empty when no reviews due', async () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 7)
      await repo.create(makeReview({ nextReviewDate: futureDate.toISOString() }))
      const due = await repo.findDueReviews()
      expect(due).toHaveLength(0)
    })
  })

  describe('getDueCount', () => {
    it('returns count of due reviews', async () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1)
      await repo.create(makeReview({ nextReviewDate: pastDate.toISOString() }))
      const count = await repo.getDueCount()
      expect(count).toBeGreaterThanOrEqual(1)
    })
  })

  describe('getReviewStats', () => {
    it('returns review statistics', async () => {
      await repo.create(makeReview({ interval: 1, repetitions: 0 }))
      await repo.create(makeReview({ interval: 30, repetitions: 6 }))
      const stats = await repo.getReviewStats()
      expect(stats.totalCount).toBe(2)
      expect(stats.masteredCount).toBeGreaterThanOrEqual(1)
      expect(stats.learningCount).toBeGreaterThanOrEqual(1)
    })
  })
})
