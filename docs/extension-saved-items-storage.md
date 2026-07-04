# Extension Saved Items — Storage & Retrieval

## Overview

The extension stores user-saved learning items (vocabulary, phrases, sentences, grammar notes, reading/writing/speaking materials, mistake notes) in `chrome.storage.local` under the key `'savedItems'`. A background bridge (`storage-bridge.ts`) synchronizes this data into IndexedDB for persistence and website sharing.

---

## Storage Key

| Key | Type | Location |
|-----|------|----------|
| `savedItems` | `Array<SavedItemEntry>` | `chrome.storage.local` |

Defined as a constant at `apps/extension/src/services/storage.ts:26`:

```ts
STORAGE_KEYS.SAVED_ITEMS = 'savedItems'
```

---

## Data Structure

### SavedItemEntry (inferred from usage across files)

```ts
interface SavedItemEntry {
  id: string               // crypto.randomUUID()
  text: string             // The saved text content
  category: SaveCategory   // Categorization (see below)
  pageTitle: string        // Source page title
  pageUrl: string          // Source page URL
  savedAt: string          // ISO 8601 timestamp
  note?: string            // User's personal note
  topic?: string           // Study topic
  difficulty?: string      // 'easy' | 'medium' | 'hard' | ''
  tags?: string[]          // User-defined tags
  status?: string          // 'new' | 'learning' | 'reviewing' | 'mastered' | 'fixed'
  skill?: string           // 'vocabulary' | 'grammar' | 'reading' | etc.
  personalNote?: string    // Alternative note field (used by MiniTutor)
}
```

### SaveCategory (from `apps/extension/src/types.ts:3`)

```ts
const SAVE_CATEGORIES = [
  'vocabulary', 'phrase', 'sentence', 'grammar',
  'reading', 'writing', 'speaking', 'mistake',
] as const
```

### Zod Entry Schema (from `apps/extension/src/types.ts:37`)

The canonical schema is `entrySchema`:

```ts
const entrySchema = z.object({
  id: z.string(),
  text: z.string().min(1),
  category: z.enum(SAVE_CATEGORIES),
  topic: z.string().default(''),
  skill: z.enum(SKILL_OPTIONS).default('general'),
  difficulty: z.enum(['easy', 'medium', 'hard', '']).default(''),
  tags: z.array(z.string()).default([]),
  personalNote: z.string().default(''),
  pageTitle: z.string().default(''),
  pageUrl: z.string().default(''),
  status: z.enum(['new', 'learning', 'reviewing', 'mastered', 'reviewing', 'fixed']).default('new'),
  createdAt: z.string(),
  updatedAt: z.string(),
})
```

---

## Storage Mechanism

### Primary Store: `chrome.storage.local`

All saved items are stored as a flat array in `chrome.storage.local`. This is the single source of truth for the extension's runtime operations.

**Writing** — the common pattern used across multiple content scripts and the popup:

```ts
chrome.storage.local.get(['savedItems'], (result) => {
  const items = result.savedItems || []
  items.unshift(newEntry)  // newest item first
  chrome.storage.local.set({ savedItems: items })
})
```

**Reading** — direct access in content scripts:

```ts
chrome.storage.local.get(['savedItems'], (result) => {
  const items = result.savedItems || []
  // ... use items
})
```

### Service Layer (`apps/extension/src/services/storage.ts`)

Wraps raw `chrome.storage.local` with typed helpers:

| Function | Signature | Description |
|----------|-----------|-------------|
| `getSavedItems<T>()` | `() => Promise<T[]>` | Returns all saved items (empty array if none) |
| `addSavedItem<T>(item)` | `(item: T) => Promise<void>` | Prepends item to saved items array |
| `storageGet(key)` | `(key: string) => Promise<T \| null>` | Generic get from chrome.storage.local |
| `storageSet(key, value)` | `(key: string, value: unknown) => Promise<void>` | Generic set to chrome.storage.local |

### Background Messaging (`apps/extension/src/background/messaging.ts`)

The background service worker handles `MINI_TUTOR_SAVE_RESULT` and `UPDATE_PROGRESS` messages:

- **`MINI_TUTOR_SAVE_RESULT`** — calls `addSavedItem()` to persist the item
- **`UPDATE_PROGRESS`** — updates the daily progress counters

Content scripts fire `UPDATE_PROGRESS` after saving (incrementing `wordsAdded` for vocabulary, `notesAdded` for mistakes).

### IndexedDB Sync via Storage Bridge (`apps/extension/src/background/storage-bridge.ts`)

A background service maintains a two-way sync between `chrome.storage.local` and IndexedDB.

**Sync direction:** `chrome.storage.local` → IndexedDB

On any change to keys `['savedItems', 'vocabulary', 'mistakes', 'articles']`, a debounced sync copies entries into IndexedDB object stores:

| chrome.storage.local key | IndexedDB store | Condition |
|--------------------------|-----------------|-----------|
| `savedItems` | `vocabulary` | if `category === 'vocabulary' \|\| category === 'phrase'` |
| `savedItems` | `mistakes` | if `category === 'mistake'` |
| `savedItems` | `learningEntries` | all others (`reading`, `writing`, `speaking`, `grammar`, `sentence`) |
| `vocabulary` | `vocabulary` | direct mapping |
| `mistakes` | `mistakes` | direct mapping |
| `articles` | `articles` | direct mapping |

IndexedDB stores use `id` as the key path.

**Reverse sync** (`syncToChromeStorage`): reads all entries from `learningEntries` store and merges them back into `savedItems` in chrome.storage.local.

---

## Save Points (where items are created)

| Location | File | Trigger |
|----------|------|---------|
| Content script — saveSelectedText | `saveSelectedText.ts:68` | `SAVE_SELECTION_FULL` message from toolbar/panel |
| Content script — floatingToolbar | `floatingToolbar.ts:315` | User clicks save action on toolbar |
| Content script — selectionPanel | `selectionPanel.ts:282` | User clicks save in selection panel |
| Popup — PopupDashboard | `PopupDashboard.tsx:244` | "Save Page" button |
| Popup — MiniTutor | `MiniTutor.tsx:244` | Save AI tutor result |
| Popup — MiniTutor | `MiniTutor.tsx:278` | Save vocabulary from AI tutor |
| Background — messaging | `messaging.ts:181` | `MINI_TUTOR_SAVE_RESULT` handler via `addSavedItem()` |

---

## Consumption Points (where items are read)

| Location | File | Purpose |
|----------|------|---------|
| Background — storage-bridge | `storage-bridge.ts:213` | Sync to IndexedDB |
| Content script — savedKeywordHighlighter | `savedKeywordHighlighter.ts:75` | Highlight saved words on page |
| Popup — PopupDashboard (recent items) | `PopupDashboard.tsx` | Display recent saves |
| Popup — MiniTutor | `MiniTutor.tsx` | Display saved items |

---

## Related Storage Keys

| Key | Type | Description |
|-----|------|-------------|
| `savedItems` | `Array` | Main saved items array |
| `dailyProgress` | `DailyProgress` | Daily counters (`wordsAdded`, `notesAdded`, `articlesSaved`, `reviewDue`, `streak`) |
| `vocabulary` | `Array` | Dedicated vocabulary list (older/parallel storage) |
| `mistakes` | `Array` | Dedicated mistakes list (older/parallel storage) |
| `articles` | `Array` | Saved articles list |
| `extension.syncStatus` | `SyncStatus` | IndexedDB sync tracking |
