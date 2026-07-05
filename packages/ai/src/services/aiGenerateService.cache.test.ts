import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { generateVocabularyDetails, vocabularyCache } from './vocabulary'
import { generateArticleQuestions, articleCache } from './article'
import type { ProviderConfig } from '../client/types'

function createMockConfig(overrides: Partial<ProviderConfig> = {}): () => ProviderConfig {
  return () => ({
    apiKey: 'sk-test',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4',
    temperature: 0.5,
    maxTokens: 1000,
    ...overrides,
  })
}

function createMockFetch(status: number, body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
  })
}

function createMockAISuccess(content: string) {
  return createMockFetch(200, {
    choices: [{ message: { content } }],
    model: 'gpt-4',
    usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
  })
}

const mockVocabResponse = JSON.stringify({
  word: 'cache',
  meaning: 'a storage mechanism that stores frequently accessed data',
  meaningVi: 'bộ nhớ đệm',
  pronunciation: '/kæʃ/',
  partOfSpeech: 'noun',
  exampleSentence: 'The cache stores recently accessed data.',
  synonyms: ['buffer', 'store'],
  antonyms: [],
  collocations: ['cache memory', 'cache hit'],
  wordFamily: ['caching', 'cached'],
})

const mockArticleResponse = JSON.stringify({
  questions: [
    {
      type: 'multiple-choice',
      question: 'What is caching?',
      options: ['A', 'B', 'C', 'D'],
      correctAnswer: 'A',
      explanation: 'Caching stores data for faster access.',
    },
  ],
})

describe('AI Generate Result Cache Integration', () => {
  beforeEach(() => {
    vocabularyCache.clear()
    articleCache.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('vocabularyCache', () => {
    it('returns cached result on repeated call with same input', async () => {
      const fetchMock = createMockAISuccess(mockVocabResponse)
      vi.stubGlobal('fetch', fetchMock)

      const result1 = await generateVocabularyDetails('cache', 'The cache stores data.', 'technology', createMockConfig())
      expect(result1.data).not.toBeNull()
      expect(result1.error).toBeNull()
      expect(fetchMock).toHaveBeenCalledTimes(1)

      const result2 = await generateVocabularyDetails('cache', 'The cache stores data.', 'technology', createMockConfig())
      expect(result2.data).toEqual(result1.data)
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    it('calls fetch again for a different input', async () => {
      const fetchMock = createMockAISuccess(mockVocabResponse)
      vi.stubGlobal('fetch', fetchMock)

      await generateVocabularyDetails('cache', 'The cache stores data.', 'technology', createMockConfig())
      await generateVocabularyDetails('algorithm', 'An algorithm is a procedure.', 'technology', createMockConfig())

      expect(fetchMock).toHaveBeenCalledTimes(2)
    })

    it('does not cache when AI returns an error', async () => {
      const fetchMock = createMockAISuccess('Invalid JSON response')
      vi.stubGlobal('fetch', fetchMock)

      const result1 = await generateVocabularyDetails('cache', 'The cache stores data.', 'technology', createMockConfig())
      expect(result1.data).toBeNull()
      expect(result1.error).not.toBeNull()

      const result2 = await generateVocabularyDetails('cache', 'The cache stores data.', 'technology', createMockConfig())
      expect(result2.data).toBeNull()
    })

    it('recalls AI after cache expiration', async () => {
      vi.useFakeTimers()
      const fetchMock = createMockAISuccess(mockVocabResponse)
      vi.stubGlobal('fetch', fetchMock)

      await generateVocabularyDetails('cache', 'The cache stores data.', 'technology', createMockConfig())
      expect(fetchMock).toHaveBeenCalledTimes(1)

      vi.advanceTimersByTime(30 * 60 * 1000 + 1)

      await generateVocabularyDetails('cache', 'The cache stores data.', 'technology', createMockConfig())
      expect(fetchMock).toHaveBeenCalledTimes(2)

      vi.useRealTimers()
    })

    it('calls fetch again after cache is cleared', async () => {
      const fetchMock = createMockAISuccess(mockVocabResponse)
      vi.stubGlobal('fetch', fetchMock)

      await generateVocabularyDetails('cache', 'The cache stores data.', 'technology', createMockConfig())
      expect(fetchMock).toHaveBeenCalledTimes(1)

      vocabularyCache.clear()

      await generateVocabularyDetails('cache', 'The cache stores data.', 'technology', createMockConfig())
      expect(fetchMock).toHaveBeenCalledTimes(2)
    })

    it('tracks cache hit and miss stats', async () => {
      const fetchMock = createMockAISuccess(mockVocabResponse)
      vi.stubGlobal('fetch', fetchMock)

      const statsBefore = vocabularyCache.stats()
      expect(statsBefore.hits).toBe(0)
      expect(statsBefore.misses).toBe(0)

      await generateVocabularyDetails('cache', 'The cache stores data.', 'technology', createMockConfig())

      const statsAfterMiss = vocabularyCache.stats()
      expect(statsAfterMiss.misses).toBe(1)
      expect(statsAfterMiss.hits).toBe(0)

      await generateVocabularyDetails('cache', 'The cache stores data.', 'technology', createMockConfig())

      const statsAfterHit = vocabularyCache.stats()
      expect(statsAfterHit.hits).toBe(1)
      expect(statsAfterHit.misses).toBe(1)
    })
  })

  describe('articleCache', () => {
    it('returns cached result on repeated call with same input', async () => {
      const fetchMock = createMockAISuccess(mockArticleResponse)
      vi.stubGlobal('fetch', fetchMock)

      const result1 = await generateArticleQuestions('Article about caching.', 'Cache Article', 'technology', 1, createMockConfig())
      expect(result1.data).not.toBeNull()
      expect(result1.error).toBeNull()
      expect(fetchMock).toHaveBeenCalledTimes(1)

      const result2 = await generateArticleQuestions('Article about caching.', 'Cache Article', 'technology', 1, createMockConfig())
      expect(result2.data).toEqual(result1.data)
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    it('calls fetch again after cache clear', async () => {
      const fetchMock = createMockAISuccess(mockArticleResponse)
      vi.stubGlobal('fetch', fetchMock)

      await generateArticleQuestions('Content', 'Title', 'education', 3, createMockConfig())
      expect(fetchMock).toHaveBeenCalledTimes(1)

      articleCache.clear()

      await generateArticleQuestions('Content', 'Title', 'education', 3, createMockConfig())
      expect(fetchMock).toHaveBeenCalledTimes(2)
    })
  })
})
