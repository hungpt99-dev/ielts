# Deep Configuration System

## Overview

The Deep Configuration System gives users full control over their IELTS Journey experience through two tiers of settings: **Basic Settings** for everyday learners and **Advanced Settings** for power users. Every aspect of the AI Tutor — personality, provider, response style, feedback depth, and automation — is configurable without requiring users to touch code.

```
User Configuration
├── Basic Settings
│   ├── Target IELTS Band
│   ├── Exam Date
│   ├── AI Response Language
│   ├── AI Tutor Mode (personality)
│   └── Daily Study Time
│
└── Advanced Settings
    ├── AI Provider (multi-provider support)
    │   ├── Provider type (OpenAI, Claude, Gemini, etc.)
    │   ├── API key
    │   ├── Base URL
    │   ├── Model name
    │   ├── Temperature / Max tokens
    │   ├── Cost & usage limits
    │   └── Fallback provider
    ├── AI Tutor Behavior
    │   ├── Explanation style
    │   ├── Correction strictness
    │   ├── Exercise difficulty
    │   ├── Feedback depth
    │   ├── Automation level
    │   └── Study reminder frequency
    ├── Vocabulary Review
    ├── Speaking Feedback
    ├── Writing Correction
    └── Privacy & Data
```

---

## Architecture

```
┌────────────────────────────────────────────────┐
│                UI Layer                         │
│  BasicSettingsForm    AdvancedSettingsForm      │
│  ┌─────────────────┐  ┌──────────────────────┐ │
│  │ Band, Exam,     │  │ Provider, Tutor,     │ │
│  │ Language, Mode, │  │ Vocab, Speaking,     │ │
│  │ Study Time      │  │ Writing, Privacy     │ │
│  └────────┬────────┘  └──────────┬───────────┘ │
│           │                      │              │
│           ▼                      ▼              │
│  ┌──────────────────────────────────────────┐  │
│  │         ConfigSlice (Context)             │  │
│  │  - useConfiguration() hook               │  │
│  │  - ConfigProvider wraps app               │  │
│  │  - Actions: updateBasic, addProvider,     │  │
│  │    updateTutorConfig, resetConfig, etc.   │  │
│  └──────────────────┬───────────────────────┘  │
│                     │                           │
│                     ▼                           │
│  ┌──────────────────────────────────────────┐  │
│  │        Storage Layer (localStorage)       │  │
│  │  - loadConfiguration()                   │  │
│  │  - saveConfiguration()                   │  │
│  │  - Migration system (v0→v1, etc.)        │  │
│  │  - Validation + deep merge with defaults │  │
│  └──────────────────────────────────────────┘  │
└────────────────────────────────────────────────┘
                      │
                      ▼
┌────────────────────────────────────────────────┐
│           AI Tutor Service                      │
│  Reads UserConfiguration on each call to:       │
│  - Select provider (API key, base URL, model)   │
│  - Apply tutor mode personality (system prompt) │
│  - Set explanation style & correction strictness│
│  - Configure feedback depth & automation        │
│  - Adjust exercise difficulty                   │
│  - Factor in study preferences                  │
└────────────────────────────────────────────────┘
```

### File Locations

| Layer | File |
|-------|------|
| Data models | `src/features/configuration/models.ts` |
| State management | `src/features/configuration/configSlice.tsx` |
| Storage & migration | `src/features/configuration/storage.ts` |
| Basic settings form | `src/features/configuration/components/BasicSettingsForm.tsx` |
| Advanced settings form | `src/features/configuration/components/AdvancedSettingsForm.tsx` |
| AI Tutor integration | `src/features/ai-tutor/aiTutorService.ts` |
| Settings page | `src/features/settings/SettingsPage.tsx` |
| Tests | `tests/configuration/` |

---

## Data Models

All configuration types are defined in `src/features/configuration/models.ts`.

### Configuration Top-Level

```typescript
interface UserConfiguration {
  basic: ConfigurationBasic
  advanced: ConfigurationAdvanced
}
```

### Basic Settings (`ConfigurationBasic`)

```typescript
interface ConfigurationBasic {
  targetBand: number           // 1.0 – 9.0
  examDate: string             // ISO date, empty if unscheduled
  responseLanguage: 'english' | 'vietnamese' | 'both'
  tutorMode: AiTutorMode       // Personality preset
  dailyStudyMinutes: number    // 1 – 1440
}
```

### Advanced Settings (`ConfigurationAdvanced`)

