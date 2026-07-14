import type {
  UserConfiguration,
  ConfigurationBasic,
  ConfigurationAdvanced,
  AiProviderConfig,
  AiTutorConfig,
  AiProviderType,
  AiTutorMode,
  AiResponseLanguage,
  ExplanationStyle,
  CorrectionStrictness,
  ExerciseDifficulty,
  FeedbackDepth,
  AutomationLevel,
  StudyReminderFrequency,
  PrivacyLevel,
} from './models'

const STORAGE_KEY = 'ielts-configuration'
const LEGACY_STORAGE_KEY = 'ielts-settings'
const STORAGE_VERSION_KEY = 'ielts-configuration-version'
const CURRENT_VERSION = 1

export interface StorageMeta {
  version: number
  migratedAt: string | null
}

export function createDefaultProvider(): AiProviderConfig {
  return {
    providerId: 'default-openai',
    provider: 'openai' as AiProviderType,
    apiKey: '',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    temperature: 0.7,
    maxTokens: 2048,
    systemPrompt: '',
    costLimit: 10,
    usageLimit: 1000,
    fallbackProvider: null,
  }
}

function createDefaultTutorConfig(): AiTutorConfig {
  return {
    mode: 'friendly-tutor' as AiTutorMode,
    explanationStyle: 'detailed' as ExplanationStyle,
    correctionStrictness: 'balanced' as CorrectionStrictness,
    responseLanguage: 'english' as AiResponseLanguage,
    exerciseDifficulty: 'adaptive' as ExerciseDifficulty,
    feedbackDepth: 'standard' as FeedbackDepth,
    automationLevel: 'semi-automatic' as AutomationLevel,
    studyReminderFrequency: 'daily' as StudyReminderFrequency,
    customSystemPrompt: '',
  }
}

function createDefaultAdvanced(): ConfigurationAdvanced {
  return {
    activeProviderId: 'default-openai',
    providers: { 'default-openai': createDefaultProvider() },
    tutorConfig: createDefaultTutorConfig(),
    vocabReview: {
      reviewsPerDay: 20,
      enableSpacedRepetition: true,
      enableContextSentences: true,
      enableExampleSentences: true,
      enableSynonyms: true,
    },
    speakingFeedback: {
      enablePronunciationFeedback: true,
      enableFluencyFeedback: true,
      enableVocabularyFeedback: true,
      enableGrammarFeedback: true,
    },
    writingCorrection: {
      enableGrammarCorrection: true,
      enableVocabularySuggestion: true,
      enableStructureFeedback: true,
      enableCoherenceFeedback: true,
      showImprovedVersion: true,
    },
    privacy: {
      privacyLevel: 'local-only' as PrivacyLevel,
      allowAnonymousAnalytics: false,
      allowCrashReporting: false,
      storeConversationHistory: true,
      storeUsageStatistics: true,
    },
  }
}

function createDefaultBasic(): ConfigurationBasic {
  return {
    targetBand: 7.0,
    examDate: '',
    nativeLanguage: '',
    responseLanguage: 'english' as AiResponseLanguage,
    tutorMode: 'friendly-tutor' as AiTutorMode,
    dailyStudyMinutes: 60,
  }
}

export function createDefaultConfiguration(): UserConfiguration {
  return {
    basic: createDefaultBasic(),
    advanced: createDefaultAdvanced(),
  }
}

function getStoredMeta(): StorageMeta {
  try {
    const raw = localStorage.getItem(STORAGE_VERSION_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        version: typeof parsed.version === 'number' ? parsed.version : 0,
        migratedAt: typeof parsed.migratedAt === 'string' ? parsed.migratedAt : null,
      }
    }
  } catch (error) {
    console.error('apps/web/src/features/configuration/storage.ts error:', error);
    /* ignore */
  }
  return { version: 0, migratedAt: null }
}

function setStoredMeta(meta: StorageMeta): void {
  try {
    localStorage.setItem(STORAGE_VERSION_KEY, JSON.stringify(meta))
  } catch (error) {
    console.error('apps/web/src/features/configuration/storage.ts error:', error);
    /* ignore */
  }
}

