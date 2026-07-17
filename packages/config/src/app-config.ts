import type { FeatureFlags } from './feature-flags'
import type { LoggingConfig } from './logging'
import { DEFAULT_FEATURE_FLAGS } from './feature-flags'
import { DEFAULT_LOGGING_CONFIG } from './logging'
import { DEFAULT_AI_TIMEOUT_MS, DEFAULT_AI_MAX_RETRIES, DEFAULT_AI_TEMPERATURE, DEFAULT_AI_MODEL } from './ai'
import type { YouTubeInfrastructureConfig } from './youtube/youtube-infra'
import { YOUTUBE_INFRA_CONFIG } from './youtube/youtube-infra'

export interface DefaultAiConfig {
  readonly timeoutMs: number
  readonly maxRetries: number
  readonly temperature: number
  readonly defaultModel: string
}

export interface AppConfig {
  readonly appName: string
  readonly appVersion: string
  readonly publicWebUrl: string
  readonly logging: LoggingConfig
  readonly ai: DefaultAiConfig
  readonly features: FeatureFlags
  readonly youtube: YouTubeInfrastructureConfig
}

export const DEFAULT_APP_CONFIG: AppConfig = Object.freeze({
  appName: 'IELTS Journey',
  appVersion: 'local',
  publicWebUrl: 'http://localhost:5173',
  logging: DEFAULT_LOGGING_CONFIG,
  ai: Object.freeze({
    timeoutMs: DEFAULT_AI_TIMEOUT_MS,
    maxRetries: DEFAULT_AI_MAX_RETRIES,
    temperature: DEFAULT_AI_TEMPERATURE,
    defaultModel: DEFAULT_AI_MODEL,
  }),
  features: DEFAULT_FEATURE_FLAGS,
  youtube: YOUTUBE_INFRA_CONFIG,
})

export function createAppConfig(overrides?: Partial<AppConfig>): AppConfig {
  return { ...DEFAULT_APP_CONFIG, ...overrides }
}
