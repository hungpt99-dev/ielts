import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { VocabularyEntry } from '../../src/models'

const mockGetAll = vi.fn()

vi.mock('../../src/services/storage/Database', () => ({
  DatabaseService: {
    getAll: (...args: unknown[]) => mockGetAll(...args),
  },
}))

vi.mock('../../src/features/vocabulary/VocabularyImport', () => ({
  default: function MockImport() {
    return null
  },
}))

vi.mock('../../src/features/vocabulary/components/WordForm', () => ({
  default: function MockWordForm() {
    return null
  },
}))

import Vocabulary from '../../src/features/vocabulary/VocabularyManager'

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
    status: 'new',
    tags: [],
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('Vocabulary import → Word tab integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows empty state when no vocabulary exists', async () => {
    mockGetAll.mockResolvedValue([])
    render(<Vocabulary />)
    const emptyTitle = await screen.findByText('Your vocabulary notebook is empty.')
    expect(emptyTitle).toBeInTheDocument()
  })

  it('displays imported vocabulary words in the Word tab', async () => {
    const words = [
      makeVocab('v1', { word: 'ubiquitous', meaning: 'existing everywhere' }),
      makeVocab('v2', { word: 'paradigm', meaning: 'a typical example' }),
    ]
    mockGetAll.mockResolvedValue(words)
    render(<Vocabulary />)

    expect(await screen.findByText('ubiquitous')).toBeInTheDocument()
    expect(screen.getByText('paradigm')).toBeInTheDocument()
    expect(screen.getByText('existing everywhere')).toBeInTheDocument()
    expect(screen.getByText('a typical example')).toBeInTheDocument()
  })

})
