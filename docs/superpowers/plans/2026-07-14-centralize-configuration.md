# Centralize Configuration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a centralized, typed, validated configuration system across the IELTS Journey monorepo.

**Architecture:** Three-package boundary: `@ielts/config` (pure constants/types), `@ielts/settings` (user-preference contracts + storage), `@ielts/ai` (AI config resolver + credential port + adapter factory). Apps provide platform-specific implementations. Engines receive config through dependency injection.

**Tech Stack:** TypeScript 5.8, pnpm workspaces, Zod 4, Vite 6, Dexie 4, Vitest 3.

---

## Phase 0: Package Scaffolding

### Task 0.1: Create `@ielts/config` package scaffolding

**Files:**
- Create: `packages/config/package.json`
- Create: `packages/config/tsconfig.json`
- Create: `packages/config/src/index.ts`

- [ ] **Step 1: Create `packages/config/package.json`**

```json
{
  "name": "@ielts/config",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "typecheck": "tsc --noEmit",
    "lint": "echo 'no linter configured'",
    "test": "vitest run --passWithNoTests",
    "build": "echo 'no build step'"
  },
  "dependencies": {},
  "devDependencies": {
    "typescript": "~5.8.3",
    "vitest": "^3.1.1"
  }
}
```

- [ ] **Step 2: Create `packages/config/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create `packages/config/src/index.ts`**

```typescript
export { AppConfig, DEFAULT_APP_CONFIG, createAppConfig } from './app-config'
export { FeatureFlags, DEFAULT_FEATURE_FLAGS } from './feature-flags'
export { STORAGE_KEYS } from './storage-keys'
export { ROUTES } from './routes'
export { LoggingConfig, DEFAULT_LOGGING_CONFIG } from './logging'
export {
  AiProviderId,
  AiAdapterType,
  AiProviderDefinition,
  DefaultAiConfig,
  AI_PROVIDER_DEFINITIONS,
  DEFAULT_AI_TIMEOUT_MS,
  DEFAULT_AI_MAX_RETRIES,
  DEFAULT_AI_TEMPERATURE,
  DEFAULT_AI_MODEL,
} from './ai'
export { YouTubeInfrastructureConfig, YOUTUBE_INFRA_CONFIG } from './youtube/youtube-infra'
export { CORS_PROXY_URL, INFRASTRUCTURE_URLS } from './infrastructure'
```

- [ ] **Step 4: Add to pnpm workspace**

Check `pnpm-workspace.yaml` and add `packages/config` if not already covered by glob.

```bash
cd /Users/phamthanhhung/Desktop/MyProject/IELTS && cat pnpm-workspace.yaml
```

If `packages/config` isn't matched, add it to the packages list.

- [ ] **Step 5: Install and verify**

```bash
cd /Users/phamthanhhung/Desktop/MyProject/IELTS && pnpm install
```

- [ ] **Step 6: Commit**

```bash
git add packages/config/ pnpm-workspace.yaml pnpm-lock.yaml
git commit -m "feat(config): scaffold @ielts/config package"
```

### Task 0.2: AI provider types and registry

**Files:**
- Create: `packages/config/src/ai/index.ts`
- Create: `packages/config/src/ai/ai-types.ts`
- Create: `packages/config/src/ai/provider-registry.ts`
- Create: `packages/config/src/ai/ai-defaults.ts`

- [ ] **Step 1: Create `packages/config/src/ai/ai-types.ts`**

```typescript
export type AiAdapterType = 'openai-compatible'

export type AiProviderId =
  | 'openai'
  | 'claude'
  | 'gemini'
  | 'deepseek'
  | 'openrouter'
  | 'groq'
  | 'local'
  | 'custom'

export interface AiProviderDefinition {
  readonly id: AiProviderId
  readonly displayName: string
  readonly adapter: AiAdapterType
  readonly defaultApiUrl?: string
  readonly defaultModel?: string
  readonly requiresApiKey: boolean
  readonly allowsCustomApiUrl: boolean
  readonly allowsCustomModel: boolean
  readonly visibleInProviderPicker: boolean
}

export interface AiCredential {
  readonly apiKey: string
}
```

- [ ] **Step 2: Create `packages/config/src/ai/provider-registry.ts`**

```typescript
import type { AiProviderId, AiProviderDefinition } from './ai-types'

