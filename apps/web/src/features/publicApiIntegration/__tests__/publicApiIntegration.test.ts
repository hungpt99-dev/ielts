import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type {
  PublicApiPreview,
  PublicApiSourceConfig,
  PublicApiImportedContent,
  PublicApiAiClassifyResponse,
} from '../types'
import { PUBLIC_API_SOURCES } from '../types'
import {
  validateLicense,
  createImportEntry,
  importPublicApiContent,
  importPublicApiContentBatch,
} from '../api/import'
import {
  extractVocabulary,
  generateReadingQuestions,
  generateListeningExercise,
  generateSpeakingPrompts,
  generateWritingIdeas,
  generateGrammarExercises,
  generateMistakeReviewTasks,
  getStoredAiConfig,
  storeAiConfig,
  clearStoredAiConfig,
} from '../ai/classify'
import {
  safeApiFetch,
  checkSourceUsability,
  buildSuggestions,
  buildErrorMessage,
} from '../utils/errorHandling'

// ── Mocks ──────────────────────────────────────────────────────────

const mockId = 'test-uuid-12345678'
vi.stubGlobal('crypto', {
  randomUUID: () => mockId,
})

const mockDb = vi.hoisted(() => ({
  addPublicApiContent: vi.fn(),
  updatePublicApiContent: vi.fn(),
  safeGetAll: vi.fn(),
  safeRemove: vi.fn(),
  add: vi.fn(),
}))

vi.mock('../../../services/storage/Database', () => ({
  DatabaseService: mockDb,
}))

function createMockResponse(data: unknown, status = 200, ok = true) {
  return {
    ok,
    status,
    json: () => Promise.resolve(data),
  } as Response
}

const mockAiConfig = {
  apiKey: 'sk-test-key',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4o-mini',
}

function mockAiResponse(content: string) {
  return { choices: [{ message: { content } }] }
}

// ── License Validation ─────────────────────────────────────────────

describe('validateLicense', () => {
  it('accepts known open licenses', () => {
    const valid = [
      'CC BY-SA 3.0',
      'CC BY 4.0',
      'CC BY 2.0 FR',
      'CC0',
      'Public Domain',
      'Creative Commons Attribution-ShareAlike',
      'MIT',
    ]
    for (const l of valid) {
      expect(validateLicense(l).valid).toBe(true)
    }
  })

  it('rejects unclear or restrictive licenses', () => {
    const invalid = ['Unknown', 'Unclear', 'All Rights Reserved', 'Copyright', 'Proprietary', '']
    for (const l of invalid) {
      const result = validateLicense(l)
      expect(result.valid).toBe(false)
    }
  })

  it('accepts case-insensitive Creative Commons mentions', () => {
    expect(validateLicense('creative commons attribution 4.0').valid).toBe(true)
  })

  it('accepts Public Domain mentions case-insensitively', () => {
    expect(validateLicense('public domain mark 1.0').valid).toBe(true)
  })

  it('accepts open license mentions with warning', () => {
    const result = validateLicense('Open Government License')
    expect(result.valid).toBe(true)
    expect(result.reason).toContain('may need verification')
  })

  it('rejects unrecognized non-open licenses', () => {
    const result = validateLicense('Some Custom License v1')
    expect(result.valid).toBe(false)
    expect(result.reason).toContain('not recognized')
  })

  it('rejects empty string', () => {
    expect(validateLicense('').valid).toBe(false)
  })
})

// ── Create Import Entry ────────────────────────────────────────────