function migrateV0toV1(raw: Record<string, unknown>): boolean {
  const legacyKey = 'ielts-settings'
  const legacyRaw = localStorage.getItem(legacyKey)
  if (!legacyRaw) return false

  try {
    const legacy = JSON.parse(legacyRaw)
    if (!legacy || typeof legacy !== 'object') return false

    if (typeof legacy.targetBand === 'number') {
      (raw.basic as Record<string, unknown>).targetBand = legacy.targetBand
    }
    if (typeof legacy.examDate === 'string') {
      (raw.basic as Record<string, unknown>).examDate = legacy.examDate
    }
    if (typeof legacy.dailyStudyMinutes === 'number') {
      (raw.basic as Record<string, unknown>).dailyStudyMinutes = legacy.dailyStudyMinutes
    }

    const provider = createDefaultProvider()
    if (typeof legacy.aiApiKey === 'string') provider.apiKey = legacy.aiApiKey
    if (typeof legacy.aiProvider === 'string') provider.provider = legacy.aiProvider as AiProviderType
    if (typeof legacy.aiBaseUrl === 'string') provider.baseUrl = legacy.aiBaseUrl
    if (typeof legacy.aiModel === 'string') provider.model = legacy.aiModel
    if (typeof legacy.aiEndpoint === 'string' && !legacy.aiBaseUrl) provider.baseUrl = legacy.aiEndpoint

    ;(raw.advanced as Record<string, unknown>).providers = {
      'default-openai': provider,
    }
    ;(raw.advanced as Record<string, unknown>).activeProviderId = 'default-openai'

    localStorage.removeItem(legacyKey)
    return true
  } catch (error) {
    console.error('apps/web/src/features/configuration/storage.ts error:', error);
    return false
  }
}

const MIGRATIONS: Record<number, (raw: Record<string, unknown>) => boolean> = {
  0: migrateV0toV1,
}

function runMigrations(raw: Record<string, unknown>, fromVersion: number): void {
  const versions = Object.keys(MIGRATIONS)
    .map(Number)
    .sort((a, b) => a - b)

  for (const version of versions) {
    if (version >= fromVersion && version < CURRENT_VERSION) {
      MIGRATIONS[version](raw)
    }
  }
}

interface ValidationResult {
  valid: boolean
  errors: string[]
}

function validateConfiguration(raw: unknown): ValidationResult {
  const errors: string[] = []

  if (!raw || typeof raw !== 'object') {
    return { valid: false, errors: ['Configuration is not an object'] }
  }

  const config = raw as Record<string, unknown>

  if (!config.basic || typeof config.basic !== 'object') {
    errors.push('Missing or invalid basic configuration')
  } else {
    const basic = config.basic as Record<string, unknown>
    if (typeof basic.targetBand !== 'number' || basic.targetBand < 0 || basic.targetBand > 9) {
      errors.push('targetBand must be a number between 0 and 9')
    }
    if (basic.examDate !== undefined && typeof basic.examDate !== 'string') {
      errors.push('examDate must be a string')
    }
    if (typeof basic.dailyStudyMinutes !== 'number' || basic.dailyStudyMinutes < 0) {
      errors.push('dailyStudyMinutes must be a non-negative number')
    }
  }

  if (!config.advanced || typeof config.advanced !== 'object') {
    errors.push('Missing or invalid advanced configuration')
  } else {
    const advanced = config.advanced as Record<string, unknown>
    if (typeof advanced.activeProviderId !== 'string') {
      errors.push('activeProviderId must be a string')
    }
    if (!advanced.providers || typeof advanced.providers !== 'object') {
      errors.push('Missing or invalid providers')
    } else {
      const providers = advanced.providers as Record<string, unknown>
      if (!providers[advanced.activeProviderId as string]) {
        errors.push('activeProviderId does not match any configured provider')
      }
    }
  }

  return { valid: errors.length === 0, errors }
}

function deepMerge<T extends Record<string, unknown>>(defaults: T, overrides: Partial<T>): T {
  const result = { ...defaults }
  for (const key of Object.keys(overrides) as (keyof T)[]) {
    const val = overrides[key]
    if (val !== undefined && val !== null) {
      if (
        typeof val === 'object' &&
        !Array.isArray(val) &&
        typeof defaults[key] === 'object' &&
        !Array.isArray(defaults[key])
      ) {
        result[key] = deepMerge(
          defaults[key] as Record<string, unknown>,
          val as Record<string, unknown>,
        ) as T[keyof T]
      } else {
        result[key] = val as T[keyof T]
      }
    }
  }
  return result
}

