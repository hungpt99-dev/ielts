import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getDueCount, buildReviewQueue, handleRating, getAllReviews } from '../reviewService'
import type { ReviewRating, ReviewItem, VocabReviewEntry } from '../reviewService'
import type { ExtensionVocabEntry } from '../../../storage/vocabularyStore'

const mockVocabStore = {
  getAllVocabulary: vi.fn<() => Promise<ExtensionVocabEntry[]>>(),
  updateVocabularyEntry: vi.fn<() => Promise<void>>(),
}

vi.mock('../../../storage/vocabularyStore', () => ({
  getAllVocabulary: () => mockVocabStore.getAllVocabulary(),
  updateVocabularyEntry: (...args: unknown[]) => mockVocabStore.updateVocabularyEntry(...args),
}))

function createMockStore(initial: Record<string, unknown> = {}) {
  const store: Record<string, unknown> = { ...initial }
  return {
    store,
    get: vi.fn((keys: string | string[], cb: (r: Record<string, unknown>) => void) => {
      if (Array.isArray(keys)) {
        const result: Record<string, unknown> = {}
        for (const k of keys) {
          if (k in store) result[k] = store[k]
        }
        cb(result)
      } else {
        cb(store)
      }
    }),
    set: vi.fn((data: Record<string, unknown>, cb?: () => void) => {
      Object.assign(store, data)
      cb?.()
    }),
  }
}

function makeVocab(id: string, word: string, overrides?: Partial<ExtensionVocabEntry>): ExtensionVocabEntry {
  return {
    id,
    word,
    meaning: `Meaning of ${word}`,
    sourceSentence: '',
    pageTitle: '',
    pageUrl: '',
    topic: 'general',
    personalNote: '',
    tags: [],
    meaningVi: '',
    partOfSpeech: 'noun',
    pronunciation: '',
    exampleSentence: '',
    synonyms: [],
    antonyms: [],
    collocations: [],
    wordFamily: [],
    difficulty: 'medium',
    status: 'learning',
    addedToReview: true,
    reviewId: '',
    createdAt: '2025-06-01T00:00:00.000Z',
    updatedAt: '2025-06-01T00:00:00.000Z',
    ...overrides,
  }
}

let mockStore: ReturnType<typeof createMockStore>

