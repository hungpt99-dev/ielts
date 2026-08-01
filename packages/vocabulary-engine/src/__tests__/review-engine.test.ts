import { describe, it, expect, beforeEach } from 'vitest'
import { ReviewEngine } from '../application/review-engine'
import { InMemoryVocabularyRepository, InMemoryVocabReviewRepository } from '../infrastructure/in-memory-repositories'
import type { VocabularyEntry } from '@ielts/storage'

function makeVocab(overrides: Partial<VocabularyEntry> = {}): Omit<VocabularyEntry, 'id'> & { id?: string } {
  const now = new Date().toISOString()
  return {
    word: 'test',
    meaning: 'a procedure intended to establish quality',
    translation: '',
    pronunciation: '',
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
    cefrLevel: '',
    ieltsRelevance: '',
    tags: [],
    sourceSentence: '',
    pageTitle: '',
    pageUrl: '',
    addedToReview: true,
    reviewId: '',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

describe('ReviewEngine', () => {
  let vocabularyRepository: InMemoryVocabularyRepository
  let vocabReviewRepository: InMemoryVocabReviewRepository
  let engine: ReviewEngine

  beforeEach(() => {
    vocabularyRepository = new InMemoryVocabularyRepository()
    vocabReviewRepository = new InMemoryVocabReviewRepository()
    engine = new ReviewEngine({ vocabularyRepository, vocabReviewRepository })
  })

  describe('buildReviewQueue', () => {
    it('includes new and due words, excludes mastered words', async () => {
      await vocabularyRepository.create(makeVocab({ word: 'new-word', status: 'new' }))
      await vocabularyRepository.create(makeVocab({ word: 'mastered-word', status: 'mastered' }))
      const queue = await engine.buildReviewQueue()
      expect(queue.map(q => q.vocab.word)).toEqual(['new-word'])
    })

    it('applies topic filter', async () => {
      await vocabularyRepository.create(makeVocab({ word: 'food-word', topic: 'food' }))
      await vocabularyRepository.create(makeVocab({ word: 'transport-word', topic: 'transport' }))
      const queue = await engine.buildReviewQueue({ topics: ['food'] })
      expect(queue.map(q => q.vocab.word)).toEqual(['food-word'])
    })

    it('limits the queue to session size', async () => {
      for (let i = 0; i < 5; i++) {
        await vocabularyRepository.create(makeVocab({ word: `w${i}`, status: 'new' }))
      }
      const queue = await engine.buildReviewQueue({ sessionSize: 2 })
      expect(queue.length).toBeLessThanOrEqual(2)
    })
  })

  describe('rateWord', () => {
    it('creates a review entry on first rating', async () => {
      const vocab = await vocabularyRepository.create(makeVocab({ word: 'first' }))
      const result = await engine.rateWord(vocab, 'good')
      expect(result.review.vocabularyId).toBe(vocab.id)
      expect(result.review.history).toHaveLength(1)
      expect(await vocabRepositoryHasReview(vocab.id)).toBe(true)
    })

    it('demotes a reviewing word back to learning on again', async () => {
      const vocab = await vocabularyRepository.create(makeVocab({ word: 'revisit', status: 'reviewing' }))
      const result = await engine.rateWord(vocab, 'again')
      expect(result.vocab.status).toBe('learning')
    })

    it('masters a reviewing word on easy', async () => {
      const vocab = await vocabularyRepository.create(makeVocab({ word: 'master', status: 'reviewing' }))
      const result = await engine.rateWord(vocab, 'easy')
      expect(result.vocab.status).toBe('mastered')
    })

    it('keeps learning status for a new word rated good', async () => {
      const vocab = await vocabularyRepository.create(makeVocab({ word: 'steady', status: 'new' }))
      const result = await engine.rateWord(vocab, 'good')
      expect(result.vocab.status).toBe('learning')
    })
  })

  describe('getDueCount', () => {
    it('returns zero when nothing is due', async () => {
      await vocabularyRepository.create(makeVocab({ word: 'future', status: 'mastered' }))
      const count = await engine.getDueCount()
      expect(count).toBe(0)
    })
  })

  async function vocabRepositoryHasReview(vocabularyId: string): Promise<boolean> {
    const review = await vocabReviewRepository.findByVocabularyId(vocabularyId)
    return review !== undefined
  }
})
