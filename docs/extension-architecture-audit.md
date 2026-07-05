# IELTS Journey Chrome Extension — Architecture Audit

> Generated: 2026-07-05
> Scope: Full inspection of extension codebase for auditing, fixing, and completing all features.

---

## 1. Codebase Overview

### 1.1 Directory Structure

```
apps/extension/
├── manifest.json              # Manifest V3
├── package.json               # @ielts/extension@0.1.0
├── tsconfig.json
├── vite.config.ts             # Build config for popup/options
├── vitest.config.ts           # Test runner config
├── popup.html                 # Popup entry HTML
├── options.html               # Options page entry HTML
├── scripts/
│   ├── build.mjs              # Custom build pipeline
│   └── package.mjs            # Chrome Web Store packaging
├── dist/                      # Build output
├── src/
│   ├── types.ts               # Shared Zod schemas, categories, enums
│   ├── vite-env.d.ts
│   ├── utils/
│   │   └── safe-chrome.ts     # Safe wrappers around chrome.* APIs
│   ├── services/
│   │   └── storage.ts         # chrome.storage.local wrapper + progress helpers
│   ├── background/
│   │   ├── index.ts           # Service worker entry
│   │   ├── messaging.ts       # Type-safe message passing framework
│   │   ├── settingsStorage.ts # Settings sync with Zod
│   │   ├── storage-bridge.ts  # IndexedDB ↔ chrome.storage sync bridge
│   │   ├── securityAudit.ts   # Security compliance docs
│   │   └── __tests__/
│   ├── content-script/
│   │   ├── index.ts           # Entry point (imports all CS modules)
│   │   ├── sharedStyles.ts    # CSS variable injection
│   │   ├── saveSelectedText.ts # Save selection, full page, artifacts
│   │   ├── selectionPanel.ts  # Floating panel on text selection
│   │   ├── floatingToolbar.ts # **DEAD** — duplicate of selectionPanel
│   │   ├── aiExplain.ts       # Full AI explain panel (7 tabs)
│   │   ├── miniTutor.ts       # Mini-tutor message handlers
│   │   ├── dictionaryPanel.ts # **DEAD** — hover dictionary lookup
│   │   ├── videoHelper.ts     # YouTube video badge + helper
│   │   ├── bridge-client.ts   # window.postMessage bridge to web app
│   │   └── highlighter/
│   │       ├── highlightEngine.ts      # DOM highlight engine
│   │       ├── highlightMatcher.ts     # Text matching algorithm
│   │       ├── highlightStyles.ts      # CSS for highlights
│   │       ├── highlightTooltip.ts     # Tooltip on hover
│   │       ├── savedKeywordHighlighter.ts # Auto-highlight saved vocab
│   │       └── __tests__/
│   ├── storage/
│   │   ├── indexedDB.ts       # IndexedDB CRUD base
│   │   ├── articleStore.ts    # Articles store
│   │   ├── videoStore.ts      # Videos store
│   │   ├── mistakeStore.ts    # Mistakes store
│   │   └── vocabularyStore.ts # Vocabulary store
│   ├── popup/
│   │   ├── main.tsx           # React entry (StrictMode, MemoryRouter)
│   │   ├── App.tsx            # View router (8 views)
│   │   ├── index.css          # Styles
│   │   ├── hooks/
│   │   │   └── usePopupData.ts
│   │   ├── services/
│   │   │   └── popupDataService.ts
│   │   └── components/
│   │       ├── PopupDashboard.tsx
│   │       ├── DashboardCard.tsx
│   │       ├── SaveTextForm.tsx
│   │       ├── QuickAddVocab.tsx     # **DEAD** — unused
│   │       ├── VocabularyCollector.tsx
│   │       ├── ArticleCollector.tsx
│   │       ├── VideoHelper.tsx
│   │       ├── MiniTutor.tsx
│   │       ├── MistakeNotebook.tsx   # **DEAD** — unused
│   │       ├── SavedWordsView.tsx
│   │       ├── BackupRestore.tsx
│   │       ├── ChatButton.tsx        # **DEAD** — unused
│   │       └── __tests__/
│   └── options/
│       ├── main.tsx
│       ├── App.tsx
│       ├── SettingsPage.tsx
│       ├── index.css
│       └── components/
│           ├── ui.tsx
│           ├── AiSettingsForm.tsx
│           └── GeneralSettings.tsx
```

