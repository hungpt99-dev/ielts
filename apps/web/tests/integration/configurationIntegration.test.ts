import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createDefaultConfiguration, saveConfiguration, loadConfiguration, clearConfiguration, migrateFromLegacySettings } from '../../src/features/configuration/storage'
import { AITutorService } from '../../src/features/ai-tutor/aiTutorService'
import type { PersonalizationContext } from '../../src/features/personalization/types'

const mockCallAI = vi.hoisted(() =>
  vi.fn((_systemPrompt: string, _userPrompt: string) =>
    Promise.resolve({ content: 'AI response', error: null }),
  ),
)

vi.mock('@ielts/ai', () => ({
  callAI: mockCallAI,
}))

vi.mock('../../src/services/storage/Database', () => ({
  DatabaseService: {
    getAll: () => Promise.resolve([]),
  },
}))

vi.mock('../../src/services/storage/SettingsStorage', () => ({
  loadAppSettings: () => ({
    targetBand: 6.0,
    currentBand: 5.0,
    examDate: '',
    dailyStudyMinutes: 30,
    weakSkills: [],
    preferredTopics: [],
    studyReminder: '',
    studyGoal: 'academic' as const,
    preferredSchedule: [],
    aiApiKey: '',
    aiProvider: 'openai' as const,
    aiEndpoint: '',
    aiModel: 'gpt-4o-mini',
    darkMode: false,
    aiEnabled: true,
  }),
}))

vi.mock('../../src/features/roadmap/roadmapService', () => ({
  loadRoadmap: () => ({
    phases: [],
    currentPhaseIndex: 0,
    currentWeekIndex: 0,
    overallProgress: 0,
    totalTasks: 0,
    completedTasks: 0,
    generatedAt: '',
    updatedAt: '',
  }),
  getTodayTask: () => null,
}))

vi.mock('../../src/features/personalization/personalizationService', () => ({
  buildPersonalizationContext: () => null,
  analyzeWeakSkills: vi.fn(),
  generateRecommendations: vi.fn(),
  getTodayRecommendation: vi.fn(),
  getAITutorContext: vi.fn(),
  getReasonLabel: vi.fn(),
}))

let service: AITutorService

const STORAGE_KEY = 'ielts-configuration'
const LEGACY_KEY = 'ielts-settings'

beforeEach(() => {
  localStorage.clear()
  service = new AITutorService()
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-07-03T10:00:00Z'))
})

afterEach(() => {
  vi.useRealTimers()
  localStorage.clear()
})

function createContext(overrides?: Partial<PersonalizationContext>): PersonalizationContext {
  return {
    profile: {
      targetBand: 7.0,
      currentBand: 5.5,
      examDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      dailyStudyMinutes: 60,
      weakSkills: ['Writing', 'Speaking'],
      preferredTopics: ['Environment'],
      studyGoal: 'academic',
      preferredSchedule: ['mon', 'wed', 'fri'],
    },
    progress: {
      studyStreak: 5,
      todayUnfinished: 0,
      weeklyActiveDays: 3,
      tasksCompletedThisWeek: 10,
    },
    exam: {
      examDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      countdownDays: 60,
      isUrgent: false,
    },
    vocabulary: {
      totalWords: 50,
      dueForReview: 5,
    },
    mistakes: {
      total: 3,
      recent: [],
    },
    ...overrides,
  }
}

describe('End-to-end: Configuration Persistence', () => {
  it('saves configuration and loads it back correctly', () => {
    const config = createDefaultConfiguration()
    config.basic.targetBand = 8.5
    config.basic.dailyStudyMinutes = 120
    config.basic.tutorMode = 'strict-examiner'
    config.advanced.tutorConfig.mode = 'strict-examiner'
    config.advanced.tutorConfig.explanationStyle = 'socratic'
    config.advanced.privacy.privacyLevel = 'local-with-analytics'
    config.advanced.vocabReview.reviewsPerDay = 30

    saveConfiguration(config)
    const loaded = loadConfiguration()

    expect(loaded.basic.targetBand).toBe(8.5)
    expect(loaded.basic.dailyStudyMinutes).toBe(120)
    expect(loaded.basic.tutorMode).toBe('strict-examiner')
    expect(loaded.advanced.tutorConfig.mode).toBe('strict-examiner')
    expect(loaded.advanced.tutorConfig.explanationStyle).toBe('socratic')
    expect(loaded.advanced.privacy.privacyLevel).toBe('local-with-analytics')
    expect(loaded.advanced.vocabReview.reviewsPerDay).toBe(30)
  })

  it('loads default config when nothing is stored', () => {
    const config = loadConfiguration()
    expect(config.basic.targetBand).toBe(7.0)
    expect(config.advanced.tutorConfig.mode).toBe('friendly-tutor')
  })
})

