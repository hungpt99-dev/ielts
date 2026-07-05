# IELTS Journey Chrome Extension — Issues & Risks Report

> Generated: 2026-07-05
> Source: Code inspection of all extension source files

---

## Severity Levels

| Level | Meaning |
|-------|---------|
| 🔴 Critical | Blocks core functionality, causes data loss, or crashes the extension |
| 🟠 High | Significantly degrades user experience or risks data integrity |
| 🟡 Medium | Notable quality issue, anti-pattern, or maintenance risk |
| ⚪ Low | Minor style, naming, or dead code issue |

---

## 🔴 Critical Issues

### C1. Duplicate `'reviewing'` in Zod `entrySchema` enum

**Location**: `src/types.ts:48`

```ts
status: z.enum(['new', 'learning', 'reviewing', 'mastered', 'reviewing', 'fixed']).default('new'),
```

The string `'reviewing'` appears **twice** in the enum. Zod schema enums reject duplicates at runtime — entries with this status will fail validation. The value `'fixed'` is also likely a mistake (it belongs to `MISTAKE_STATUS_OPTIONS`, not `LEARNING_STATUS_OPTIONS`).

**Impact**: Any `LearningEntry` with status `'reviewing'` may fail Zod validation, causing save operations to throw or silently discard data.

---

### C2. Hardcoded `localhost:5173` for web app URLs

**Location**: `src/popup/components/PopupDashboard.tsx:268,338`

```ts
// Line 268
chrome.tabs.create({ url: 'http://localhost:5173' })
// Line 338
onClick: () => chrome.tabs.create({ url: 'http://localhost:5173/public-api' }),
```

These URLs will **fail in production** when the web app is deployed to a real domain. Every user clicking "Open Dashboard" or "Public API" will get a connection error.

---

### C3. "Start Review" button is a no-op

**Location**: `src/popup/components/PopupDashboard.tsx:263-265`

```ts
const handleStartReview = useCallback(() => {
  showToast('info', 'Opening vocabulary review…')
}, [showToast])
```

Only shows a toast. No review flow exists — no navigation, no review UI, no spaced-repetition logic. The entire feature is a stub.

---

### C4. No vocabulary deduplication in storage bridge

**Location**: `src/background/storage-bridge.ts:184-197`

```ts
for (const entry of raw) {
  if (!entry || !entry.id) continue
  const storeName = mapEntryToStore(entry as Record<string, unknown>)
  await putInIDB(storeName, entryToSave)  // simple overwrite by id
}
```

The bridge performs a simple `store.put()` by ID. But when the same word is saved via:
1. **Popup** → saves to IndexedDB directly
2. **Content script** → saves to `chrome.storage.local` → bridge → IndexedDB

Each path generates a **different UUID** for the same word, creating duplicate entries. No content-based dedup exists anywhere.

---

### C5. Popup saves bypass `chrome.storage.local`

**Location**: `src/popup/components/SaveTextForm.tsx` (line 5 import, save call)

`SaveTextForm` calls `saveEntry()` from `src/storage/indexedDB.ts`, which writes only to IndexedDB. It does **not** write to `chrome.storage.local.savedItems`. This means:

- Content script features (selection panel, highlight re-scan, bridge client) **cannot see** popup-saved data
- The storage bridge syncs **chrome.storage.local → IndexedDB**, not the reverse for new saves
- Data is effectively siloed: popup → IndexedDB, content script → chrome.storage.local

---

### C6. Extension icons may be 1×1 transparent placeholders

**Location**: `manifest.json:9-11` — references `icons/icon-16.png`, `icon-48.png`, `icon-128.png`

The build script (`scripts/build.mjs`) was reported in the feature audit to generate placeholder icons. The extension toolbar icon will appear as a blank/invisible square.

---

## 🟠 High-Impact Issues

### H1. Saved word rows not clickable (no detail modal)

**Location**: `src/popup/components/SavedWordsView.tsx:169-241`

Every vocabulary row has `cursor: 'pointer'` (line 180) but **no `onClick` handler**. Clicking a word does nothing. Users cannot:
- View full word details (meaning, pronunciation, POS, forms, synonyms, examples)
- Edit or delete the word
- See AI-enriched data

---

### H2. Tailwind status badge classes won't resolve in extension context

**Location**: `src/popup/components/SavedWordsView.tsx:18-23,227`

```ts
const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  learning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  ...
}
```