### 1.2 Build System

| Aspect | Detail |
|--------|--------|
| Package manager | pnpm (monorepo via `pnpm-workspace.yaml`) |
| Build tool | Custom `scripts/build.mjs` using Vite + esbuild |
| Vite | Builds popup & options React bundles |
| esbuild | Bundles background Service Worker + content script as ESM |
| Testing | Vitest with jsdom environment |
| Manifest | V3, type `module` for background SW |

### 1.3 Dependencies (Runtime)

| Dependency | Purpose |
|------------|---------|
| `react`, `react-dom` | Popup & options UI |
| `react-router-dom` | In-app routing (MemoryRouter) |
| `zod` | Runtime schema validation |
| `@ielts/ai` | AI explain, dictionary, transcript analysis |
| `@ielts/ai-tutor` | Listed in package.json |
| `@ielts/settings` | Shared settings schemas, constants |
| `@ielts/storage` | Sync service, export/import |
| `@ielts/ui` | ToastProvider component |

---

## 2. Component Architecture & Communication

### 2.1 Extension Parts

```
┌──────────────────────────────────────────────────────────────────────┐
│                     IELTS Journey Extension                           │
│                                                                       │
│  ┌─────────────────────┐    ┌──────────────────┐    ┌───────────────┐ │
│  │   Service Worker     │    │  Content Script   │    │  Popup (React)│ │
│  │   (background.js)    │    │  (content.js)     │    │  (popup.html) │ │
│  │                      │    │                   │    │               │ │
│  │  • Context menus     │◄───│• Selection panel  │    │• Dashboard    │ │
│  │  • Message routing   │    │• AI Explain panel │    │• Vocab forms  │ │
│  │  • Settings storage  │    │• Video helper     │    │• Mini Tutor   │ │
│  │  • Storage bridge    │    │• Highlighter      │    │• Review       │ │
│  │  • Install/init      │    │• Bridge client    │    │• Settings     │ │
│  └──────────┬───────────┘    └────────┬──────────┘    └──────┬────────┘ │
│             │                         │                       │          │
│             ▼                         ▼                       ▼          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                          Storage Layers                          │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐ │    │
│  │  │ chrome.storage│  │ chrome.storage│  │      IndexedDB         │ │    │
│  │  │   .local      │  │   .sync       │  │  • learningEntries     │ │    │
│  │  │ • aiApiKey    │  │ • settings    │  │  • vocabulary          │ │    │
│  │  │ • savedItems  │  │ • theme       │  │  • articles            │ │    │
│  │  │ • vocabulary  │  │ • toggles     │  │  • videos              │ │    │
│  │  │ • dailyProgress│  │ • model      │  │  • mistakes            │ │    │
│  │  │ • artifacts   │  │ • baseUrl     │  │                        │ │    │
│  │  └──────────────┘  └──────────────┘  └────────────────────────┘ │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                         │
│  ┌──────────────────┐                                                   │
│  │   Web App Bridge  │  ←── window.postMessage                         │
│  │   (bridge-client) │  ←── Settings sync, vocab sync                  │
│  └──────────────────┘                                                   │
└──────────────────────────────────────────────────────────────────────┘
```

### 2.2 Communication Channels

