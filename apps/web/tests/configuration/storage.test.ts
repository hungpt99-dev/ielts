import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  createDefaultConfiguration,
  createDefaultProvider,
  loadConfiguration,
  saveConfiguration,
  clearConfiguration,
  configurationExists,
  getStorageStats,
  migrateFromLegacySettings,
} from '../../src/features/configuration/storage'

const STORAGE_KEY = 'ielts-configuration'
const LEGACY_KEY = 'ielts-settings'
const STORAGE_VERSION_KEY = 'ielts-configuration-version'

beforeEach(() => {
  localStorage.clear()
})

afterEach(() => {
  localStorage.clear()
})

describe('createDefaultProvider', () => {
  it('creates a default OpenAI provider', () => {
    const provider = createDefaultProvider()
    expect(provider.providerId).toBe('default-openai')
    expect(provider.provider).toBe('openai')
    expect(provider.baseUrl).toBe('https://api.openai.com/v1')
    expect(provider.model).toBe('gpt-4o-mini')
    expect(provider.temperature).toBe(0.7)
    expect(provider.maxTokens).toBe(2048)
    expect(provider.apiKey).toBe('')
    expect(provider.costLimit).toBe(10)
    expect(provider.usageLimit).toBe(1000)
    expect(provider.fallbackProvider).toBeNull()
    expect(provider.systemPrompt).toBe('')
  })
})

describe('createDefaultConfiguration', () => {
  it('creates configuration with default basic settings', () => {
    const config = createDefaultConfiguration()
    expect(config.basic.targetBand).toBe(7.0)
    expect(config.basic.examDate).toBe('')
    expect(config.basic.responseLanguage).toBe('english')
    expect(config.basic.tutorMode).toBe('friendly-tutor')
    expect(config.basic.dailyStudyMinutes).toBe(60)
  })

  it('creates configuration with default advanced settings', () => {
    const config = createDefaultConfiguration()
    expect(config.advanced.activeProviderId).toBe('default-openai')
    expect(Object.keys(config.advanced.providers)).toHaveLength(1)
    expect(config.advanced.providers['default-openai']).toBeDefined()
    expect(config.advanced.tutorConfig.mode).toBe('friendly-tutor')
    expect(config.advanced.tutorConfig.explanationStyle).toBe('detailed')
    expect(config.advanced.vocabReview.reviewsPerDay).toBe(20)
    expect(config.advanced.privacy.privacyLevel).toBe('local-only')
  })

  it('has all speaking feedback enabled by default', () => {
    const config = createDefaultConfiguration()
    expect(config.advanced.speakingFeedback.enablePronunciationFeedback).toBe(true)
    expect(config.advanced.speakingFeedback.enableFluencyFeedback).toBe(true)
    expect(config.advanced.speakingFeedback.enableVocabularyFeedback).toBe(true)
    expect(config.advanced.speakingFeedback.enableGrammarFeedback).toBe(true)
  })

  it('has all writing correction enabled by default', () => {
    const config = createDefaultConfiguration()
    expect(config.advanced.writingCorrection.enableGrammarCorrection).toBe(true)
    expect(config.advanced.writingCorrection.enableVocabularySuggestion).toBe(true)
    expect(config.advanced.writingCorrection.enableStructureFeedback).toBe(true)
    expect(config.advanced.writingCorrection.enableCoherenceFeedback).toBe(true)
    expect(config.advanced.writingCorrection.showImprovedVersion).toBe(true)
  })
})