describe('End-to-end: Migration from Legacy Settings', () => {
  it('migrates legacy settings using migrateFromLegacySettings', () => {
    const legacy = {
      targetBand: 6.0,
      examDate: '2026-12-15',
      dailyStudyMinutes: 45,
      aiApiKey: 'sk-legacy',
      aiProvider: 'deepseek',
      aiModel: 'deepseek-chat',
    }
    localStorage.setItem(LEGACY_KEY, JSON.stringify(legacy))

    const migrated = migrateFromLegacySettings()
    expect(migrated).not.toBeNull()
    expect(migrated!.basic.targetBand).toBe(6.0)
    expect(migrated!.basic.examDate).toBe('2026-12-15')
    expect(migrated!.basic.dailyStudyMinutes).toBe(45)
    expect(migrated!.advanced.providers['default-openai'].apiKey).toBe('sk-legacy')
    expect(migrated!.advanced.providers['default-openai'].provider).toBe('deepseek')
    expect(migrated!.advanced.providers['default-openai'].model).toBe('deepseek-chat')
  })

  it('migrated configuration is saveable and reloadable', () => {
    const legacy = { targetBand: 7.5, aiApiKey: 'sk-test' }
    localStorage.setItem(LEGACY_KEY, JSON.stringify(legacy))

    const migrated = migrateFromLegacySettings()
    expect(migrated).not.toBeNull()

    migrated!.basic.dailyStudyMinutes = 90
    saveConfiguration(migrated!)

    localStorage.removeItem(LEGACY_KEY)
    const reloaded = loadConfiguration()
    expect(reloaded.basic.targetBand).toBe(7.5)
    expect(reloaded.basic.dailyStudyMinutes).toBe(90)
    expect(reloaded.advanced.providers['default-openai'].apiKey).toBe('sk-test')
  })
})