beforeEach(() => {
  mockStore = createMockStore()
  vi.stubGlobal('chrome', {
    runtime: { lastError: undefined },
    storage: { local: mockStore },
  })

  mockVocabStore.getAllVocabulary.mockResolvedValue([])
  mockVocabStore.updateVocabularyEntry.mockResolvedValue(undefined)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('getDueCount', () => {
  it('returns 0 when no vocabulary stored', async () => {
    const count = await getDueCount()
    expect(count).toBe(0)
  })

  it('returns 0 when all vocab is mastered', async () => {
    mockVocabStore.getAllVocabulary.mockResolvedValue([
      makeVocab('1', 'hello', { status: 'mastered', addedToReview: true }),
      makeVocab('2', 'world', { status: 'mastered', addedToReview: true }),
    ])
    const count = await getDueCount()
    expect(count).toBe(0)
  })

  it('returns count for vocab added to review', async () => {
    mockVocabStore.getAllVocabulary.mockResolvedValue([
      makeVocab('1', 'hello', { addedToReview: true, status: 'new' }),
    ])
    const count = await getDueCount()
    expect(count).toBe(1)
  })

  it('excludes vocab not added to review', async () => {
    mockVocabStore.getAllVocabulary.mockResolvedValue([
      makeVocab('1', 'hello', { addedToReview: false }),
    ])
    const count = await getDueCount()
    expect(count).toBe(0)
  })

  it('returns count based on nextReviewDate', async () => {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 10)

    mockVocabStore.getAllVocabulary.mockResolvedValue([
      makeVocab('1', 'hello', { status: 'reviewing', addedToReview: true }),
      makeVocab('2', 'world', { status: 'reviewing', addedToReview: true }),
    ])

    const pastReview: VocabReviewEntry = {
      id: 'r1',
      vocabularyId: '1',
      interval: 1,
      easeFactor: 2.5,
      repetitions: 1,
      nextReviewDate: futureDate.toISOString(),
      lastReviewDate: '2025-06-01T00:00:00.000Z',
      history: [{ date: '2025-06-01T00:00:00.000Z', rating: 'good' }],
    }

    const dueReview: VocabReviewEntry = {
      id: 'r2',
      vocabularyId: '2',
      interval: 1,
      easeFactor: 2.5,
      repetitions: 1,
      nextReviewDate: '2020-01-01T00:00:00.000Z',
      lastReviewDate: '2020-01-01T00:00:00.000Z',
      history: [{ date: '2020-01-01T00:00:00.000Z', rating: 'good' }],
    }

    mockStore.store['vocabularyReviews'] = [pastReview, dueReview]

    const count = await getDueCount()
    expect(count).toBe(1)
  })

  it('counts new vocab without review entries', async () => {
    mockVocabStore.getAllVocabulary.mockResolvedValue([
      makeVocab('1', 'hello', { status: 'new', addedToReview: true }),
      makeVocab('2', 'world', { status: 'learning', addedToReview: true }),
    ])
    const count = await getDueCount()
    expect(count).toBe(2)
  })
})

describe('buildReviewQueue', () => {
  it('returns empty array when no vocab', async () => {
    const queue = await buildReviewQueue()
    expect(queue).toEqual([])
  })

  it('excludes mastered vocab', async () => {
    mockVocabStore.getAllVocabulary.mockResolvedValue([
      makeVocab('1', 'hello', { status: 'mastered', addedToReview: true }),
    ])
    const queue = await buildReviewQueue()
    expect(queue).toHaveLength(0)
  })

  it('excludes vocab not added to review', async () => {
    mockVocabStore.getAllVocabulary.mockResolvedValue([
      makeVocab('1', 'hello', { addedToReview: false }),
    ])
    const queue = await buildReviewQueue()
    expect(queue).toHaveLength(0)
  })

  it('includes due vocab items with review entries', async () => {
    mockVocabStore.getAllVocabulary.mockResolvedValue([
      makeVocab('1', 'hello', { status: 'reviewing', addedToReview: true }),
    ])

    mockStore.store['vocabularyReviews'] = [{
      id: 'r1',
      vocabularyId: '1',
      interval: 1,
      easeFactor: 2.5,
      repetitions: 2,
      nextReviewDate: '2020-01-01T00:00:00.000Z',
      lastReviewDate: '2020-01-01T00:00:00.000Z',
      history: [],
    }]

    const queue = await buildReviewQueue()
    expect(queue).toHaveLength(1)
    expect(queue[0].vocab.word).toBe('hello')
    expect(queue[0].review).toBeDefined()
    expect(queue[0].review!.vocabularyId).toBe('1')
  })

  it('includes new vocab without review entries', async () => {
    mockVocabStore.getAllVocabulary.mockResolvedValue([
      makeVocab('1', 'hello', { status: 'new', addedToReview: true }),
    ])

    const queue = await buildReviewQueue()
    expect(queue).toHaveLength(1)
    expect(queue[0].vocab.word).toBe('hello')
    expect(queue[0].review).toBeNull()
  })

  it('respects maxSize parameter', async () => {
    mockVocabStore.getAllVocabulary.mockResolvedValue([
      makeVocab('1', 'hello', { status: 'new', addedToReview: true }),
      makeVocab('2', 'world', { status: 'new', addedToReview: true }),
      makeVocab('3', 'test', { status: 'new', addedToReview: true }),
    ])

    const queue = await buildReviewQueue(2)
    expect(queue.length).toBeLessThanOrEqual(2)
  })
})

describe('handleRating', () => {
  it('creates a new review entry for vocab without one', async () => {
    const vocab = makeVocab('1', 'hello', { status: 'new', addedToReview: true })
    const item: ReviewItem = { vocab, review: null }

    await handleRating(item, 'good')

    expect(mockVocabStore.updateVocabularyEntry).toHaveBeenCalledWith('1', { status: 'learning' })

    const reviews = await getAllReviews()
    expect(reviews).toHaveLength(1)
    expect(reviews[0].vocabularyId).toBe('1')
    expect(reviews[0].interval).toBe(1)
    expect(reviews[0].history).toHaveLength(1)
    expect(reviews[0].history[0].rating).toBe('good')
  })

  it('updates existing review entry with new rating', async () => {
    const vocab = makeVocab('1', 'hello', { status: 'reviewing', addedToReview: true })

    const existingReview: VocabReviewEntry = {
      id: 'r1',
      vocabularyId: '1',
      interval: 6,
      easeFactor: 2.5,
      repetitions: 2,
      nextReviewDate: '2025-07-01T00:00:00.000Z',
      lastReviewDate: '2025-06-20T00:00:00.000Z',
      history: [{ date: '2025-06-20T00:00:00.000Z', rating: 'good' }],
    }

    mockStore.store['vocabularyReviews'] = [existingReview]

    const item: ReviewItem = { vocab, review: existingReview }
    await handleRating(item, 'easy')

    const reviews = await getAllReviews()
    expect(reviews).toHaveLength(1)
    expect(reviews[0].repetitions).toBe(3)
    expect(reviews[0].history).toHaveLength(2)
    expect(reviews[0].history[1].rating).toBe('easy')
  })

  it('marks vocab as mastered on easy rating during reviewing status', async () => {
    const vocab = makeVocab('1', 'hello', { status: 'reviewing', addedToReview: true })
    const existingReview: VocabReviewEntry = {
      id: 'r1',
      vocabularyId: '1',
      interval: 6,
      easeFactor: 2.5,
      repetitions: 2,
      nextReviewDate: '2025-07-01T00:00:00.000Z',
      lastReviewDate: '2025-06-20T00:00:00.000Z',
      history: [{ date: '2025-06-20T00:00:00.000Z', rating: 'good' }],
    }

    mockStore.store['vocabularyReviews'] = [existingReview]

    const item: ReviewItem = { vocab, review: existingReview }
    await handleRating(item, 'easy')

    expect(mockVocabStore.updateVocabularyEntry).toHaveBeenCalledWith('1', { status: 'mastered' })
  })

  it('resets to learning on again rating', async () => {
    const vocab = makeVocab('1', 'hello', { status: 'reviewing', addedToReview: true })
    const existingReview: VocabReviewEntry = {
      id: 'r1',
      vocabularyId: '1',
      interval: 6,
      easeFactor: 2.5,
      repetitions: 2,
      nextReviewDate: '2025-07-01T00:00:00.000Z',
      lastReviewDate: '2025-06-20T00:00:00.000Z',
      history: [{ date: '2025-06-20T00:00:00.000Z', rating: 'good' }],
    }

    mockStore.store['vocabularyReviews'] = [existingReview]

    const item: ReviewItem = { vocab, review: existingReview }
    await handleRating(item, 'again')

    expect(mockVocabStore.updateVocabularyEntry).toHaveBeenCalledWith('1', { status: 'learning' })

    const reviews = await getAllReviews()
    expect(reviews[0].repetitions).toBe(0)
    expect(reviews[0].interval).toBe(1)
    expect(reviews[0].easeFactor).toBe(2.3)
  })
})

describe('spaced repetition algorithm', () => {
  it('calculates correct intervals for good ratings', async () => {
    const vocab1 = makeVocab('1', 'hello', { status: 'new', addedToReview: true })
    const item1: ReviewItem = { vocab: vocab1, review: null }
    await handleRating(item1, 'good')

    const reviews = await getAllReviews()
    expect(reviews[0].interval).toBe(1)

    const vocab2 = makeVocab('1', 'hello', { status: 'learning', addedToReview: true })
    const item2: ReviewItem = { vocab: vocab2, review: reviews[0] }
    await handleRating(item2, 'good')

    const reviews2 = await getAllReviews()
    expect(reviews2[0].interval).toBe(6)
    expect(reviews2[0].repetitions).toBe(2)

    const vocab3 = makeVocab('1', 'hello', { status: 'learning', addedToReview: true })
    const item3: ReviewItem = { vocab: vocab3, review: reviews2[0] }
    await handleRating(item3, 'good')

    const reviews3 = await getAllReviews()
    expect(reviews3[0].interval).toBe(15)
    expect(reviews3[0].repetitions).toBe(3)
  })

  it('increases ease factor on easy rating', async () => {
    const vocab = makeVocab('1', 'hello', { status: 'new', addedToReview: true })
    const item: ReviewItem = { vocab, review: null }
    await handleRating(item, 'easy')

    const reviews = await getAllReviews()
    expect(reviews[0].easeFactor).toBe(2.65)
    expect(reviews[0].interval).toBe(4)
  })

  it('decreases ease factor on hard rating', async () => {
    const vocab = makeVocab('1', 'hello', { status: 'new', addedToReview: true })
    const item: ReviewItem = { vocab, review: null }
    await handleRating(item, 'hard')

    const reviews = await getAllReviews()
    expect(reviews[0].easeFactor).toBe(2.35)
    expect(reviews[0].interval).toBe(1)
  })

  it('enforces minimum ease factor of 1.3', async () => {
    const vocab = makeVocab('1', 'hello', { status: 'new', addedToReview: true })
    const reviewEntry: VocabReviewEntry = {
      id: 'r1',
      vocabularyId: '1',
      interval: 60,
      easeFactor: 1.4,
      repetitions: 5,
      nextReviewDate: '2025-07-01T00:00:00.000Z',
      lastReviewDate: '2025-06-20T00:00:00.000Z',
      history: [],
    }

    mockStore.store['vocabularyReviews'] = [reviewEntry]

    const item: ReviewItem = { vocab, review: reviewEntry }
    await handleRating(item, 'again')

    const reviews = await getAllReviews()
    expect(reviews[0].easeFactor).toBe(1.3)
  })
})