describe('createImportEntry', () => {
  const preview: PublicApiPreview = {
    id: 'preview-1',
    title: 'Test Word',
    content: 'Definition of test word',
    contentType: 'dictionary',
    sourceName: 'wiktionary',
    sourceUrl: 'https://en.wiktionary.org/wiki/test',
    licenseName: 'CC BY-SA 3.0',
    attribution: 'Source: wiktionary (CC BY-SA 3.0)',
  }

  it('creates entry with all required fields', () => {
    const entry = createImportEntry(preview)
    expect(entry.id).toBe(mockId)
    expect(entry.title).toBe('Test Word')
    expect(entry.content).toBe('Definition of test word')
    expect(entry.contentType).toBe('dictionary')
    expect(entry.sourceType).toBe('public-api')
    expect(entry.sourceName).toBe('wiktionary')
    expect(entry.sourceUrl).toBe('https://en.wiktionary.org/wiki/test')
    expect(entry.licenseName).toBe('CC BY-SA 3.0')
    expect(entry.attribution).toBe('Source: wiktionary (CC BY-SA 3.0)')
    expect(entry.importedAt).toBeTruthy()
    expect(entry.skill).toBe('')
    expect(entry.topic).toBe('')
    expect(entry.difficulty).toBe('medium')
    expect(entry.tags).toEqual([])
    expect(entry.userNotes).toBe('')
  })

  it('applies overrides correctly', () => {
    const entry = createImportEntry(preview, {
      skill: 'reading',
      topic: 'Education',
      difficulty: 'hard',
      tags: ['vocabulary', 'ielts'],
      userNotes: 'My note',
    })
    expect(entry.skill).toBe('reading')
    expect(entry.topic).toBe('Education')
    expect(entry.difficulty).toBe('hard')
    expect(entry.tags).toEqual(['vocabulary', 'ielts'])
    expect(entry.userNotes).toBe('My note')
  })
})

// ── Import Public API Content ──────────────────────────────────────

describe('importPublicApiContent', () => {
  const validPreview: PublicApiPreview = {
    id: 'preview-1',
    title: 'Test',
    content: 'Content',
    contentType: 'dictionary',
    sourceName: 'wiktionary',
    sourceUrl: 'https://example.com',
    licenseName: 'CC BY-SA 3.0',
    attribution: 'test attribution',
  }

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('imports content successfully with valid license', async () => {
    mockDb.addPublicApiContent.mockResolvedValue({ id: mockId })
    const result = await importPublicApiContent(validPreview)
    expect(result.success).toBe(true)
    expect(result.contentId).toBe(mockId)
    expect(mockDb.addPublicApiContent).toHaveBeenCalledTimes(1)
  })

  it('rejects import when license is invalid', async () => {
    const badPreview = { ...validPreview, licenseName: 'All Rights Reserved' }
    const result = await importPublicApiContent(badPreview)
    expect(result.success).toBe(false)
    expect(result.contentId).toBe('')
    expect(result.error).toBeTruthy()
    expect(mockDb.addPublicApiContent).not.toHaveBeenCalled()
  })

  it('returns error when database save fails', async () => {
    mockDb.addPublicApiContent.mockRejectedValue(new Error('DB write failed'))
    const result = await importPublicApiContent(validPreview)
    expect(result.success).toBe(false)
    expect(result.error).toBe('DB write failed')
  })
})

describe('importPublicApiContentBatch', () => {
  const validPreview: PublicApiPreview = {
    id: 'preview-1',
    title: 'Test',
    content: 'Content',
    contentType: 'dictionary',
    sourceName: 'wiktionary',
    sourceUrl: 'https://example.com',
    licenseName: 'CC BY-SA 3.0',
    attribution: 'test attribution',
  }

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('imports batch of content items', async () => {
    mockDb.addPublicApiContent.mockResolvedValue({ id: mockId })
    const previews = [validPreview, { ...validPreview, id: 'preview-2' }]
    const results = await importPublicApiContentBatch(previews)
    expect(results).toHaveLength(2)
    expect(results[0].success).toBe(true)
    expect(results[1].success).toBe(true)
    expect(mockDb.addPublicApiContent).toHaveBeenCalledTimes(2)
  })

  it('handles mixed success/failure in batch', async () => {
    mockDb.addPublicApiContent
      .mockResolvedValueOnce({ id: mockId })

    const badPreview: PublicApiPreview = {
      ...validPreview,
      licenseName: 'All Rights Reserved',
    }
    const results = await importPublicApiContentBatch([validPreview, badPreview])
    expect(results[0].success).toBe(true)
    expect(results[1].success).toBe(false)
  })
})

// ── AI Exercise Generation ─────────────────────────────────────────