describe('saveConfiguration and loadConfiguration', () => {
  it('saves and loads configuration correctly', () => {
    const config = createDefaultConfiguration()
    config.basic.targetBand = 8.0
    config.basic.dailyStudyMinutes = 120

    saveConfiguration(config)
    const loaded = loadConfiguration()

    expect(loaded.basic.targetBand).toBe(8.0)
    expect(loaded.basic.dailyStudyMinutes).toBe(120)
  })

  it('loads default config when nothing is stored', () => {
    const config = loadConfiguration()
    expect(config.basic.targetBand).toBe(7.0)
    expect(config.basic.dailyStudyMinutes).toBe(60)
  })

  it('persists tutor config changes', () => {
    const config = createDefaultConfiguration()
    config.advanced.tutorConfig.mode = 'strict-examiner'
    config.advanced.tutorConfig.explanationStyle = 'socratic'

    saveConfiguration(config)
    const loaded = loadConfiguration()

    expect(loaded.advanced.tutorConfig.mode).toBe('strict-examiner')
    expect(loaded.advanced.tutorConfig.explanationStyle).toBe('socratic')
  })

  it('persists provider changes', () => {
    const config = createDefaultConfiguration()
    config.advanced.providers['default-openai'].apiKey = 'sk-test-key'
    config.advanced.providers['default-openai'].temperature = 0.3

    saveConfiguration(config)
    const loaded = loadConfiguration()

    expect(loaded.advanced.providers['default-openai'].apiKey).toBe('sk-test-key')
    expect(loaded.advanced.providers['default-openai'].temperature).toBe(0.3)
  })

  it('persists privacy settings', () => {
    const config = createDefaultConfiguration()
    config.advanced.privacy.privacyLevel = 'local-with-analytics'
    config.advanced.privacy.allowAnonymousAnalytics = true

    saveConfiguration(config)
    const loaded = loadConfiguration()

    expect(loaded.advanced.privacy.privacyLevel).toBe('local-with-analytics')
    expect(loaded.advanced.privacy.allowAnonymousAnalytics).toBe(true)
  })

  it('persists vocab review settings', () => {
    const config = createDefaultConfiguration()
    config.advanced.vocabReview.reviewsPerDay = 50
    config.advanced.vocabReview.enableSpacedRepetition = false

    saveConfiguration(config)
    const loaded = loadConfiguration()

    expect(loaded.advanced.vocabReview.reviewsPerDay).toBe(50)
    expect(loaded.advanced.vocabReview.enableSpacedRepetition).toBe(false)
  })

  it('persists speaking feedback settings', () => {
    const config = createDefaultConfiguration()
    config.advanced.speakingFeedback.enablePronunciationFeedback = false

    saveConfiguration(config)
    const loaded = loadConfiguration()

    expect(loaded.advanced.speakingFeedback.enablePronunciationFeedback).toBe(false)
  })

  it('persists writing correction settings', () => {
    const config = createDefaultConfiguration()
    config.advanced.writingCorrection.showImprovedVersion = false

    saveConfiguration(config)
    const loaded = loadConfiguration()

    expect(loaded.advanced.writingCorrection.showImprovedVersion).toBe(false)
  })

  it('does not save invalid configuration', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const config = createDefaultConfiguration()
    ;(config as unknown as Record<string, unknown>).basic = null

    saveConfiguration(config as never)
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it('loads default config when localStorage is corrupted', () => {
    localStorage.setItem(STORAGE_KEY, '{invalid json')
    const config = loadConfiguration()
    expect(config.basic.targetBand).toBe(7.0)
  })

  it('merges partial stored config with defaults', () => {
    const partial = { basic: { targetBand: 8.5 } }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(partial))

    const config = loadConfiguration()
    expect(config.basic.targetBand).toBe(8.5)
    expect(config.basic.dailyStudyMinutes).toBe(60)
  })
})

describe('clearConfiguration', () => {
  it('removes configuration from localStorage', () => {
    saveConfiguration(createDefaultConfiguration())
    expect(configurationExists()).toBe(true)

    clearConfiguration()
    expect(configurationExists()).toBe(false)
  })

  it('removes version metadata', () => {
    saveConfiguration(createDefaultConfiguration())
    clearConfiguration()
    expect(localStorage.getItem(STORAGE_VERSION_KEY)).toBeNull()
  })

  it('handles clearing when nothing is stored', () => {
    expect(() => clearConfiguration()).not.toThrow()
  })
})

describe('configurationExists', () => {
  it('returns false when no configuration stored', () => {
    expect(configurationExists()).toBe(false)
  })

  it('returns true when configuration is stored', () => {
    saveConfiguration(createDefaultConfiguration())
    expect(configurationExists()).toBe(true)
  })
})

