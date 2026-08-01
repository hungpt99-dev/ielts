import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockCreateVocabularyEngine = vi.fn()

vi.mock('@ielts/vocabulary-engine', () => ({
  createVocabularyEngine: mockCreateVocabularyEngine,
  DexieVocabularyRepository: vi.fn(),
  DexieVocabReviewRepository: vi.fn(),
}))

describe('vocabulary engine bootstrap', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('creates the vocabulary engine with Dexie adapters and exposes it', async () => {
    mockCreateVocabularyEngine.mockReset().mockReturnValue({ id: 'vocabulary-engine' })

    const { initializeVocabularyEngine, getVocabularyEngine } = await import('../engineBootstrap')

    const engine = await initializeVocabularyEngine()

    expect(engine).toEqual({ id: 'vocabulary-engine' })
    expect(mockCreateVocabularyEngine).toHaveBeenCalledTimes(1)
    expect(mockCreateVocabularyEngine).toHaveBeenCalledWith(
      expect.objectContaining({
        vocabularyRepository: expect.anything(),
        vocabReviewRepository: expect.anything(),
        clock: expect.anything(),
      }),
    )
    expect(getVocabularyEngine()).toEqual({ id: 'vocabulary-engine' })
  })

  it('reuses the existing instance on subsequent initializations', async () => {
    mockCreateVocabularyEngine.mockReset().mockReturnValue({ id: 'vocabulary-engine' })

    const { initializeVocabularyEngine } = await import('../engineBootstrap')

    await initializeVocabularyEngine()
    await initializeVocabularyEngine()

    expect(mockCreateVocabularyEngine).toHaveBeenCalledTimes(1)
  })

  it('returns null and keeps the singleton empty when creation fails', async () => {
    mockCreateVocabularyEngine.mockReset().mockImplementation(() => {
      throw new Error('construction failed')
    })

    const { initializeVocabularyEngine, getVocabularyEngine } = await import('../engineBootstrap')

    const engine = await initializeVocabularyEngine()

    expect(engine).toBeNull()
    expect(getVocabularyEngine()).toBeNull()
  })
})
