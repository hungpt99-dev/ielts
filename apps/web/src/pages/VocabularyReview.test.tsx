import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { VocabularyEntry, VocabReviewEntry } from '../models'

const mockGetAll = vi.fn()
const mockPut = vi.fn()
const mockAdd = vi.fn()

vi.mock('../services/storage/Database', () => ({
  DatabaseService: {
    getAll: (...args: unknown[]) => mockGetAll(...args),
    put: (...args: unknown[]) => mockPut(...args),
    add: (...args: unknown[]) => mockAdd(...args),
  },
}))

vi.mock('../utils/spaced-repetition', async () => {
  const actual = await vi.importActual('../utils/spaced-repetition')
  return actual
})

import VocabularyReview from './VocabularyReview'

function makeVocab(id: string, overrides: Partial<VocabularyEntry> = {}): VocabularyEntry {
  return {
    id,
    word: 'ubiquitous',
    meaning: 'existing everywhere',
    meaningVi: 'phổ biến khắp nơi',
    pronunciation: '/juːˈbɪk.wɪ.təs/',
    partOfSpeech: 'adjective',
    topic: 'Technology',
    exampleSentence: 'Smartphones have become ubiquitous.',
    collocations: ['ubiquitous computing', 'ubiquitous presence'],
    synonyms: ['widespread', 'pervasive'],
    antonyms: ['rare'],
    wordFamily: ['ubiquity'],
    personalNote: '',
    difficulty: 'medium',
    status: 'reviewing',
    tags: [],
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function makeReview(vocabularyId: string, overrides: Partial<VocabReviewEntry> = {}): VocabReviewEntry {
  return {
    id: `r-${vocabularyId}`,
    vocabularyId,
    interval: 1,
    easeFactor: 2.5,
    repetitions: 1,
    nextReviewDate: new Date(Date.now() - 86400000).toISOString(),
    lastReviewDate: new Date().toISOString(),
    history: [],
    ...overrides,
  }
}

async function startReview() {
  const button = await screen.findByRole('button', { name: /start review/i })
  await userEvent.click(button)
}

describe('VocabularyReview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows review settings initially', async () => {
    mockGetAll.mockResolvedValue([])
    render(<VocabularyReview />)
    const heading = await screen.findByText('Review Settings')
    expect(heading).toBeInTheDocument()
  })

  it('shows empty state when no reviews due', async () => {
    mockGetAll.mockResolvedValue([])
    render(<VocabularyReview />)
    await startReview()
    const heading = await screen.findByText('All caught up!')
    expect(heading).toBeInTheDocument()
    expect(screen.getByText(/No vocabulary due for review/)).toBeInTheDocument()
  })

  it('shows empty state when all words are mastered', async () => {
    mockGetAll.mockImplementation((store: string) => {
      if (store === 'vocabulary') return Promise.resolve([makeVocab('v1', { status: 'mastered' })])
      if (store === 'vocabularyReviews') return Promise.resolve([])
      return Promise.resolve([])
    })
    render(<VocabularyReview />)
    await startReview()
    const heading = await screen.findByText('All caught up!')
    expect(heading).toBeInTheDocument()
  })

  it('shows review card with word in word-to-meaning mode', async () => {
    mockGetAll.mockImplementation((store: string) => {
      if (store === 'vocabulary') return Promise.resolve([makeVocab('v1')])
      if (store === 'vocabularyReviews') return Promise.resolve([makeReview('v1')])
      return Promise.resolve([])
    })
    render(<VocabularyReview />)
    await startReview()

    await screen.findByTestId('review-card')
    expect(screen.getByText('ubiquitous')).toBeInTheDocument()
  })

  it('shows all four rating buttons', async () => {
    mockGetAll.mockImplementation((store: string) => {
      if (store === 'vocabulary') return Promise.resolve([makeVocab('v1')])
      if (store === 'vocabularyReviews') return Promise.resolve([makeReview('v1')])
      return Promise.resolve([])
    })
    render(<VocabularyReview />)
    await startReview()

    await screen.findByTestId('review-card')

    expect(screen.getByRole('button', { name: /again/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /hard/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /good/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /easy/i })).toBeInTheDocument()
  })

  it('moves to next card after rating', async () => {
    const vocab1 = makeVocab('v1', { word: 'ubiquitous' })
    const vocab2 = makeVocab('v2', { word: 'paradigm' })
    mockGetAll.mockImplementation((store: string) => {
      if (store === 'vocabulary') return Promise.resolve([vocab1, vocab2])
      if (store === 'vocabularyReviews') return Promise.resolve([makeReview('v1'), makeReview('v2')])
      return Promise.resolve([])
    })
    render(<VocabularyReview />)
    await startReview()

    await screen.findByTestId('review-card')
    expect(screen.getByText('ubiquitous')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /good/i }))

    // Progress should show card 2 of 2
    await screen.findByTestId('review-card')
    expect(screen.getByTestId('review-progress')).toHaveTextContent('2 / 2')
  })

  it('calls put with updated review entry when rating', async () => {
    mockGetAll.mockImplementation((store: string) => {
      if (store === 'vocabulary') return Promise.resolve([makeVocab('v1')])
      if (store === 'vocabularyReviews') return Promise.resolve([makeReview('v1')])
      return Promise.resolve([])
    })
    render(<VocabularyReview />)
    await startReview()

    await screen.findByTestId('review-card')
    await userEvent.click(screen.getByRole('button', { name: /good/i }))

    expect(mockPut).toHaveBeenCalled()
    const putArgs = mockPut.mock.calls.find((c: unknown[]) => c[0] === 'vocabularyReviews')
    expect(putArgs).toBeDefined()
    if (putArgs) {
      const updatedReview = putArgs[1] as VocabReviewEntry
      expect(updatedReview.history).toHaveLength(1)
      expect(updatedReview.history[0].rating).toBe('good')
    }
  })

  it('shows review stats', async () => {
    mockGetAll.mockImplementation((store: string) => {
      if (store === 'vocabulary') return Promise.resolve([makeVocab('v1'), makeVocab('v2')])
      if (store === 'vocabularyReviews') return Promise.resolve([makeReview('v1'), makeReview('v2')])
      return Promise.resolve([])
    })
    render(<VocabularyReview />)
    await startReview()

    await screen.findByTestId('review-card')
    expect(screen.getByTestId('review-progress')).toHaveTextContent('1 / 2')
  })

  it('shows completion screen when all words reviewed', async () => {
    mockGetAll.mockImplementation((store: string) => {
      if (store === 'vocabulary') return Promise.resolve([makeVocab('v1')])
      if (store === 'vocabularyReviews') return Promise.resolve([makeReview('v1')])
      return Promise.resolve([])
    })
    render(<VocabularyReview />)
    await startReview()

    await screen.findByTestId('review-card')
    await userEvent.click(screen.getByRole('button', { name: /good/i }))

    const completed = await screen.findByText(/Review Complete/i)
    expect(completed).toBeInTheDocument()
  })
})