describe('getStorageStats', () => {
  it('returns zero stats when no configuration', () => {
    const stats = getStorageStats()
    expect(stats.sizeBytes).toBe(0)
    expect(stats.version).toBe(0)
  })

  it('returns size and version for stored configuration', () => {
    saveConfiguration(createDefaultConfiguration())
    const stats = getStorageStats()
    expect(stats.sizeBytes).toBeGreaterThan(0)
    expect(stats.version).toBe(1)
  })
})

describe('migrateFromLegacySettings', () => {
  it('returns null when no legacy settings exist', () => {
    const result = migrateFromLegacySettings()
    expect(result).toBeNull()
  })

  it('migrates legacy settings to new configuration', () => {
    const legacy = {
      targetBand: 6.5,
      examDate: '2026-12-15',
      dailyStudyMinutes: 45,
      aiApiKey: 'legacy-key',
      aiProvider: 'deepseek',
      aiBaseUrl: 'https://api.deepseek.com',
      aiModel: 'deepseek-chat',
    }
    localStorage.setItem(LEGACY_KEY, JSON.stringify(legacy))

    const result = migrateFromLegacySettings()
    expect(result).not.toBeNull()
    expect(result!.basic.targetBand).toBe(6.5)
    expect(result!.basic.examDate).toBe('2026-12-15')
    expect(result!.basic.dailyStudyMinutes).toBe(45)
    expect(result!.advanced.providers['default-openai'].apiKey).toBe('legacy-key')
    expect(result!.advanced.providers['default-openai'].provider).toBe('deepseek')
    expect(result!.advanced.providers['default-openai'].baseUrl).toBe('https://api.deepseek.com')
    expect(result!.advanced.providers['default-openai'].model).toBe('deepseek-chat')
  })

  it('handles partial legacy settings', () => {
    const legacy = { targetBand: 7.0 }
    localStorage.setItem(LEGACY_KEY, JSON.stringify(legacy))

    const result = migrateFromLegacySettings()
    expect(result!.basic.targetBand).toBe(7.0)
    expect(result!.basic.examDate).toBe('')
    expect(result!.basic.dailyStudyMinutes).toBe(60)
  })

  it('migrates aiEndpoint when aiBaseUrl is not set', () => {
    const legacy = {
      aiEndpoint: 'https://custom.endpoint.com/v1',
      aiModel: 'custom-model',
      aiApiKey: 'key',
    }
    localStorage.setItem(LEGACY_KEY, JSON.stringify(legacy))

    const result = migrateFromLegacySettings()
    expect(result!.advanced.providers['default-openai'].baseUrl).toBe('https://custom.endpoint.com/v1')
  })

  it('prefers aiBaseUrl over aiEndpoint', () => {
    const legacy = {
      aiBaseUrl: 'https://base.url/v1',
      aiEndpoint: 'https://endpoint.url/v1',
    }
    localStorage.setItem(LEGACY_KEY, JSON.stringify(legacy))

    const result = migrateFromLegacySettings()
    expect(result!.advanced.providers['default-openai'].baseUrl).toBe('https://base.url/v1')
  })

  it('returns null for non-object legacy data', () => {
    localStorage.setItem(LEGACY_KEY, '"string"')
    expect(migrateFromLegacySettings()).toBeNull()
  })

  it('returns null for invalid JSON legacy data', () => {
    localStorage.setItem(LEGACY_KEY, 'not json')
    expect(migrateFromLegacySettings()).toBeNull()
  })
})

describe('loadConfiguration with migration', () => {
  it('triggers migration from legacy settings when they exist', () => {
    const legacy = { targetBand: 8.0, aiModel: 'gpt-4' }
    localStorage.setItem(LEGACY_KEY, JSON.stringify(legacy))

    const migrated = migrateFromLegacySettings()
    expect(migrated).not.toBeNull()
    expect(migrated!.basic.targetBand).toBe(8.0)
  })

  it('handles corrupted stored config gracefully', () => {
    localStorage.setItem(STORAGE_KEY, '{broken')
    const config = loadConfiguration()
    expect(config.basic.targetBand).toBe(7.0)
  })
})
