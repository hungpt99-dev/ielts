# AI Orchestration

> Package: `@ielts/ai` — files in `packages/ai/src/`

The `@ielts/ai` package provides the AI communication layer shared by all engines. It wraps the OpenAI API, provides prompt builders, Zod-validated output schemas, caching, and utilities.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    @ielts/ai                         │
├─────────────────────────────────────────────────────┤
│  Client Layer     │  Adapters     │  Prompts         │
│  createAIClient   │  openai.ts    │  vocabulary.ts   │
│  callAI           │               │  video.ts        │
│  AIClient         │  Types        │  article.ts      │
│                   │  ProviderCfg  │  dictionary.ts   │
│  Services         │               │  explain.ts      │
│  vocabulary.ts    │  Schemas      │  exercise-gen.ts │
│  video.ts         │  Zod schemas  │  prompt-reg.ts   │
│  article.ts       │  per service  │                  │
│  dictionary.ts    │               │  Utilities       │
│  explain.ts       │  Errors       │  AiCache         │
│                   │  AIError      │  AiGenerateResult│
│                   │  AIAuthError  │  Cache           │
│                   │  AIRateLimit  │  extractJSON     │
│                   │  AINetworkErr │  parseAndValidate│
│                   │  AIEmptyResp  │                  │
│                   │  AIConfigErr  │                  │
└─────────────────────────────────────────────────────┘
```

## Key Exports

From `packages/ai/src/index.ts`:

```typescript
// Client
export { createAIClient, callAI }
export type { AIClient, AICallResult }

// Services
export { explain, generateVocabularyDetails, generateVocabularyFromTranscript,
  generateSummaryFromTranscript, generateListeningQuestions,
  generateShadowingScripts, generateDictionaryEntry, dictionaryCache }

// Prompts
export { AI_EXPLAIN_LABELS }
export type { AiExplainType }

// Prompt Registry
export { PromptRegistry, getDefaultPromptRegistry, registerDefaultPrompts }

// Exercise generation prompts
export { READING_QUESTIONS_SYSTEM_PROMPT, LISTENING_EXERCISE_SYSTEM_PROMPT,
  SPEAKING_PROMPTS_SYSTEM_PROMPT, WRITING_IDEAS_SYSTEM_PROMPT,
  GRAMMAR_EXERCISES_SYSTEM_PROMPT, MISTAKE_REVIEW_SYSTEM_PROMPT,
  VOCABULARY_EXTRACTION_SYSTEM_PROMPT,
  buildReadingQuestionsPrompt, buildListeningExercisePrompt,
  buildSpeakingPromptsPrompt, buildWritingIdeasPrompt,
  buildGrammarExercisesPrompt, buildMistakeReviewPrompt,
  buildVocabularyExtractionPrompt }

// Schemas (Zod)
export { vocabularyDetailsSchema, vocabularyQuizSchema,
  readingQuestionsSchema, listeningExerciseSchema, speakingPromptsSchema,
  writingIdeasSchema, grammarExercisesSchema, mistakeReviewSchema,
  vocabularyExtractionSchema }

