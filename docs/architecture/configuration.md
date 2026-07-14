# Configuration Architecture

> Status: Design document
> Last updated: 2026-07-14

## 1. Problem Summary

The IELTS Journey codebase had the following configuration problems before this refactoring:

- **Two overlapping settings systems**: legacy `ielts-settings` (`AppSettings` + `SettingsStorage.ts`) and newer `ielts-configuration` (`UserConfiguration` + `configuration/storage.ts`), both active simultaneously
- **Hardcoded values scattered everywhere**: AI provider URLs, model names, timeouts, retries, storage keys, route paths, feature flags — duplicated across 8 packages and 2 apps
- **AI provider presets hardcoded in UI**: `AdvancedSettingsForm.tsx` maintained its own list of 8 providers with URLs and models, duplicating what should be a single registry
- **Hardcoded YouTube API key**: committed to source in `messaging.ts:73`
- **Hardcoded CORS proxy URL**: in `api-client.ts:27` with no typed configuration
- **No environment variable usage**: deliberate choice (documented), but no typed constants either — all config was stringly-typed
- **No credential abstraction**: API keys read directly from `localStorage` or `chrome.storage.local` in service code

## 2. Target Architecture

```
┌────────────────────────────────────────────────────────────┐
│                       @ielts/config                        │
│                                                            │
│  Immutable app defaults       Feature availability         │
│  Provider preset registry     Adapter type metadata        │
│  Infrastructure URLs          Shared route definitions     │
│  Logging defaults             General storage identifiers  │
│                                                            │
│  Pure constants, types and factories                       │
│  No storage access, side effects or workspace dependencies │
└────────────────────────────────────────────────────────────┘
             │                         │
             ▼                         ▼
┌────────────────────────────┐  ┌─────────────────────────────┐
│      @ielts/settings       │  │          @ielts/ai         │
│                            │  │                             │
│ User preference schemas    │  │ AI adapter interfaces       │
│ Defaults                   │  │ OpenAI-compatible adapter    │
│ Repository interface       │  │ Adapter factory             │
│ Settings service           │  │ AI config resolver          │
│ Migration functions        │  │ Credential provider port    │
│                            │  │                             │
│ No AI execution logic      │  │ No direct storage access   │
└────────────────────────────┘  └─────────────────────────────┘
             ▲                         ▲
             │ implementations         │ injected dependencies
             │                         │
┌────────────────────────────────────────────────────────────┐
│                    Application composition                  │
│                                                            │
│ Web: localStorage repository and credential provider       │
│ Extension: chrome.storage repository and credential provider│
│                                                            │
│ Builds resolved AI configuration and injects dependencies  │
│ into engines                                                │
└────────────────────────────────────────────────────────────┘
```

### Responsibility Boundaries

| Concern | Owner |
|---------|-------|
| Immutable app defaults (app name, version, logging level) | `@ielts/config` |
| Storage key constants (localStorage, chrome.storage, IndexedDB) | `@ielts/config` |
| Route path definitions (both apps) | `@ielts/config` |
| Feature flag definitions | `@ielts/config` |
| AI provider registry (all 8 presets → 1 adapter type) | `@ielts/config` |
| Provider adapter type metadata | `@ielts/config` |
| Infrastructure endpoint URLs (CORS proxy, YouTube base URL) | `@ielts/config` |
| Default timeout, retry, and temperature fallbacks | `@ielts/config` |
| Domain constants (IELTS skills, exercise types, CEFR levels, band ranges) | **Owning domain package** (not `@ielts/config`) |
| User preference schemas | `@ielts/settings` |
| Settings repository interface | `@ielts/settings` |
| Settings service (read/write/patch) | `@ielts/settings` |
| Data migration (legacy → new) | `@ielts/settings` |
| Persisted credential storage implementation | `@ielts/settings` |
| AI configuration resolver | `@ielts/ai` |
| Credential provider interface | `@ielts/ai` |
| AI adapter interfaces | `@ielts/ai` |
| AI adapter factory | `@ielts/ai` |
| OpenAI-compatible adapter | `@ielts/ai` |

### Key Rules

- `@ielts/config` is **pure, immutable** and has no runtime storage access or workspace dependencies
- `@ielts/settings` owns mutable user-preference contracts, validation, defaults, services, and migrations
- `@ielts/ai` owns adapter selection, credential requirements, and final AI configuration resolution
- Platform storage adapters live in the **apps** (or separate package entry points), not in `@ielts/settings` root
- Engines receive user settings or resolved configurations through **dependency injection**
- Engines do **not** import `@ielts/settings`
- Only repository implementations access `localStorage` or `chrome.storage`
- Only one-time migration code reads the legacy `ielts-settings` key
- **No secrets** exist in `@ielts/config`
- True domain constants remain in their **owning domain or engine package** (not in `@ielts/config`)
- No environment variables are introduced

## 3. Package: `@ielts/config`

### 3.1 Structure

