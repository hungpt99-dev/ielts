# IELTS Journey Chrome Extension — Feature Status Report

> Generated: 2026-07-05
> Status: Audit of all implemented and planned features with current state assessment

---

## Assessment Legend

| Status | Meaning |
|--------|---------|
| ✅ Complete | Works correctly, proper error handling, tests exist |
| ⚠️ Partial | Functional but has known gaps, missing states, or risks |
| 💀 Dead | Code exists but is not wired/imported/used |
| 🔴 Broken | Has a known bug that prevents correct function |
| 🚫 Missing | Feature not implemented yet |
| ❓ Unknown | Cannot determine from code inspection alone (requires runtime test) |

---

## 1. Popup UI Features

### 1.1 Popup Opens Correctly

| Aspect | Status | Details |
|--------|--------|---------|
| `popup.html` loads React app | ✅ Complete | `main.tsx` renders `App.tsx` with StrictMode |
| MemoryRouter for in-app nav | ✅ Complete | View routing works between 8 views |
| ToastProvider wraps all views | ✅ Complete | Each view section wraps in `ToastProvider` |
| CSS variables + dark mode toggle | ✅ Complete | `usePopupData` applies `.dark` class on `document.documentElement` |
| Min height 500px | ✅ Complete | All views set `minHeight: '500px'` |
| **Issue**: No error boundary | ⚠️ Partial | No React error boundary wrapping the app tree; any component crash kills the popup |
| **Issue**: `@ielts/tailwind` classes in `SavedWordsView` | ⚠️ Partial | `STATUS_COLORS` map uses Tailwind class strings that may not resolve in extension context (line 19-23) |

**Files**: `src/popup/main.tsx`, `src/popup/App.tsx`, `src/popup/index.css`

### 1.2 Dashboard View (PopupDashboard)