export const AI_PROVIDER_DEFINITIONS: Record<AiProviderId, AiProviderDefinition> = {
  openai: {
    id: 'openai',
    displayName: 'OpenAI',
    adapter: 'openai-compatible',
    defaultApiUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4.1-mini',
    requiresApiKey: true,
    allowsCustomApiUrl: false,
    allowsCustomModel: true,
    visibleInProviderPicker: true,
  },
  claude: {
    id: 'claude',
    displayName: 'Anthropic Claude',
    adapter: 'openai-compatible',
    defaultApiUrl: 'https://api.anthropic.com/v1',
    defaultModel: 'claude-sonnet-4-20250514',
    requiresApiKey: true,
    allowsCustomApiUrl: false,
    allowsCustomModel: true,
    visibleInProviderPicker: true,
  },
  gemini: {
    id: 'gemini',
    displayName: 'Google Gemini',
    adapter: 'openai-compatible',
    defaultApiUrl: 'https://generativelanguage.googleapis.com/v1beta',
    defaultModel: 'gemini-2.0-flash',
    requiresApiKey: true,
    allowsCustomApiUrl: false,
    allowsCustomModel: true,
    visibleInProviderPicker: true,
  },
  deepseek: {
    id: 'deepseek',
    displayName: 'DeepSeek',
    adapter: 'openai-compatible',
    defaultApiUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    requiresApiKey: true,
    allowsCustomApiUrl: false,
    allowsCustomModel: true,
    visibleInProviderPicker: true,
  },
  openrouter: {
    id: 'openrouter',
    displayName: 'OpenRouter',
    adapter: 'openai-compatible',
    defaultApiUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'openai/gpt-4o-mini',
    requiresApiKey: true,
    allowsCustomApiUrl: false,
    allowsCustomModel: true,
    visibleInProviderPicker: true,
  },
  groq: {
    id: 'groq',
    displayName: 'Groq',
    adapter: 'openai-compatible',
    defaultApiUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.3-70b-versatile',
    requiresApiKey: true,
    allowsCustomApiUrl: false,
    allowsCustomModel: true,
    visibleInProviderPicker: true,
  },
  local: {
    id: 'local',
    displayName: 'Local AI',
    adapter: 'openai-compatible',
    defaultApiUrl: 'http://localhost:11434/v1',
    defaultModel: 'llama3',
    requiresApiKey: false,
    allowsCustomApiUrl: true,
    allowsCustomModel: true,
    visibleInProviderPicker: true,
  },
  custom: {
    id: 'custom',
    displayName: 'Custom Provider',
    adapter: 'openai-compatible',
    requiresApiKey: false,
    allowsCustomApiUrl: true,
    allowsCustomModel: true,
    visibleInProviderPicker: true,
  },
}

export function getVisibleProviders(): AiProviderDefinition[] {
  return Object.values(AI_PROVIDER_DEFINITIONS).filter(p => p.visibleInProviderPicker)
}