| From | To | Mechanism | Message Types |
|------|----|-----------|---------------|
| Popup | Service Worker | `chrome.runtime.sendMessage` | `GET_DAILY_PROGRESS`, `UPDATE_PROGRESS`, `OPEN_OPTIONS`, `VIDEO_PAGE_DETECTED`, `VIDEO_HELPER_OPEN` |
| Popup | Content Script | `chrome.tabs.sendMessage` (via background) | `AI_EXPLAIN`, `SAVE_SELECTION_FULL`, `SAVE_SELECTION`, `SAVE_ARTIFACT` |
| Content Script | Service Worker | `chrome.runtime.sendMessage` | `VIDEO_PAGE_DETECTED`, progress updates |
| Content Script | Web App | `window.postMessage` | Vocabulary sync, settings sync, auth state |
| Service Worker | Content Script | `chrome.tabs.sendMessage` | `AI_EXPLAIN`, save commands |
| Options | Service Worker | `chrome.storage.sync` / `chrome.storage.local` | Settings read/write |

### 2.3 Message Passing Framework (`background/messaging.ts`)

Type-safe message map using Zod validation:

```typescript
type MessageMap = {
  GET_DAILY_PROGRESS: {} => { wordsAdded, notesAdded, articlesSaved, reviewDue, streak }
  UPDATE_PROGRESS: { wordsAdded?, notesAdded?, articlesSaved? } => void
  OPEN_OPTIONS: {} => void
  VIDEO_PAGE_DETECTED: { isVideoPage, platform, videoTitle, videoUrl, videoId } => void
  VIDEO_HELPER_OPEN: { isVideoPage, platform, videoTitle, videoUrl, videoId } => void
  MINI_TUTOR_SAVE_RESULT: { id, text, category, pageTitle?, pageUrl? } => void
  MINI_TUTOR_OPEN_PAGE: { action, text } => void
  MINI_TUTOR_TRIGGER: { action, text } => void
  SAVE_SELECTION_FULL: SaveItemPayload => void
  AI_EXPLAIN: { text, action } => void
  SETTINGS_SYNC: SharedSettingsPatch => void
}
```

---

## 3. Storage Architecture

### 3.1 Storage Layers

| Layer | API | Contents | Used By |
|-------|-----|----------|---------|
| `chrome.storage.local` | `safeStorageGet/Set` | Daily progress, AI API key, saved items (legacy), vocabulary (legacy), artifacts | Background SW, content scripts, popup |
| `chrome.storage.sync` | `safeSyncGet/Set` | AI model, base URL, toggles, theme, settings | Background SW, options page |
| IndexedDB (`ielts-journey-db`) | Store modules | Primary data: `learningEntries`, `vocabulary`, `articles`, `videos`, `mistakes` | Popup, storage bridge |

### 3.2 Storage Stores (IndexedDB)

| Store | Schema (Zod) | Key Operations |
|-------|-------------|----------------|
| `learningEntries` | `entrySchema` — id, text, meaning, category, pageTitle, pageUrl, createdAt, status, tags | CRUD via `indexedDB.ts` |
| `vocabulary` | `vocabSchema` — id, word, meaning, partOfSpeech, pronunciation, example, synonyms, aiEnriched, status | CRUD via `vocabularyStore.ts` |
| `articles` | `articleSchema` — id, title, url, content, notes, aiQuestions, savedAt | CRUD via `articleStore.ts` |
| `videos` | `videoSchema` — id, title, url, platform, notes, transcript, aiAnalysis | CRUD via `videoStore.ts` |
| `mistakes` | `mistakeSchema` — id, text, category, correction, note, pageTitle, pageUrl, createdAt | CRUD via `mistakeStore.ts` |

### 3.3 Storage Bridge (`background/storage-bridge.ts`)

- Syncs `chrome.storage.local` data to IndexedDB (debounced, 500ms)
- Handles `learningEntries` migration from legacy storage to IndexedDB
- Provides `syncToChromeStorage()` for reverse direction
- **Risk**: No deduplication — same word saved via popup (→ IndexedDB) and content script (→ chrome.storage.local → bridge → IndexedDB) can create duplicates

---

## 4. Feature Inventory & Status

### 4.1 Popup Features

