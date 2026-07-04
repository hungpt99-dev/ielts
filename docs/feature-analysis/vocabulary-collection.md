# Vocabulary Collection and AI Enrichment

## Overview

Vocabulary is collected via three pathways — browser extension (selection panel + dictionary panel) and the web app form — all storing into IndexedDB with an optional AI enrichment step that provides meanings, examples, synonyms, collocations, and word family data.

---

## System Architecture

```
User selects text (browser)
       │
       ▼
┌─────────────────────┐      ┌──────────────────────┐
│  selectionPanel.ts   │      │  dictionaryPanel.ts   │
│  (floating toolbar)  │      │  (hover dictionary)   │
└────────┬────────────┘      └──────────┬───────────┘
         │                              │
    ┌────▼────┐                   ┌─────▼──────┐
    │ Save to │                   │ AI Enrich  │
    │ chrome. │                   │ via        │
    │storage. │                   │generateDic-│
    │ local   │                   │tionaryEntry│
    └────┬────┘                   └─────┬──────┘
         │                              │
         ▼                              ▼
    ┌────────────────────────────────────────┐
    │      chrome.storage.local              │
    │  (keys: vocabulary, savedItems, etc.)  │
    └────────────────┬───────────────────────┘
                     │ sync via storage-bridge.ts
                     ▼
    ┌────────────────────────────────────────┐
    │           IndexedDB (Dexie)            │
    │  tables: vocabulary, vocabularyReviews │
    └────────────────┬───────────────────────┘
                     │
         ┌───────────┴───────────┐
         ▼                       ▼
    Web App (SPA)          Extension
  (Vocabulary.tsx)      (vocabularyStore.ts)
```

---

## Collection Pathways

### Pathway 1: Dictionary Panel (`dictionaryPanel.ts`)

- **Trigger**: double-click or select a single word on any webpage
- **AI enrichment**: automatically calls `generateDictionaryEntry()` from `packages/ai/src/services/dictionary.ts`
- **Data returned**: `DictionaryEntry` — meaning, meaningVi, pronunciation, partOfSpeech, exampleSentence, synonyms, collocations, ieltsTopic
- **Caching**: 30-minute TTL in-memory cache (`DictionaryCache`)
- **Save**: user clicks "Save Word" button → `saveWord()` populates the entry with cached AI data + source context (pageTitle, pageUrl, sourceSentence) → writes to `chrome.storage.local['vocabulary']`
- **Limitation**: `antonyms` and `wordFamily` are NOT included because `DictionaryEntry` schema lacks those fields (only `VocabularyDetails` includes them, but `generateVocabularyDetails()` is never called during the dictionary panel save flow)

### Pathway 2: Selection Panel (`selectionPanel.ts`)

- **Trigger**: select any text on a webpage
- **Save actions**: user clicks one of three category buttons (📖 Save Word, 📝 Save Sentence, ⚠️ Mistake Note)
- **Display-only AI**: for single words, the panel automatically loads dictionary data from `dictionaryCache` / `generateDictionaryEntry()` and renders it inline for reference
- **Save**: `saveText()` writes the raw text + category + page metadata to `chrome.storage.local['savedItems']` — **no AI enrichment is persisted with the saved entry**
- **Observation**: the "Save Word" action in selection panel saves to `savedItems`, NOT to the `vocabulary` store. The dictionary panel's "Save Word" is the only extension path that persists AI-enriched vocabulary entries.

### Pathway 3: Web App Manual Form (`WordForm.tsx`)

- **Trigger**: user navigates to `/vocabulary` page, clicks "Add Word"
- **AI enrichment**: only partial — there is a "Generate Example" button that calls AI inline (not through the shared AI service) to produce an example sentence, collocations, and synonyms; meaning, pronunciation, and other fields are filled manually
- **Save**: form submits → `buildEntry()` creates a `VocabularyEntry` with manual data → calls `onSave()` → `vocabularyService.ts` writes to IndexedDB
- **No full AI enrichment**: `generateVocabularyDetails()` (which returns complete data including antonyms and wordFamily) is NOT wired to the web app form

---

## AI Enrichment Services

### `generateDictionaryEntry()` — `packages/ai/src/services/dictionary.ts`

| Property | Description |
|----------|-------------|
| Module | `packages/ai/src/services/dictionary.ts:28` |
| Inputs | `selectedWord`, `contextSentence`, `getConfig` |
| Output | `DictionaryEntry` → { word, meaning, meaningVi, pronunciation, partOfSpeech, exampleSentence, synonyms, collocations, ieltsTopic } |
| Cache | `DictionaryCache` with 30-min TTL keyed on `word\|context[:80]` |
| Temperature | 0.3 (low, for factual dictionary lookups) |
| Max tokens | 800 |

### `generateVocabularyDetails()` — `packages/ai/src/services/vocabulary.ts`

| Property | Description |
|----------|-------------|
| Module | `packages/ai/src/services/vocabulary.ts:8` |
| Inputs | `word`, `sourceSentence`, `topic`, `getConfig` |
| Output | `VocabularyDetails` → { meaning, meaningVi, partOfSpeech, pronunciation, exampleSentence, synonyms, antonyms, collocations, wordFamily } |
| Cache | None (no caching) |
| Temperature | 0.5 |
| Max tokens | 1000 |
| **Note** | More complete than DictionaryEntry (includes `antonyms`, `wordFamily`), but is NOT used in any save flow currently |

### `explain('ielts-vocab')` — `packages/ai/src/services/explain.ts`

- Returns `IeltsVocabResult`: an array of `{ word, meaning, partOfSpeech, example, synonyms, collocations }`
- Used by the `aiExplain.ts` modal panel (extension — the 💡 AI Explain action)
- Has its own in-memory cache (`AiCache` with no TTL)
- Output is displayed in-UI but NOT persisted to the vocabulary store