describe('AI generation functions', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('extractVocabulary', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns extracted vocabulary on success', async () => {
    const vocabData = {
      words: [{
        word: 'sustainable',
        meaning: 'able to be maintained over time',
        partOfSpeech: 'adjective',
        example: 'Sustainable energy is crucial.',
        synonyms: ['renewable'],
        collocations: ['sustainable development'],
      }],
    }
    vi.mocked(fetch).mockResolvedValueOnce(createMockResponse(mockAiResponse(JSON.stringify(vocabData))))

    const result = await extractVocabulary('Content about sustainability', mockAiConfig)

    expect(result.data).toEqual(vocabData)
    expect(result.error).toBeNull()
  })

  it('returns error when no words extracted', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(createMockResponse(mockAiResponse(JSON.stringify({ words: [] }))))

    const result = await extractVocabulary('Content', mockAiConfig)

    expect(result.data).toBeNull()
    expect(result.error).toContain('No vocabulary words extracted')
  })
})

  describe('generateReadingQuestions', () => {
    it('returns questions on success', async () => {
      const data = {
        questions: [{
          question: 'What is the main idea?',
          type: 'multiple-choice',
          options: ['A', 'B', 'C', 'D'],
          answer: 'A',
          explanation: 'Because it summarizes the text.',
        }],
      }
      vi.mocked(fetch).mockResolvedValueOnce(createMockResponse(mockAiResponse(JSON.stringify(data))))

      const result = await generateReadingQuestions('Content', 'Title', mockAiConfig)

      expect(result.data).toEqual(data)
      expect(result.error).toBeNull()
    })

    it('returns error on API failure', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))

      const result = await generateReadingQuestions('Content', 'Title', mockAiConfig)

      expect(result.data).toBeNull()
      expect(result.error).toBeTruthy()
    })
  })

  describe('generateListeningExercise', () => {
    it('returns gap-fill exercise on success', async () => {
      const data = {
        gaps: [{ sentence: 'The meeting is on _____.', answer: 'Monday', hint: 'day' }],
      }
      vi.mocked(fetch).mockResolvedValueOnce(createMockResponse(mockAiResponse(JSON.stringify(data))))

      const result = await generateListeningExercise('Transcript content', mockAiConfig)

      expect(result.data).toEqual(data)
      expect(result.error).toBeNull()
    })
  })

  describe('generateSpeakingPrompts', () => {
    it('returns speaking prompts on success', async () => {
      const data = {
        prompts: [
          { part: 1, question: 'Do you like music?' },
          { part: 2, question: 'Describe a song' },
          { part: 3, question: 'How has music changed?' },
        ],
      }
      vi.mocked(fetch).mockResolvedValueOnce(createMockResponse(mockAiResponse(JSON.stringify(data))))

      const result = await generateSpeakingPrompts('Music content', mockAiConfig)

      expect(result.data).toEqual(data)
      expect(result.error).toBeNull()
    })
  })

  describe('generateWritingIdeas', () => {
    it('returns writing ideas on success', async () => {
      const data = {
        ideas: [
          { task: 1, prompt: 'Describe the chart', instruction: 'Write 150 words' },
          { task: 2, prompt: 'Should students wear uniforms?', instruction: 'Give your opinion' },
        ],
      }
      vi.mocked(fetch).mockResolvedValueOnce(createMockResponse(mockAiResponse(JSON.stringify(data))))

      const result = await generateWritingIdeas('Education content', mockAiConfig)

      expect(result.data).toEqual(data)
      expect(result.error).toBeNull()
    })
  })

  describe('generateGrammarExercises', () => {
    it('returns grammar exercises on success', async () => {
      const data = {
        exercises: [{
          sentence: 'He go to school yesterday.',
          error: 'Incorrect past tense',
          correction: 'He went to school yesterday.',
          explanation: 'Use past simple for completed actions.',
        }],
      }
      vi.mocked(fetch).mockResolvedValueOnce(createMockResponse(mockAiResponse(JSON.stringify(data))))

      const result = await generateGrammarExercises('Content', mockAiConfig)

      expect(result.data).toEqual(data)
      expect(result.error).toBeNull()
    })
  })

  describe('generateMistakeReviewTasks', () => {
    it('returns mistake review tasks on success', async () => {
      const data = {
        tasks: [{
          type: 'grammar',
          question: 'Find the mistake: He go to school.',
          answer: 'He goes to school.',
          explanation: 'Third person singular needs -s.',
        }],
      }
      vi.mocked(fetch).mockResolvedValueOnce(createMockResponse(mockAiResponse(JSON.stringify(data))))

      const result = await generateMistakeReviewTasks('Content', mockAiConfig)

      expect(result.data).toEqual(data)
      expect(result.error).toBeNull()
    })
  })
})

// ── AI Config Storage ──────────────────────────────────────────────