```typescript
interface ConfigurationAdvanced {
  activeProviderId: string
  providers: Record<string, AiProviderConfig>
  tutorConfig: AiTutorConfig
  vocabReview: VocabReviewSettings
  speakingFeedback: SpeakingFeedbackSettings
  writingCorrection: WritingCorrectionSettings
  privacy: PrivacySettings
}
```

### AI Provider (`AiProviderConfig`)

```typescript
interface AiProviderConfig {
  providerId: string
  provider: AiProviderType     // 'openai' | 'claude' | 'gemini' | 'deepseek'
                              // | 'openrouter' | 'groq' | 'local' | 'custom'
  apiKey: string
  baseUrl: string
  model: string
  temperature: number          // 0 – 2
  maxTokens: number            // 1 – 1,000,000
  systemPrompt: string         // Optional override
  costLimit: number            // Monthly spending cap ($)
  usageLimit: number           // Max requests per month
  fallbackProvider: string | null
}
```

### AI Tutor Behavior (`AiTutorConfig`)

```typescript
interface AiTutorConfig {
  mode: AiTutorMode
  explanationStyle: 'simple' | 'detailed' | 'example-based'
                    | 'socratic' | 'step-by-step'
  correctionStrictness: 'gentle' | 'balanced' | 'strict'
  responseLanguage: 'english' | 'vietnamese' | 'both'
  exerciseDifficulty: 'easy' | 'medium' | 'hard' | 'adaptive'
  feedbackDepth: 'minimal' | 'standard' | 'thorough'
  automationLevel: 'manual' | 'semi-automatic' | 'automatic'
  studyReminderFrequency: 'none' | 'daily' | 'weekdays' | 'custom'
  customSystemPrompt: string
}
```

### Tutor Modes (`AiTutorMode`)

| Mode | Description |
|------|-------------|
| `friendly-tutor` | Supportive and encouraging |
| `strict-examiner` | Official exam standards |
| `simple-english-teacher` | Uses simple English explanations |
| `vietnamese-explanation-tutor` | Explains in Vietnamese |
| `motivation-coach` | Keeps you motivated |
| `grammar-focused-tutor` | Focuses on grammar accuracy |
| `vocabulary-focused-tutor` | Expands your vocabulary |
| `writing-correction-tutor` | Corrects writing in detail |
| `speaking-practice-tutor` | Practices speaking with you |

### Specialized Sub-Settings

```typescript
interface VocabReviewSettings {
  reviewsPerDay: number
  enableSpacedRepetition: boolean
  enableContextSentences: boolean
  enableExampleSentences: boolean
  enableSynonyms: boolean
}

interface SpeakingFeedbackSettings {
  enablePronunciationFeedback: boolean
  enableFluencyFeedback: boolean
  enableVocabularyFeedback: boolean
  enableGrammarFeedback: boolean
}

interface WritingCorrectionSettings {
  enableGrammarCorrection: boolean
  enableVocabularySuggestion: boolean
  enableStructureFeedback: boolean
  enableCoherenceFeedback: boolean
  showImprovedVersion: boolean
}

interface PrivacySettings {
  privacyLevel: 'local-only' | 'local-with-analytics'
  allowAnonymousAnalytics: boolean
  allowCrashReporting: boolean
  storeConversationHistory: boolean
  storeUsageStatistics: boolean
}
```

---

## Two-Level Settings Design

### Basic Settings (for normal users)

Shown as the default view on the Settings page. Covers the 5 most common decisions a learner needs to make:

1. **Target IELTS Band** — dropdown 1.0–9.0
2. **Exam Date** — date picker (optional)
3. **AI Response Language** — English, Vietnamese, or Both
4. **AI Tutor Personality** — visual card grid of 9 tutor modes with descriptions
5. **Daily Study Time** — number input (minutes)

The basic form validates input in real-time and persists changes immediately via `updateBasicField`.

### Advanced Settings (for power users)

Accessed via a toggle or tab on the Settings page. Organized into 6 collapsible sections:

1. **AI Provider** — multi-provider management with type, API key, base URL, model, temperature, max tokens, cost & usage limits, system prompt override, and fallback provider
2. **AI Tutor Behavior** — explanation style, correction strictness, exercise difficulty, feedback depth, automation level, study reminder frequency
3. **Vocabulary Review** — reviews per day, spaced repetition toggle, context/example sentences, synonyms
4. **Speaking Feedback** — pronunciation, fluency, vocabulary, grammar feedback toggles
5. **Writing Correction** — grammar, vocabulary, structure, coherence, improved version toggles
6. **Privacy & Data** — privacy level (local-only vs analytics), anonymous analytics, crash reporting, conversation history, usage statistics