export function loadConfiguration(): UserConfiguration {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const meta = getStoredMeta()

    if (raw) {
      const parsed = JSON.parse(raw)
      const defaults = createDefaultConfiguration()

      if (meta.version < CURRENT_VERSION) {
        runMigrations(parsed, meta.version)
      }

      const validation = validateConfiguration(parsed)
      if (!validation.valid) {
        console.warn('Configuration validation failed, applying defaults for invalid fields:', validation.errors)
      }

      const config: UserConfiguration = {
        basic: {
          ...defaults.basic,
          ...(parsed.basic || {}),
        },
        advanced: {
          ...defaults.advanced,
          ...(parsed.advanced || {}),
          providers: deepMerge(
            defaults.advanced.providers,
            (parsed.advanced?.providers || {}) as Partial<typeof defaults.advanced.providers>,
          ),
          tutorConfig: deepMerge(
            defaults.advanced.tutorConfig,
            (parsed.advanced?.tutorConfig || {}) as Partial<typeof defaults.advanced.tutorConfig>,
          ) as AiTutorConfig,
          vocabReview: deepMerge(
            defaults.advanced.vocabReview,
            (parsed.advanced?.vocabReview || {}) as Partial<typeof defaults.advanced.vocabReview>,
          ) as typeof defaults.advanced.vocabReview,
          speakingFeedback: deepMerge(
            defaults.advanced.speakingFeedback,
            (parsed.advanced?.speakingFeedback || {}) as Partial<typeof defaults.advanced.speakingFeedback>,
          ) as typeof defaults.advanced.speakingFeedback,
          writingCorrection: deepMerge(
            defaults.advanced.writingCorrection,
            (parsed.advanced?.writingCorrection || {}) as Partial<typeof defaults.advanced.writingCorrection>,
          ) as typeof defaults.advanced.writingCorrection,
          privacy: deepMerge(
            defaults.advanced.privacy,
            (parsed.advanced?.privacy || {}) as Partial<typeof defaults.advanced.privacy>,
          ) as typeof defaults.advanced.privacy,
        },
      }

      if (meta.version < CURRENT_VERSION) {
        setStoredMeta({ version: CURRENT_VERSION, migratedAt: new Date().toISOString() })
        saveConfiguration(config)
      }

      return config
    }

    const defaults = createDefaultConfiguration()
    return defaults
  } catch (error) {
    console.error('apps/web/src/features/configuration/storage.ts error:', error);
    return createDefaultConfiguration()
  }
}

export function saveConfiguration(config: UserConfiguration): void {
  try {
    const validation = validateConfiguration(config)
    if (!validation.valid) {
      console.error('Attempted to save invalid configuration:', validation.errors)
      return
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
    setStoredMeta({ version: CURRENT_VERSION, migratedAt: new Date().toISOString() })
  } catch (e) {
    console.error('Failed to save configuration to localStorage:', e)
  }
}

export function clearConfiguration(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(STORAGE_VERSION_KEY)
  } catch (e) {
    console.error('Failed to clear configuration:', e)
  }
}

export function migrateFromLegacySettings(): UserConfiguration | null {
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY)
    if (!raw) return null

    const legacy = JSON.parse(raw)
    if (!legacy || typeof legacy !== 'object') return null

    const config = createDefaultConfiguration()
    if (typeof legacy.targetBand === 'number') config.basic.targetBand = legacy.targetBand
    if (typeof legacy.examDate === 'string') config.basic.examDate = legacy.examDate
    if (typeof legacy.dailyStudyMinutes === 'number') config.basic.dailyStudyMinutes = legacy.dailyStudyMinutes

    const provider = createDefaultProvider()
    if (typeof legacy.aiApiKey === 'string') provider.apiKey = legacy.aiApiKey
    if (typeof legacy.aiProvider === 'string') provider.provider = legacy.aiProvider as AiProviderType
    if (typeof legacy.aiBaseUrl === 'string') provider.baseUrl = legacy.aiBaseUrl
    if (typeof legacy.aiModel === 'string') provider.model = legacy.aiModel
    if (typeof legacy.aiEndpoint === 'string' && !legacy.aiBaseUrl) provider.baseUrl = legacy.aiEndpoint

    config.advanced.providers = { 'default-openai': provider }
    config.advanced.activeProviderId = 'default-openai'

    return config
  } catch (error) {
    console.error('apps/web/src/features/configuration/storage.ts error:', error);
    return null
  }
}

export function configurationExists(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null
  } catch (error) {
    console.error('apps/web/src/features/configuration/storage.ts error:', error);
    return false
  }
}

export function getStorageStats(): { sizeBytes: number; version: number } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const meta = getStoredMeta()
    return {
      sizeBytes: raw ? new Blob([raw]).size : 0,
      version: meta.version,
    }
  } catch (error) {
    console.error('apps/web/src/features/configuration/storage.ts error:', error);
    return { sizeBytes: 0, version: 0 }
  }
}