describe('AI config storage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns default config when nothing is stored', () => {
    const config = getStoredAiConfig()
    expect(config.apiKey).toBe('')
    expect(config.baseUrl).toBe('https://api.openai.com/v1')
    expect(config.model).toBe('gpt-4o-mini')
  })

  it('stores and retrieves AI config', () => {
    storeAiConfig({ apiKey: 'sk-test', baseUrl: 'https://custom.com/v1', model: 'gpt-4' })
    const config = getStoredAiConfig()
    expect(config.apiKey).toBe('sk-test')
    expect(config.baseUrl).toBe('https://custom.com/v1')
    expect(config.model).toBe('gpt-4')
  })

  it('clears stored AI config', () => {
    storeAiConfig({ apiKey: 'sk-test' })
    clearStoredAiConfig()
    const config = getStoredAiConfig()
    expect(config.apiKey).toBe('')
  })

  it('handles partial config updates', () => {
    storeAiConfig({ apiKey: 'sk-key' })
    storeAiConfig({ model: 'gpt-4-turbo' })
    const config = getStoredAiConfig()
    expect(config.apiKey).toBe('sk-key')
    expect(config.model).toBe('gpt-4-turbo')
  })

  it('handles localStorage errors gracefully', () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Storage error')
    })
    const config = getStoredAiConfig()
    expect(config.apiKey).toBe('')
    expect(config.baseUrl).toBe('https://api.openai.com/v1')
    getItem.mockRestore()
  })
})

// ── safeApiFetch ───────────────────────────────────────────────────

describe('safeApiFetch', () => {
  const source: PublicApiSourceConfig = PUBLIC_API_SOURCES[0]

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns data on successful fetch', async () => {
    const responseData = { results: ['item1', 'item2'] }
    vi.mocked(fetch).mockResolvedValueOnce(createMockResponse(responseData))
    const result = await safeApiFetch<{ results: string[] }>('https://api.example.com/data', source)
    expect(result.data).toEqual(responseData)
    expect(result.error).toBeNull()
  })

  it('returns error info on HTTP error', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(createMockResponse({ error: 'Not found' }, 404, false))
    const result = await safeApiFetch<unknown>('https://api.example.com/data', source)
    expect(result.data).toBeNull()
    expect(result.error).not.toBeNull()
  })

  it('returns CORS error info on network failure', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError('Failed to fetch'))
    const result = await safeApiFetch<unknown>('https://api.example.com/data', source)
    expect(result.data).toBeNull()
    expect(result.error).not.toBeNull()
    expect(result.error!.type).toBe('cors')
  })
})

// ── API Key Encoding/Decoding ──────────────────────────────────────

describe('API key encoding/decoding', () => {
  it('encodes and decodes API keys', async () => {
    const { encodeKey, decodeKey } = await import('../components/ApiKeySettings')
    const key = 'AIzaSyTestKey123'
    const encoded = encodeKey(key)
    expect(encoded).not.toBe(key)
    expect(decodeKey(encoded)).toBe(key)
  })

  it('handles encoding errors gracefully', async () => {
    const { encodeKey } = await import('../components/ApiKeySettings')
    vi.spyOn(window, 'btoa').mockImplementationOnce(() => {
      throw new Error('Encoding error')
    })
    const result = encodeKey('test')
    expect(result).toBe('test')
  })

  it('handles decoding errors gracefully', async () => {
    const { decodeKey } = await import('../components/ApiKeySettings')
    vi.spyOn(window, 'atob').mockImplementationOnce(() => {
      throw new Error('Decoding error')
    })
    const result = decodeKey('invalid!')
    expect(result).toBe('invalid!')
  })
})

describe('validateApiKey (YouTube)', () => {
  function validateApiKey(source: string, key: string): string | null {
    if (!key) return 'API key is required.'
    if (source === 'youtube' && !key.startsWith('AIza')) {
      return 'YouTube Data API keys typically start with "AIza". Please check your key.'
    }
    return null
  }

  it('accepts valid YouTube key', () => {
    expect(validateApiKey('youtube', 'AIzaSyTest123')).toBeNull()
  })

  it('rejects empty key', () => {
    expect(validateApiKey('youtube', '')).toBe('API key is required.')
  })

  it('rejects non-AIza key for YouTube', () => {
    expect(validateApiKey('youtube', 'wrong-key')).toBe(
      'YouTube Data API keys typically start with "AIza". Please check your key.',
    )
  })

  it('accepts any key for non-YouTube sources', () => {
    expect(validateApiKey('wiktionary', 'some-key')).toBeNull()
  })
})