---

## State Management

Configuration state is managed through React Context (`ConfigProvider` in `configSlice.tsx`).

### Access Pattern

```typescript
import { useConfiguration } from '../configuration/configSlice'

function MyComponent() {
  const { config, actions } = useConfiguration()

  // Read values
  const band = config.basic.targetBand
  const provider = config.advanced.providers[config.advanced.activeProviderId]

  // Update basic settings
  actions.updateBasicField('targetBand', 7.5)
  actions.updateBasic({ targetBand: 7.5, dailyStudyMinutes: 90 })

  // Manage providers
  actions.addProvider(newProvider)
  actions.updateProvider(providerId, { temperature: 0.5 })
  actions.removeProvider(providerId)
  actions.setActiveProvider(providerId)

  // Update tutor behavior
  actions.updateTutorConfig({ explanationStyle: 'socratic' })

  // Reset everything
  actions.resetConfig()
}
```

### Available Actions (`ConfigActions`)

| Action | Signature | Description |
|--------|-----------|-------------|
| `updateBasic` | `(patch: Partial<ConfigurationBasic>) => void` | Bulk update basic settings |
| `updateBasicField` | `<K>(field: K, value: ConfigurationBasic[K]) => void` | Single field update |
| `updateAdvanced` | `(patch: Partial<ConfigurationAdvanced>) => void` | Bulk update advanced settings |
| `updateAdvancedField` | `<K>(field: K, value: ConfigurationAdvanced[K]) => void` | Single field update |
| `updateTutorConfig` | `(patch: Partial<AiTutorConfig>) => void` | Update tutor behavior |
| `addProvider` | `(config: AiProviderConfig) => void` | Add a new AI provider |
| `updateProvider` | `(providerId: string, patch: Partial<AiProviderConfig>) => void` | Update a provider |
| `removeProvider` | `(providerId: string) => void` | Remove a provider |
| `setActiveProvider` | `(providerId: string) => void` | Switch active provider |
| `resetConfig` | `() => void` | Reset to factory defaults |

---

## Persistent Storage

Configuration is stored in `localStorage` under the key `ielts-configuration`. The storage layer (`src/features/configuration/storage.ts`) provides:

### Key Functions

| Function | Description |
|----------|-------------|
| `createDefaultConfiguration()` | Returns factory defaults |
| `loadConfiguration()` | Loads from localStorage, runs migrations, validates, deep-merges with defaults |
| `saveConfiguration(config)` | Validates and persists to localStorage |
| `clearConfiguration()` | Removes all stored configuration |
| `configurationExists()` | Checks if stored config exists |
| `migrateFromLegacySettings()` | Migrates from the old `ielts-settings` key |
| `getStorageStats()` | Returns size in bytes and schema version |

### Migration System

The storage layer includes a versioned migration system. Each migration is a function that transforms raw stored data:

```typescript
const MIGRATIONS: Record<number, (raw: Record<string, unknown>) => boolean> = {
  0: migrateV0toV1,  // Migrates legacy 'ielts-settings' to new format
}
```

When loading, the system checks the stored version, runs any pending migrations sequentially, then saves the migrated result.

### Validation

On load and save, the configuration is validated:

- `targetBand` must be a number between 0 and 9
- `examDate` must be a string (if provided)
- `dailyStudyMinutes` must be a non-negative number
- `activeProviderId` must match a configured provider
- `providers` must be a non-empty object

Invalid fields are replaced with defaults (load) or rejected (save).

---

## AI Tutor Integration

The `AITutorService` (`src/features/ai-tutor/aiTutorService.ts`) reads the user's configuration on every interaction to personalize responses.

### Integration Flow

```
User sends message / requests exercise
  │
  ▼
AITutorService.loadConfiguration()
  │
  ├── Selects active provider (API key, base URL, model)
  ├── Applies tutor mode → constructs system prompt
  │     e.g. "strict-examiner" → "You are a strict IELTS examiner..."
  │     e.g. "friendly-tutor" → "You are a supportive IELTS tutor..."
  ├── Sets temperature from provider config
  ├── Applies explanation style + correction strictness
  ├── Adjusts exercise difficulty
  ├── Configures feedback depth
  └── Passes to callAI() with final ProviderConfig
```

