import { describe, it, expect } from 'vitest'
import { ReviewSchedulerService } from '../review-scheduler/ReviewSchedulerService'

describe('ReviewSchedulerService', () => {
  const service = new ReviewSchedulerService()

  const createVocab = (id: string, status: string = 'learning') => ({
    id,
    word: `word-${id}`,
    meaning: 'meaning',
    meaningVi: '',
    pronunciation: '',
    partOfSpeech: 'noun',
    topic: 'general',
    exampleSentence: '',
    collocations: [],
    synonyms: [],
    antonyms: [],
    wordFamily: [],
    personalNote: '',
    difficulty: 'medium' as const,
    status: status as any,
    tags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })

  const createReview = (vocabId: string, nextDate: Date, interval = 1, repetitions = 1, easeFactor = 2.5) => ({
    id: `review-${vocabId}`,
    vocabularyId: vocabId,
    interval,
    easeFactor,
    repetitions,
    nextReviewDate: nextDate.toISOString(),
    lastReviewDate: new Date().toISOString(),
    history: [],
  })

  it('returns due vocabulary reviews', () => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const vocab = [createVocab('v1'), createVocab('v2'), createVocab('v3', 'mastered')]
    const reviews = [createReview('v1', yesterday)]

    const due = service.getDueVocabularyReviews(vocab, reviews)
    expect(due.length).toBeGreaterThanOrEqual(1)
    expect(due.find(d => d.vocabulary.id === 'v1')).toBeTruthy()
  })

  it('does not return mastered vocabulary', () => {
    const vocab = [createVocab('v1', 'mastered')]
    const reviews: any[] = []

    const due = service.getDueVocabularyReviews(vocab, reviews)
    expect(due.length).toBe(0)
  })

  it('creates initial review entry for new vocabulary without review', () => {
    const vocab = [createVocab('v1', 'new')]
    const reviews: any[] = []

    const due = service.getDueVocabularyReviews(vocab, reviews)
    expect(due.length).toBe(1)
    expect(due[0].review.vocabularyId).toBe('v1')
  })

  it('implements SM-2 algorithm correctly for "again" rating', () => {
    const now = new Date()
    const entry = createReview('v1', now, 10, 5, 2.5)
    const updated = service.calculateNextReview(entry, 'again', now)

    expect(updated.repetitions).toBe(0)
    expect(updated.interval).toBe(1)
    expect(updated.easeFactor).toBeLessThan(2.5)
  })

  it('implements SM-2 algorithm correctly for "good" rating', () => {
    const now = new Date()
    const entry = createReview('v1', now, 0, 0, 2.5)
    const updated = service.calculateNextReview(entry, 'good', now)

    expect(updated.repetitions).toBe(1)
    expect(updated.interval).toBeGreaterThanOrEqual(1)
  })

  it('implements SM-2 algorithm correctly for "easy" rating', () => {
    const now = new Date()
    const entry = createReview('v1', now, 0, 0, 2.5)
    const updated = service.calculateNextReview(entry, 'easy', now)

    expect(updated.repetitions).toBe(1)
    expect(updated.interval).toBeGreaterThanOrEqual(4)
    expect(updated.easeFactor).toBeGreaterThan(2.5)
  })

  it('calculates review stats correctly', () => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const farFuture = new Date(today)
    farFuture.setDate(farFuture.getDate() + 30)

    const reviews = [
      createReview('v1', yesterday, 1, 1),
      createReview('v2', yesterday, 30, 10),
      createReview('v3', farFuture, 1, 1),
    ]

    const stats = service.getReviewStats(reviews)
    expect(stats.dueCount).toBe(2)
    expect(stats.totalCount).toBe(3)
    expect(stats.masteredCount).toBe(1)
    expect(stats.learningCount).toBe(2)
  })

  it('returns due mistake reviews', () => {
    const oldDate = new Date()
    oldDate.setDate(oldDate.getDate() - 5)

    const mistakes = [
      {
        id: 'm1',
        mistake: 'common grammar error',
        correction: 'corrected version',
        explanation: 'explanation',
        source: 'test',
        date: oldDate.toISOString(),
        skill: 'grammar' as const,
        status: 'new' as const,
        repetitionCount: 3,
        createdAt: oldDate.toISOString(),
        updatedAt: oldDate.toISOString(),
      },
    ]

    const due = service.getDueMistakeReviews(mistakes)
    expect(due.length).toBe(1)
    expect(due[0].daysSinceLastReview).toBeGreaterThanOrEqual(5)
  })

  it('skips resolved mistakes', () => {
    const mistakes = [
      {
        id: 'm1',
        mistake: 'error',
        correction: '',
        explanation: '',
        source: '',
        date: new Date().toISOString(),
        skill: 'grammar' as const,
        status: 'resolved' as const,
        repetitionCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]

    const due = service.getDueMistakeReviews(mistakes)
    expect(due.length).toBe(0)
  })

  it('calculates total due count', () => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const vocab = [createVocab('v1'), createVocab('v2')]
    const reviews = [createReview('v1', yesterday), createReview('v2', yesterday)]
    const mistakes: any[] = []

    const due = service.getDueReviews(vocab, reviews, mistakes)
    expect(due.totalDue).toBe(2)
  })
})