// Cache
export { AiGenerateResultCache }
export type { GenerateResultCacheOptions, GenerateResultCacheStats }
```

## Client: OpenAI Adapter

`createAIClient` (`client/index.ts`) creates an OpenAI-compatible client. `callAI` is the primary entry point:

```typescript
async function callAI(
  systemPrompt: string,
  userMessage: string,
  config?: ProviderConfig | (() => ProviderConfig),
  options?: { temperature?: number; maxTokens?: number; signal?: AbortSignal },
): Promise<AICallResult>
```

It reads `ProviderConfig` (API key, base URL, model) at call time, allowing dynamic configuration switching. The default model is `gpt-4o-mini`.

## Prompt Builders

### Exercise Generation Prompts

In `packages/ai/src/prompts/`:

| Builder | File | Purpose |
|---|---|---|
| `buildReadingQuestionsPrompt` | `prompts/exercise-generation.ts` | Generate reading passage questions |
| `buildListeningExercisePrompt` | `prompts/exercise-generation.ts` | Generate listening exercises |
| `buildSpeakingPromptsPrompt` | `prompts/exercise-generation.ts` | Generate speaking prompts |
| `buildWritingIdeasPrompt` | `prompts/exercise-generation.ts` | Generate writing ideas |
| `buildGrammarExercisesPrompt` | `prompts/exercise-generation.ts` | Generate grammar exercises |
| `buildMistakeReviewPrompt` | `prompts/exercise-generation.ts` | Generate mistake review exercises |
| `buildVocabularyExtractionPrompt` | `prompts/exercise-generation.ts` | Extract vocabulary from text |

### Service-Specific Prompts

| Builder | File | Purpose |
|---|---|---|
| `explain` | `services/explain.ts` | Word/phrase explanations |
| `generateVocabularyDetails` | `services/vocabulary.ts` | Vocabulary detail generation |
| `generateDictionaryEntry` | `services/dictionary.ts` | Dictionary entry generation |
| `generateSummaryFromTranscript` | `services/video.ts` | YouTube transcript summary |
| `generateListeningQuestions` | `services/video.ts` | Questions from video content |

### Prompt Registry

`PromptRegistry` (`prompts/prompt-registry.ts`) manages named prompts with versioning. `registerDefaultPrompts` registers all system prompts. `getDefaultPromptRegistry` returns a pre-populated registry.

## Zod-Validated Schemas

Schemas in `packages/ai/src/schemas/` ensure AI outputs conform to expected shapes:

| Schema | Validates | Used By |
|---|---|---|
| `vocabularyDetailsSchema` | Word details (definitions, examples, forms) | Vocabulary service |
| `vocabularyQuizSchema` | Quiz questions | Vocabulary service |
| `readingQuestionsSchema` | Reading questions + answers | Exercise generation |
| `listeningExerciseSchema` | Listening exercises | Exercise generation |
| `speakingPromptsSchema` | Speaking prompts + follow-ups | Exercise generation |
| `writingIdeasSchema` | Writing task ideas | Exercise generation |
| `grammarExercisesSchema` | Grammar exercises | Exercise generation |
| `mistakeReviewSchema` | Mistake review exercises | Exercise generation |
| `vocabularyExtractionSchema` | Extracted vocabulary items | Vocabulary extraction |

## Caching

### AiCache (`utils/cache.ts:1`)

Simple TTL-based in-memory cache:

```typescript
class AiCache<T> {
  constructor(ttlMs?: number)  // default 1 hour
  get(key: string): T | null
  set(key: string, data: T): void
  clear(): void
  size(): number
}
```

Used by: `dictionaryCache`, `AiPlanOrchestrator`'s internal cache

### AiGenerateResultCache (`utils/generateResultCache.ts:20`)

Full-featured cache for AI generation results:

```typescript
class AiGenerateResultCache<T> {
  constructor(options: { ttlMs?, maxSize?, serializer? })

  get(key: string): T | null
  set(key: string, data: T, ttlOverride?): void
  getOrSet(key: string, factory: () => Promise<T>): Promise<T>
  has(key: string): boolean
  delete(key: string): boolean
  clear(): void
  size(): number
  stats(): { hits, misses, evictions, size }
  keys(): string[]

  static generateKey(...parts: string[]): string
}
```

Features:
- TTL-based expiry (default 1 hour)
- Max size with LRU eviction
- Pending request coalescing (deduplicates concurrent fetches)
- Stats tracking (hits/misses/evictions)
- Custom serializer support

Used by: `CachedContextBuilder`, `CachedProactiveEvaluator`

## Utilities

### `extractJSON` (`utils/response.ts`)

Extracts the first valid JSON object or array from a raw AI response string. Handles:
- Markdown-fenced code blocks (` ```json ... ``` `)
- Leading/trailing text outside JSON
- Nested objects with braces/strings

### `parseAndValidate`

Wraps `extractJSON` + `JSON.parse` + `Zod.safeParse` into a single call, returning typed data or `null`.

## Error Types

`packages/ai/src/errors/types.ts`:

| Error | Code | When |
|---|---|---|
| `AIError` | `UNKNOWN` | Base error class |
| `AIAuthError` | `AUTH_ERROR` | Invalid API key |
| `AIRateLimitError` | `RATE_LIMIT` | Rate limit exceeded |
| `AINetworkError` | `NETWORK_ERROR` | Network failure |
| `AIEmptyResponseError` | `EMPTY_RESPONSE` | Empty AI response |
| `AIConfigError` | `CONFIG_ERROR` | API key not configured |

All errors extend `AIError` with a `code` string and user-friendly default messages.

## Offline Fallback

Both engines degrade gracefully when AI is unavailable:

- **Learning Engine**: `TutorIntelligencePort` checks API key presence (`engineBootstrap.ts:472`). Without a key, it returns `{ success: false, error: { code: 'ai_not_configured' } }`. The engine falls back to deterministic grading and template-based exercise generation.
- **AI Tutor Engine**: `AITutorEngineImpl` initializes with `aiAvailable: false` when no AI client is provided. Operations return `{ status: 'unavailable' }`. The `FallbackTutorAIClient` is used as a default.
- **Study Plan Engine**: `AiPlanOrchestrator` skips all AI calls when `aiProviderAvailable` is false, running purely deterministic plan generation.

## Data Minimization

Prompts are constructed with only the data relevant to the specific AI call:
- Profile analysis prompts include band scores and gaps, not full task history
- Weekly objective prompts include phase context, not individual exercise data
- Task candidate prompts include week details and objectives, not the full plan
- Chat prompts include summarized context, not raw repository data

The `context-summarizer.ts` in `@ielts/ai-tutor-engine` transforms the full `LearnerStateSnapshot` into a compact, AI-prompt-friendly summary for chat context.