### Provider Configuration Mapping

When calling the AI, the config is mapped to the `ProviderConfig` expected by `@ielts/ai`:

```typescript
function toProviderConfig(provider: AiProviderConfig): ProviderConfig {
  return {
    provider: provider.provider,
    apiKey: provider.apiKey,
    baseUrl: provider.baseUrl,
    model: provider.model,
    temperature: provider.temperature,
    maxTokens: provider.maxTokens,
  }
}
```

---

## User Workflows

### Workflow 1: First-Time Setup

```
App loads → no configuration found
  │
  ▼
Create default configuration (factory defaults)
  │
  ▼
User lands on Settings → sees Basic Settings
  │
  ▼
User sets target band → selects tutor mode → sets study time
  │
  ▼
Configuration auto-saves → AI Tutor uses personalized settings
```

### Workflow 2: Power User Configuration

```
User opens Settings → switches to Advanced tab
  │
  ▼
User adds custom AI provider (e.g., DeepSeek):
  │  1. Click "+ Add Provider"
  │  2. Select "DeepSeek" as provider type
  │  3. Enter API key
  │  4. Model defaults to "deepseek-chat"
  │
  ▼
User configures tutor behavior:
  │  1. Explanation style → "step-by-step"
  │  2. Correction strictness → "strict"
  │  3. Exercise difficulty → "hard"
  │  4. Automation level → "automatic"
  │
  ▼
User adjusts privacy:
  │  Privacy level → "local-only"
  │  Anonymous analytics → disabled
  │
  ▼
User clicks "Save Settings" → config persisted
```

### Workflow 3: Provider Fallback

```
Active provider reaches usage limit
  │
  ▼
AITutorService detects limit exceeded
  │
  ├── Falls back to configured fallback provider
  ├── If no fallback → prompt user to switch providers
  └── If only one provider → show upgrade suggestion
```

### Workflow 4: Configuration Reset

```
User clicks "Reset to Defaults"
  │
  ▼
Confirmation dialog shown
  │
  ▼
actions.resetConfig() called
  │
  ▼
localStorage cleared → defaults loaded → UI refreshed
```

### Workflow 5: Legacy Migration

```
User opens app after update (has old 'ielts-settings' in localStorage)
  │
  ▼
ConfigProvider detects legacy data
  │
  ▼
migrateFromLegacySettings() runs:
  │  - Copies targetBand, examDate, dailyStudyMinutes
  │  - Copies aiApiKey, aiProvider, aiBaseUrl, aiModel
  │  - Creates new AiProviderConfig from legacy fields
  │
  ▼
Old 'ielts-settings' key removed
  │
  ▼
New configuration saved under 'ielts-configuration'
```

---

## Components

### BasicSettingsForm

| Prop/Feature | Details |
|-------------|---------|
| Fields | Target band, exam date, response language, tutor mode, study time |
| Tutor selector | Visual card grid with 9 mode options, descriptions, active state |
| Validation | Inline real-time validation for band range, date format, study minutes |
| Save model | Auto-save on field change + explicit "Save Settings" bulk save |

### AdvancedSettingsForm

| Section | Fields |
|---------|--------|
| AI Provider | Type selector, model, API key (password), base URL, temperature, max tokens, cost limit, usage limit, fallback, system prompt |
| AI Tutor Behavior | Explanation style, correction strictness, exercise difficulty, feedback depth, automation level, study reminder frequency |
| Vocabulary Review | Reviews per day, spaced repetition, context sentences, example sentences, synonyms |
| Speaking Feedback | Pronunciation, fluency, vocabulary, grammar toggles |
| Writing Correction | Grammar, vocabulary, structure, coherence, improved version toggles |
| Privacy | Privacy level, anonymous analytics, crash reporting, conversation history, usage statistics |

### Default Provider Presets

| Provider | Base URL | Default Model |
|----------|----------|---------------|
| OpenAI | `https://api.openai.com/v1` | `gpt-4o-mini` |
| Claude | `https://api.anthropic.com/v1` | `claude-sonnet-4-20250514` |
| Gemini | `https://generativelanguage.googleapis.com/v1beta` | `gemini-2.0-flash` |
| DeepSeek | `https://api.deepseek.com` | `deepseek-chat` |
| OpenRouter | `https://openrouter.ai/api/v1` | `openai/gpt-4o-mini` |
| Groq | `https://api.groq.com/openai/v1` | `llama-3.3-70b-versatile` |
| Local | `http://localhost:11434/v1` | `llama3` |
| Custom | (user-defined) | (user-defined) |

