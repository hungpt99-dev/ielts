# Explain & Simplify Text Feature — Architecture Analysis

## Overview

The explain/simplify feature lets users select text and get AI-generated explanations, translations, vocabulary analysis, grammar breakdowns, rewrites, example sentences, and quizzes. It lives in `packages/ai` and is consumed primarily by the browser extension (`apps/extension/src/content-script/aiExplain.ts`).

---

## Architecture

### Key Files

| File | Role |
|---|---|
| `packages/ai/src/prompts/explain.ts` | Defines prompt templates, system prompts, JSON schemas, and the `buildExplainPrompt()` factory |
| `packages/ai/src/schemas/explain.ts` | Zod schemas for each explain type's expected AI response shape; defines the `AiExplainResult` union type |
| `packages/ai/src/services/explain.ts` | Orchestrator: caching, AI call, parsing, validation |
| `packages/ai/src/client/index.ts` | `callAI()` — sends messages to the configured AI provider |
| `packages/ai/src/utils/response.ts` | `extractJSON()` and `parseAndValidate()` — extract + validate JSON from AI responses |
| `packages/ai/src/utils/cache.ts` | `AiCache<T>` — in-memory TTL cache |
| `apps/extension/src/content-script/aiExplain.ts` | Extension UI: panel rendering, tab switching, calls `explain()`, renders results |

### Explain Types (7 modes)

| Type | Schema | Purpose |
|---|---|---|
| `simple` | `SimpleExplain` (`{ explanation }`) | Simplify text for IELTS learners |
| `vietnamese` | `VietnameseExplain` (`{ translation, vocabularyNotes[] }`) | Translate + vocabulary notes |
| `ielts-vocab` | `IeltsVocabResult` (`{ words[]: { word, meaning, partOfSpeech, example, synonyms, collocations } }`) | Extract IELTS vocabulary |
| `grammar` | `GrammarExplain` (`{ explanation, structure, rules[], commonMistakes[] }`) | Grammar analysis |
| `rewrite` | `RewriteResult` (`{ rewritten, changes, tone }`) | Natural rewrite |
| `example-sentences` | `ExampleSentencesResult` (`{ sentences[], explanation }`) | Generate example sentences |
| `quiz` | `QuizResult` (`{ questions[]: { question, options[], correctAnswer, explanation } }`) | Quiz generation |

---

## Data Flow

```
User selects text
       │
       ▼
showExplainPanel(text, initialAction?)     ← extension aiExplain.ts
       │
       ▼
loadTab(type)
       │
       ├── Check cache → if hit, render directly
       │
       ▼
explain(type, text, getConfig)             ← packages/ai/src/services/explain.ts
       │
       ├── 1. Compute cache key = `${type}:${text}`
       ├── 2. Check aiExplainCache → return if hit (TTL: 1 hour)
       │
       ▼
buildExplainPrompt(type, text)             ← packages/ai/src/prompts/explain.ts
       │
       ├── Lookup AI_EXPLAIN_PROMPTS[type]  (user prompt template)
       ├── Lookup SYSTEM_PROMPTS[type]       (system role definition)
       ├── Lookup JSON_SCHEMAS[type]         (expected JSON shape example)
       │
       ▼
callAI(systemPrompt, userPrompt, getConfig) ← packages/ai/src/client/index.ts
       │
       ├── createAIClient() → OpenAIAdapter (default)
       ├── Builds Message[] = [{ role: "system", content }, { role: "user", content }]
       ├── Calls adapter.complete() with ProviderConfig (apiKey, baseUrl, model, temperature)
       │
       ▼
AI Provider → raw response string
       │
       ▼
extractJSON(content)                       ← packages/ai/src/utils/response.ts
       │
       ├── Slices from first '{' to last '}' → JSON string
       ├── Throws AIError if no braces found
       │
       ▼
JSON.parse(json) → unknown object
       │
       ▼
schema.safeParse(parsed)                   ← type-specific Zod schema
       │
       ├── On failure → return error "unexpected format"
       ├── On success → cache result + return { data, error: null }
       │
       ▼
Extension renders result                   ← aiExplain.ts renderResult()
```

---

## Caching

- **Class:** `AiCache<T>` (`packages/ai/src/utils/cache.ts`)
- **Instance:** `aiExplainCache = new AiCache<AiExplainResult>()` — module-level singleton
- **TTL:** 60 minutes (default)
- **Key format:** `${type}:${text}` (e.g. `"simple:The quick brown fox"`)
- **Storage:** In-memory `Map<string, { data: T, timestamp: number }>`
- **Eviction:** Lazy — checked on `get()`; `clear()` available but only called in tests
- **Scope:** Per page session (not persisted to disk/IndexedDB)

## Error Handling

Errors are surfaced to the UI as user-readable strings:

| Scenario | Error Message |
|---|---|
| No API key | `"API key not configured. Add your AI API key in Settings."` |
| Invalid JSON response | `"AI response was not valid JSON. Try again."` |
| Unexpected response shape | `"AI response had unexpected format. Try again."` |
| Auth failure (401) | `"Invalid API key. Check your key in Settings."` |
| Rate limit (429) | `"Rate limit exceeded. Wait a moment and try again."` |
| Network failure | `"Network error. Check your internet connection and API endpoint."` |
| Empty response | `"AI returned an empty response. Try again."` |

---

## Key Observations

1. **No "simplify" as a separate feature** — simplification is the `simple` explain type. There's no dedicated simplification pipeline; it's just one of 7 AI prompt modes.
2. **All prompts are hardcoded** — `AI_EXPLAIN_PROMPTS`, `SYSTEM_PROMPTS`, and `JSON_SCHEMAS` are static `Record` objects in `prompts/explain.ts`. No dynamic prompt construction, no user customization.
3. **JSON extraction is fragile** — `extractJSON()` takes the first `{` to last `}`, which breaks if the AI wraps JSON in markdown code fences or includes `{}` in text.
4. **No streaming** — `callAI` waits for the full response. The UI shows a spinner during the wait.
5. **In-memory cache only** — clearing the page or navigating away loses cached results. No persistent storage.
6. **7 independent schemas** — each explain type has its own Zod schema and its own `renderResult()` handler in the extension. Adding a new explain type requires touching 4 files (prompts, schemas, service, renderer).
7. **Vocabulary extraction (`ielts-vocab`)** produces static word lists with no link to the storage layer — the results are displayed in the panel but not automatically saved to the user's vocabulary bank.