### AI Client Configuration

All services use `callAI()` from `packages/ai/src/client/index.ts` — an OpenAI-compatible fetch wrapper. Configuration:
- Endpoint: configurable `baseUrl` (default `https://api.openai.com/v1`)
- Model: configurable (default `gpt-4o-mini`)
- API key: user-supplied, stored in `chrome.storage.local['aiApiKey']` (extension) or `settings.aiApiKey` (web app)

---

## Storage

### Primary: IndexedDB via Dexie

**`vocabulary` table schema** (defined in `packages/storage/src/schema.ts:35`):

| Field | Type | Required | Default |
|-------|------|----------|---------|
| id | string (UUID) | yes | — |
| word | string | yes | — |
| meaning | string | yes | — |
| meaningVi | string | no | '' |
| pronunciation | string | no | '' |
| partOfSpeech | string | no | '' |
| topic | string | yes (schema), but extension saves default to '' | — |
| exampleSentence | string | no | '' |
| collocations | string[] | no | [] |
| synonyms | string[] | no | [] |
| antonyms | string[] | no | [] |
| wordFamily | string[] | no | [] |
| personalNote | string | no | '' |
| difficulty | 'easy' \| 'medium' \| 'hard' | yes | — |
| status | 'new' \| 'learning' \| 'reviewing' \| 'mastered' | yes | — |
| tags | string[] | no | [] |
| createdAt | ISO string | yes | — |
| updatedAt | ISO string | yes | — |

**`vocabularyReviews` table schema** (defined in `packages/storage/src/schema.ts:56`):

| Field | Type | Description |
|-------|------|-------------|
| id | string (UUID) | Primary key |
| vocabularyId | string | FK → vocabulary.id |
| interval | number | Days between reviews (SM-2) |
| easeFactor | number | Min 1.3 |
| repetitions | number | Consecutive correct reps |
| nextReviewDate | ISO string | When to review next |
| lastReviewDate | ISO string | Last review timestamp |
| history | Array<{date, rating}> | Review trail |

### Secondary: `chrome.storage.local` (extension)

- **`vocabulary`**: list of vocabulary entries (synced to IndexedDB via `storage-bridge.ts`)
- **`savedItems`**: generic saves from selection panel (text + category only, no AI enrichment)

### Database Wrappers

- **Extension**: `apps/extension/src/storage/vocabularyStore.ts` — IndexedDB CRUD + stats + review queries
- **Web app**: `apps/web/src/features/vocabulary/vocabularyService.ts` — CRUD, filtering, spaced repetition rating (SM-2), exercise generation
- **Sync bridge**: `packages/storage/src/syncService.ts` — translates extension storage format to shared schema

---

## AI Enrichment Usage Gaps

| Location | AI Used | What's Enriched | What's Missing |
|----------|---------|-----------------|----------------|
| Dictionary panel save | `generateDictionaryEntry` | meaning, meaningVi, pronunciation, partOfSpeech, exampleSentence, synonyms, collocations, ieltsTopic | `antonyms`, `wordFamily` (schema doesn't include them) |
| Selection panel save | None (display only) | Nothing persisted | No enrichment at all — saves raw text only |
| Web app WordForm | Inline `callAI` for example gen | exampleSentence, collocations, synonyms | No meaning, pronunciation, partOfSpeech, antonyms, wordFamily enrichment |
| AI Explain (ielts-vocab) | `explain('ielts-vocab')` | Display only — not persisted | No save-to-vocabulary integration |
| Video transcript | `generateVocabularyFromTranscript` | Extracted vocabulary list | Not auto-saved as vocabulary entries |

---

## Integration Points

1. **`packages/ai` exports**: `generateDictionaryEntry`, `generateVocabularyDetails`, `generateVocabularyQuiz`, `explain`, `callAI` — available as library for any consumer
2. **Extension messaging**: `chrome.runtime.sendMessage` types — `UPDATE_PROGRESS`, `SAVE_SELECTION_FULL`, `AI_EXPLAIN` — used to route saves and AI requests between content scripts ↔ background ↔ popup
3. **Custom DOM events**: `vocabulary-changed` event (`vocabularyEvents.ts`) — triggers cross-component refresh in the web app after vocabulary mutations
4. **Settings integration**: AI endpoint, model, and API key are configured through shared settings UI and consumed by `getProviderConfig()` in both extension and web app

---

## Spaced Repetition Integration

- Saved vocabulary entries are eligible for review via the SM-2 algorithm in `apps/web/src/utils/spaced-repetition.ts`
- The `/review` page (`VocabularyReview.tsx`) quizzes users with gap-fill (using stored `exampleSentence`), synonym matching, and collocation matching
- `generateVocabularyQuiz()` exists in the AI package (returns 4 AI-generated question types: meaning, gap-fill, synonym, collocation) but is **not wired into the review flow** — reviews use hardcoded formats from stored data instead

---

## Summary of Current Limitations

1. **Dictionary panel** saves lack `antonyms` and `wordFamily` — `DictionaryEntry` schema is a subset of `VocabularyDetails`
2. **Selection panel** saves raw text only — no AI enrichment is persisted with saved items
3. **Web app form** has no "Auto-enrich" button — `generateVocabularyDetails()` is exported but never wired
4. **AI quiz generation** (`generateVocabularyQuiz`) is unused in the review flow
5. **Extension ↔ web app databases are separate** — no automatic sync between the two IndexedDB instances
6. **Topic auto-detection** is not applied on save — `ieltsTopic` from dictionary API is displayed but not saved
7. **All AI features require user-supplied API key** — no built-in service