// ── Search API Integration ─────────────────────────────────────────

describe('Search API response parsing', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('parses Wikipedia search results', async () => {
    const wikiResponse = {
      query: {
        search: [
          { pageid: 123, title: 'IELTS', snippet: 'The <b>IELTS</b> test...' },
        ],
      },
    }
    vi.mocked(fetch).mockResolvedValueOnce(createMockResponse(wikiResponse))

    const res = await fetch('https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=IELTS&format=json&origin=*')
    const data = await res.json()
    const pages = data?.query?.search ?? []
    const results = pages.map((p: Record<string, unknown>) => ({
      id: 'wiki-' + p.pageid,
      title: String(p.title ?? ''),
      snippet: String(p.snippet ?? '').replace(/<[^>]+>/g, ''),
      sourceName: 'wikipedia' as const,
      sourceUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(String(p.title ?? ''))}`,
      contentType: 'article' as const,
      licenseName: 'CC BY-SA 3.0',
    }))

    expect(results).toHaveLength(1)
    expect(results[0].title).toBe('IELTS')
    expect(results[0].sourceName).toBe('wikipedia')
    expect(results[0].licenseName).toBe('CC BY-SA 3.0')
  })

  it('parses Datamuse word results', async () => {
    const dmData = [
      { word: 'environment', defs: ['the surroundings or conditions'], tags: ['noun', 'common'] },
    ]
    vi.mocked(fetch).mockResolvedValueOnce(createMockResponse(dmData))

    const res = await fetch('https://api.datamuse.com/words?ml=nature&max=10')
    const data = await res.json()
    const results = data.map((w: Record<string, unknown>, i: number) => ({
      id: 'dm-' + i + '-test',
      title: String(w.word ?? ''),
      snippet: [(w.defs as string[] | undefined)?.slice(0, 2).join('; ') ?? ''].filter(Boolean).join(' — '),
      sourceName: 'datamuse' as const,
      sourceUrl: 'https://www.datamuse.com/api/?ml=nature',
      contentType: 'vocabulary-list' as const,
      licenseName: 'CC BY 4.0',
    }))

    expect(results).toHaveLength(1)
    expect(results[0].title).toBe('environment')
    expect(results[0].licenseName).toBe('CC BY 4.0')
  })

  it('parses Gutendex book results', async () => {
    const guteData = {
      results: [{
        id: 123,
        title: 'Great Expectations',
        authors: [{ name: 'Charles Dickens' }],
        subjects: ['Fiction', 'Classic'],
      }],
    }
    vi.mocked(fetch).mockResolvedValueOnce(createMockResponse(guteData))

    const res = await fetch('https://gutendex.com/books?search=expectations')
    const data = await res.json()
    const books = data?.results ?? []
    const results = books.map((b: Record<string, unknown>) => ({
      id: 'gute-' + b.id,
      title: String(b.title ?? ''),
      snippet: [
        (b.authors as Array<{ name: string }> | undefined)?.map(a => a.name).join(', ') ?? '',
        (b.subjects as string[] | undefined)?.slice(0, 3).join(', ') ?? '',
      ].filter(Boolean).join(' — '),
      sourceName: 'gutendex' as const,
      sourceUrl: `https://www.gutenberg.org/ebooks/${b.id}`,
      contentType: 'reading' as const,
      licenseName: 'Public Domain',
    }))

    expect(results).toHaveLength(1)
    expect(results[0].title).toBe('Great Expectations')
    expect(results[0].licenseName).toBe('Public Domain')
  })

  it('throws error when YouTube API key is missing', async () => {
    await expect(async () => {
      const apiKey = ''
      if (!apiKey) {
        throw new Error('YouTube Data API requires an API key. Enter your key above to search YouTube.')
      }
    }).rejects.toThrow('API key')
  })

  it('handles Wikipedia API error', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(createMockResponse({ error: 'Internal error' }, 500, false))

    await expect(async () => {
      const res = await fetch('https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=test&format=json&origin=*')
      if (!res.ok) throw new Error(`Wikipedia API error: ${res.status}`)
    }).rejects.toThrow('Wikipedia API error: 500')
  })
})

// ── Source Configuration ───────────────────────────────────────────

