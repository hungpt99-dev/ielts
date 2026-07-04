# Selected Text Saving and Categorization

## Overview

The system provides three entry points for saving selected text from the web, all in the browser extension (`apps/extension/`). Data flows through `chrome.storage.local` to IndexedDB, with AI enrichment available on demand but **no automated categorization**.

## Entry Points

### 1. Context Menu (Right-Click)
- **File**: `apps/extension/src/background/index.ts`
- User selects text, right-clicks → "Save to IELTS Journey" → chooses one of 8 sub-categories.
- Background script sends `SAVE_SELECTION_FULL` message to content script.
- Content script (`apps/extension/src/content-script/saveSelectedText.ts`) stores to `chrome.storage.local` under `savedItems`.

### 2. Floating Selection Toolbar
- **File**: `apps/extension/src/content-script/selectionPanel.ts`
- Appears on text `mouseup` with 3 categorized save buttons: Save Word, Save Sentence, Mistake Note.
- Same storage path: `chrome.storage.local` → IndexedDB sync.

### 3. Extension Popup
- **Files**: `apps/extension/src/popup/App.tsx` → `SaveTextForm.tsx`, `VocabularyCollector.tsx`, `ArticleCollector.tsx`
- Popup queries current tab (`GET_PAGE_INFO`) for `{title, url, selectedText}`.
- **SaveTextForm**: Full form with text area, category grid, topic, skill, difficulty, tags, personal note. Writes directly to IndexedDB.
- **VocabularyCollector**: Dedicated vocab form with optional AI enrichment button. Writes to IndexedDB `vocabulary` store.
- **ArticleCollector**: Saves full page + optional AI IELTS questions to IndexedDB `articles` store.

## Categorization

### Manual Only — No AI-Driven Category Assignment

The system defines **8 fixed categories** in `apps/extension/src/types.ts`:

```
vocabulary, phrase, sentence, grammar, reading, writing, speaking, mistake
```

Every save path requires **explicit user choice** of category:
- Context menu: chosen from 8 sub-menu items
- Toolbar: one of 3 buttons (Word, Sentence, Mistake)
- Popup form: grid of 8 category buttons

### Metadata (User-Provided)
- **Topic**: free-text input (e.g., "education", "environment")
- **Skill**: dropdown with `vocabulary, grammar, reading, listening, writing, speaking, general`
- **Difficulty**: dropdown with `easy, medium, hard, not specified`
- **Tags**: comma-separated free-text

### AI-Assisted Categorization (Limited)
- `packages/ai/src/services/dictionary.ts` — `generateDictionaryEntry()` prompts AI to assign an `ieltsTopic` from a fixed list (education, environment, technology, etc.).
- This is **display-only** in the selection panel tooltip, not used to drive save-category selection or any logic.

## AI Enrichment (Post-Save, On Demand)

| Service | What it produces | Trigger |
|---------|-----------------|---------|
| `dictionary.ts` | Meaning, pronunciation, synonyms, collocations, ieltsTopic | Auto for single-word selection |
| `explain.ts` (7 types) | Simple explanation, VN translation, IELTS vocab analysis, grammar, rewrite, examples, quiz | Toolbar buttons or Explain panel |
| `vocabulary.ts` | Full word details + quiz questions | Vocabulary Collector "Enrich" button |
| `article.ts` | IELTS reading questions | Article Collector |

All AI calls go through `packages/ai/src/client/index.ts` (OpenAI-compatible). Configurable API key stored in `chrome.storage.local`.

## Storage

### Extension Storage (Two-Tier)

1. **`chrome.storage.local`** (`savedItems`, `vocabulary`, `mistakes`, `articles`, `dailyProgress`)
   - File: `apps/extension/src/services/storage.ts`
   - Immediate persistence, size-limited.

2. **IndexedDB** (`ielts-journey-extension` database)
   - Files:
     - `apps/extension/src/storage/indexedDB.ts` — `learningEntries` store (phrase, sentence, grammar, reading, writing, speaking)
     - `apps/extension/src/storage/vocabularyStore.ts` — `vocabulary` store with AI enrichment fields
     - `apps/extension/src/storage/articleStore.ts` — `articles` store
     - `apps/extension/src/storage/mistakeStore.ts` — `mistakes` store
   - Synced from `chrome.storage.local` via **debounced bridge** (`apps/extension/src/background/storage-bridge.ts`, 500ms debounce).
   - Provides richer indexing (by category, createdAt, topic, skill, status).

### Web App Storage
- `apps/web/src/services/storage/Database.ts` — Dexie-backed IndexedDB with typed repositories.
- Separate database from extension.

## Key Components

| Component | File | Role |
|-----------|------|------|
| `selectionPanel.ts` | `apps/extension/src/content-script/selectionPanel.ts` | Floating toolbar on text selection |
| `saveSelectedText.ts` | `apps/extension/src/content-script/saveSelectedText.ts` | Content-script save handler |
| `SaveTextForm.tsx` | `apps/extension/src/popup/components/SaveTextForm.tsx` | Popup save form with full categorization |
| `VocabularyCollector.tsx` | `apps/extension/src/popup/components/VocabularyCollector.tsx` | Dedicated vocab collector |
| `ArticleCollector.tsx` | `apps/extension/src/popup/components/ArticleCollector.tsx` | Article collector |
| `storage-bridge.ts` | `apps/extension/src/background/storage-bridge.ts` | `chrome.storage` → IndexedDB sync |
| `Vocabulary.tsx` | `apps/web/src/pages/Vocabulary.tsx` | Web app vocabulary notebook |

## Data Flow Diagram

```
[User selects text on webpage]
          |
          v
+--------------------------+    +--------------------------+    +----------------------+
| Context Menu (right-click)|    | Floating Selection Toolbar|    | Extension Popup       |
| 8 category sub-menus     |    | 3 category buttons + AI  |    | SaveTextForm /        |
| (background/index.ts)    |    | (selectionPanel.ts)      |    | VocabularyCollector   |
+--------------------------+    +--------------------------+    +----------------------+
          |                              |                              |
          | chrome.tabs.sendMessage     | direct call                  | Direct IndexedDB write
          | SAVE_SELECTION_FULL         |                              |
          v                              v                              v
+-----------------------------------------------------+    +---------------------+
| content-script/saveSelectedText.ts                   |    | IndexedDB           |
| Stores to chrome.storage.local >> savedItems         |    | - learningEntries   |
| Updates dailyProgress                                |    | - vocabulary        |
+-----------------------------------------------------+    | - articles          |
          |                                                  | - mistakes          |
          | (storage bridge detects change)                  +---------------------+
          v
+-----------------------------------------------------+
| background/storage-bridge.ts                         |
| Debounced sync (500ms) from chrome.storage -> IDB   |
| Maps entries to correct store by category            |
+-----------------------------------------------------+
          |
          v
+-----------------------------------------------------+
| IndexedDB (ielts-journey-extension)                  |
| - learningEntries: phrase, sentence, grammar,        |
|   reading, writing, speaking                         |
| - vocabulary: word entries + AI enrichment           |
| - articles: saved articles + AI questions            |
| - mistakes: mistake entries                          |
+-----------------------------------------------------+
```

## Key Finding: No Automated Classification

The system requires **entirely manual categorization**. Users must explicitly pick a category at every entry point. The only AI-driven topic suggestion (`ieltsTopic` in dictionary lookups) is display-only and not used to pre-select categories, auto-tag, or route entries.

This represents the primary opportunity for automation — an AI service that analyzes selected text and suggests or auto-selects the save category could significantly reduce user effort.
