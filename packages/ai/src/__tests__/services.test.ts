import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { explain, aiExplainCache } from '../services/explain'
import { generateVocabularyDetails, generateVocabularyQuiz } from '../services/vocabulary'
import { generateArticleQuestions } from '../services/article'
import { generateVocabularyFromTranscript, generateSummaryFromTranscript, generateListeningQuestions, generateShadowingScripts } from '../services/video'
import { generateDictionaryEntry, dictionaryCache } from '../services/dictionary'
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

const mockVocabDetails = {
  word: 'test',
  meaning: 'a procedure intended to establish quality',
  translation: 'kiểm tra',
  pronunciation: '/tɛst/',
  partOfSpeech: 'noun',
  exampleSentence: 'This is a test.',
  synonyms: ['trial', 'examination'],
  antonyms: [],
  collocations: ['run a test', 'test results'],
  wordFamily: ['testing', 'tested'],
}

describe('AI Services', () => {
  beforeEach(() => {
    aiExplainCache.clear()
    dictionaryCache.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('explain', () => {
    it('returns error when AI response is not valid JSON', async () => {
      vi.stubGlobal('fetch', createMockAISuccess('Not JSON at all'))
      const result = await explain('simple', 'hello', createMockConfig())
      expect(result.data).toBeNull()
      expect(result.error).toContain('JSON')
    })

    it('returns error when AI response has unexpected format', async () => {
      vi.stubGlobal('fetch', createMockAISuccess(JSON.stringify({ wrong: 'shape' })))
      const result = await explain('simple', 'hello', createMockConfig())
      expect(result.data).toBeNull()
      expect(result.error).toContain('format')
    })
  })

  describe('generateVocabularyDetails', () => {
    it('returns error when API key is empty', async () => {
      const result = await generateVocabularyDetails('test', 'This is a test.', 'general', createMockConfig({ apiKey: '' }))
      expect(result.data).toBeNull()
      expect(result.error).toContain('API key')
    })

    it('returns error for 401 status', async () => {
      vi.stubGlobal('fetch', createMockFetch(401, {}))
      const result = await generateVocabularyDetails('test', 'This is a test.', 'general', createMockConfig())
      expect(result.data).toBeNull()
      expect(result.error).toContain('API key')
    })

    it('returns error for 429 status', async () => {
      vi.stubGlobal('fetch', createMockFetch(429, {}))
      const result = await generateVocabularyDetails('test', 'This is a test.', 'general', createMockConfig())
      expect(result.data).toBeNull()
      expect(result.error).toContain('Rate limit')
    })

    it('returns error for network failure', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
      const result = await generateVocabularyDetails('test', 'This is a test.', 'general', createMockConfig())
      expect(result.data).toBeNull()
      expect(result.error).toContain('Network error')
    })

    it('returns error for empty response', async () => {
      vi.stubGlobal('fetch', createMockFetch(200, {
        choices: [{ message: { content: '' } }],
        model: 'gpt-4',
      }))
      const result = await generateVocabularyDetails('test', 'This is a test.', 'general', createMockConfig())
      expect(result.data).toBeNull()
      expect(result.error).toContain('empty')
    })
  })

  describe('generateVocabularyQuiz', () => {
    it('returns error when API key is empty', async () => {
      const result = await generateVocabularyQuiz('test', mockVocabDetails as any, createMockConfig({ apiKey: '' }))
      expect(result.data).toBeNull()
      expect(result.error).toContain('API key')
    })

    it('returns error for invalid JSON in AI response', async () => {
      vi.stubGlobal('fetch', createMockAISuccess('Invalid JSON'))
      const result = await generateVocabularyQuiz('test', mockVocabDetails as any, createMockConfig())
      expect(result.data).toBeNull()
      expect(result.error).toContain('not valid JSON')
    })
  })

  describe('generateArticleQuestions', () => {
    it('returns error when API key is empty', async () => {
      const result = await generateArticleQuestions('Some article content', 'Article Title', 'education', 3, createMockConfig({ apiKey: '' }))
      expect(result.data).toBeNull()
      expect(result.error).toContain('API key')
    })

    it('returns error for network error', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Failed to fetch')))
      const result = await generateArticleQuestions('content', 'Title', 'topic', 3, createMockConfig())
      expect(result.data).toBeNull()
      expect(result.error).toContain('Network error')
    })
  })

  describe('video transcription services', () => {
    const transcript = 'This is a sample transcript for testing purposes.'
    const title = 'Sample Video'

    it('generateVocabularyFromTranscript returns error when API key is empty', async () => {
      const result = await generateVocabularyFromTranscript(transcript, title, createMockConfig({ apiKey: '' }))
      expect(result.data).toBeNull()
      expect(result.error).toContain('API key')
    })

    it('generateSummaryFromTranscript returns error when API key is empty', async () => {
      const result = await generateSummaryFromTranscript(transcript, title, createMockConfig({ apiKey: '' }))
      expect(result.data).toBeNull()
      expect(result.error).toContain('API key')
    })

    it('generateListeningQuestions returns error when API key is empty', async () => {
      const result = await generateListeningQuestions(transcript, title, createMockConfig({ apiKey: '' }))
      expect(result.data).toBeNull()
      expect(result.error).toContain('API key')
    })

    it('generateShadowingScripts returns error when API key is empty', async () => {
      const result = await generateShadowingScripts(transcript, createMockConfig({ apiKey: '' }))
      expect(result.data).toBeNull()
      expect(result.error).toContain('API key')
    })
  })

  describe('generateDictionaryEntry', () => {
    it('returns error when API key is empty', async () => {
      const result = await generateDictionaryEntry('hello', 'Hello world', createMockConfig({ apiKey: '' }))
      expect(result.data).toBeNull()
      expect(result.error).toContain('API key')
    })
  })
})
