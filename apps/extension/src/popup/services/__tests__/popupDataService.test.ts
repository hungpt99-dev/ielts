import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { loadVocabulary, findWord } from '../popupDataService'

const mockVocabStore = {
  getAllVocabulary: vi.fn<() => Promise<unknown[]>>(),
}

vi.mock('../../../storage/vocabularyStore', () => ({
  getAllVocabulary: () => mockVocabStore.getAllVocabulary(),
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
    set: vi.fn(),
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
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('loadVocabulary', () => {
  it('returns empty entries and zero stats when nothing stored', async () => {
    const result = await loadVocabulary()
    expect(result.entries).toEqual([])
    expect(result.stats).toEqual({ total: 0, newCount: 0, learningCount: 0, masteredCount: 0 })
  })

  it('loads vocabulary from IndexedDB entries', async () => {
    mockVocabStore.getAllVocabulary.mockResolvedValue([
      {
        id: '1',
        word: 'hello',
        meaning: 'xin chao',
        pronunciation: '/həˈloʊ/',
        partOfSpeech: 'interjection',
        topic: 'greeting',
        difficulty: 'easy',
        status: 'new',
        createdAt: '2025-06-01T00:00:00.000Z',
      },
    ])

    const result = await loadVocabulary()
    expect(result.entries).toHaveLength(1)
    expect(result.entries[0].word).toBe('hello')
    expect(result.entries[0].meaning).toBe('xin chao')
  })

  it('loads vocabulary from chrome.storage.local as fallback', async () => {
    mockStore.store['vocabulary'] = [
      {
        id: '2',
        word: 'world',
        meaning: 'the earth',
        text: 'world is beautiful',
        pronunciation: '/wɜrld/',
        partOfSpeech: 'noun',
        topic: 'geography',
        difficulty: 'medium',
        status: 'learning',
        createdAt: '2025-06-02T00:00:00.000Z',
      },
    ]

    const result = await loadVocabulary()
    expect(result.entries).toHaveLength(1)
    expect(result.entries[0].word).toBe('world')
  })

  it('deduplicates entries by word, preferring IDB over storage', async () => {
    mockVocabStore.getAllVocabulary.mockResolvedValue([
      {
        id: '1',
        word: 'hello',
        meaning: 'from IDB',
        pronunciation: '/həˈloʊ/',
        partOfSpeech: 'interjection',
        topic: 'greeting',
        difficulty: 'easy',
        status: 'new',
        createdAt: '2025-06-01T00:00:00.000Z',
      },
    ])

    mockStore.store['vocabulary'] = [
      {
        id: '2',
        word: 'hello',
        meaning: 'from storage',
        text: 'hello world',
        createdAt: '2025-06-02T00:00:00.000Z',
      },
    ]

    const result = await loadVocabulary()
    expect(result.entries).toHaveLength(1)
    expect(result.entries[0].meaning).toBe('from storage')
  })

  it('calculates stats correctly', async () => {
    mockVocabStore.getAllVocabulary.mockResolvedValue([
      {
        id: '1',
        word: 'new1',
        meaning: '',
        pronunciation: '',
        partOfSpeech: '',
        topic: '',
        difficulty: '',
        status: 'new',
        createdAt: '2025-06-01T00:00:00.000Z',
      },
      {
        id: '2',
        word: 'learning1',
        meaning: '',
        pronunciation: '',
        partOfSpeech: '',
        topic: '',
        difficulty: '',
        status: 'learning',
        createdAt: '2025-06-01T00:00:00.000Z',
      },
      {
        id: '3',
        word: 'mastered1',
        meaning: '',
        pronunciation: '',
        partOfSpeech: '',
        topic: '',
        difficulty: '',
        status: 'mastered',
        createdAt: '2025-06-01T00:00:00.000Z',
      },
    ])

    const result = await loadVocabulary()
    expect(result.stats).toEqual({
      total: 3,
      newCount: 1,
      learningCount: 1,
      masteredCount: 1,
    })
  })

  it('counts reviewing status as learning', async () => {
    mockVocabStore.getAllVocabulary.mockResolvedValue([
      {
        id: '1',
        word: 'reviewing1',
        meaning: '',
        pronunciation: '',
        partOfSpeech: '',
        topic: '',
        difficulty: '',
        status: 'reviewing',
        createdAt: '2025-06-01T00:00:00.000Z',
      },
    ])

    const result = await loadVocabulary()
    expect(result.stats.learningCount).toBe(1)
    expect(result.stats.newCount).toBe(0)
  })

  it('sorts entries by createdAt descending', async () => {
    mockVocabStore.getAllVocabulary.mockResolvedValue([
      {
        id: '1',
        word: 'old',
        meaning: '',
        pronunciation: '',
        partOfSpeech: '',
        topic: '',
        difficulty: '',
        status: 'new',
        createdAt: '2025-01-01T00:00:00.000Z',
      },
      {
        id: '2',
        word: 'new',
        meaning: '',
        pronunciation: '',
        partOfSpeech: '',
        topic: '',
        difficulty: '',
        status: 'new',
        createdAt: '2025-06-01T00:00:00.000Z',
      },
    ])

    const result = await loadVocabulary()
    expect(result.entries[0].word).toBe('new')
    expect(result.entries[1].word).toBe('old')
  })

  it('filters out storage entries without a word field', async () => {
    mockStore.store['vocabulary'] = [
      { id: '1', word: 'valid', createdAt: '2025-06-01T00:00:00.000Z' },
      { id: '2', word: '', createdAt: '2025-06-01T00:00:00.000Z' },
    ]

    const result = await loadVocabulary()
    expect(result.entries).toHaveLength(1)
    expect(result.entries[0].word).toBe('valid')
  })
})

describe('findWord', () => {
  it('returns undefined when word not found', async () => {
    const result = await findWord('nonexistent')
    expect(result).toBeUndefined()
  })

  it('finds word case-insensitively', async () => {
    mockVocabStore.getAllVocabulary.mockResolvedValue([
      {
        id: '1',
        word: 'Hello',
        meaning: 'xin chao',
        pronunciation: '',
        partOfSpeech: '',
        topic: '',
        difficulty: '',
        status: 'new',
        createdAt: '2025-06-01T00:00:00.000Z',
      },
    ])

    const result = await findWord('hello')
    expect(result).toBeDefined()
    expect(result!.word).toBe('Hello')
  })

  it('finds word with exact match', async () => {
    mockVocabStore.getAllVocabulary.mockResolvedValue([
      {
        id: '1',
        word: 'environment',
        meaning: 'môi trường',
        pronunciation: '',
        partOfSpeech: '',
        topic: '',
        difficulty: '',
        status: 'new',
        createdAt: '2025-06-01T00:00:00.000Z',
      },
    ])

    const result = await findWord('environment')
    expect(result).toBeDefined()
    expect(result!.meaning).toBe('môi trường')
  })
})