describe('End-to-end: Configuration and AI Tutor integration', () => {
  it('buildProviderConfig returns config with API key', () => {
    const config = createDefaultConfiguration()
    config.advanced.providers['default-openai'].apiKey = 'sk-real-key'
    config.advanced.providers['default-openai'].baseUrl = 'https://api.openai.com/v1'
    config.advanced.providers['default-openai'].model = 'gpt-4o'
    config.advanced.providers['default-openai'].temperature = 0.5
    config.advanced.providers['default-openai'].maxTokens = 4096
    saveConfiguration(config)

    const providerConfig = service['buildProviderConfig']()
    expect(providerConfig).not.toBeNull()
    expect(providerConfig!.apiKey).toBe('sk-real-key')
    expect(providerConfig!.baseUrl).toBe('https://api.openai.com/v1')
    expect(providerConfig!.model).toBe('gpt-4o')
    expect(providerConfig!.temperature).toBe(0.5)
    expect(providerConfig!.maxTokens).toBe(4096)
  })

  it('buildProviderConfig returns null when no API key configured', () => {
    saveConfiguration(createDefaultConfiguration())
    const providerConfig = service['buildProviderConfig']()
    expect(providerConfig).toBeNull()
  })

  it('buildProviderConfig falls back to second provider when first lacks API key', () => {
    const config = createDefaultConfiguration()
    config.advanced.providers['default-openai'].apiKey = ''
    config.advanced.providers['default-openai'].fallbackProvider = null
    config.advanced.providers['fallback-provider'] = {
      providerId: 'fallback-provider',
      provider: 'claude',
      apiKey: 'sk-fallback',
      baseUrl: 'https://api.anthropic.com/v1',
      model: 'claude-3',
      temperature: 0.3,
      maxTokens: 2048,
      systemPrompt: '',
      costLimit: 10,
      usageLimit: 1000,
      fallbackProvider: null,
    }
    saveConfiguration(config)

    const providerConfig = service['buildProviderConfig']()
    expect(providerConfig).not.toBeNull()
    expect(providerConfig!.apiKey).toBe('sk-fallback')
  })

  it('buildProviderConfig uses fallback provider when active has no key', () => {
    const config = createDefaultConfiguration()
    config.advanced.providers['default-openai'].apiKey = ''
    config.advanced.providers['default-openai'].fallbackProvider = 'fallback'
    config.advanced.providers['fallback'] = {
      providerId: 'fallback',
      provider: 'openai',
      apiKey: 'sk-fallback-key',
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 2048,
      systemPrompt: '',
      costLimit: 10,
      usageLimit: 1000,
      fallbackProvider: null,
    }
    saveConfiguration(config)

    const providerConfig = service['buildProviderConfig']()
    expect(providerConfig).not.toBeNull()
    expect(providerConfig!.apiKey).toBe('sk-fallback-key')
  })

  it('buildTutorSystemPrompt includes tutor mode from config', () => {
    const config = createDefaultConfiguration()
    config.advanced.tutorConfig.mode = 'strict-examiner'
    config.advanced.tutorConfig.explanationStyle = 'step-by-step'
    config.advanced.tutorConfig.correctionStrictness = 'strict'
    config.advanced.tutorConfig.feedbackDepth = 'thorough'
    config.basic.responseLanguage = 'english'
    saveConfiguration(config)

    const context = createContext()
    const prompt = service['buildTutorSystemPrompt'](context)
    expect(prompt).toContain('strict IELTS examiner')
    expect(prompt).toContain('clear, sequential steps')
    expect(prompt).toContain('Be direct and precise')
    expect(prompt).toContain('comprehensive, detailed feedback')
    expect(prompt).toContain('Always respond in English')
  })

  it('buildTutorSystemPrompt includes custom system prompt', () => {
    const config = createDefaultConfiguration()
    config.advanced.tutorConfig.customSystemPrompt = 'Always provide band-9 examples'
    saveConfiguration(config)

    const context = createContext()
    const prompt = service['buildTutorSystemPrompt'](context)
    expect(prompt).toContain('Always provide band-9 examples')
  })

  it('buildTutorSystemPrompt includes weak skills from context', () => {
    saveConfiguration(createDefaultConfiguration())
    const context = createContext()
    const prompt = service['buildTutorSystemPrompt'](context)
    expect(prompt).toContain('Writing')
    expect(prompt).toContain('Speaking')
  })

  it('buildTutorSystemPrompt respects Vietnamese response language', () => {
    const config = createDefaultConfiguration()
    config.basic.responseLanguage = 'vietnamese'
    saveConfiguration(config)

    const context = createContext()
    const prompt = service['buildTutorSystemPrompt'](context)
    expect(prompt).toContain('Always respond in Vietnamese')
  })

  it('buildTutorSystemPrompt respects bilingual response language', () => {
    const config = createDefaultConfiguration()
    config.basic.responseLanguage = 'both'
    saveConfiguration(config)

    const context = createContext()
    const prompt = service['buildTutorSystemPrompt'](context)
    expect(prompt).toContain('English and Vietnamese')
  })
})

describe('End-to-end: Multiple config save/load cycles', () => {
  it('survives multiple save and load cycles', () => {
    const config1 = createDefaultConfiguration()
    config1.basic.targetBand = 6.5
    saveConfiguration(config1)
    const loaded1 = loadConfiguration()
    expect(loaded1.basic.targetBand).toBe(6.5)

    const config2 = loaded1
    config2.basic.targetBand = 7.5
    config2.advanced.tutorConfig.mode = 'vocabulary-focused-tutor'
    saveConfiguration(config2)
    const loaded2 = loadConfiguration()
    expect(loaded2.basic.targetBand).toBe(7.5)
    expect(loaded2.advanced.tutorConfig.mode).toBe('vocabulary-focused-tutor')
  })

  it('clearConfiguration resets to defaults on next load', () => {
    const config = createDefaultConfiguration()
    config.basic.targetBand = 9
    saveConfiguration(config)
    clearConfiguration()

    const loaded = loadConfiguration()
    expect(loaded.basic.targetBand).toBe(7.0)
  })
})
