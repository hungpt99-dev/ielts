import { describe, it, expect } from 'vitest'
import { calculateNextReview, getInitialReviewEntry, getDailyReviewQueue } from './spaced-repetition'
import type { VocabReviewEntry, VocabularyEntry } from '../models'

function makeVocab(id: string, status: VocabularyEntry['status'] = 'new'): VocabularyEntry {
  return {
    id,
    word: 'test',
    meaning: 'a test',
    meaningVi: '',
    pronunciation: '',
    partOfSpeech: 'noun',
    topic: 'Education',
    exampleSentence: '',
    collocations: [],
    synonyms: [],
    antonyms: [],
    wordFamily: [],
    personalNote: '',
    difficulty: 'medium',
    status,
    tags: [],
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  }
}

describe('getInitialReviewEntry', () => {
  it('creates a review entry with default values', () => {
    const entry = getInitialReviewEntry('vocab-1')
    expect(entry.vocabularyId).toBe('vocab-1')
    expect(entry.interval).toBe(0)
    expect(entry.easeFactor).toBe(2.5)
    expect(entry.repetitions).toBe(0)
    expect(entry.history).toEqual([])
    expect(entry.id).toBeTruthy()
  })
})

describe('calculateNextReview', () => {
  it('returns initial entry with 1-day interval when rating is again', () => {
    const entry: VocabReviewEntry = {
      id: 'r1',
      vocabularyId: 'v1',
      interval: 0,
      easeFactor: 2.5,
      repetitions: 0,
      nextReviewDate: '2025-01-01T00:00:00.000Z',
      lastReviewDate: '2025-01-01T00:00:00.000Z',
      history: [],
    }

    const result = calculateNextReview(entry, 'again')

    expect(result.interval).toBe(1)
    expect(result.repetitions).toBe(0)
    expect(result.easeFactor).toBe(2.3)
    expect(result.history).toHaveLength(1)
    expect(result.history[0].rating).toBe('again')
  })

  it('returns 1-day interval when rating is hard on first review', () => {
    const entry: VocabReviewEntry = {
      id: 'r1',
      vocabularyId: 'v1',
      interval: 0,
      easeFactor: 2.5,
      repetitions: 0,
      nextReviewDate: '2025-01-01T00:00:00.000Z',
      lastReviewDate: '2025-01-01T00:00:00.000Z',
      history: [],
    }

    const result = calculateNextReview(entry, 'hard')

    expect(result.interval).toBe(1)
    expect(result.repetitions).toBe(1)
    expect(result.easeFactor).toBe(2.35)
    expect(result.history).toHaveLength(1)
  })

  it('returns 1-day interval when rating is good on first review', () => {
    const entry: VocabReviewEntry = {
      id: 'r1',
      vocabularyId: 'v1',
      interval: 0,
      easeFactor: 2.5,
      repetitions: 0,
      nextReviewDate: '2025-01-01T00:00:00.000Z',
      lastReviewDate: '2025-01-01T00:00:00.000Z',
      history: [],
    }

    const result = calculateNextReview(entry, 'good')

    expect(result.interval).toBe(1)
    expect(result.repetitions).toBe(1)
    expect(result.easeFactor).toBe(2.5)
    expect(result.history).toHaveLength(1)
  })

  it('returns 4-day interval with easy on first review', () => {
    const entry: VocabReviewEntry = {
      id: 'r1',
      vocabularyId: 'v1',
      interval: 0,
      easeFactor: 2.5,
      repetitions: 0,
      nextReviewDate: '2025-01-01T00:00:00.000Z',
      lastReviewDate: '2025-01-01T00:00:00.000Z',
      history: [],
    }

    const result = calculateNextReview(entry, 'easy')

    expect(result.interval).toBe(4)
    expect(result.repetitions).toBe(1)
    expect(result.easeFactor).toBe(2.65)
  })

  it('increases interval on second good review', () => {
    const entry: VocabReviewEntry = {
      id: 'r1',
      vocabularyId: 'v1',
      interval: 1,
      easeFactor: 2.5,
      repetitions: 1,
      nextReviewDate: '2025-01-02T00:00:00.000Z',
      lastReviewDate: '2025-01-01T00:00:00.000Z',
      history: [{ date: '2025-01-01T00:00:00.000Z', rating: 'good' }],
    }

    const result = calculateNextReview(entry, 'good')

    expect(result.interval).toBe(6)
    expect(result.repetitions).toBe(2)
    expect(result.easeFactor).toBe(2.5)
  })

  it('resets interval to 1 when rating is again after prior reviews', () => {
    const entry: VocabReviewEntry = {
      id: 'r1',
      vocabularyId: 'v1',
      interval: 6,
      easeFactor: 2.5,
      repetitions: 2,
      nextReviewDate: '2025-01-07T00:00:00.000Z',
      lastReviewDate: '2025-01-01T00:00:00.000Z',
      history: [
        { date: '2025-01-01T00:00:00.000Z', rating: 'good' },
        { date: '2025-01-07T00:00:00.000Z', rating: 'good' },
      ],
    }

    const result = calculateNextReview(entry, 'again')

    expect(result.interval).toBe(1)
    expect(result.repetitions).toBe(0)
    expect(result.easeFactor).toBe(2.3)
  })

  it('sets nextReviewDate to today plus interval days', () => {
    const now = new Date('2025-06-15T12:00:00.000Z')
    const entry: VocabReviewEntry = {
      id: 'r1',
      vocabularyId: 'v1',
      interval: 0,
      easeFactor: 2.5,
      repetitions: 0,
      nextReviewDate: '2025-06-15T00:00:00.000Z',
      lastReviewDate: '2025-06-15T00:00:00.000Z',
      history: [],
    }

    const result = calculateNextReview(entry, 'good', now)

    const expectedNext = new Date('2025-06-16T00:00:00.000Z')
    expect(new Date(result.nextReviewDate).getTime()).toBe(expectedNext.getTime())
    expect(new Date(result.lastReviewDate).getTime()).toBe(now.getTime())
  })
})