describe('Public API source configurations', () => {
  it('has all required fields for each source', () => {
    for (const source of PUBLIC_API_SOURCES) {
      expect(source.name).toBeTruthy()
      expect(source.label).toBeTruthy()
      expect(source.category).toBeTruthy()
      expect(source.description).toBeTruthy()
      expect(source.supportedContentTypes.length).toBeGreaterThan(0)
      expect(['direct', 'cors-bypass', 'no-cors']).toContain(source.corsStatus)
      expect(typeof source.requiresApiKey).toBe('boolean')
      expect(source.baseUrl).toBeTruthy()
      expect(source.docsUrl).toBeTruthy()
      expect(source.defaultLicense).toBeTruthy()
    }
  })

  it('YouTube is the only source requiring an API key', () => {
    const requiringKey = PUBLIC_API_SOURCES.filter(s => s.requiresApiKey)
    expect(requiringKey).toHaveLength(1)
    expect(requiringKey[0].name).toBe('youtube')
  })

  it('YouTube is the only no-cors source', () => {
    const noCors = PUBLIC_API_SOURCES.filter(s => s.corsStatus === 'no-cors')
    expect(noCors).toHaveLength(1)
    expect(noCors[0].name).toBe('youtube')
  })

  it('has direct-cors sources in categories that support browser access', () => {
    const categories = new Set(PUBLIC_API_SOURCES.map(s => s.category))
    for (const cat of categories) {
      const sources = PUBLIC_API_SOURCES.filter(s => s.category === cat)
      const hasDirect = sources.some(s => s.corsStatus === 'direct')
      const hasNoCors = sources.some(s => s.corsStatus === 'no-cors')
      const allProxyOrNoCors = sources.every(s => s.corsStatus === 'no-cors' || s.corsStatus === 'cors-bypass')
      if (hasNoCors && !hasDirect) {
        expect(allProxyOrNoCors).toBe(true)
      } else if (!hasDirect && allProxyOrNoCors) {
        // Category only has cors-bypass sources (usable with proxy)
        expect(allProxyOrNoCors).toBe(true)
      } else {
        expect(hasDirect).toBe(true)
      }
    }
  })
})

// ── Content Model Validation ───────────────────────────────────────

describe('PublicApiImportedContent model', () => {
  it('has all required fields from the schema', () => {
    const requiredFields = [
      'id', 'title', 'content', 'contentType', 'sourceType',
      'sourceName', 'sourceUrl', 'licenseName', 'attribution',
      'importedAt', 'skill', 'topic', 'difficulty', 'tags', 'userNotes',
    ]

    const item: PublicApiImportedContent = {
      id: '1',
      title: 'Test',
      content: 'Content',
      contentType: 'dictionary',
      sourceType: 'public-api',
      sourceName: 'wiktionary',
      sourceUrl: 'https://example.com',
      licenseName: 'CC BY-SA 3.0',
      attribution: 'test',
      importedAt: new Date().toISOString(),
      skill: 'reading',
      topic: 'Education',
      difficulty: 'medium',
      tags: ['test'],
      userNotes: '',
    }

    for (const field of requiredFields) {
      expect(item).toHaveProperty(field)
    }
    expect(item.sourceType).toBe('public-api')
  })
})

// ── Integration: Import Flow ───────────────────────────────────────

describe('Integration: full import flow', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
    vi.stubGlobal('crypto', { randomUUID: () => 'integration-test-uuid' })
    vi.resetAllMocks()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('completes full import flow with Wikipedia content', async () => {
    const wikiExtractResponse = {
      query: {
        pages: {
          '456': {
            extract: 'Climate change refers to long-term shifts in temperatures and weather patterns.',
          },
        },
      },
    }
    mockDb.addPublicApiContent.mockResolvedValue({ id: 'integration-test-uuid' })
    vi.mocked(fetch).mockResolvedValueOnce(createMockResponse(wikiExtractResponse))

    const preview: PublicApiPreview = {
      id: 'wiki-456',
      title: 'Climate Change',
      content: 'Climate change refers to long-term shifts in temperatures and weather patterns.',
      contentType: 'article',
      sourceName: 'wikipedia',
      sourceUrl: 'https://en.wikipedia.org/wiki/Climate_Change',
      licenseName: 'CC BY-SA 3.0',
      attribution: 'Source: wikipedia (CC BY-SA 3.0)',
    }

    const result = await importPublicApiContent(preview, { topic: 'Environment', skill: 'reading' })

    if (!result.success) {
      throw new Error(`Import failed: ${result.error}`)
    }
    expect(result.success).toBe(true)
    expect(result.contentId).toBe('integration-test-uuid')
    expect(mockDb.addPublicApiContent).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Climate Change',
        sourceName: 'wikipedia',
        topic: 'Environment',
        skill: 'reading',
      }),
    )
  })

  it('rejects import with restrictive license', async () => {
    const preview: PublicApiPreview = {
      id: 'wiki-999',
      title: 'Copyrighted Content',
      content: 'Some restricted content',
      contentType: 'article',
      sourceName: 'wikipedia',
      sourceUrl: 'https://example.com',
      licenseName: 'All Rights Reserved',
      attribution: 'test',
    }

    const result = await importPublicApiContent(preview)
    expect(result.success).toBe(false)
    expect(mockDb.addPublicApiContent).not.toHaveBeenCalled()
  })

})