| Feature | File | Status | Notes |
|---------|------|--------|-------|
| Dashboard view | `PopupDashboard.tsx` | ⚠️ Incomplete | Links to web app use hardcoded `localhost:5173`; "Start Review" only shows toast |
| Dashboard card | `DashboardCard.tsx` | ✅ Complete | With tests |
| Save text form | `SaveTextForm.tsx` | ⚠️ Partial | Saves to IndexedDB only, not chrome.storage.local |
| Quick add vocab | `QuickAddVocab.tsx` | 💀 Dead | Not imported anywhere |
| Vocabulary collector | `VocabularyCollector.tsx` | ⚠️ Partial | AI enrichment works; has own AI config fetching (duplicated) |
| Article collector | `ArticleCollector.tsx` | ⚠️ Partial | AI questions generator; own AI config fetching |
| Video helper | `VideoHelper.tsx` | ⚠️ Partial | AI transcript analysis; own AI config fetching |
| Mini Tutor | `MiniTutor.tsx` | ⚠️ Partial | 8 actions; 3 fall through to custom prompts; results saved to chrome.storage.local only |
| Saved words view | `SavedWordsView.tsx` | ⚠️ Partial | Reads from IndexedDB vocabulary store |
| Backup/Restore | `BackupRestore.tsx` | ⚠️ Partial | Uses `@ielts/storage` sync service |
| Mistake notebook | `MistakeNotebook.tsx` | 💀 Dead | Not routed in App.tsx |
| Chat button | `ChatButton.tsx` | 💀 Dead | Not used in any view |
| QuickAddVocab | `QuickAddVocab.tsx` | 💀 Dead | Not used |

### 4.2 Content Script Features

| Feature | File | Status | Notes |
|---------|------|--------|-------|
| Selection panel | `selectionPanel.ts` | ✅ Working | Floating panel on text selection with AI actions |
| AI explain panel | `aiExplain.ts` | ✅ Working | 7 explain modes with caching |
| Save selected text | `saveSelectedText.ts` | ✅ Working | Saves to chrome.storage.local |
| Video detection | `videoHelper.ts` | ✅ Working | YouTube badge detection |
| Auto-highlight | `highlighter/*` | ✅ Working | With tests; `setWordIds` is unused |
| Web bridge | `bridge-client.ts` | ⚠️ Untested | window.postMessage-based sync; uses `as any` |
| Floating toolbar | `floatingToolbar.ts` | 💀 Dead | Duplicate of selectionPanel (434 lines, unused imports) |
| Dictionary panel | `dictionaryPanel.ts` | 💀 Dead | Not imported; hover dictionary never initialized |

### 4.3 Background Service Worker Features

| Feature | File | Status | Notes |
|---------|------|--------|-------|
| Message routing | `messaging.ts` | ✅ Complete | With tests |
| Context menus | `index.ts` | ✅ Working | Right-click save/explain |
| Settings storage | `settingsStorage.ts` | ✅ Complete | With Zod validation |
| Storage bridge | `storage-bridge.ts` | ⚠️ Partial | No dedup; syncs to IndexedDB |
| Install handler | `index.ts` | ✅ Working | Basic init |

### 4.4 AI Features

| Feature | Source | Status | Notes |
|---------|--------|--------|-------|
| AI explain (7 modes) | `@ielts/ai` | ✅ Working | Structured typed output |
| Dictionary entry | `@ielts/ai` | 💀 Dead | Backend exists but content script not loaded |
| Vocabulary enrichment | Direct OpenAI call | ✅ Working | Duplicated AI config fetching |
| Article questions | Direct OpenAI call | ✅ Working | Duplicated AI config fetching |
| Video transcript analysis | `@ielts/ai` | ✅ Working | 4 analysis modes |
| Mini Tutor actions | `MiniTutor.tsx` | ⚠️ Partial | 5 of 8 actions well-typed; 3 are unstructured |

### 4.5 Options Page Features