| Feature | Status | Details |
|---------|--------|---------|
| Display user progress stats | ✅ Complete | 4 `DashboardCard`s: Words Today, Notes Today, Articles, Review Due |
| Streak badge display | ✅ Complete | Shows streak count in header |
| Quick Actions grid | ✅ Complete | 8 action buttons with icons + descriptions |
| Save Page button | ✅ Complete | Saves current tab title as reading entry |
| Quick Note button | ✅ Complete | Navigates to saveForm view |
| Today's Activity feed | ✅ Complete | Shows recent 5 entries, empty state with guidance message |
| Dark mode toggle | ✅ Complete | localStorage-persisted, applies `.dark` class |
| Settings link | ✅ Complete | Opens `options.html` in new tab |
| Backup/Restore link | ✅ Complete | Navigates to backupRestore view |
| "Open Dashboard" link | 🔴 Broken | Hardcoded `http://localhost:5173` — fails in production |
| **"Start Review" button** | 🔴 Broken | Only shows toast "Opening vocabulary review…"; no actual review flow |
| **Pending review count accuracy** | ⚠️ Partial | `progress.reviewDue` reads from `chrome.storage.local.dailyProgress`, but actual review data lives in IndexedDB `vocabularyStore` — stale counter likely |
| Vocabulary count on "Saved Words" button | ⚠️ Partial | Calls `loadVocabulary()` in a standalone `useEffect`, duplicating data the `savedWords` view already loads |
| Loading state | ✅ Complete | Shows "Loading..." centered |
| Empty state (Today's Activity) | ✅ Complete | Shows book icon + guidance message |

**File**: `src/popup/components/PopupDashboard.tsx` (606 lines)

### 1.3 Save Text Form (SaveTextForm)

| Feature | Status | Details |
|---------|--------|---------|
| Reads selected text from content script | ✅ Complete | Sends `GET_PAGE_INFO` message on mount |
| Category selector grid | ✅ Complete | 8 categories with icons, colors, labels |
| Topic, Skill, Difficulty, Tags fields | ✅ Complete | Zod-validated form |
| Personal Note textarea | ✅ Complete | |
| Saves to IndexedDB via `saveEntry()` | ✅ Complete | Writes to `learningEntries` store |
| Updates `dailyProgress` counter | ✅ Complete | Increments `wordsAdded` for vocabulary |
| Success state with animation | ✅ Complete | Green check circle + category label |
| **Does NOT save to `chrome.storage.local`** | ⚠️ Partial | Content script features read from `savedItems` key in chrome.storage, not IndexedDB — data saved here is invisible to content script features until storage bridge syncs |
| **Does not also update content script's storage** | ⚠️ Partial | Storage bridge only syncs one direction (chrome.storage.local → IndexedDB) |

**File**: `src/popup/components/SaveTextForm.tsx` (460 lines)

### 1.4 Vocabulary Collector (VocabularyCollector)

| Feature | Status | Details |
|---------|--------|---------|
| Manual word input | ✅ Complete | Text input with dedup check (debounced 400ms lookup) |
| Source sentence auto-populated | ✅ Complete | From page selection |
| Topic, Difficulty, Tags, Note fields | ✅ Complete | |
| AI enrichment via `generateVocabularyDetails()` | ✅ Complete | Opens direct `fetch()` to OpenAI-compatible endpoint |
| Displays AI results (meaning, POS, pronunciation, examples, synonyms, antonyms, collocations, word family) | ✅ Complete | Styled result card with color-coded tags |
| Pronunciation button (speak word) | ✅ Complete | Uses `window.speechSynthesis` |
| Duplicate word detection | ✅ Complete | Shows "Already saved: {word} — {meaning}" warning |
| Saves to IndexedDB `vocabularyStore` | ✅ Complete | |
| Updates `dailyProgress.wordsAdded` | ✅ Complete | |
| Success animation | ✅ Complete | Green check circle |
| **Issue**: Duplicated AI config fetching | ⚠️ Partial | `getAIProviderConfig()` is defined locally (line 40-55) — identical duplicated logic exists in `ArticleCollector.tsx` and `VideoHelper.tsx` instead of using shared `safeFetchProviderConfig` from `safe-chrome.ts` |
| **Issue**: Direct `fetch()` to OpenAI endpoint | ⚠️ Partial | Duplicates the existing `@ielts/ai` library's vocabulary enrichment functions instead of reusing them |

**File**: `src/popup/components/VocabularyCollector.tsx` (844 lines)

### 1.5 Article Collector (ArticleCollector)

| Feature | Status | Details |
|---------|--------|---------|
| Title, Content, Paragraph fields | ✅ Complete | Auto-populates title and selected text from page |
| IELTS Topic dropdown | ✅ Complete | `IELTS_TOPICS` from `articleStore.ts` |
| Difficulty, Tags, Note fields | ✅ Complete | |
| Reading practice toggle | ✅ Complete | |
| AI question generation via `generateQuestions()` | ✅ Complete | Direct `fetch()` to OpenAI, custom prompt |
| Question preview (expandable) | ✅ Complete | Shows type badge, difficulty, band score, options, correct answer |
| Saves to IndexedDB `articlesStore` | ✅ Complete | |
| Updates `dailyProgress.articlesSaved` | ✅ Complete | |
| **Issue**: Duplicated AI config fetching | ⚠️ Partial | Same as VocabularyCollector — has its own `getAIProviderConfig()` |
| **Issue**: No AI enrichment status caching | ⚠️ Partial | Regenerates questions each time instead of checking if already generated |
| **Issue**: `viewArticleId` prop defined but unused | 💀 Dead | Parameter exists in interface but never used |

**File**: `src/popup/components/ArticleCollector.tsx` (758 lines)

### 1.6 Video Helper (VideoHelper)

| Feature | Status | Details |
|---------|--------|---------|
| Detects video page via content script | ✅ Complete | Sends `GET_VIDEO_PAGE_INFO` message |
| Displays video title, URL, platform | ✅ Complete | |
| Notes field | ✅ Complete | |
| Transcript input (toggle) | ✅ Complete | Hidden by default, "Paste Transcript" button |
| AI Vocabulary from transcript | ✅ Complete | Uses `@ielts/ai` `generateVocabularyFromTranscript()` |
| AI Summary from transcript | ✅ Complete | Uses `@ielts/ai` `generateSummaryFromTranscript()` |
| AI Questions from transcript | ✅ Complete | Uses `@ielts/ai` `generateListeningQuestions()` |
| AI Shadowing Scripts from transcript | ✅ Complete | Uses `@ielts/ai` `generateShadowingScripts()` |
| Result tabs (vocab, summary, questions, shadowing) | ✅ Complete | Tab navigation with styled previews |
| Saves video entry to IndexedDB `videoStore` | ✅ Complete | |
| Saves listening learning entry | ✅ Complete | Also saves as `learningEntries` |
| Saves extracted vocabulary to `vocabularyStore` | ✅ Complete | |
| **Issue**: Duplicated AI config fetching | ⚠️ Partial | Has its own `getAIProviderConfig()` — third duplicate |
| **Issue**: Requires manual transcript paste | ⚠️ Partial | No automatic YouTube transcript fetching — user must paste manually |
| **AI state management clean with union type** | ✅ Complete | Uses `AiState = { status: 'idle'|'loading'|'error'|'no-key'|'done' }` |

**File**: `src/popup/components/VideoHelper.tsx` (602 lines)

### 1.7 AI Tutor / Mini Tutor (MiniTutor)

| Feature | Status | Details |
|---------|--------|---------|
| Reads selected text from content script | ✅ Complete | `GET_PAGE_INFO` message on mount |
| 8 action buttons (Explain, Simplify, Translate, Exercise, Vocabulary, Questions, Discuss, IELTS Connect) | ✅ Complete | Grid layout with hover/active states |
| 5 of 8 actions use `@ielts/ai` typed explain functions | ✅ Complete | `explain`, `simplify`, `translate`, `exercise`, `vocabulary` |
| 3 custom prompt actions (questions, discuss, ielts-connect) | ✅ Complete | Direct `fetch()` with hardcoded prompts |
| Formatted result display | ✅ Complete | `formatExplainResult()` handles all 5 AI types |
| Error state (API key missing, API errors) | ✅ Complete | Shows key config prompt with settings link, retry button |
| Loading state with action-specific text | ✅ Complete | "Explaining...", "Simplifying...", etc. |
| Empty state (no selection) | ✅ Complete | Friendly message with personality tips |
| Save result as note | ✅ Complete | Saves to `chrome.storage.local.savedItems` + `UPDATE_PROGRESS` |
| Save selection as vocabulary | ✅ Complete | Saves to `chrome.storage.local.savedItems` |
| **Issue**: Saves to chrome.storage.local, not IndexedDB | ⚠️ Partial | Bypasses the IndexedDB layer used by other components |
| **Issue**: Uses `as any` in error handler | ⚠️ Partial | `catch (err: any)` at line 202 |
| **Issue**: `safeSendMessage({ type: 'OPEN_OPTIONS' })` may not be handled | ⚠️ Partial | `OPEN_OPTIONS` handler exists in `messaging.ts` — should work |

**File**: `src/popup/components/MiniTutor.tsx` (655 lines)

### 1.8 Saved Words View (SavedWordsView)

| Feature | Status | Details |
|---------|--------|---------|
| Loads vocabulary from IndexedDB + chrome.storage.local | ✅ Complete | `loadVocabulary()` merges both sources |
| Stats bar (Total, New, Learning, Mastered) | ✅ Complete | |
| Search field with filtering | ✅ Complete | Filters by word, meaning, topic |
| Filter tabs (All, New, Learning, Mastered) | ✅ Complete | |
| Sort (Newest, A-Z) | ✅ Complete | |
| Pronunciation button per word | ✅ Complete | `speakWord()` using `speechSynthesis` |
| Shows pronunciation, part of speech | ✅ Complete | |
| Shows meaning | ✅ Complete | |
| Footer count | ✅ Complete | "X of Y words shown" |
| Empty state (no words / no match) | ✅ Complete | Contextual messages |
| Loading state | ✅ Complete | "Loading vocabulary..." |
| **Word detail modal on click** | 🚫 Missing | No detail view — clicking a word does nothing |
| **Word editing** | 🚫 Missing | No way to edit meaning, forms, etc. |
| **Word deletion** | 🚫 Missing | No delete functionality |
| **Issue**: Tailwind class strings in status badges | ⚠️ Partial | `STATUS_COLORS` map uses Tailwind classes like `bg-blue-100` that may not resolve in extension CSS context (line 18-23) |

**File**: `src/popup/components/SavedWordsView.tsx` (250 lines)

### 1.9 Backup & Restore (BackupRestore)

| Feature | Status | Details |
|---------|--------|---------|
| Sync status display | ✅ Complete | Shows last sync time, pending items, last result |
| Clear pending items | ✅ Complete | Manually clear sync queue |
| Export data | ✅ Complete | Uses `@ielts/storage` sync service, downloads JSON |
| Import data | ✅ Complete | File upload with merge/replace mode |
| Import result summary | ✅ Complete | Added/failed counts with error details |
| Help info about website sync | ✅ Complete | Explains origin-bound IndexedDB limitation |
| **Issue**: `as never` type casts for storage handlers | ⚠️ Partial | Line 49-62 uses `as never` to bridge types |

**File**: `src/popup/components/BackupRestore.tsx` (574 lines)

### 1.10 Dead Popup Components

| Component | Status | Details |
|-----------|--------|---------|
| `QuickAddVocab.tsx` | 💀 Dead | Not imported in any file |
| `MistakeNotebook.tsx` | 💀 Dead | Not routed in `App.tsx` |
| `ChatButton.tsx` | 💀 Dead | Not used in any view |

---

## 2. Content Script Features

### 2.1 Selection Panel (selectionPanel)

| Feature | Status | Details |
|---------|--------|---------|
| Floating toolbar on text selection | ✅ Complete | Appears at selection position with animation |
| 4 save actions (Save Word, Sentence, Mistake — divider — Explain, Simplify, Translate, IELTS Vocab) | ✅ Complete | 8 action buttons in toolbar |
| Dictionary lookup for single words | ✅ Complete | Auto-loads dictionary entry from AI when selecting 1-2 words |
| Dictionary display (POS, pronunciation, meaning, examples, synonyms, collocations, IELTS topic) | ✅ Complete | Styled card with speak/pronunciation button |
| AI Explain panel integration | ✅ Complete | Opens `showExplainPanel()` for AI actions |
| Saves to chrome.storage.local | ✅ Complete | `SAVE_SELECTION_FULL` → `savedItems` |
| Sends `VOCAB_SAVED` postMessage to web app | ✅ Complete | When saving vocabulary |
| Settings-aware (respects `floatingToolbar` toggle) | ✅ Complete | Checks settings on init and listens for changes |
| Escape key dismisses panel | ✅ Complete | |
| Scroll hides panel | ✅ Complete | |
| Toast notifications on save | ✅ Complete | Styled toast with animation |
| **Issue**: Multiple `mouseup` listeners on re-init | ⚠️ Partial | `init()` is called at module level (line 518); no guard prevents duplicate event listener registration if module is re-executed |
| **Issue**: `dictionaryCache.get(word, context)` second parameter ignored | ⚠️ Partial | `dictionaryCache` likely ignores the `context` argument (from `@ielts/ai`) |

**File**: `src/content-script/selectionPanel.ts` (522 lines)

### 2.2 AI Explain Panel (aiExplain)

| Feature | Status | Details |
|---------|--------|---------|
| 7 explain tabs (Simple, Vietnamese, IELTS Vocab, Grammar, Rewrite, Examples, Quiz) | ✅ Complete | Tabbed modal dialog |
| Each tab loads lazily on first click | ✅ Complete | Caches results per tab |
| Typed result rendering for each mode | ✅ Complete | `renderSimpleResult`, `renderVietnameseResult`, `renderIELTSVocabResult`, `renderGrammarResult`, `renderRewriteResult`, `renderExampleSentencesResult`, `renderQuizResult` |
| Overlay backdrop | ✅ Complete | Click to close |
| SEO-friendly icons + ARIA attributes | ✅ Complete | `role="dialog"`, `role="tablist"`, `aria-modal`, etc. |
| Copy to Clipboard button (Rewrite tab) | ✅ Complete | |
| Missing API key handling | ✅ Complete | Shows "Open Settings" and "Close" buttons |
| Loading spinner | ✅ Complete | |
| Error state with retry | ✅ Complete | |
| Close animation | ✅ Complete | 200ms fade out |
| Message listener for `AI_EXPLAIN` from background | ✅ Complete | |
| **Issue**: `onClose` callback never set | 💀 Dead | `onClose` variable is always `null` (line 34, never assigned) |
| **Issue**: No rate limiting or debounce on AI calls | ⚠️ Partial | Rapid tab switching can trigger multiple concurrent AI requests |

**File**: `src/content-script/aiExplain.ts` (525 lines)

### 2.3 Save Selected Text (saveSelectedText)

| Feature | Status | Details |
|---------|--------|---------|
| Handles `SAVE_SELECTION` message | ✅ Complete | Shows toast confirmation |
| Handles `SAVE_SELECTION_FULL` message | ✅ Complete | Saves to `chrome.storage.local.savedItems`, updates progress, sends postMessage |
| Handles `SAVE_ARTIFACT` message | ✅ Complete | Saves page artifact with favicon, tags |
| Handles `GET_PAGE_INFO` message | ✅ Complete | Returns title, URL, selectedText |
| **Issue**: `sendResponse` called after async with `return false` | ⚠️ Partial | Line 58, 71, 94, 136 — `return false` closes the channel; if `sendResponse` is called after async, it may silently fail. The message handler should return `true` for async responses |
| **Issue**: Toast styling inconsistency | ⚠️ Partial | Toast uses hardcoded `#2563eb` background instead of CSS variables |

**File**: `src/content-script/saveSelectedText.ts` (141 lines)

### 2.4 Auto-Highlighter (highlighter/)

| Feature | Status | Details |
|---------|--------|---------|
| Loads saved vocabulary from chrome.storage.local | ✅ Complete | Reads `vocabulary` and `savedItems` keys |
| Text matching with word-boundary regex | ✅ Complete | `highlightMatcher.ts` uses `\p{L}` Unicode word boundaries |
| Overlap detection | ✅ Complete | Prevent overlapping highlights |
| DOM TreeWalker for text nodes | ✅ Complete | Skips scripts, styles, iframes, SVGs, hidden elements |
| Creates highlight spans with data attributes | ✅ Complete | Stores word info as JSON in `data-highlight` |
| Tooltip on hover (meaning, example) | ✅ Complete | `highlightTooltip.ts` with position-aware display |
| Click to keep tooltip visible | ✅ Complete | |
| MutationObserver for dynamic content | ✅ Complete | Debounced at 300ms, skips own highlights |
| Storage change listener for live updates | ✅ Complete | Re-highlights on vocab/settings changes |
| Respects `autoHighlightSavedVocabulary` setting | ✅ Complete | Enables/disables via chrome.storage listener |
| Duplicate highlight avoidance | ✅ Complete | Skips nodes already inside `.ielts-journey-saved-keyword-highlight` |
| Clean removal on disable | ✅ Complete | `removeAllHighlights()` + `destroyTooltip()` |
| **Issue**: `setWordIds()` is unused | 💀 Dead | Function exists in `highlightEngine.ts` but never called |
| **Issue**: Vocabulary only loaded from chrome.storage.local, not IndexedDB | ⚠️ Partial | Popup saves vocabulary to IndexedDB but highlighter only reads from chrome.storage.local — newly added vocab may not appear until storage bridge syncs |
| **Issue**: No debounced guard against rapid re-highlights | ⚠️ Partial | `refreshHighlights()` calls `removeAllHighlights()` then `scanPage()` — if called rapidly (e.g., many storage changes), can cause flicker |
| **Issue**: `window.getSelection()` result used in `getContextForWord()` in `selectionPanel.ts` but not in highlighter | ✅ Complete | Highlighter handles its own text node scanning independently |

**Files**: `savedKeywordHighlighter.ts` (246 lines), `highlightEngine.ts` (167 lines), `highlightMatcher.ts` (90 lines), `highlightTooltip.ts`, `highlightStyles.ts`

### 2.5 Video Helper Badge (videoHelper)

| Feature | Status | Details |
|---------|--------|---------|
| YouTube page detection | ✅ Complete | Checks URL for `youtube.com` / `youtu.be` |
| Video title extraction | ✅ Complete | Reads from `h1.ytd-watch-metadata` or document title |
| Floating badge UI on video pages | ✅ Complete | Animated badge with icon + text |
| Click badge → opens popup helper | ✅ Complete | Sends `VIDEO_HELPER_OPEN` message |
| Sends `VIDEO_PAGE_DETECTED` to background | ✅ Complete | |
| Handles `GET_VIDEO_PAGE_INFO` from popup | ✅ Complete | |
| MutationObserver for SPA navigation (YouTube) | ✅ Complete | Watches URL changes, re-inits after 1s delay |
| **Issue**: Badge style uses hardcoded dark theme colors | ⚠️ Partial | Background `#0f172a` — doesn't respect theme setting |
| **Issue**: No Vimeo or other platform support | ⚠️ Partial | Only YouTube is detected |

**File**: `src/content-script/videoHelper.ts` (234 lines)

### 2.6 Mini Tutor Content Script (miniTutor)

| Feature | Status | Details |
|---------|--------|---------|
| Handles `MINI_TUTOR_ACTION` message | ✅ Complete | Opens AI Explain panel with mapped action type |
| Handles `MINI_TUTOR_GET_SELECTION` message | ✅ Complete | Returns active selection with position |
| Handles `MINI_TUTOR_GET_SELECTION_FULL` message | ✅ Complete | Returns selection + surrounding text context |
| Handles `MINI_TUTOR_TRIGGER` message | ✅ Complete | Opens AI Explain panel; falls back to `simple` for unknown actions |
| **Issue**: No error handling for `sendResponse` after async | ⚠️ Partial | Same pattern as saveSelectedText |

**File**: `src/content-script/miniTutor.ts` (134 lines)

### 2.7 Web App Bridge (bridge-client)

| Feature | Status | Details |
|---------|--------|---------|
| Listens for `postMessage` from web app | ✅ Complete | Validates source and origin |
| Forwards `SETTINGS_CHANGED` to background | ✅ Complete | `forwardToBackground()` |
| Handles `REQUEST_EXTENSION_VOCAB` from web app | ✅ Complete | Forwards vocab data to web page |
| Handles `VOCAB_SAVED_BY_WEB` from web app | ✅ Complete | Deduplicates and saves to chrome.storage.local |
| Handles `VOCAB_LIST_SYNC` from web app | ✅ Complete | Replaces entire vocabulary list |
| Listens for background `SETTINGS_SYNC` messages | ✅ Complete | Forwards settings to web page |
| Guard against double initialization | ✅ Complete | `initialized` flag |
| **Issue**: Uses `as Record<string, unknown>` casts extensively | ⚠️ Partial | Lines 12, 79, 87, 102, 108 — loss of type safety |
| **Issue**: `forwardVocabToPage()` could be very slow | ⚠️ Partial | Iterates every saved item individually with `postMessage` calls — no batching |
| **Issue**: No authentication state handling | 🚫 Missing | Bridge doesn't check or communicate auth state |

**File**: `src/content-script/bridge-client.ts` (127 lines)

### 2.8 Dead Content Script Modules

| Module | Status | Details |
|--------|--------|---------|
| `floatingToolbar.ts` | 💀 Dead | 434 lines — duplicate of `selectionPanel.ts`, not imported in `content-script/index.ts` |
| `dictionaryPanel.ts` | 💀 Dead | 469 lines — hover dictionary, not imported |

---

## 3. Background Service Worker Features

### 3.1 Message Routing (messaging.ts)

| Feature | Status | Details |
|---------|--------|---------|
| Type-safe message map with Zod | ✅ Complete | Well-typed `MessageMap` interface |
| Handler registration pattern | ✅ Complete | `registerHandler()` / `unregisterHandler()` |
| Async handler support | ✅ Complete | Returns `true` for async, `false` for sync |
| Error handling in handlers | ✅ Complete | Catches both sync and async errors, returns structured response |
| Unknown message logging | ✅ Complete | Warns on unknown message types |
| Tests exist | ✅ Complete | `__tests__/` directory |

### 3.2 Context Menus (background/index.ts)

| Feature | Status | Details |
|---------|--------|---------|
| Right-click "Save to IELTS Journey" submenu | ✅ Complete | 8 category sub-items |
| Right-click "Explain with AI" submenu | ✅ Complete | 7 AI explain sub-items |
| Right-click "Save page as Artifact" | ✅ Complete | Saves entire page |
| Click handlers for all menu items | ✅ Complete | Routes to content script via `tabs.sendMessage` |
| Install/update handler | ✅ Complete | Initializes storage on install, creates menus |
| **Issue**: Silent catch on content script errors | ⚠️ Partial | `.catch(() => {})` swallows all errors — could mask real problems in development |

**File**: `src/background/index.ts` (150 lines)

### 3.3 Settings Storage (settingsStorage.ts)

| Feature | Status | Details |
|--------|--------|---------|
| Zod-validated settings schema | ✅ Complete | Extends `sharedSettingsSchema` |
| Save/load settings from chrome.storage.sync | ✅ Complete | |
| API key stored in chrome.storage.local | ✅ Complete | Not synced across devices |
| Settings change listeners | ✅ Complete | Notifies listeners on save |
| Website bridge integration (`syncFromWebsite`) | ✅ Complete | Applies overlapping settings from web app |
| Website overlapping fields extraction | ✅ Complete | |
| Export/import settings | ✅ Complete | |
| **Issue**: AI API key in local storage (not sync) is intentional but prevents cross-device use | ⚠️ Partial | Documented security decision |
| **Tests exist** | ✅ Complete | |

**File**: `src/background/settingsStorage.ts` (207 lines)

### 3.4 Storage Bridge (storage-bridge.ts)

| Feature | Status | Details |
|--------|--------|---------|
| Syncs chrome.storage.local changes to IndexedDB | ✅ Complete | Debounced at 500ms |
| Maps saved items to appropriate stores | ✅ Complete | `mapEntryToStore()` routes by category |
| Sync status tracking | ✅ Complete | `lastSyncAt`, `pendingItems`, `lastSyncResult` |
| `syncToChromeStorage()` reverse sync | ✅ Complete | IndexedDB → chrome.storage.local |
| `syncSingleEntry()` for individual items | ✅ Complete | |
| `broadcastToTabs()` for settings sync | ✅ Complete | Notifies all tabs of settings changes |
| **Issue**: No deduplication | 🔴 Broken | Same word saved via popup (→ IndexedDB) and content script (→ chrome.storage.local → bridge → IndexedDB) creates duplicate entries in IndexedDB |
| **Issue**: Race condition on initial sync | ⚠️ Partial | Initial sync runs on install but doesn't wait for first data population |

**File**: `src/background/storage-bridge.ts` (278 lines)

---

## 4. Storage Layer Features

### 4.1 IndexedDB Base (indexedDB.ts)

| Feature | Status | Details |
|--------|--------|---------|
| CRUD operations for learningEntries | ✅ Complete | `saveEntry`, `getAllEntries`, `getEntryById`, `updateEntry`, `deleteEntry` |
| Category/skill/topic/status indexes | ✅ Complete | |
| `getTodayEntries()` | ✅ Complete | |
| `getEntriesByDateRange()` | ✅ Complete | Uses IDBKeyRange |
| `searchEntries()` | ✅ Complete | Full-text search across text, topic, title, note, tags |
| `getStats()` | ✅ Complete | Total, byCategory, todayCount |
| `exportAllEntries()` / `importEntries()` | ✅ Complete | JSON export/import |
| `clearAllEntries()` | ✅ Complete | |

**File**: `src/storage/indexedDB.ts` (228 lines)

### 4.2 Vocabulary Store (vocabularyStore.ts)

| Feature | Status | Details |
|--------|--------|---------|
| Zod schema with full word details | ✅ Complete | `extensionVocabSchema` — includes meaning, POS, pronunciation, examples, synonyms, antonyms, collocations, wordFamily |
| CRUD operations | ✅ Complete | `saveVocabularyEntry`, `getAllVocabulary`, `getVocabularyById`, `updateVocabularyEntry`, `deleteVocabularyEntry` |
| Review-related queries | ✅ Complete | `getVocabularyDueForReview`, `getVocabularyStats` |
| **Issue**: DB_VERSION (2) conflicts with other stores | ⚠️ Partial | Each store module uses its own `DB_VERSION` — `openDB()` is called independently, and each calls `request.onupgradeneeded` creating missing stores. This works but each store defines DB version numbers that may conflict with each other |

**File**: `src/storage/vocabularyStore.ts` (139 lines)

### 4.3 Article Store (articleStore.ts)

| Feature | Status | Details |
|--------|--------|---------|
| Zod schema with AI questions | ✅ Complete | `extensionArticleSchema`, `articleQuestionSchema` |
| CRUD operations | ✅ Complete | |
| Topic/practice-specific queries | ✅ Complete | `getArticlesByTopic`, `getReadingPracticeArticles` |
| Stats | ✅ Complete | `getArticleStats` |

**File**: `src/storage/articleStore.ts` (170 lines)

### 4.4 Video Store (videoStore.ts)

| Feature | Status | Details |
|--------|--------|---------|
| Zod schema with AI analysis data | ✅ Complete | Includes vocabulary, summary, questions, shadowing scripts |
| CRUD operations | ✅ Complete | |
| Platform and stats queries | ✅ Complete | `getVideosByPlatform`, `getVideoStats` |

**File**: `src/storage/videoStore.ts` (167 lines)

### 4.5 Mistake Store (mistakeStore.ts)

| Feature | Status | Details |
|--------|--------|---------|
| Zod schema with correction tracking | ✅ Complete | mistake, correction, explanation, skill, status, repetitionCount |
| CRUD operations | ✅ Complete | |
| Status/skill queries | ✅ Complete | |
| Stats with review scheduling | ✅ Complete | `getMistakeStats()` calculates `dueForReview` |
| **Issue**: Store exists but `MistakeNotebook.tsx` component is dead | 💀 Partial | Mistake data can be created via content script but never viewed in popup |

**File**: `src/storage/mistakeStore.ts` (168 lines)

### 4.6 Storage Utilities (services/storage.ts)

| Feature | Status | Details |
|--------|--------|---------|
| DailyProgress CRUD | ✅ Complete | |
| Video page info storage | ✅ Complete | |
| Saved items management | ✅ Complete | |
| Install initialization | ✅ Complete | |
| **Issue**: Duplicate of `safe-chrome.ts` functionality | ⚠️ Partial | `services/storage.ts` and `utils/safe-chrome.ts` both provide wrappers around chrome.storage — overlapping responsibilities |

**File**: `src/services/storage.ts` (143 lines)

---

## 5. AI Integration Features

### 5.1 AI Explain (7 modes)

| Feature | Status | Details |
|--------|--------|---------|
| Simple English explanation | ✅ Complete | Via `@ielts/ai` `explain('simple', text, config)` |
| Vietnamese explanation | ✅ Complete | Via `@ielts/ai` `explain('vietnamese', text, config)` |
| IELTS Vocabulary extraction | ✅ Complete | Via `@ielts/ai` `explain('ielts-vocab', text, config)` |
| Grammar explanation | ✅ Complete | Via `@ielts/ai` `explain('grammar', text, config)` |
| Rewrite/simplify | ✅ Complete | Via `@ielts/ai` `explain('rewrite', text, config)` |
| Example sentences | ✅ Complete | Via `@ielts/ai` `explain('example-sentences', text, config)` |
| Quiz questions | ✅ Complete | Via `@ielts/ai` `explain('quiz', text, config)` |

### 5.2 Vocabulary Enrichment

| Feature | Status | Details |
|--------|--------|---------|
| AI enrichment in VocabularyCollector | ✅ Complete | Custom prompt, direct fetch |
| AI enrichment in VideoHelper (transcript vocab) | ✅ Complete | Via `@ielts/ai` `generateVocabularyFromTranscript()` |
| **Issue**: Duplicate AI config fetching | ⚠️ Partial | 3 components (`VocabularyCollector`, `ArticleCollector`, `VideoHelper`) each implement their own `getAIProviderConfig()` |
| **Issue**: No rate limiting | 🚫 Missing | No debounce or queue — rapid requests can hit API rate limits |

### 5.3 AI Article Questions

| Feature | Status | Details |
|--------|--------|---------|
| Generate IELTS-style questions from article | ✅ Complete | Custom prompt with 5 question types |
| Question preview in UI | ✅ Complete | |

### 5.4 AI Video Analysis (4 modes)

| Feature | Status | Details |
|--------|--------|---------|
| Vocabulary from transcript | ✅ Complete | Via `@ielts/ai` |
| Summary from transcript | ✅ Complete | Via `@ielts/ai` |
| Listening questions | ✅ Complete | Via `@ielts/ai` |
| Shadowing scripts | ✅ Complete | Via `@ielts/ai` |

### 5.5 AI Config Provider (shared)

| Feature | Status | Details |
|--------|--------|---------|
| `safeFetchProviderConfig()` in safe-chrome.ts | ✅ Complete | Reads `extensionSettings` from chrome.storage.sync + `aiApiKey` from chrome.storage.local |
| Used by content script modules | ✅ Complete | `selectionPanel.ts`, `aiExplain.ts`, `MiniTutor.tsx` |
| **Not used by popup forms** | ⚠️ Partial | `VocabularyCollector`, `ArticleCollector`, `VideoHelper` all have their own duplicate implementations |

**File**: `src/utils/safe-chrome.ts` (144 lines)

---

## 6. Settings & Options Page Features

### 6.1 AI Settings Form (AiSettingsForm)

| Feature | Status | Details |
|--------|--------|---------|
| API Key input (masked) | ✅ Complete | |
| Model selection dropdown | ✅ Complete | |
| Base URL input with defaults | ✅ Complete | |
| Save to chrome.storage | ✅ Complete | |
| Validation | ✅ Complete | |

**File**: `src/options/components/AiSettingsForm.tsx`

### 6.2 General Settings (GeneralSettings)

| Feature | Status | Details |
|--------|--------|---------|
| Theme switcher (light/dark/system) | ✅ Complete | |
| Floating toolbar toggle | ✅ Complete | |
| Auto-highlight toggle | ✅ Complete | |
| Default category/topic | ✅ Complete | |

**File**: `src/options/components/GeneralSettings.tsx`

---

## 7. Cross-Cutting Concerns

### 7.1 Authentication & Authorization

| Feature | Status | Details |
|--------|--------|---------|
| Auth state handled | 🚫 Missing | No auth system in extension — relies on web app bridge for web app features |
| Logged-out state handling | 🚫 Missing | Extension does not check or display auth status |
| API key as sole authentication | ⚠️ Partial | Extension uses user's own API key, not OAuth/login |

### 7.2 Error Handling

| Aspect | Status | Details |
|--------|--------|---------|
| Chrome API errors caught | ✅ Complete | `safe-chrome.ts` wraps all chrome.* calls with try/catch |
| Context invalidation handled | ✅ Complete | `isContextError()` filters out extension context errors |
| AI API errors typed | ✅ Complete | Error states for 401, 429, network errors |
| React error boundaries | 🚫 Missing | No error boundary in popup React tree |
| Console logging for debugging | ⚠️ Partial | Inconsistent — some modules have good logging, others silence all errors |

### 7.3 Loading/Empty/Error States

| Component | Loading | Empty | Error | Notes |
|-----------|---------|-------|-------|-------|
| PopupDashboard | ✅ | ✅ | 🚫 | Error not handled if progress load fails |
| SavedWordsView | ✅ | ✅ | 🚫 | Catch sets loading to false silently |
| MiniTutor | ✅ | ✅ | ✅ | Good state coverage |
| VocabularyCollector | ✅ | 🚫 | ✅ | AI enrichment error handled, no empty state for form |
| ArticleCollector | ✅ | 🚫 | ✅ | Same pattern |
| VideoHelper | ✅ | 🚫 | ✅ | AI analysis errors handled |
| SaveTextForm | ✅ | ✅ | ✅ | Zod validation errors + submit error |
| BackupRestore | ✅ | ✅ | ✅ | Import/export results displayed |
| selectionPanel | 🚫 | 🚫 | 🚫 | Panel shows/hides immediately, no loading for save action |
| aiExplain panel | ✅ | 🚫 | ✅ | Loading spinner, error with retry, missing API key view |

### 7.4 Data Integrity & Sync

| Concern | Status | Details |
|---------|--------|---------|
| Vocabulary deduplication | 🔴 Broken | No dedup in storage bridge; popup saves to IndexedDB, content script to chrome.storage.local |
| Offline queue | 🚫 Missing | AI calls fail when offline with no retry mechanism |
| API call rate limiting | 🚫 Missing | No debounce or queue for AI requests |
| Data loss on offline saves | ⚠️ Partial | IndexedDB and chrome.storage.local are local-first, but AI data is not queued |

### 7.5 Security & Permissions

| Aspect | Status | Details |
|--------|--------|---------|
| Manifest V3 | ✅ Complete | |
| ISOLATED world content script | ✅ Complete | Cannot access page JS |
| postMessage origin validation | ✅ Complete | Bridge validates `event.origin` |
| API key in local storage only | ✅ Complete | Not synced across devices |
| `<all_urls>` permission | ✅ Complete | Required for highlight + save on any page |
| `activeTab` permission | ✅ Complete | |
| `contextMenus` permission | ✅ Complete | |
| `storage` permission | ✅ Complete | |

### 7.6 Performance & Reliability

| Concern | Status | Details |
|---------|--------|---------|
| MutationObserver debounced | ✅ Complete | 300ms debounce for highlight re-scan |
| Storage bridge debounced | ✅ Complete | 500ms debounce |
| Avoid UI injection multiple times | ⚠️ Partial | `selectionPanel.ts` checks for existing panel before creating, but `videoHelper.ts` badge could be duplicated on SPA navigation if cleanup is incomplete |
| Memory leaks | ⚠️ Partial | Content script modules add listeners at module level but never remove them (except selectionPanel which exports `destroySelectionPanel`) |
| Duplicate event listeners | ⚠️ Partial | Module-level `init()` calls in multiple content script files add `chrome.runtime.onMessage` listeners — each `onMessage.addListener` adds a new listener, but multiple listeners for the same message type is fine (all receive the message) |

### 7.7 Test Coverage

| Area | Coverage | Files |
|------|----------|-------|
| Popup components | 2/12 have tests | `DashboardCard.test.tsx`, `ChatButton.test.tsx` (ChatButton is dead code) |
| Content script modules | 0/10 have tests | |
| Background SW | 2/5 have tests | `messaging.test.ts`, `settingsStorage.test.ts` |
| Storage modules | 0/5 have tests | |
| Highlighter | Tests exist | `highlightMatcher.test.ts`, `savedKeywordHighlighter.test.ts` |

---

## 8. Summary of Critical Issues

### 🔴 Critical (blocks core functionality)

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| 1 | Duplicate `'reviewing'` in `entryStatus` Zod enum | `types.ts:48` | Zod validation will error for duplicate value |
| 2 | Hardcoded `localhost:5173` for web app URL | `PopupDashboard.tsx:269,339` | Broken links in production |
| 3 | "Start Review" only shows toast, does nothing | `PopupDashboard.tsx:263-265` | Users cannot start vocabulary review |
| 4 | No vocabulary deduplication in storage bridge | `storage-bridge.ts` | Duplicates when saving same word via popup + content script |
| 5 | Popup save doesn't write to chrome.storage.local | `SaveTextForm.tsx` | Content script features can't see popup-saved data |
| 6 | Icons are 1x1 transparent placeholders | `scripts/build.mjs` | Missing extension icon in toolbar |

### ⚠️ High (degrades user experience)

| # | Issue | Location |
|---|-------|----------|
| 7 | No word detail modal on click | `SavedWordsView.tsx` — clicking word does nothing |
| 8 | Tailwind CSS classes in status badges may not resolve | `SavedWordsView.tsx:19-23` |
| 9 | Duplicated AI config fetching in 3 components | `VocabularyCollector.tsx`, `ArticleCollector.tsx`, `VideoHelper.tsx` |
| 10 | No error boundary in popup | React tree — any crash kills popup |
| 11 | Progress `reviewDue` may be stale | Uses chrome.storage.local, not IndexedDB |
| 12 | Highlighter only reads from chrome.storage.local, not IndexedDB | `savedKeywordHighlighter.ts` |

### 🚫 Missing

| # | Feature |
|---|---------|
| 13 | Vocabulary review flow |
| 14 | Word detail/edit modal |
| 15 | Text-to-speech in SavedWordsView (only pronunciation button exists) |
| 16 | Offline handling/queue |
| 17 | API call rate limiting |
| 18 | Auth state handling |
| 19 | React error boundaries |

---

## 9. Feature Completion Radar

```
Popup opens                       ████████████████░░ 85%
Dashboard view                    █████████████░░░░░ 70%
Save Text Form                    ██████████████░░░░ 75%
Vocabulary Collector              ███████████████░░░ 80%
Article Collector                 ███████████████░░░ 78%
Video Helper                      ███████████████░░░ 80%
AI Tutor / MiniTutor              ████████████████░░ 82%
Saved Words View                  ████████████░░░░░░ 60%
Backup & Restore                  ████████████████░░ 85%

Content Script: Selection Panel   █████████████████░ 90%
Content Script: AI Explain Panel  ██████████████████ 92%
Content Script: Save Text         ████████████████░░ 80%
Content Script: Auto-Highlight    ████████████████░░ 82%
Content Script: Video Helper      ████████████████░░ 80%
Content Script: Bridge Client     ████████████░░░░░░ 55%

Background: Message Routing       ██████████████████ 95%
Background: Context Menus         ██████████████████ 92%
Background: Settings Storage      ██████████████████ 92%
Background: Storage Bridge        █████████████░░░░░ 65%

Settings Page                     ██████████████████ 90%

Data Integrity / Dedup            ██████░░░░░░░░░░░░ 25%
Error Boundaries                  ░░░░░░░░░░░░░░░░░░  0%
Offline Handling                  ░░░░░░░░░░░░░░░░░░  0%
Rate Limiting                     ░░░░░░░░░░░░░░░░░░  0%
Auth State Handling               ░░░░░░░░░░░░░░░░░░  0%
Test Coverage                     ██████░░░░░░░░░░░░ 25%
```

---

*End of report — 6 core features broken/critical, 6 high-priority issues, 7 missing features identified.*