describe('getDailyReviewQueue', () => {
  it('returns words due for review sorted by nextReviewDate', () => {
    const today = '2025-06-15'
    const vocabulary = [
      makeVocab('v1', 'reviewing'),
      makeVocab('v2', 'learning'),
      makeVocab('v3', 'mastered'),
      makeVocab('v4', 'new'),
    ]
    const reviews: VocabReviewEntry[] = [
      { id: 'r1', vocabularyId: 'v1', interval: 6, easeFactor: 2.5, repetitions: 2, nextReviewDate: '2025-06-14T00:00:00.000Z', lastReviewDate: '2025-06-08T00:00:00.000Z', history: [] },
      { id: 'r2', vocabularyId: 'v2', interval: 1, easeFactor: 2.5, repetitions: 1, nextReviewDate: '2025-06-15T00:00:00.000Z', lastReviewDate: '2025-06-14T00:00:00.000Z', history: [] },
      { id: 'r3', vocabularyId: 'v3', interval: 30, easeFactor: 2.5, repetitions: 5, nextReviewDate: '2025-07-15T00:00:00.000Z', lastReviewDate: '2025-06-15T00:00:00.000Z', history: [] },
    ]

    const queue = getDailyReviewQueue(vocabulary, reviews, today)

    expect(queue).toHaveLength(3)
    expect(queue[0].vocab.id).toBe('v1')
    expect(queue[1].vocab.id).toBe('v2')
    expect(queue[2].vocab.id).toBe('v4')
  })

  it('returns empty array when nothing is due', () => {
    const vocabulary = [makeVocab('v1', 'mastered')]
    const reviews: VocabReviewEntry[] = [
      { id: 'r1', vocabularyId: 'v1', interval: 30, easeFactor: 2.5, repetitions: 5, nextReviewDate: '2025-07-15T00:00:00.000Z', lastReviewDate: '2025-06-15T00:00:00.000Z', history: [] },
    ]

    const queue = getDailyReviewQueue(vocabulary, reviews, '2025-06-15')

    expect(queue).toHaveLength(0)
  })

  it('includes new words without review entries', () => {
    const vocabulary = [makeVocab('v1', 'new'), makeVocab('v2', 'learning')]
    const reviews: VocabReviewEntry[] = [
      { id: 'r1', vocabularyId: 'v2', interval: 30, easeFactor: 2.5, repetitions: 5, nextReviewDate: '2025-07-15T00:00:00.000Z', lastReviewDate: '2025-06-15T00:00:00.000Z', history: [] },
    ]

    const queue = getDailyReviewQueue(vocabulary, reviews, '2025-06-15')

    expect(queue).toHaveLength(1)
    expect(queue[0].vocab.id).toBe('v1')
  })

  it('does not include mastered words', () => {
    const vocabulary = [makeVocab('v1', 'mastered')]

    const queue = getDailyReviewQueue(vocabulary, [], '2025-06-15')

    expect(queue).toHaveLength(0)
  })
})