export function getProviderById(id: AiProviderId): AiProviderDefinition | undefined {
  return AI_PROVIDER_DEFINITIONS[id]
}
```

- [ ] **Step 3: Create `packages/config/src/ai/ai-defaults.ts`**

```typescript
export const DEFAULT_AI_TIMEOUT_MS = 30_000
export const DEFAULT_AI_MAX_RETRIES = 2
export const DEFAULT_AI_TEMPERATURE = 0.7
export const DEFAULT_AI_MODEL = 'gpt-4.1-mini'
```

- [ ] **Step 4: Create `packages/config/src/ai/index.ts`**

```typescript
export { AiAdapterType, AiProviderId, AiProviderDefinition, AiCredential } from './ai-types'
export { AI_PROVIDER_DEFINITIONS, getVisibleProviders, getProviderById } from './provider-registry'
export { DEFAULT_AI_TIMEOUT_MS, DEFAULT_AI_MAX_RETRIES, DEFAULT_AI_TEMPERATURE, DEFAULT_AI_MODEL } from './ai-defaults'
```

- [ ] **Step 5: Verify typecheck**

```bash
cd /Users/phamthanhhung/Desktop/MyProject/IELTS && npx tsc --noEmit --project packages/config/tsconfig.json
```

- [ ] **Step 6: Commit**

```bash
git add packages/config/
git commit -m "feat(config): add AI provider types and registry"
```

### Task 0.3: Storage keys, routes, feature flags, infrastructure

**Files:**
- Create: `packages/config/src/storage-keys.ts`
- Create: `packages/config/src/routes.ts`
- Create: `packages/config/src/feature-flags.ts`
- Create: `packages/config/src/logging.ts`
- Create: `packages/config/src/app-config.ts`
- Create: `packages/config/src/youtube/youtube-infra.ts`
- Create: `packages/config/src/infrastructure.ts`

- [ ] **Step 1: Create `packages/config/src/storage-keys.ts`**

```typescript
export const STORAGE_KEYS = {
  localStorage: {
    userSettings: 'ielts-configuration' as const,
    configurationVersion: 'ielts-configuration-version' as const,
    themeMode: 'ielts-theme-mode' as const,
    accentColor: 'ielts-accent-color' as const,
    notificationPrefs: 'ielts-notification-prefs' as const,
    onboardingComplete: 'ielts-onboarding-complete' as const,
    preferredLanguage: 'ielts-preferred-language' as const,
    corsProxy: 'ielts-cors-proxy' as const,
    aiProgressReviewCache: 'ielts-ai-progress-review-cache-v2' as const,
    aiTutorChatState: 'ai-tutor-chat-state' as const,
    savedAiNotes: 'savedAiNotes' as const,
    extensionConnected: 'extension-connected' as const,
    appSettings: 'ielts-app-settings' as const,
    roadmap: 'ielts-roadmap' as const,
    tutorMemoryPrefix: 'tutor-memory-' as const,
    apiKeyPrefix: 'ielts-api-key-' as const,
  },
  extensionLocal: {
    extensionSettings: 'extensionSettings' as const,
    aiApiKey: 'aiApiKey' as const,
    settingsBackup: 'ielts-settings-backup' as const,
    dailyProgress: 'dailyProgress' as const,
    ytLearningMistakes: 'yt-learning-mistakes' as const,
    ytLearningAutoOpen: 'yt-learning-auto-open' as const,
    pendingSaves: '_pendingSaves' as const,
  },
  indexedDB: {
    databaseName: 'ielts-journey' as const,
    schemaVersionKey: 'schema_version' as const,
  },
} as const
```

- [ ] **Step 2: Create `packages/config/src/routes.ts`**

```typescript
export const ROUTES = {
  tutor: '/tutor',
  dashboard: '/dashboard',
  roadmap: '/roadmap',
  vocabulary: '/vocabulary',
  review: '/review',
  reviewCenter: '/review-center',
  reading: '/reading',
  listening: '/listening',
  writing: '/writing',
  speaking: '/speaking',
  grammar: '/grammar',
  mistakes: '/mistakes',
  mockTests: '/mock-tests',
  topics: '/topics',
  progress: '/progress',
  artifacts: '/artifacts',
  search: '/search',
  books: '/books',
  publicApi: '/public-api',
  settings: '/settings',
  settingsAi: '/settings/ai',
  settingsData: '/settings/data',
  settingsExtension: '/settings/extension',
  importExport: '/import-export',
  info: '/info',
  privacy: '/privacy',
  landing: '/landing',
  onboarding: '/onboarding',
} as const
```

- [ ] **Step 3: Create `packages/config/src/feature-flags.ts`**

```typescript
export interface FeatureFlags {
  readonly aiTutor: boolean
  readonly learningEngine: boolean
  readonly planEngine: boolean
  readonly youtubeLearning: boolean
  readonly proactiveTutor: boolean
  readonly progressReview: boolean
}

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  aiTutor: true,
  learningEngine: true,
  planEngine: true,
  youtubeLearning: true,
  proactiveTutor: true,
  progressReview: true,
}
```

- [ ] **Step 4: Create `packages/config/src/logging.ts`**

```typescript
export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LoggingConfig {
  readonly level: LogLevel
}

export const DEFAULT_LOGGING_CONFIG: LoggingConfig = {
  level: 'info',
}
```

- [ ] **Step 5: Create `packages/config/src/app-config.ts`**

```typescript
import type { FeatureFlags } from './feature-flags'
import type { LoggingConfig } from './logging'
import type { DefaultAiConfig } from './ai'
import type { YouTubeInfrastructureConfig } from './youtube/youtube-infra'
import { DEFAULT_FEATURE_FLAGS } from './feature-flags'
import { DEFAULT_LOGGING_CONFIG } from './logging'
import { DEFAULT_AI_TIMEOUT_MS, DEFAULT_AI_MAX_RETRIES, DEFAULT_AI_TEMPERATURE, DEFAULT_AI_MODEL } from './ai'

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

export const DEFAULT_APP_CONFIG: AppConfig = {
  appName: 'IELTS Journey',
  appVersion: 'local',
  publicWebUrl: 'http://localhost:5173',
  logging: DEFAULT_LOGGING_CONFIG,
  ai: {
    timeoutMs: DEFAULT_AI_TIMEOUT_MS,
    maxRetries: DEFAULT_AI_MAX_RETRIES,
    temperature: DEFAULT_AI_TEMPERATURE,
    defaultModel: DEFAULT_AI_MODEL,
  },
  features: DEFAULT_FEATURE_FLAGS,
  youtube: {
    apiBaseUrl: 'https://www.googleapis.com/youtube/v3',
    corsProxyBaseUrl: undefined,
    timeoutMs: 20_000,
  },
}