```
packages/config/
├── src/
│   ├── index.ts                  # Barrel export
│   ├── app-config.ts             # AppConfig interface + createAppConfig()
│   ├── feature-flags.ts          # FeatureFlags interface + defaults
│   ├── storage-keys.ts           # STORAGE_KEYS frozen object
│   ├── routes.ts                 # Route paths for both apps
│   ├── logging.ts                # LoggingConfig + defaults
│   ├── ai/
│   │   ├── index.ts              # Barrel
│   │   ├── ai-types.ts           # AiProviderId, AiAdapterType, AiProviderDefinition
│   │   ├── provider-registry.ts  # AI_PROVIDER_DEFINITIONS frozen registry
│   │   └── ai-defaults.ts        # DEFAULT_AI_TIMEOUT_MS, DEFAULT_AI_MAX_RETRIES, etc.
│   ├── youtube/
│   │   ├── index.ts              # Barrel
│   │   └── youtube-infra.ts      # YouTubeInfrastructureConfig (endpoints only — NO key)
│   └── infrastructure.ts         # CORS proxy, other non-secret endpoint URLs
├── package.json
├── tsconfig.json
└── README.md (minimal)
```

### 3.2 AppConfig

```typescript
export interface AppConfig {
  readonly appName: string;
  readonly appVersion: string;
  readonly publicWebUrl: string;
  readonly logging: LoggingConfig;
  readonly ai: DefaultAiConfig;
  readonly features: FeatureFlags;
  readonly youtube: YouTubeInfrastructureConfig;
}
```

### 3.3 AI Provider Registry

```typescript
export type AiAdapterType = 'openai-compatible';

export type AiProviderId =
  | 'openai' | 'claude' | 'gemini' | 'deepseek'
  | 'openrouter' | 'groq' | 'local' | 'custom';

export interface AiProviderDefinition {
  readonly id: AiProviderId;
  readonly displayName: string;
  readonly adapter: AiAdapterType;
  readonly defaultApiUrl?: string;
  readonly defaultModel?: string;
  readonly requiresApiKey: boolean;
  readonly allowsCustomApiUrl: boolean;
  readonly allowsCustomModel: boolean;
  readonly visibleInProviderPicker: boolean;
}

export const AI_PROVIDER_DEFINITIONS: Record<AiProviderId, AiProviderDefinition>;
```

All 8 presets use `adapter: 'openai-compatible'`.

### 3.4 Storage Keys

```typescript
export const STORAGE_KEYS = Object.freeze({
  localStorage: {
    userSettings: 'ielts-configuration',
    configurationVersion: 'ielts-configuration-version',
    themeMode: 'ielts-theme-mode',
    accentColor: 'ielts-accent-color',
    onboardingComplete: 'ielts-onboarding-complete',
    // ... all other localStorage keys
  },
  extensionLocal: {
    extensionSettings: 'extensionSettings',
    aiApiKey: 'aiApiKey',
    // ...
  },
  indexedDB: {
    databaseName: 'ielts-journey',
    schemaVersionKey: 'schema_version',
  },
} as const);
```

### 3.5 Routes

```typescript
export const ROUTES = Object.freeze({
  tutor: '/tutor',
  dashboard: '/dashboard',
  roadmap: '/roadmap',
  vocabulary: '/vocabulary',
  reading: '/reading',
  listening: '/listening',
  writing: '/writing',
  speaking: '/speaking',
  grammar: '/grammar',
  mistakes: '/mistakes',
  mockTests: '/mock-tests',
  progress: '/progress',
  settings: '/settings',
  settingsAi: '/settings/ai',
  // ...
} as const);
```

### 3.6 Feature Flags

```typescript
export interface FeatureFlags {
  readonly aiTutor: boolean;
  readonly learningEngine: boolean;
  readonly planEngine: boolean;
  readonly youtubeLearning: boolean;
  readonly proactiveTutor: boolean;
  readonly progressReview: boolean;
}

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = Object.freeze({
  aiTutor: true,
  learningEngine: true,
  planEngine: true,
  youtubeLearning: true,
  proactiveTutor: true,
  progressReview: true,
});
```

### 3.7 Domain Constants

```typescript
export const IELTS_SKILLS = ['listening', 'reading', 'writing', 'speaking'] as const;
export type IeltsSkill = (typeof IELTS_SKILLS)[number];

export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

export const BAND_MIN = 0;
export const BAND_MAX = 9;
export const BAND_STEP = 0.5;

export const EXERCISE_TYPES = [
  'multiple-choice', 'true-false-not-given', 'gap-fill',
  'matching', 'short-answer', 'essay', 'speaking-response',
] as const;
```

## 4. Package: `@ielts/settings` Refactoring

### 4.1 Changes

The existing `@ielts/settings` package is KEPT but REFACTORED:

1. **Add**: `UserConfiguration` schema and types (moved from `apps/web/src/features/configuration/`)
2. **Add**: `UserSettingsRepository` interface + platform-agnostic service
3. **Add**: Persisted credential storage implementation
4. **Add**: Data migration logic (legacy `ielts-settings` → `ielts-configuration`)
5. **Remove**: `AppSettings` references
6. **Remove**: Direct `localStorage.getItem('ielts-settings')` from app code