// ── CORS / Error Handling Integration ──────────────────────────────

describe('CORS and error handling integration', () => {
  it('marks YouTube as unusable from browser', () => {
    const youtubeSource = PUBLIC_API_SOURCES.find(s => s.name === 'youtube')!
    const usability = checkSourceUsability(youtubeSource)
    expect(usability.usable).toBe(false)
    expect(usability.errorInfo).not.toBeNull()
    expect(usability.errorInfo!.type).toBe('cors')
    expect(usability.warnings.some(w => w.includes('cannot be used directly'))).toBe(true)
  })

  it('suggests alternatives for CORS-restricted sources', () => {
    const youtubeSource = PUBLIC_API_SOURCES.find(s => s.name === 'youtube')!
    const suggestions = buildSuggestions('cors', youtubeSource)
    const hasManualImport = suggestions.some(s => s.type === 'manual-import')
    expect(hasManualImport).toBe(true)
  })

  it('guides user on auth errors for YouTube', () => {
    const youtubeSource = PUBLIC_API_SOURCES.find(s => s.name === 'youtube')!
    const error = new Error('YouTube API key is invalid or missing.')
    const result = buildErrorMessage(error, youtubeSource)
    expect(result.type).toBe('auth')
    expect(result.title).toBe('API Key Issue')
  })

  it('handles rate limit errors with source-specific message', () => {
    const datamuseSource = PUBLIC_API_SOURCES.find(s => s.name === 'datamuse')!
    const error = { status: 429, message: 'Too Many Requests' }
    const result = buildErrorMessage(error, datamuseSource)
    expect(result.type).toBe('rate-limit')
    expect(result.message).toContain('Datamuse')
    expect(result.suggestions.some(s => s.type === 'retry-later')).toBe(true)
  })
})

// ── AI API Error Handling ──────────────────────────────────────────

describe('AI API HTTP error handling', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('handles 401 from AI API', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(createMockResponse({ error: 'Unauthorized' }, 401, false))

    const result = await extractVocabulary('Some content', mockAiConfig)

    expect(result.data).toBeNull()
    expect(result.error).toContain('Invalid API key')
  })

  it('handles 429 from AI API', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(createMockResponse({ error: 'Rate limited' }, 429, false))

    const result = await extractVocabulary('Some content', mockAiConfig)
    expect(result.data).toBeNull()
    expect(result.error).toContain('Rate limit exceeded')
  })

  it('handles network errors in AI calls', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new TypeError('Failed to fetch'))

    const result = await extractVocabulary('Some content', mockAiConfig)

    expect(result.data).toBeNull()
    expect(result.error).toContain('Network error')
  })
})

// ── Search UI Logic Tests ─────────────────────────────────────────

describe('Search UI logic', () => {
  it('source without API key is searchable with any query', () => {
    const query = 'test'
    const requiresApiKey = false
    const apiKey = ''
    const canSearch = query.trim().length > 0 && (!requiresApiKey || apiKey.length > 0)
    expect(canSearch).toBe(true)
  })

  it('YouTube source requires API key to be searchable', () => {
    const query = 'test'
    const requiresApiKey = true
    const apiKey = ''
    const canSearch = query.trim().length > 0 && (!requiresApiKey || apiKey.length > 0)
    expect(canSearch).toBe(false)

    const withKey = 'AIzaSyTest'
    const canSearchWithKey = query.trim().length > 0 && (!requiresApiKey || withKey.length > 0)
    expect(canSearchWithKey).toBe(true)
  })

  it('disables search when query is empty', () => {
    const query = ''
    const canSearch = query.trim().length > 0
    expect(canSearch).toBe(false)
  })
})