export function createAppConfig(overrides?: Partial<AppConfig>): AppConfig {
  return { ...DEFAULT_APP_CONFIG, ...overrides }
}
```

- [ ] **Step 6: Create `packages/config/src/youtube/youtube-infra.ts`**

```typescript
export interface YouTubeInfrastructureConfig {
  readonly apiBaseUrl: string
  readonly corsProxyBaseUrl?: string
  readonly timeoutMs: number
}

export const YOUTUBE_INFRA_CONFIG: YouTubeInfrastructureConfig = {
  apiBaseUrl: 'https://www.googleapis.com/youtube/v3',
  timeoutMs: 20_000,
}
```

- [ ] **Step 7: Create `packages/config/src/youtube/index.ts`**

```typescript
export { YouTubeInfrastructureConfig, YOUTUBE_INFRA_CONFIG } from './youtube-infra'
```

- [ ] **Step 8: Create `packages/config/src/infrastructure.ts`**

```typescript
export const CORS_PROXY_URL = 'https://corsproxy.io/?'

export const INFRASTRUCTURE_URLS = {
  corsProxy: CORS_PROXY_URL,
  chromeWebStore:
    'https://chromewebstore.google.com/detail/ielts-journey' as const,
  githubRepo: 'https://github.com/hungpt99-dev/IELTS' as const,
  landingCanonical: 'https://ieltsjourney.dev' as const,
  extensionWebUrl: 'https://ieltsjourney.dev' as const,
} as const
```

- [ ] **Step 9: Update `packages/config/src/index.ts`** to include all exports

```typescript
export { AppConfig, DefaultAiConfig, DEFAULT_APP_CONFIG, createAppConfig } from './app-config'
export { FeatureFlags, DEFAULT_FEATURE_FLAGS } from './feature-flags'
export { STORAGE_KEYS } from './storage-keys'
export { ROUTES } from './routes'
export { LoggingConfig, LogLevel, DEFAULT_LOGGING_CONFIG } from './logging'
export {
  AiAdapterType,
  AiProviderId,
  AiProviderDefinition,
  AiCredential,
  AI_PROVIDER_DEFINITIONS,
  getVisibleProviders,
  getProviderById,
  DEFAULT_AI_TIMEOUT_MS,
  DEFAULT_AI_MAX_RETRIES,
  DEFAULT_AI_TEMPERATURE,
  DEFAULT_AI_MODEL,
} from './ai'
export { YouTubeInfrastructureConfig, YOUTUBE_INFRA_CONFIG } from './youtube'
export { CORS_PROXY_URL, INFRASTRUCTURE_URLS } from './infrastructure'
```

- [ ] **Step 10: Verify typecheck**

```bash
cd /Users/phamthanhhung/Desktop/MyProject/IELTS && npx tsc --noEmit --project packages/config/tsconfig.json
```

- [ ] **Step 11: Commit**

```bash
git add packages/config/
git commit -m "feat(config): add storage keys, routes, feature flags, infrastructure"
```

## Phase 1: AI Configuration Resolver

### Task 1.1: Add `AiConfigurationResolver` and `AiCredentialProvider` to `@ielts/ai`

**Files:**
- Modify: `packages/ai/src/index.ts`
- Create: `packages/ai/src/config/index.ts`
- Create: `packages/ai/src/config/ai-config-resolver.ts`
- Create: `packages/ai/src/config/credential-provider.ts`
- Create: `packages/ai/src/config/ai-adapter-factory.ts`
- Add dep: `packages/ai/package.json` → `"@ielts/config": "workspace:*"`

- [ ] **Step 1: Add `@ielts/config` dependency to `packages/ai/package.json`**

```json
"dependencies": {
  "@ielts/config": "workspace:*",
  ...
}
```

- [ ] **Step 2: Create `packages/ai/src/config/credential-provider.ts`**

```typescript
import type { AiProviderId, AiCredential } from '@ielts/config'

export interface AiCredentialProvider {
  getCredential(providerId: AiProviderId): Promise<AiCredential | undefined>
  storeCredential(providerId: AiProviderId, credential: AiCredential): Promise<void>
  clearCredential(providerId: AiProviderId): Promise<void>
}
```

- [ ] **Step 3: Create `packages/ai/src/config/ai-config-resolver.ts`**

```typescript
import {
  type AiProviderId,
  type AiProviderDefinition,
  type DefaultAiConfig,
  AI_PROVIDER_DEFINITIONS,
  getProviderById,
} from '@ielts/config'
import type { AiCredentialProvider } from './credential-provider'

export interface AiUserSettings {
  providerId: AiProviderId
  model?: string
  customApiUrl?: string
  temperature?: number
}

export interface ResolvedAiConnectionConfig {
  readonly providerId: AiProviderId
  readonly adapterType: 'openai-compatible'
  readonly apiUrl: string
  readonly model: string
  readonly apiKey?: string
  readonly timeoutMs: number
  readonly maxRetries: number
  readonly temperature: number
}