Used at line 227:
```tsx
<span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[entry.status] || ''}`}>
```

The extension popup does not bundle Tailwind CSS. These class strings will be ignored, resulting in unstyled badges.

---

### H3. Triplicated AI config fetching logic

**Location (3 files)**:
- `src/popup/components/VocabularyCollector.tsx:40-55`
- `src/popup/components/ArticleCollector.tsx:17-32`
- `src/popup/components/VideoHelper.tsx:33-44`

Each component defines an identical `getAIProviderConfig()` function. Meanwhile, a shared version exists in `src/utils/safe-chrome.ts:114-143` (`safeFetchProviderConfig()`) but these components don't use it.

**Impact**: Maintenance burden + risk of config drift. 3 duplicate implementations to fix if the config schema changes.

---

### H4. No React error boundary in popup

**Location**: `src/popup/App.tsx:1-94`

No `<ErrorBoundary>` wraps the component tree. Any uncaught render error, thrown promise, or unexpected state will crash the entire popup — showing a white screen with no recovery option.

---

### H5. `reviewDue` counter is stale/inaccurate

**Location**: `src/popup/hooks/usePopupData.ts:37-39`

```ts
async function loadProgress(): Promise<DailyProgress> {
  const result = await safeStorageGet<any>('dailyProgress')
  return result.dailyProgress || DEFAULT_PROGRESS
}
```

`reviewDue` comes from `chrome.storage.local.dailyProgress`, but the actual review data lives in IndexedDB `vocabularyStore`. The count is only updated when `UPDATE_PROGRESS` is sent — it's never recalculated from the actual vocabulary store.

**Impact**: Users see stale or wrong pending review counts, eroding trust.

---

### H6. Highlighter only reads from `chrome.storage.local`, not IndexedDB

**Location**: `src/content-script/highlighter/savedKeywordHighlighter.ts:61-91`

```ts
const localResult = await new Promise<any>(r =>
  chrome.storage.local.get([VOCAB_STORAGE_KEY, SAVED_ITEMS_KEY], r),
)
```

The auto-highlighter reads vocabulary exclusively from `chrome.storage.local`. Vocabulary saved via the popup's `VocabularyCollector` (which writes to IndexedDB) will **never appear** in auto-highlights unless the storage bridge syncs it — and that sync is one-directional (chrome.storage → IndexedDB, not the reverse for vocab-specific saves).

---

## 🟡 Medium-Impact Issues

### M1. `sendResponse` called after `return false` (async pattern bug)

**Locations**: `src/content-script/saveSelectedText.ts:58,71,94,136`

```ts
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'SAVE_SELECTION') {
    // ...
    try { sendResponse({ success: true }) } catch { /* ignore */ }
    return false  // <-- closes the message channel
  }
