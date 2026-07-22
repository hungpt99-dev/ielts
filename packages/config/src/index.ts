export { type AppConfig, type DefaultAiConfig, DEFAULT_APP_CONFIG, createAppConfig } from './app-config'
export { type FeatureFlags, DEFAULT_FEATURE_FLAGS } from './feature-flags'
export { STORAGE_KEYS } from './storage-keys'
export { ROUTES } from './routes'
export { type LoggingConfig, type LogLevel, DEFAULT_LOGGING_CONFIG } from './logging'
export {
  type AiAdapterType,
  type AiProviderId,
  type AiProviderDefinition,
  type AiCredential,
  type ProviderModelCapability,
  type AiModelAssignments,
  AI_PROVIDER_DEFINITIONS,
  getVisibleProviders,
  getProviderById,
  DEFAULT_AI_TIMEOUT_MS,
  DEFAULT_AI_MAX_RETRIES,
  DEFAULT_AI_TEMPERATURE,
  DEFAULT_AI_MODEL,
  DEFAULT_AI_MAX_TOKENS,
  DEFAULT_PLAN_ENRICH_MAX_CALLS,
  DEFAULT_PLAN_ENRICH_HARD_CALL_LIMIT,
  DEFAULT_PLAN_ENRICH_MAX_REPAIR_CALLS,
  AI_PROVIDER_IDS,
  DEFAULT_AI_PROVIDER_ID,
  DEFAULT_AI_MODEL_ASSIGNMENTS,
} from './ai'
export { type YouTubeInfrastructureConfig, YOUTUBE_INFRA_CONFIG } from './youtube'
export { CORS_PROXY_URL, INFRASTRUCTURE_URLS } from './infrastructure'
export {
  DEFAULT_TARGET_BAND,
  DEFAULT_CURRENT_BAND,
  DEFAULT_DAILY_STUDY_MINUTES,
  DEFAULT_STUDY_GOAL,
  DEFAULT_WEAK_SKILLS,
  DEFAULT_SCHEDULE,
} from './study-defaults'
export {
  IELTS_SKILLS,
  type IeltsSkill,
  LANGUAGE_SKILLS,
  type LanguageSkill,
  CEFR_LEVELS,
  BAND_MIN,
  BAND_MAX,
  BAND_STEP,
  EXERCISE_TYPES,
} from './domain-constants'
