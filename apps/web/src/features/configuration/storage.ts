import type {
  ExtendedUserConfiguration,
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
import { STORAGE_KEYS, DEFAULT_AI_MODEL, DEFAULT_AI_PROVIDER_ID } from '@ielts/config'
import { loadUserConfiguration } from '@ielts/settings'
import type { UserConfiguration } from '@ielts/settings'

const STORAGE_KEY = STORAGE_KEYS.localStorage.configurationAdvanced
const LEGACY_STORAGE_KEY = STORAGE_KEYS.localStorage.appSettings
const STORAGE_VERSION_KEY = STORAGE_KEYS.localStorage.configurationAdvancedVersion
const CURRENT_VERSION = 1

export interface StorageMeta {
  version: number
  migratedAt: string | null
}

export function createDefaultProvider(): AiProviderConfig {
  return {
    providerId: `default-${DEFAULT_AI_PROVIDER_ID}`,
    provider: DEFAULT_AI_PROVIDER_ID as AiProviderType,
    apiKey: '',
    baseUrl: 'https://api.openai.com/v1',
    model: DEFAULT_AI_MODEL,
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
    activeProviderId: `default-${DEFAULT_AI_PROVIDER_ID}`,
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

export function createDefaultConfiguration(): ExtendedUserConfiguration {
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

function applyCanonicalToBasic(basic: ConfigurationBasic, canonical: UserConfiguration): void {
  if (canonical.study.targetBand) basic.targetBand = canonical.study.targetBand
  if (canonical.study.examDate) basic.examDate = canonical.study.examDate
  if (canonical.study.nativeLanguage) basic.nativeLanguage = canonical.study.nativeLanguage
  if (canonical.study.dailyStudyMinutes) basic.dailyStudyMinutes = canonical.study.dailyStudyMinutes
}

function applyCanonicalToProvider(advanced: ConfigurationAdvanced, canonical: UserConfiguration): void {
  const activeId = advanced.activeProviderId
  if (!activeId || !advanced.providers[activeId]) return

  const provider = advanced.providers[activeId]
  if (canonical.ai.providerId) {
    provider.provider = canonical.ai.providerId as AiProviderType
  }
  if (canonical.ai.model) provider.model = canonical.ai.model
  if (canonical.ai.customApiUrl) provider.baseUrl = canonical.ai.customApiUrl
}

function syncCanonicalFromConfig(config: ExtendedUserConfiguration): void {
  try {
    const canonical = loadUserConfiguration()
    const activeId = config.advanced.activeProviderId
    const activeProvider = activeId ? config.advanced.providers[activeId] : null

    const updated: Partial<UserConfiguration> = {}
    const study: Record<string, unknown> = {}
    if (config.basic.targetBand !== canonical.study.targetBand) study.targetBand = config.basic.targetBand
    if (config.basic.examDate !== canonical.study.examDate) study.examDate = config.basic.examDate
    if (config.basic.nativeLanguage !== canonical.study.nativeLanguage) study.nativeLanguage = config.basic.nativeLanguage
    if (config.basic.dailyStudyMinutes !== canonical.study.dailyStudyMinutes) study.dailyStudyMinutes = config.basic.dailyStudyMinutes

    if (Object.keys(study).length > 0) {
      const mergedStudy = { ...canonical.study, ...study }
      updated.study = mergedStudy
    }

    const ai: Record<string, unknown> = {}
    if (activeProvider) {
      if (activeProvider.provider && activeProvider.provider !== canonical.ai.providerId) ai.providerId = activeProvider.provider
      if (activeProvider.model && activeProvider.model !== canonical.ai.model) ai.model = activeProvider.model
      if (activeProvider.baseUrl && activeProvider.baseUrl !== canonical.ai.customApiUrl) ai.customApiUrl = activeProvider.baseUrl
    }

    if (Object.keys(ai).length > 0) {
      const mergedAi = { ...canonical.ai, ...ai }
      updated.ai = mergedAi
    }

    if (Object.keys(updated).length > 0) {
      const merged = { ...canonical, ...updated }
      localStorage.setItem(STORAGE_KEYS.localStorage.userSettings, JSON.stringify(merged))
      window.dispatchEvent(new CustomEvent('ielts-settings-updated', { detail: merged }))
    }
  } catch (error) {
    console.error('apps/web/src/features/configuration/storage.ts error:', error);
  }
}

function migrateV0toV1(raw: Record<string, unknown>): boolean {
  const legacyKey = STORAGE_KEYS.localStorage.appSettings
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
      [`default-${DEFAULT_AI_PROVIDER_ID}`]: provider,
    }
    ;(raw.advanced as Record<string, unknown>).activeProviderId = `default-${DEFAULT_AI_PROVIDER_ID}`

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

function loadExtendedConfig(): ExtendedUserConfiguration | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as ExtendedUserConfiguration
  } catch {
    return null
  }
}

export function loadConfiguration(): ExtendedUserConfiguration {
  try {
    const meta = getStoredMeta()
    const extended = loadExtendedConfig()
    const defaults = createDefaultConfiguration()
    const canonical = loadUserConfiguration()

    if (!extended) {
      const fresh = createDefaultConfiguration()
      applyCanonicalToBasic(fresh.basic, canonical)
      return fresh
    }

    if (meta.version < CURRENT_VERSION) {
      runMigrations(extended as unknown as Record<string, unknown>, meta.version)
    }

    applyCanonicalToBasic(extended.basic, canonical)
    applyCanonicalToProvider(extended.advanced, canonical)

    const mergedAdv = deepMerge(
      defaults.advanced,
      (extended.advanced || {}) as Partial<typeof defaults.advanced>,
    )
    mergedAdv.providers = deepMerge(
      defaults.advanced.providers,
      (extended.advanced?.providers || {}) as Partial<typeof defaults.advanced.providers>,
    )
    mergedAdv.tutorConfig = deepMerge(
      defaults.advanced.tutorConfig,
      (extended.advanced?.tutorConfig || {}) as Partial<typeof defaults.advanced.tutorConfig>,
    ) as AiTutorConfig
    mergedAdv.vocabReview = deepMerge(
      defaults.advanced.vocabReview,
      (extended.advanced?.vocabReview || {}) as Partial<typeof defaults.advanced.vocabReview>,
    ) as typeof defaults.advanced.vocabReview
    mergedAdv.speakingFeedback = deepMerge(
      defaults.advanced.speakingFeedback,
      (extended.advanced?.speakingFeedback || {}) as Partial<typeof defaults.advanced.speakingFeedback>,
    ) as typeof defaults.advanced.speakingFeedback
    mergedAdv.writingCorrection = deepMerge(
      defaults.advanced.writingCorrection,
      (extended.advanced?.writingCorrection || {}) as Partial<typeof defaults.advanced.writingCorrection>,
    ) as typeof defaults.advanced.writingCorrection
    mergedAdv.privacy = deepMerge(
      defaults.advanced.privacy,
      (extended.advanced?.privacy || {}) as Partial<typeof defaults.advanced.privacy>,
    ) as typeof defaults.advanced.privacy

    const config: ExtendedUserConfiguration = {
      basic: { ...defaults.basic, ...extended.basic },
      advanced: mergedAdv,
    }

    if (meta.version < CURRENT_VERSION) {
      setStoredMeta({ version: CURRENT_VERSION, migratedAt: new Date().toISOString() })
      saveConfiguration(config)
    }

    return config
  } catch (error) {
    console.error('apps/web/src/features/configuration/storage.ts error:', error);
    return createDefaultConfiguration()
  }
}

export function saveConfiguration(config: ExtendedUserConfiguration): void {
  try {
    const validation = validateConfiguration(config)
    if (!validation.valid) {
      console.error('Attempted to save invalid configuration:', validation.errors)
      return
    }
    const extended: ExtendedUserConfiguration = {
      basic: { ...config.basic },
      advanced: { ...config.advanced },
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(extended))
    setStoredMeta({ version: CURRENT_VERSION, migratedAt: new Date().toISOString() })
    syncCanonicalFromConfig(config)
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

export function migrateFromLegacySettings(): ExtendedUserConfiguration | null {
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

    config.advanced.providers = { [`default-${DEFAULT_AI_PROVIDER_ID}`]: provider }
    config.advanced.activeProviderId = `default-${DEFAULT_AI_PROVIDER_ID}`

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