```

`return false` tells Chrome the response channel is closed. If `sendResponse` is called **after** this return (e.g. after an async operation), the response is silently dropped. The same pattern exists in `selectionPanel.ts` line 523 and `miniTutor.ts`.

**Impact**: Callers may never receive a response from the content script, causing silent failures.

---

### M2. `onClose` callback in AI Explain is always null (dead code)

**Location**: `src/content-script/aiExplain.ts:34,184`

```ts
let onClose: (() => void) | null = null  // never assigned
// ...
if (onClose) onClose()  // never executes
```

The `onClose` variable is declared but never set by any caller. The code path is dead.

---

### M3. `setWordIds()` in highlight engine is unused

**Location**: `src/content-script/highlighter/highlightEngine.ts`

The function `setWordIds()` exists but is never called anywhere in the codebase. Dead exported utility.

---

### M4. Silent `.catch(() => {})` swallows content script errors

**Location**: `src/background/index.ts:109-111,127-129,141-143`

```ts
.catch(() => {
  // Content script not available on this tab — silently ignore
})
```

While some of these are legitimate (content script not injected on chrome:// pages), the pattern masks real errors like:
- `tabs.sendMessage` failing due to context invalidation during async operations
- Malformed message payloads
- Timeout errors on slow pages

---

### M5. `mouseup` listener may be registered multiple times

**Location**: `src/content-script/selectionPanel.ts:58,518`

```ts
async function init(): Promise<void> {
  // ...
  document.addEventListener('mouseup', onMouseUp)
  // ...
}
init().catch(...)
```

`init()` is called at module level. If the module is re-executed (HMR, or manifest reloads), `addEventListener` runs again, doubling event listeners. There's no guard like the `initialized` flag pattern used in other modules.

---

### M6. No AI rate limiting or debounce

**Locations** (all content script + popup AI callers):
- `VocabularyCollector.tsx` — each enrichment call
- `ArticleCollector.tsx` — question generation
- `VideoHelper.tsx` — transcript analysis
- `MiniTutor.tsx` — AI actions
- `selectionPanel.ts` — dictionary lookup
- `aiExplain.ts` — tab switching

Rapid tab switching in AI Explain panel, or repeated clicks on enrichment buttons, can fire **multiple concurrent API requests**. No queue, debounce, or abort controller pattern is used.

**Impact**: API rate limit errors, wasted tokens, confusing UX (results from stale requests overwriting newer ones).

---

### M7. Overlapping storage wrapper modules

**Locations**:
- `src/services/storage.ts` — `getDailyProgress()`, `updateDailyProgress()`, `addSavedItem()`, etc.
- `src/utils/safe-chrome.ts` — `safeStorageGet()`, `safeStorageSet()`, `safeSyncGet()`, etc.

Both provide wrappers around `chrome.storage.local`. `services/storage.ts` uses raw `chrome.storage.local.get()` with no error handling while `safe-chrome.ts` wraps with context invalidation checks. Some code uses one, some uses the other.

**Impact**: Inconsistent error handling. Code that uses `services/storage.ts` gets no context-invalidation protection.

---

### M8. Content script listeners never cleaned up (potential memory leak)

**Modules that add `chrome.runtime.onMessage` listeners at module level**:
- `saveSelectedText.ts` (line 54)
- `aiExplain.ts` (line 515)
- `videoHelper.ts` (line 226)
- `miniTutor.ts` (line ~130)
- `bridge-client.ts` (line 118 — has `destroyBridgeClient()` but it's never called)

Only `bridge-client.ts` provides a destroy function, but `content-script/index.ts` never calls it. None of the other modules provide cleanup. This matters when:
- The content script is long-lived (it is)
- The extension is reloaded/updated (new listeners added, old ones remain)
- The page navigates via SPA (same content script context persists)

---

### M9. DB_VERSION conflicts between storage modules

**Locations**:
- `src/storage/indexedDB.ts` — `DB_VERSION = 1`
- `src/storage/vocabularyStore.ts` — `DB_VERSION = 2`
- `src/background/storage-bridge.ts` — `DB_VERSION = 1`

Each module calls `indexedDB.open(DB_NAME, itsOwnVersion)`. The database name is the same (`'ielts-journey-extension'`). If one module's version is higher, `onupgradeneeded` fires again — but each module only creates **its own** stores, leaving others untouched. This works incidentally but is fragile:
- Storage bridge opens with version 1, which creates `learningEntries`, `vocabulary`, `articles`, `mistakes`, `videos` stores
- Vocabulary store opens with version 2, triggering `onupgradeneeded` again

---

### M10. No auth state handling in bridge client

**Location**: `src/content-script/bridge-client.ts`

The bridge forwards `postMessage` data between the web app and the extension background but never checks or communicates authentication state. There is no:
- Auth token validation
- Logged-in/logged-out state display in popup
- Graceful handling of expired sessions

---

### M11. Toast styling inconsistencies

**Locations**:
- `src/content-script/saveSelectedText.ts:30-31` — hardcoded `#2563eb` background
- `src/content-script/videoHelper.ts:52-53` — hardcoded `#0f172a` background

These toasts don't use CSS variables from `sharedStyles.ts`. They'll look out of place if the theme system is updated, and don't respect dark/light mode.

---

### M12. `viewArticleId` prop is dead parameter

**Location**: `src/popup/components/ArticleCollector.tsx:8`

```ts
interface ArticleCollectorProps {
  // ...
  viewArticleId?: string  // never used
}
```

The prop is defined in the interface but never read in the component body. It's also never passed by `App.tsx`.

---

### M13. Rapid re-highlight can cause flicker

**Location**: `src/content-script/highlighter/savedKeywordHighlighter.ts:158-166`

```ts
async function refreshHighlights(): Promise<void> {
  currentWords = await loadVocabulary()
  removeAllHighlights()
  // ... scanPage() after
}
```

Calling `removeAllHighlights()` followed by `scanPage()` for every storage change (and vocabulary change is debounced at 300ms per mutation but not per storage change) can cause visible flicker if multiple storage events fire in quick succession.

---

### M14. Video badge may duplicate on SPA navigation

**Location**: `src/content-script/videoHelper.ts:217-224`

```ts
const observer = new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href
    setTimeout(() => instance.init(), 1000)
  }
})
```

The URL change observer creates a new badge via `instance.init()` but the old badge's `removeBadge()` is called inside `createBadge()` only. If `init()` detects a non-video page and returns early, the old badge from a previous video page may remain.

---

### M15. `as any` / `as never` type escapes

**Locations**:
- `src/popup/components/MiniTutor.tsx:202` — `catch (err: any)` then accessing `err.message`
- `src/popup/components/BackupRestore.tsx` — `as never` casts on storage handlers
- `src/content-script/bridge-client.ts:12,79,87,102,108` — multiple `as Record<string, unknown>` casts

These bypass TypeScript's type system and can mask real type errors.

---

### M16. No offline detection or retry mechanism