| Feature | File | Status | Notes |
|---------|------|--------|-------|
| AI settings | `AiSettingsForm.tsx` | ✅ Complete | API key, model, base URL |
| General settings | `GeneralSettings.tsx` | ✅ Complete | Theme, toolbar, defaults |

---

## 5. Identified Issues

### 5.1 Dead Code (to remove)

| File | Lines | Reason |
|------|-------|--------|
| `content-script/floatingToolbar.ts` | 434 | Unused — duplicate of `selectionPanel.ts` |
| `content-script/dictionaryPanel.ts` | 469 | Unused — not imported in `content-script/index.ts` |
| `popup/components/MistakeNotebook.tsx` | ~200 | Unused — no route renders it |
| `popup/components/ChatButton.tsx` | ~50 | Unused — not rendered in any view |
| `popup/components/QuickAddVocab.tsx` | ~100 | Unused — not imported anywhere |

### 5.2 Critical Bugs

| Issue | Location | Impact |
|-------|----------|--------|
| `entryStatus` enum has duplicate `'reviewing'` value | `types.ts` | Zod schema validation will error on duplicate entry |
| Hardcoded `localhost:5173` for web app URL | `PopupDashboard.tsx` | Fails in production; should use configurable base URL |
| "Start Review" button does nothing | `PopupDashboard.tsx` | User clicks and nothing happens beyond a toast |
| Popup saves to IndexedDB only (not chrome.storage.local) | `SaveTextForm.tsx` | Data saved from popup may not be visible to content script features |

### 5.3 Data Integrity Issues

| Issue | Details |
|-------|---------|
| Dual storage for vocabulary | Content scripts write to `chrome.storage.local`; popup writes to IndexedDB. Bridge syncs one direction (local→IDB) but no dedup. Same word saved both ways → duplicates. |
| No offline queue | AI features fail silently when offline; no retry mechanism |
| AI API key in `chrome.storage.local` (not sync) | Key is not synced across devices |
| Progress counters may be stale | `GET_DAILY_PROGRESS` returns `chrome.storage.local` data which may not reflect IndexedDB state |

### 5.4 Code Quality Issues

| Issue | Location |
|-------|----------|
| Duplicated AI config fetching | `ArticleCollector.tsx`, `VocabularyCollector.tsx`, `VideoHelper.tsx` all implement their own `getAIProviderConfig` |
| `as any` / `as Record<string, unknown>` casts | `bridge-client.ts`, `miniTutor.ts` |
| No loading/empty/error states for several components | `SavedWordsView.tsx`, `MiniTutor.tsx` |
| Icons are 1x1 transparent placeholders | `scripts/build.mjs` generates placeholder PNGs |
| `noUnusedLocals: true` but dead imports exist | `floatingToolbar.ts` imports unused symbols |

### 5.5 Missing Features

| Feature | Expected Behavior | Current State |
|---------|------------------|---------------|
| Vocabulary review flow | Start a review session from popup | Button exists but only shows toast |
| Word detail modal | Click word to see full details (meaning, pronunciation, forms, synonyms, examples, IELTS usage) | `SavedWordsView.tsx` shows list but no detail view |
| Text-to-speech | Pronunciation button reads word aloud | Not implemented |
| Auto-highlight safety | Must not break layout on dynamic pages | Engine exists but may need testing on SPA/React sites |
| Offline handling | Queue AI actions, show offline indicator | Not implemented |
| Error boundaries | Catch React errors gracefully | Not present |
| API call spam prevention | Rate limiting / debouncing | Not implemented |

### 5.6 Test Gaps

| Area | Test Coverage |
|------|---------------|
| Popup components | 2/12 have tests (DashboardCard, ChatButton) |
| Content script modules | 0/10 have tests |
| Storage modules | 0/5 have tests |
| Background SW | 2/5 have tests (messaging, settingsStorage) |

---

## 6. Data Flow Analysis

### 6.1 Save Vocabulary Flow