### 4.2 AI User Settings (what `@ielts/settings` stores — not the resolved config)

```typescript
export interface AiUserSettings {
  providerId: AiProviderId;
  model?: string;
  customApiUrl?: string;
  temperature?: number;
}
```

The resolved AI connection config lives in `@ielts/ai`, not here.

### 4.3 Credential Storage (implementation, not interface)

`@ielts/settings` provides the **storage implementation** for credentials. The **interface** (`AiCredentialProvider`) is defined in `@ielts/ai` to follow dependency inversion.

```typescript
// @ielts/settings — storage implementation
export class LocalStorageCredentialStore implements AiCredentialProvider {
  constructor(private readonly storageKey: string) {}
  async getCredential(providerId: AiProviderId): Promise<AiCredential | undefined> { ... }
  async storeCredential(providerId: AiProviderId, credential: AiCredential): Promise<void> { ... }
  async clearCredential(providerId: AiProviderId): Promise<void> { ... }
}
```

Platform-specific storage adapters (localStorage, chrome.storage) live in apps or behind this implementation. Never logs the key.

## 5. Data Migration Plan

### 5.1 Migration: Legacy `ielts-settings` → `ielts-configuration`

1. On first load after migration, read `ielts-settings` (if exists)
2. Transform `AppSettings` shape → `UserConfiguration` shape
3. Write to `ielts-configuration`
4. Set `ielts-configuration-version` to current version
5. Delete `ielts-settings` key
6. All subsequent reads use `ielts-configuration` only

The existing `migrateV0toV1` in `configuration/storage.ts` already handles part of this. Extend it and move it into `@ielts/settings`.

### 5.2 Legacy Code Removal

Files to remove after migration:

- `apps/web/src/services/storage/SettingsStorage.ts`
- `apps/web/src/models/index.ts` (the `AppSettings` interface and `DEFAULT_SETTINGS`)
- `apps/web/src/features/configuration/` (moved into `@ielts/settings`)
- `apps/web/src/services/ai/vocabularyEnrichmentService.ts` (AI config reads → use resolver)
- All `loadAppSettings()` calls → `UserSettingsRepository.getSettings()`
- All `readAiConfig()` → `AiConfigResolver.resolve()`

## 6. Security: YouTube API Key

1. **Immediately**: revoke/rotate the key `AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8`
2. **Remove** from `messaging.ts:73`
3. **Add** `YouTubeCredentialProvider` interface to `@ielts/settings`
4. **Add** `YouTubeInfrastructureConfig` to `@ielts/config` (endpoints only, no key)
5. **Update** `YouTubeApiClient` to receive credentials via dependency injection
6. **Add** secret-scanning to pre-commit or CI
7. **Document** security limitations

## 7. Migration: App Call Sites

### 7.1 `apps/web/src/services/engineBootstrap.ts`

- `createAIClient()` → read provider definitions from `@ielts/config`, use `AiConfigurationResolver` from `@ielts/ai`
- `readAiConfig()` → removed; replaced by `AiConfigurationResolver`
- `profileRepo` → reads `@ielts/settings` repository

### 7.2 `apps/web/src/features/configuration/components/AdvancedSettingsForm.tsx`

- Provider picker reads `AI_PROVIDER_DEFINITIONS` from `@ielts/config`
- Removes hardcoded provider list

### 7.3 All other call sites

- `import.meta.env` / `process.env` → already none; no changes needed
- `loadAppSettings()` → `userSettingsRepository.getSettings()`
- Direct `localStorage.getItem('ielts-settings')` → repository method
- Hardcoded URLs → import from `@ielts/config`
- Hardcoded models → import from provider registry or use resolver
- Hardcoded timeouts → import from `@ielts/config`
- Route strings → use `ROUTES` from `@ielts/config`

## 8. Testing Strategy

| Layer | Tests |
|-------|-------|
| `@ielts/config` | Default values, type correctness, immutability, provider registry completeness, route uniqueness |
| `@ielts/settings` | Schema parsing, migration logic, repository read/write, credential redaction, AI config resolution precedence |
| Integration | Settings migration from legacy key, cross-package imports, extension storage adapter |
| Security | No API key in defaults, no key in diagnostic output, credential provider doesn't log |

## 9. Summary of Changes

| Action | Files |
|--------|-------|
| **Create** | `packages/config/` (~15 source files — constants, types, provider registry) |
| **Modify** | `packages/settings/` (add user preference schemas, repository interface, migration, credential storage impl) |
| **Modify** | `packages/ai/` (add AiConfigurationResolver, AiCredentialProvider interface, adapter factory) |
| **Modify** | `apps/web/` (~30+ files — engineBootstrap, all feature files that read config) |
| **Modify** | `apps/extension/` (~10 files) |
| **Remove** | `apps/web/src/services/storage/SettingsStorage.ts` |
| **Remove** | `apps/web/src/features/configuration/` (moved to @ielts/settings) |
| **Remove** | Legacy `ielts-settings` reads in all feature files |
| **Security** | Rotate YouTube key, remove from source |