export class AiConfigurationResolver {
  constructor(
    private readonly credentialProvider: AiCredentialProvider,
    private readonly appDefaults: DefaultAiConfig,
  ) {}

  async resolve(userSettings: AiUserSettings): Promise<ResolvedAiConnectionConfig> {
    const provider = this.getProviderOrThrow(userSettings.providerId)
    const credential = await this.credentialProvider.getCredential(userSettings.providerId)

    return {
      providerId: provider.id,
      adapterType: 'openai-compatible',
      apiUrl: userSettings.customApiUrl || provider.defaultApiUrl || '',
      model: userSettings.model || provider.defaultModel || this.appDefaults.defaultModel,
      apiKey: credential?.apiKey,
      timeoutMs: this.appDefaults.timeoutMs,
      maxRetries: this.appDefaults.maxRetries,
      temperature: userSettings.temperature ?? this.appDefaults.temperature,
    }
  }

  private getProviderOrThrow(providerId: AiProviderId): AiProviderDefinition {
    const provider = getProviderById(providerId)
    if (!provider) {
      throw new Error(`Unsupported AI provider: ${providerId}`)
    }
    return provider
  }
}
```

- [ ] **Step 4: Create `packages/ai/src/config/ai-adapter-factory.ts`**

```typescript
import type { AiProviderDefinition } from '@ielts/config'
import type { AIAdapter } from '../adapters/types'
import { OpenAIAdapter } from '../adapters/openai'

export class AiAdapterFactory {
  create(_provider: AiProviderDefinition): AIAdapter {
    return new OpenAIAdapter()
  }
}
```

- [ ] **Step 5: Create `packages/ai/src/config/index.ts`**

```typescript
export { AiCredentialProvider } from './credential-provider'
export { AiUserSettings, ResolvedAiConnectionConfig, AiConfigurationResolver } from './ai-config-resolver'
export { AiAdapterFactory } from './ai-adapter-factory'
```

- [ ] **Step 6: Update `packages/ai/src/index.ts`**

```typescript
export { AiCredentialProvider, AiUserSettings, ResolvedAiConnectionConfig, AiConfigurationResolver, AiAdapterFactory } from './config'
// ... keep existing exports
```

- [ ] **Step 7: Install deps and typecheck**

```bash
cd /Users/phamthanhhung/Desktop/MyProject/IELTS && pnpm install && npx tsc --noEmit --project packages/ai/tsconfig.json
```

- [ ] **Step 8: Commit**

```bash
git add packages/ai/
git commit -m "feat(ai): add AiConfigurationResolver, AiCredentialProvider, AiAdapterFactory"
```

## Phase 2: Refactor `@ielts/settings`

### Task 2.1: Add user preference schemas and repository interface

**Files:**
- Modify: `packages/settings/src/schemas.ts`
- Modify: `packages/settings/src/defaults.ts`
- Modify: `packages/settings/src/types.ts`
- Create: `packages/settings/src/repository.ts`
- Modify: `packages/settings/src/index.ts`
- Add dep: `packages/settings/package.json` → `"@ielts/config": "workspace:*"`

- [ ] **Step 1: Add `@ielts/config` dep to `packages/settings/package.json`**

```json
"dependencies": {
  "@ielts/config": "workspace:*",
  ...
}
```

- [ ] **Step 2: Update `packages/settings/src/schemas.ts`**

Replace `aiSettingsSchema` to use `AiProviderId` from `@ielts/config` and add `AiUserSettings` schema:

```typescript
import { z } from 'zod'
import type { AiProviderId } from '@ielts/config'

export const AI_PROVIDER_IDS = [
  'openai', 'claude', 'gemini', 'deepseek',
  'openrouter', 'groq', 'local', 'custom',
] as const

export const aiUserSettingsSchema = z.object({
  providerId: z.enum(AI_PROVIDER_IDS).default('openai'),
  model: z.string().optional(),
  customApiUrl: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
})