```
User highlights text on webpage
        │
        ▼
Content Script: selectionPanel.ts shows floating toolbar
        │
        ├──→ "Save Word" → saveSelectedText.ts → chrome.storage.local.savedItems
        │                                                  │
        │                                            storage-bridge.ts
        │                                                  │ (500ms debounce)
        │                                                  ▼
        │                                            IndexedDB.learningEntries
        │
        └──→ "AI Explain" → aiExplain.ts → @ielts/ai → POST /chat/completions
                                                     → displays result in panel
```

### 6.2 Popup Load Flow

```
Popup opens (popup.html → main.tsx → App.tsx → PopupDashboard)
        │
        ▼
usePopupData() hook fires
        │
        ├──→ chrome.runtime.sendMessage({ type: 'GET_DAILY_PROGRESS' })
        │         │
        │         ▼
        │    background/messaging.ts → chrome.storage.local.get('dailyProgress')
        │         │
        │         ▼
        │    Returns { wordsAdded, notesAdded, articlesSaved, reviewDue, streak }
        │
        ├──→ popupDataService.ts → vocabularyStore.getAll() (IndexedDB)
        │         │
        │         ▼
        │    Returns vocabulary list
        │
        └──→ chrome.storage.sync.get('extensionSettings') → theme, model, toggles
```

### 6.3 Auto-Highlight Flow

```
Content script loads (content.js injected on all URLs)
        │
        ▼
savedKeywordHighlighter.ts initializes
        │
        ├──→ Reads vocabulary from chrome.storage.local
        │         │
        │         ▼
        │    highlightMatcher.ts builds text index of saved words
        │
        ├──→ highlightEngine.ts scans DOM text nodes
        │         │
        │         ▼
        │    Wraps matching words in <span> with highlight styles
        │    (avoids duplicate highlights, respects existing markup)
        │
        └──→ MutationObserver watches for DOM changes
              (re-applies highlights to dynamic content)
```

### 6.4 AI Explain Flow (from Popup)

```
Popup: User selects text → "Explain" button
        │
        ▼
chrome.tabs.sendMessage(tabId, { type: 'AI_EXPLAIN', payload: { text, action } })
        │
        ▼
Content Script: aiExplain.ts receives message
        │
        ├──→ aiExplainService (from @ielts/ai) with { text, mode }
        │         │
        │         ▼
        │    POST {baseUrl}/chat/completions  (Authorization: Bearer {apiKey})
        │         │
        │         ▼
        │    Structured AI response returned
        │
        └──→ Renders result in explain panel overlay
              (7 tabs: Simple, Vietnamese, IELTS Vocab, Grammar, Rewrite, Examples, Quiz)
```

---

## 7. Settings & Sync Architecture

### 7.1 Settings Storage

```
Settings stored across two key spaces:

chrome.storage.sync (synced across Chrome profiles):
  └── extensionSettings: {
        model: string (default: DEFAULT_MODEL from @ielts/settings)
        baseUrl: string (default: OPENAI_BASE_URL from @ielts/settings)
        theme: 'light' | 'dark' | 'system'
        autoHighlight: boolean
        showSelectionPanel: boolean
        enableVideoHelper: boolean
        enableDictionary: boolean
      }

chrome.storage.local (device-local):
  └── aiApiKey: string (API key not synced for security)
```

### 7.2 Web App Sync Bridge

The `bridge-client.ts` content script listens for `window.postMessage` events from the IELTS Journey web app:

| Message | Direction | Data |
|---------|-----------|------|
| `SYNC_SETTINGS` | Web App → Extension | Shared settings patch |
| `GET_SETTINGS` | Web App ← Extension | Current extension settings |
| `VOCAB_SYNC` | Bidirectional | Vocabulary items |
| `REFRESH_HIGHLIGHTS` | Web App → Extension | Trigger re-highlight |

### 7.3 Security Model