### Factory Defaults

```typescript
// Basic
targetBand: 7.0
examDate: ''
responseLanguage: 'english'
tutorMode: 'friendly-tutor'
dailyStudyMinutes: 60

// Advanced
activeProvider: 'default-openai' (GPT-4o Mini)
tutorConfig: { explanationStyle: 'detailed', correctionStrictness: 'balanced',
               exerciseDifficulty: 'adaptive', feedbackDepth: 'standard',
               automationLevel: 'semi-automatic', studyReminderFrequency: 'daily' }
vocabReview: 20 reviews/day, all toggles on
speakingFeedback: all toggles on
writingCorrection: all toggles on, showImprovedVersion: true
privacy: local-only, analytics off, crash reporting off,
         conversation history on, usage statistics on
```

---

## Privacy & Security

### Data Storage

- All configuration is stored **locally** in the user's browser (`localStorage`)
- API keys are never sent to any server other than the user's chosen AI provider
- No configuration data is transmitted to IELTS Journey backend (there is no backend)

### Privacy Levels

| Level | Behavior |
|-------|----------|
| `local-only` | Everything stays in the browser. No analytics, no telemetry. |
| `local-with-analytics` | Anonymous usage data may be collected. API keys are still never transmitted. |

### Security Considerations

1. **API Keys**: Stored as plain text in `localStorage`. Users should avoid using shared devices. Future enhancement: warn users of this tradeoff.
2. **Conversation History**: Stored locally via IndexedDB. Users can disable storage in Privacy settings.
3. **Provider Fallback**: When a fallback provider is configured, the same request may be sent to a different provider — users should be aware of data exposure across providers.

---

## Testing

Tests are located in `tests/configuration/`:

| Test File | What It Covers |
|-----------|---------------|
| `configModels.test.ts` | Type validation, default values, interface contracts |
| `configSlice.test.tsx` | Context provider behavior, action dispatch, state updates |
| `storage.test.ts` | Save/load round-trip, migration, validation, edge cases |
| `forms.test.tsx` | Component rendering, validation messages, save flows |
| Configuration integration test | End-to-end flow from storage through AI Tutor |

---

## Developer Guide

### Adding a New Configuration Field

1. Add the field to the appropriate interface in `models.ts`
2. Update the default value in `createDefaultBasic()` or `createDefaultAdvanced()` in `storage.ts`
3. Add the field to the validation logic in `validateConfiguration()` if needed
4. Add the UI control to the appropriate form component
5. Add the field to the `deepMerge` structure in `loadConfiguration()` if it's nested
6. Write/update tests

### Adding a New AI Provider Type

1. Add the provider name to `AiProviderType` union in `models.ts`
2. Add a default preset in `createDefaultProvider()` in `AdvancedSettingsForm.tsx`
3. Update the `PROVIDER_TYPE_OPTIONS` constant if present
4. Add provider-specific call logic in `aiTutorService.ts` if special handling is needed

### Adding a New Tutor Mode

1. Add the mode to `AiTutorMode` union in `models.ts`
2. Add an entry to `TUTOR_MODE_OPTIONS` in `BasicSettingsForm.tsx` with label and description
3. Add the system prompt generation logic in `aiTutorService.ts`

---

## Accessibility (UX Notes)

An accessibility review (`docs/accessibility-ux-review-configuration.md`) identified these key findings:

- Tutor mode selector should use `role="radiogroup"` and `role="radio"` patterns for keyboard navigation
- Error messages need `role="alert"` for screen reader announcement
- ToggleSwitch descriptions should use `aria-describedby`
- Save model inconsistency between Basic (auto-save) and Advanced (explicit save) should be resolved
- Helper text contrast depends on theme token values — verify against WCAG 4.5:1

See the full review for detailed findings and priority fixes.

---

## Future Enhancements

- **Configuration import/export** — JSON file download/upload for backup and sharing
- **Per-skill AI provider routing** — e.g., use OpenAI for writing, local model for vocabulary
- **A/B testing mode** — compare two provider configurations side-by-side
- **Configuration presets** — "Exam Day", "Quick Practice", "Deep Study" one-click profiles
- **Cloud sync** — optional encrypted sync across devices (requires authentication system)
- **Usage dashboard** — visualize API costs, request counts, and model performance per provider