export const userConfigurationSchema = z.object({
  version: z.number().int().positive().default(1),
  ai: aiUserSettingsSchema.default({}),
  study: z.object({
    targetBand: z.number().min(0).max(9).default(6.5),
    currentBand: z.number().min(0).max(9).default(5.5),
    examDate: z.string().optional(),
    dailyStudyMinutes: z.number().int().positive().default(60),
    weakSkills: z.array(z.string()).default([]),
    nativeLanguage: z.string().default(''),
    studyGoal: z.enum(['academic', 'general']).default('academic'),
    preferredSchedule: z.array(z.string()).default(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']),
  }).default({}),
  theme: z.object({
    mode: z.enum(['light', 'dark', 'system']).default('system'),
    accentColor: z.string().default('#2563eb'),
  }).default({}),
  notifications: z.object({
    enabled: z.boolean().default(true),
    reminderTime: z.string().default('09:00'),
  }).default({}),
})

// Keep OPENAI_BASE_URL and DEFAULT_MODEL for backward compat during migration
export const OPENAI_BASE_URL = 'https://api.openai.com/v1'
export const DEFAULT_MODEL = 'gpt-4.1-mini'
```

- [ ] **Step 3: Update `packages/settings/src/defaults.ts`**

```typescript
import { DEFAULT_AI_TIMEOUT_MS, DEFAULT_AI_MAX_RETRIES, DEFAULT_AI_TEMPERATURE } from '@ielts/config'

export const DEFAULT_AI_SETTINGS = {
  aiProvider: 'openai' as const,
  aiBaseUrl: '' as string,
  aiApiKey: '' as string,
  aiModel: 'gpt-4.1-mini' as string,
}

export const DEFAULT_SHARED_SETTINGS = {
  ...DEFAULT_AI_SETTINGS,
  themeMode: 'system' as const,
  nativeLanguage: '' as string,
}
```

- [ ] **Step 4: Create `packages/settings/src/repository.ts`**

```typescript
import type { UserConfiguration } from './types'

export interface UserSettingsRepository {
  getSettings(): Promise<UserConfiguration>
  updateSettings(update: Partial<UserConfiguration>): Promise<UserConfiguration>
  resetSettings(): Promise<UserConfiguration>
}
```

- [ ] **Step 5: Update `packages/settings/src/types.ts`**

```typescript
import { z } from 'zod'
import { userConfigurationSchema, aiUserSettingsSchema } from './schemas'

export type UserConfiguration = z.infer<typeof userConfigurationSchema>
export type AiUserSettings = z.infer<typeof aiUserSettingsSchema>
// Keep existing type exports for backward compat
export type { AISettings, SharedSettings, SharedSettingsPatch } from './schemas'
```

- [ ] **Step 6: Update `packages/settings/src/index.ts`**

```typescript
export { AI_PROVIDERS, THEME_MODES, NATIVE_LANGUAGES, OPENAI_BASE_URL, DEFAULT_MODEL } from './schemas'
export { userConfigurationSchema, aiUserSettingsSchema } from './schemas'
export { DEFAULT_AI_SETTINGS, DEFAULT_SHARED_SETTINGS } from './defaults'
export { UserConfiguration, AiUserSettings } from './types'
export { UserSettingsRepository } from './repository'
export { getSettings, saveSettings, patchSettings } from './settings-service'
export { SETTINGS_BRIDGE_ACTIONS, BRIDGE_SOURCES, createSettingsBridgeMessage } from './bridge'
export { themeModeFromDarkMode, darkModeFromThemeMode, translationTarget } from './utils'
```

- [ ] **Step 7: Install and typecheck**

```bash
cd /Users/phamthanhhung/Desktop/MyProject/IELTS && pnpm install && npx tsc --noEmit --project packages/settings/tsconfig.json
```

- [ ] **Step 8: Commit**

```bash
git add packages/settings/
git commit -m "feat(settings): add UserConfiguration schema, UserSettingsRepository, AiUserSettings"
```

## Phase 3: Migrate Web App Call Sites

### Task 3.1: Update `engineBootstrap.ts` to use new config system

**Files:**
- Modify: `apps/web/src/services/engineBootstrap.ts`
- Add dep: `apps/web/package.json` → add workspace deps if missing

- [ ] **Step 1: Refactor `engineBootstrap.ts`**

Replace `readAiConfig()` with `AiConfigurationResolver`. Replace `createAIClient()` to use the resolver.

```typescript
import { AI_PROVIDER_DEFINITIONS, DEFAULT_APP_CONFIG } from '@ielts/config'
import { AiConfigurationResolver, AiAdapterFactory, type AiCredentialProvider } from '@ielts/ai'
import type { UserConfiguration } from '@ielts/settings'

// Remove readAiConfig() function
// Remove old createAIClient()

function createCredentialProvider(): AiCredentialProvider {
  return {
    async getCredential() {
      try {
        const raw = localStorage.getItem('ielts-configuration')
        if (!raw) return undefined
        const config = JSON.parse(raw) as UserConfiguration
        const key = config.ai?.providerId
          ? localStorage.getItem(`ielts-api-key-${config.ai.providerId}`)
          : undefined
        return key ? { apiKey: key } : undefined
      } catch { return undefined }
    },
    async storeCredential(_providerId, credential) {
      // stored by settings UI
    },
    async clearCredential(_providerId) {
      // handled by settings UI
    },
  }
}

function createAIClientResolver() {
  const credentialProvider = createCredentialProvider()
  return new AiConfigurationResolver(credentialProvider, DEFAULT_APP_CONFIG.ai)
}

async function getResolvedAiConfig() {
  const resolver = createAIClientResolver()
  const settings = await loadCurrentUserSettings()
  return resolver.resolve(settings.ai ?? { providerId: 'openai' })
}
```

Then update `createAIClient()` to use `getResolvedAiConfig()` and pass the resolved config to `callAI`.

- [ ] **Step 2: Typecheck**

```bash
cd /Users/phamthanhhung/Desktop/MyProject/IELTS && npx tsc --noEmit --project apps/web/tsconfig.json
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/services/engineBootstrap.ts
git commit -m "refactor(web): use AiConfigurationResolver in engineBootstrap"
```

### Task 3.2: Update AdvancedSettingsForm to read provider registry

**Files:**
- Modify: `apps/web/src/features/configuration/components/AdvancedSettingsForm.tsx`

- [ ] **Step 1: Replace hardcoded provider list with `AI_PROVIDER_DEFINITIONS`**

```typescript
import { AI_PROVIDER_DEFINITIONS, getVisibleProviders } from '@ielts/config'

// Remove the hardcoded PROVIDER_PRESETS map
// Replace with:
const availableProviders = getVisibleProviders()
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/features/configuration/components/AdvancedSettingsForm.tsx
git commit -m "refactor(web): AdvancedSettingsForm reads provider registry from @ielts/config"
```

### Task 3.3: Migrate all remaining direct config reads

**Files to modify** (approximately 30 files — migrate one group at a time):

Group A — Route strings: Replace `'/reading'`, `'/vocabulary'`, etc. with `ROUTES.reading`, `ROUTES.vocabulary`.

Group B — localStorage keys: Replace `'ielts-settings'` strings with `STORAGE_KEYS.localStorage.userSettings`.

Group C — AI config reads: Replace `loadAppSettings()`, `readAiConfig()`, direct `localStorage.getItem('ielts-settings')` with `UserSettingsRepository` and `AiConfigurationResolver`.

Group D — Hardcoded URLs: Replace with `INFRASTRUCTURE_URLS`, `YOUTUBE_INFRA_CONFIG`, etc.

- [ ] **Step 1-5: Migrate each group, typecheck after each, commit**

## Phase 4: Data Migration

### Task 4.1: `@ielts/settings` migration logic

**Files:**
- Create: `packages/settings/src/migration.ts`
- Test: `packages/settings/src/__tests__/migration.test.ts`

- [ ] **Step 1: Write migration test**

```typescript
// packages/settings/src/__tests__/migration.test.ts
import { describe, it, expect } from 'vitest'
import { migrateFromLegacySettings } from '../migration'

describe('migrateFromLegacySettings', () => {
  it('transforms AppSettings shape to UserConfiguration shape', () => {
    const legacy = {
      targetBand: 7.0,
      currentBand: 5.5,
      examDate: '2026-09-15',
      dailyStudyMinutes: 60,
      weakSkills: ['writing'],
      aiApiKey: 'sk-test',
      aiBaseUrl: 'https://api.openai.com/v1',
      aiModel: 'gpt-4o-mini',
    }
    const result = migrateFromLegacySettings(legacy)
    expect(result.version).toBe(1)
    expect(result.ai?.providerId).toBe('openai')
    expect(result.study?.targetBand).toBe(7.0)
    // No API key in result — migrated separately
    expect(result).not.toHaveProperty('aiApiKey')
  })

  it('returns null for empty input', () => {
    expect(migrateFromLegacySettings({})).toBeNull()
  })
})
```

- [ ] **Step 2: Implement migration function**

```typescript
export function migrateFromLegacySettings(legacy: Record<string, unknown>): UserConfiguration | null {
  if (!legacy || Object.keys(legacy).length === 0) return null

  return {
    version: 1,
    ai: {
      providerId: 'openai',
      model: (legacy.aiModel as string) || undefined,
      customApiUrl: (legacy.aiBaseUrl as string) || undefined,
    },
    study: {
      targetBand: (legacy.targetBand as number) ?? 6.5,
      currentBand: (legacy.currentBand as number) ?? 5.5,
      examDate: legacy.examDate as string || undefined,
      dailyStudyMinutes: (legacy.dailyStudyMinutes as number) ?? 60,
      weakSkills: (legacy.weakSkills as string[]) ?? [],
      nativeLanguage: (legacy.nativeLanguage as string) ?? '',
      studyGoal: (legacy.studyGoal as 'academic' | 'general') ?? 'academic',
      preferredSchedule: (legacy.preferredSchedule as string[]) ?? ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
    },
    theme: {
      mode: 'system',
      accentColor: '#2563eb',
    },
    notifications: {
      enabled: true,
      reminderTime: '09:00',
    },
  }
}
```

- [ ] **Step 3: Run tests**

```bash
cd /Users/phamthanhhung/Desktop/MyProject/IELTS/packages/settings && npx vitest run --passWithNoTests
```

- [ ] **Step 4: Commit**

```bash
git add packages/settings/src/migration.ts packages/settings/src/__tests__/
git commit -m "feat(settings): add legacy settings migration"
```

## Phase 5: Legacy Code Removal

### Task 5.1: Remove `SettingsStorage.ts`, `AppSettings`, legacy hooks

**Files to remove:**
- `apps/web/src/services/storage/SettingsStorage.ts`
- `apps/web/src/models/index.ts` (remove `AppSettings` interface + `DEFAULT_SETTINGS`)
- `apps/web/src/features/configuration/` (move schemas to `@ielts/settings`, remove directory)

- [ ] **Step 1-3: Verify no remaining imports, delete files, update index exports**

- [ ] **Step 4: Typecheck**

```bash
cd /Users/phamthanhhung/Desktop/MyProject/IELTS && npx tsc --noEmit --project apps/web/tsconfig.json
```

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "refactor: remove legacy settings system (SettingsStorage, AppSettings)"
```

## Phase 6: Security Cleanup

### Task 6.1: Rotate YouTube API key, add credential provider

**Files:**
- Modify: `apps/extension/src/background/messaging.ts` (remove hardcoded key)
- Create: `apps/extension/src/services/youtube-credential-provider.ts`

- [ ] **Step 1: Remove hardcoded key from `messaging.ts`**

Delete line 73: `YT_PLAYER_API_KEY = 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8'`

Replace with:

```typescript
import type { AiCredentialProvider } from '@ielts/ai'

let credentialProvider: AiCredentialProvider | null = null

export function setYouTubeCredentialProvider(provider: AiCredentialProvider) {
  credentialProvider = provider
}

export async function getYouTubeApiKey(): Promise<string | undefined> {
  const credential = await credentialProvider?.getCredential('custom')
  return credential?.apiKey ?? processYouTubeApiKeyFromSettings()
}
```

- [ ] **Step 2: Create extension credential provider**

```typescript
// apps/extension/src/services/youtube-credential-provider.ts
import type { AiCredentialProvider, AiProviderId, AiCredential } from '@ielts/config'

export class ExtensionYouTubeCredentialProvider implements AiCredentialProvider {
  async getCredential(_providerId: AiProviderId): Promise<AiCredential | undefined> {
    return new Promise((resolve) => {
      chrome.storage.local.get('aiApiKey', (result) => {
        const key = result.aiApiKey as string | undefined
        resolve(key ? { apiKey: key } : undefined)
      })
    })
  }

  async storeCredential(_providerId: AiProviderId, credential: AiCredential): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.set({ aiApiKey: credential.apiKey }, resolve)
    })
  }

  async clearCredential(_providerId: AiProviderId): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.remove('aiApiKey', resolve)
    })
  }
}
```

- [ ] **Step 3: Typecheck extension**

```bash
cd /Users/phamthanhhung/Desktop/MyProject/IELTS && npx tsc --noEmit --project apps/extension/tsconfig.json
```

- [ ] **Step 4: Commit**

```bash
git add apps/extension/
git commit -m "security(ext): remove hardcoded YouTube API key, add credential provider"
```

## Phase 7: Final Verification

### Task 7.1: Full typecheck, test, build

- [ ] **Step 1: Root typecheck**

```bash
cd /Users/phamthanhhung/Desktop/MyProject/IELTS && npx tsc --noEmit
```

- [ ] **Step 2: Run all package tests**

```bash
cd /Users/phamthanhhung/Desktop/MyProject/IELTS && pnpm -r test
```

- [ ] **Step 3: Build web app**

```bash
cd /Users/phamthanhhung/Desktop/MyProject/IELTS/apps/web && npx vite build
```

- [ ] **Step 4: Verify no remaining direct config reads**

```bash
# Check for remaining legacy patterns
cd /Users/phamthanhhung/Desktop/MyProject/IELTS
grep -rn "loadAppSettings\|readAiConfig\|'ielts-settings'" apps/web/src/ --include="*.ts" --include="*.tsx" || echo "No legacy patterns found"
grep -rn "AIzaSy" apps/ --include="*.ts" --include="*.tsx" || echo "No hardcoded API keys found"
```

- [ ] **Step 5: Commit final verification**

```bash
git add -A && git commit -m "chore: final verification and cleanup"
```