- Content script runs in `ISOLATED` world (cannot access page JS)
- `window.postMessage` bridge allows controlled communication with web app
- API key stored in `chrome.storage.local` (not exposed to webpage)
- All AI calls go to user-configured endpoint (no hardcoded third-party)
- Permissions: `storage`, `contextMenus`, `activeTab`, `<all_urls>`

---

## 8. Priority Fix Plan

### Phase 1 — Critical Bugs (user-facing)
1. Fix duplicate `'reviewing'` in `entryStatus` Zod enum
2. Fix hardcoded `localhost:5173` URL
3. Implement "Start Review" button navigation
4. Fix icons (generate proper placeholder icons)
5. Ensure popup save also writes to chrome.storage.local

### Phase 2 — Dead Code Removal
1. Remove `floatingToolbar.ts` (duplicate of selectionPanel.ts)
2. Wire up `dictionaryPanel.ts` or remove if not needed
3. Remove/connect `MistakeNotebook.tsx`, `ChatButton.tsx`, `QuickAddVocab.tsx`

### Phase 3 — Feature Completion
1. Implement vocabulary review flow
2. Add word detail modal (meaning, pronunciation, forms, synonyms, examples)
3. Add text-to-speech / pronunciation button
4. Add loading, empty, error states to all components
5. Implement API call debouncing/rate limiting
6. Add offline detection and queue

### Phase 4 — Data Integrity
1. Implement deduplication in storage bridge
2. Unify vocabulary storage path (single source of truth)
3. Ensure AI config fetching uses shared utility (no duplication)
4. Add error boundaries to popup React tree

### Phase 5 — Polish
1. Add tests for critical content script modules
2. Remove `as any` casts with proper types
3. Improve error handling and logging
4. Add production config for web app URL

---

## 9. Appendix: Key Files Reference

| File | Purpose | Lines |
|------|---------|-------|
| `manifest.json` | Extension manifest (V3) | ~25 |
| `src/types.ts` | Shared schemas & types | ~200 |
| `src/utils/safe-chrome.ts` | chrome.* API wrappers | ~100 |
| `src/services/storage.ts` | chrome.storage wrappers | ~80 |
| `src/background/index.ts` | Service worker entry | ~60 |
| `src/background/messaging.ts` | Message framework | ~120 |
| `src/background/storage-bridge.ts` | IDB sync bridge | ~100 |
| `src/background/settingsStorage.ts` | Settings management | ~150 |
| `src/content-script/index.ts` | Content script entry | ~20 |
| `src/content-script/selectionPanel.ts` | Selection toolbar | ~350 |
| `src/content-script/aiExplain.ts` | AI explain panel | ~400 |
| `src/content-script/saveSelectedText.ts` | Save text utilities | ~150 |
| `src/content-script/videoHelper.ts` | YouTube helper | ~100 |
| `src/content-script/highlighter/highlightEngine.ts` | DOM highlight engine | ~250 |
| `src/content-script/highlighter/highlightMatcher.ts` | Text matching | ~100 |
| `src/content-script/highlighter/savedKeywordHighlighter.ts` | Auto-highlight | ~80 |
| `src/storage/indexedDB.ts` | IndexedDB base | ~100 |
| `src/storage/vocabularyStore.ts` | Vocab store | ~120 |
| `src/popup/App.tsx` | Popup router | ~80 |
| `src/popup/components/PopupDashboard.tsx` | Dashboard | ~200 |
| `src/popup/components/SavedWordsView.tsx` | Vocab list | ~150 |
| `src/popup/components/MiniTutor.tsx` | AI Tutor | ~250 |
| `src/popup/components/VocabularyCollector.tsx` | Vocab + AI enrichment | ~200 |
| `src/popup/components/ArticleCollector.tsx` | Articles + AI | ~200 |
| `src/popup/components/VideoHelper.tsx` | Video + AI | ~200 |
| `src/options/SettingsPage.tsx` | Options page | ~150 |
| `src/options/components/AiSettingsForm.tsx` | AI settings form | ~200 |
| `src/options/components/GeneralSettings.tsx` | General settings | ~100 |