AI calls (`VocabularyCollector`, `ArticleCollector`, `VideoHelper`, `MiniTutor`, `selectionPanel`, `aiExplain`) will fail with a generic error when the user is offline. There is no:
- `navigator.onLine` check before making API calls
- Retry button after network error detection
- Offline queue for deferred processing

---

## ⚪ Low-Impact Issues

### L1. Dead code — entire components/modules

**Unused components** (not imported anywhere):
- `src/popup/components/QuickAddVocab.tsx`
- `src/popup/components/MistakeNotebook.tsx`
- `src/popup/components/ChatButton.tsx`
- `src/content-script/floatingToolbar.ts` (434 lines — duplicate of `selectionPanel.ts`)
- `src/content-script/dictionaryPanel.ts` (469 lines — not imported)

### L2. Dead code — unused exports/variables

**Unused code paths**:
- `aiExplain.ts:34` — `onClose` variable (always null, never set)
- `highlightEngine.ts` — `setWordIds()` function never called
- `ArticleCollector.tsx` — `viewArticleId` prop never read
- `services/storage.ts` — `getSyncStatus()` and `markItemsSynced()` exist but are duplicated in `storage-bridge.ts`

### L3. Missing error state in popup dashboard

**Location**: `src/popup/hooks/usePopupData.ts:37-53`

If `loadProgress()` or `loadRecentEntries()` fail, the dashboard silently falls through to default/empty states with no error message or retry for the user.

---

## 🔍 Architectural Risks

### R1. Dual-write inconsistency

The extension has **two independent save paths**:

```
Popup → IndexedDB (vocabularyStore, indexedDB)
Content Script → chrome.storage.local → Storage Bridge → IndexedDB
```

Neither path is authoritative. The storage bridge only syncs **chrome.storage → IndexedDB**, meaning IndexedDB can have entries that don't exist in `chrome.storage.local` (and vice versa). Readers pick one source, leading to inconsistent views.

### R2. Multiple `openDB()` calls to shared database

At least 3 modules open the same IndexedDB database independently:
- `storage-bridge.ts`
- `indexedDB.ts` (learning entries)
- `vocabularyStore.ts`

Each has its own version number. Opening with a higher version triggers `onupgradeneeded` again, which could drop or recreate stores if not handled carefully.

### R3. No storage namespace isolation

`chrome.storage.local` is a flat key-value namespace. Keys like `vocabulary`, `savedItems`, `dailyProgress` are used across `services/storage.ts`, `storage-bridge.ts`, various content script modules, and the popup. There's no central registry of key names, and conflicts could silently overwrite data.

### R4. Content script initialization order is implicit

`content-script/index.ts` imports modules in a specific order, but the initialization of each module happens at import side-effect (module-level code). There's no coordination, no dependency management, and no lifecycle:

```ts
import './saveSelectedText'     // adds onMessage listener
import './selectionPanel'       // init() - adds DOM listeners
import './aiExplain'            // adds onMessage listener
import './videoHelper'          // creates observer, runs init()
import './miniTutor'            // adds onMessage listener
import './highlighter/savedKeywordHighlighter'  // init() - adds storage listener
```

### R5. Module-level side effects make testing difficult

Every content script module executes initialization code at import time. This means:
- Tests that import these modules trigger real chrome API calls
- Tests can't easily control initialization order
- Cleanup between tests is incomplete

---

## 📊 Priority Summary

| Priority | Count | Key Items |
|----------|-------|-----------|
| 🔴 Critical | 6 | Duplicate Zod enum, hardcoded localhost, no-op review, no dedup, popup save silo, missing icons |
| 🟠 High | 6 | Non-clickable words, broken badges, triplicated AI config, no error boundary, stale review counter, highlighter blind to IndexedDB |
| 🟡 Medium | 16 | sendResponse async bug, dead callbacks, unused functions, silent error catch, double listeners, no rate limiting, conflicting stores, memory leaks, etc. |
| ⚪ Low | 3 | Dead components, unused exports, missing error state |

---

## 🔧 Recommended Fix Order (by user impact)

1. **C1** — Fix Zod duplicate enum → unblocks all vocabulary save operations
2. **C4** + **C5** — Fix dual-write + dedup → stops data loss/duplication
3. **H2** — Fix Tailwind badges → visible words status
4. **H1** — Add word detail modal → core vocabulary UX
5. **C3** — Implement review flow (or remove the button)
6. **C2** — Fix hardcoded URLs → production broken links
7. **H4** — Add error boundary → prevent popup crashes
8. **H3** — Deduplicate AI config → reduce maintenance burden
9. **H6** — Make highlighter read from IndexedDB too
10. **M4** — Improve error logging → debug real issues
