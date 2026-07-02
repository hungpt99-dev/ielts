# IELTS Learning Journey — Browser Extension Architecture

## 1. Overview

The IELTS Learning Journey browser extension is a Manifest V3 Chrome extension that allows users to collect English learning material from any webpage and save it into their local IELTS study database. It operates entirely client-side with no backend, sharing data with the main website through a local storage bridge strategy.

### Design Principles

- **Local-first:** All data stays in the browser. No cloud, no backend.
- **Privacy-respecting:** No browsing history collection, no silent data transmission.
- **User-controlled AI:** All AI features use the user's own API key, stored locally.
- **Smooth website integration:** Extension and website share the same IndexedDB database when possible, with fallback sync mechanisms.
- **Composable architecture:** Content scripts, background worker, popup, and injected bridge each have narrow responsibilities.

---

## 2. Monorepo Structure

```
ielts-journey/
├── apps/
│   ├── web/                          # Existing Vite + React website
│   │   ├── src/
│   │   │   ├── models/
│   │   │   ├── services/
│   │   │   ├── hooks/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   └── ...
│   │   └── package.json
│   │
│   └── extension/                    # New: Chrome Extension
│       ├── src/
│       │   ├── background/           # Service worker (MV3)
│       │   │   ├── index.ts          # Entry point
│       │   │   ├── ai-service.ts     # AI API calls
│       │   │   ├── storage-bridge.ts # Sync with website DB
│       │   │   └── messaging.ts      # Internal message routing
│       │   │
│       │   ├── content/              # Content scripts
│       │   │   ├── index.ts          # Main content script entry
│       │   │   ├── selection-handler.ts  # Text selection detection
│       │   │   ├── floating-toolbar.ts   # Floating toolbar UI
│       │   │   ├── dictionary-panel.ts   # Mini dictionary popup
│       │   │   ├── youtube-helper.ts     # YouTube page detection
│       │   │   └── bridge-client.ts      # Website bridge communication
│       │   │
│       │   ├── popup/                # Extension popup UI
│       │   │   ├── index.html
│       │   │   ├── main.tsx
│       │   │   ├── App.tsx
│       │   │   ├── components/
│       │   │   │   ├── DashboardCard.tsx
│       │   │   │   ├── QuickAddVocab.tsx
│       │   │   │   ├── QuickAddNote.tsx
│       │   │   │   ├── TodayStats.tsx
│       │   │   │   ├── StreakDisplay.tsx
│       │   │   │   ├── PendingReviews.tsx
│       │   │   │   └── EmptyState.tsx
│       │   │   └── hooks/
│       │   │       └── usePopupData.ts
│       │   │
│       │   ├── options/              # Settings page
│       │   │   ├── index.html
│       │   │   ├── main.tsx
│       │   │   ├── App.tsx
│       │   │   └── components/
│       │   │       ├── AiSettingsForm.tsx
│       │   │       ├── GeneralSettings.tsx
│       │   │       └── ImportExportSection.tsx
│       │   │
│       │   ├── services/             # Shared extension services
│       │   │   ├── storage.ts        # chrome.storage wrapper
│       │   │   ├── indexed-db.ts     # IndexedDB operations
│       │   │   ├── export-import.ts  # JSON backup/restore
│       │   │   └── ai-client.ts      # AI API client
│       │   │
│       │   ├── types/                # Extension-specific types
│       │   │   ├── messages.ts       # Message protocol types
│       │   │   ├── storage.ts        # chrome.storage schema
│       │   │   └── extension.ts      # Extension-specific models
│       │   │
│       │   ├── utils/
│       │   │   ├── dom.ts            # DOM extraction helpers
│       │   │   ├── url.ts            # URL parsing
│       │   │   └── validators.ts     # Form validation
│       │   │
│       │   └── styles/
│       │       └── index.css         # Shared Tailwind tokens
│       │
│       ├── public/
│       │   ├── manifest.json         # Manifest V3
│       │   ├── icons/                # Extension icons (16, 48, 128)
│       │   └── popup.html            # Popup entry HTML
│       │
│       ├── package.json
│       ├── vite.config.ts            # Vite config for extension build
│       ├── tsconfig.json
│       └── tailwind.config.js
│
└── packages/                         # Shared between apps/web and apps/extension
    ├── ui/                           # Shared React components
    ├── types/                        # Shared TypeScript interfaces
    │   └── src/
    │       ├── index.ts
    │       ├── vocabulary.ts
    │       ├── mistakes.ts
    │       ├── settings.ts
    │       ├── import-export.ts
    │       └── ielts-topics.ts
    ├── ai/                           # Shared AI client
    │   └── src/
    │       ├── index.ts
    │       ├── client.ts             # OpenAI-compatible fetch wrapper
    │       ├── prompts.ts            # IELTS-specific prompt templates
    │       └── types.ts
    ├── storage/                      # Shared storage layer
    │   └── src/
    │       ├── index.ts
    │       ├── db.ts                 # IndexedDB schema & connection
    │       ├── vocabulary-store.ts
    │       ├── mistakes-store.ts
    │       ├── reviews-store.ts
    │       └── settings-store.ts
    ├── validators/                   # Zod schemas
    │   └── src/
    │       ├── index.ts
    │       ├── vocabulary.ts
    │       ├── mistakes.ts
    │       └── settings.ts
    └── config/                       # Shared constants
        └── src/
            ├── index.ts
            ├── topics.ts             # IELTS topic definitions
            ├── design-tokens.ts      # Theme tokens
            └── defaults.ts           # Default values
```

### Shared Package Dependencies

| Package   | Shared by      | Purpose                               |
|-----------|----------------|---------------------------------------|
| `types`   | web,extension  | All TypeScript interfaces & enums     |
| `storage` | web,extension  | IndexedDB operations (same DB schema) |
| `ai`      | web,extension  | OpenAI-compatible AI client           |
| `validators` | web,extension | Zod schemas for data validation     |
| `config`  | web,extension  | Design tokens, topics, constants      |
| `ui`      | web,extension  | React UI components (if applicable)   |

---

## 3. Extension Components & Responsibilities

### 3.1 Service Worker (`background/index.ts`)

The Manifest V3 service worker is the extension's central coordinator. It is event-driven and non-persistent.

**Responsibilities:**
- Route messages between content scripts and the popup/options page
- Manage `chrome.storage.session` for runtime state
- Handle AI API calls (must be done from service worker to avoid CORS issues in content scripts)
- Coordinate IndexedDB access (content scripts can access IndexedDB directly, but service worker provides a unified API)
- Manage extension alarms for review reminders
- Handle installation/update events

**Lifecycle:**
```
Install/Update → Initialize default settings in chrome.storage.local
              → Register alarms for daily review reminders

On Message    → Route to appropriate handler (AI, storage, etc.)
On Alarm      → Notify popup badge with pending review count
```

### 3.2 Content Script (`content/index.ts`)

Injected into every page the user browses. Runs in an isolated world (MV3 requirement for security).

**Responsibilities:**
- Detect text selection and show floating toolbar
- Inject dictionary mini panel on word double-click
- Detect YouTube pages and activate video helper UI
- Listen for messages from the popup/service worker
- Extract page metadata (title, URL, selected text, readable content)
- Communicate with the website bridge (if website tab is open)
- Never modifies webpage layout aside from the floating UI elements

**Permissions required:**
- `activeTab` (for accessing tab URL/title)
- `scripting` (for dynamic injection where needed)
- `storage` (for reading settings)
- `contextMenus` (for right-click save actions)

**Not required:**
- `<all_urls>` or broad host permissions — use `activeTab` + `host_permissions` only for selected sites if needed

### 3.3 Popup (`popup/`)

The extension popup shown when the user clicks the extension icon.

**Responsibilities:**
- Display today's learning stats (items saved today, streak, pending reviews)
- Quick-add vocabulary form
- Quick-add note form
- Quick-save current page button (saves as reading material)
- Quick-open dashboard link to the main website
- Quick-start vocabulary review (opens website review page)
- Display empty states when no data exists

### 3.4 Options Page (`options/`)

Full settings page for the extension.

**Responsibilities:**
- AI provider configuration (provider, base URL, API key, model)
- Theme toggle (dark/light mode using shared design tokens)
- Floating toolbar enable/disable
- Auto-save selected text toggle
- Default save category and IELTS topic
- Data export (download as JSON)
- Data import (upload JSON backup)
- Clear all extension data

### 3.5 Floating Toolbar (`content/floating-toolbar.ts`)

An optional UI element that appears when the user selects text on a webpage.

**Actions available:**
- Save word (opens a small form to save as vocabulary)
- Save sentence (saves as example sentence or useful phrase)
- Explain meaning (AI: simple English explanation)
- Simplify text (AI: simplified version)
- Translate to Vietnamese (AI: Vietnamese translation)
- Generate IELTS vocabulary (AI: related IELTS vocabulary from selected text)
- Add to mistake notebook (opens form with pre-filled original text)

### 3.6 Dictionary Mini Panel (`content/dictionary-panel.ts`)

Appears when the user double-clicks or selects a single word.

**Features:**
- Show cached definition if available
- Request AI for meaning, example, synonym, collocation
- One-click save to vocabulary
- Cache results locally in chrome.storage.session to reduce AI costs

### 3.7 YouTube Helper (`content/youtube-helper.ts`)

Detects when the user is on a YouTube video page and adds a save button.

**Features:**
- Capture video title and URL
- Manual transcript paste area
- AI actions: generate vocabulary list, summary, listening questions, shadowing practice
- Save result to Listening practice or Vocabulary

---

## 4. Data Flow Architecture

### 4.1 High-Level Data Flow

```
                    ┌─────────────────────────────┐
                    │     Webpage (any domain)     │
                    │  ┌───────────────────────┐   │
                    │  │ Content Script (isolated) │
                    │  │  - Selection detection │   │
                    │  │  - Floating toolbar    │   │
                    │  │  - Dictionary panel    │   │
                    │  │  - YouTube detector    │   │
                    │  └──────┬────────────────┘   │
                    └─────────┼────────────────────┘
                              │
            ┌─────────────────┼────────────────────┐
            │                 │ chrome.runtime      │
            ▼                 ▼                     │
    ┌──────────────┐  ┌──────────────┐             │
    │   Popup UI   │  │ Options Page │             │
    │  (React SPA) │  │  (React SPA) │             │
    └──────┬───────┘  └──────┬───────┘             │
           │                 │                     │
           ▼                 ▼                     │
    ┌─────────────────────────────────────────┐    │
    │        Service Worker (MV3)             │    │
    │  ┌──────────┐ ┌───────────┐ ┌────────┐ │    │
    │  │ Messaging │ │ AI Client │ │Storage │ │    │
    │  │ Router    │ │ (fetch to │ │Bridge  │ │    │
    │  │           │ │  LLM API) │ │        │ │    │
    │  └──────────┘ └───────────┘ └───┬────┘ │    │
    └─────────────────────────────────┼───────┘    │
                                      │            │
            ┌─────────────────────────┼────────────┘
            │                         │
            ▼                         ▼
    ┌────────────────┐     ┌───────────────────────┐
    │ Browser's      │     │ Main Website Tab      │
    │ IndexedDB      │     │  ┌─────────────────┐  │
    │ (ielts-journey)│     │  │ Bridge Script    │  │
    │                │     │  │ (injected when   │  │
    │ Shared DB      │     │  │ website is open) │  │
    │ or extension-  │     │  └────────┬────────┘  │
    │ scoped DB      │     │           │           │
    └────────────────┘     └───────────┼───────────┘
                                       │
                                       ▼
                               ┌───────────────┐
                               │ chrome.storage │
                               │ .local / .sync │
                               └───────────────┘
```

### 4.2 Save Selected Text Flow (Detailed)

```
User selects text on webpage
        │
        ▼
Selection handler detects highlight
        │
        ├── (if floating toolbar enabled) → Show toolbar near selection
        │                                      │
        │                                      ▼
        │                              User clicks "Save Word"
        │                                      │
        │                                      ▼
        │                              Show small form overlay:
        │                              - Type: Vocabulary / Phrase / Sentence / etc.
        │                              - Topic dropdown
        │                              - Skill selector
        │                              - Difficulty selector
        │                              - Tags input
        │                              - Personal note
        │                              - [Save] [Cancel]
        │                                      │
        │                                      ▼ (User clicks Save)
        │
        ├── (right-click context menu) → User right-clicks → "Save to IELTS Journey"
        │                                      │
        │                                      ▼
        │                              Show save type submenu
        │                                      │
        │                                      ▼
        │                              Opens popup with pre-filled data
        │
        ▼
Content script sends message:
  { type: "SAVE_ITEM", payload: { type, text, pageTitle, pageUrl, topic, ... } }
        │
        ▼
Service worker receives message
        │
        ├── Writes to IndexedDB (directly or via bridge)
        │
        ├── Updates chrome.storage.local with today's count
        │
        └── Sends response: { success: true, id: "..." }
        │
        ▼
Content script shows toast: "Saved to IELTS Journey ✓"
```

### 4.3 AI Explain Flow

```
User selects text → clicks "Explain" on toolbar
        │
        ▼
Content script sends: { type: "AI_REQUEST", payload: { action: "explain", text, language: "simple-english|vietnamese" } }
        │
        ▼
Service worker checks chrome.storage.local for API key
        │
        ├── If API key missing → return { error: "API_KEY_MISSING" }
        │                       → Content script shows friendly error
        │
        ├── If API key present → fetch(provider.baseUrl + "/chat/completions", {
        │                          method: "POST",
        │                          headers: { Authorization: "Bearer <key>" },
        │                          body: { model, messages: [...] }
        │                       })
        │
        ▼
Service worker returns response to content script
        │
        ▼
Content script shows AI response in a tooltip/overlay
```

### 4.4 YouTube Video Learning Flow

```
User is on youtube.com/watch?v=...
        │
        ▼
YouTube detector activates (content script matches URL pattern)
        │
        ├── Injects a small floating button: "Save to IELTS"
        │
        ▼
User clicks button → Shows form in overlay:
  - Title (auto-filled from page)
  - URL (auto-filled)
  - Notes (textarea)
  - Transcript paste area (textarea, manual)
        │
        ▼
User optionally pastes transcript → clicks "AI Analysis"
        │
        ▼
Service worker calls AI API with transcript
  - Prompt: generate vocabulary list + summary + 5 listening questions + shadowing practice
        │
        ▼
AI returns structured content
        │
        ▼
User can review and choose what to save:
  □ Vocabulary list  → save to Vocabulary store
  □ Summary          → save as Reading material
  □ Listening questions → save as Listening practice
  □ Shadowing practice  → save as Speaking practice
        │
        ▼
Selected items saved to IndexedDB
```

### 4.5 Dictionary Mini Panel Flow

```
User double-clicks a single word
        │
        ▼
Content script detects word boundary
        │
        ▼
Check chrome.storage.session cache
        │
        ├── Cache HIT → display cached definition immediately
        │
        ├── Cache MISS:
        │     │
        │     ├── (AI enabled) → call service worker → AI returns meaning, example, synonym
        │     │                   → cache result in chrome.storage.session (TTL: 24h)
        │     │                   → display panel
        │     │
        │     └── (AI disabled) → display basic panel with word only, prompt to enable AI
        │
        ▼
User clicks "Save" → saves to vocabulary with pre-filled fields
        │
        ▼
Show success toast
```

---

## 5. Data Synchronization Strategy

### 5.1 The Core Challenge

IndexedDB is **origin-bound** — each origin (e.g., `chrome-extension://abc123` vs `http://localhost:5173`) gets its own isolated IndexedDB database. Chrome extensions and web pages cannot directly share the same IndexedDB database.

### 5.2 Chosen Approach: Hybrid Storage Bridge

We use a **three-tier storage strategy** with increasing levels of integration:

#### Tier 1: Extension-Scoped IndexedDB (Primary Storage)

The extension maintains its own IndexedDB database (`ielts-journey-extension`) within the extension's origin. This is fast, reliable, and always available regardless of whether the website tab is open.

- **Always writable** — content scripts can save to it from any webpage
- **Always readable** — popup, options, and service worker can read it
- **Schema**: Mirrors the main website's IndexedDB schema exactly (same stores, same indexes), enabling direct import/export compatibility

#### Tier 2: chrome.storage.local (Fast Sync)

Used for lightweight state sharing between extension contexts:
- Today's item counts (for popup badge)
- AI cache results
- Pending review count
- Synced settings (AI config, theme, etc.)

```
chrome.storage.local keys:
  extension.settings        → Extension-specific settings
  extension.todayStats      → { date, savedCount, vocabCount, mistakeCount }
  extension.pendingReviews  → number
  extension.aiCache         → { [word]: { definition, example, ... }, ... }
```

#### Tier 3: Website Bridge (Optional, Direct Sync)

When the user has the IELTS Learning Journey website open in a tab, a bridge script injected by the content script enables direct data transfer.

**Bridge mechanism:**

```
Extension Content Script (on website tab)
        │
        ▼
Detects website is open (URL matches localhost or deployed domain)
        │
        ▼
Injects bridge-client.ts into the page's main world (via script injection)
        │
        ▼
Bridge client establishes communication via window.postMessage:
  - Extension content script listens for messages from page
  - Page listens for messages from content script
        │
        ▼
Protocol:
  1. Extension → Page: { source: "ielts-extension", action: "SYNC_REQUEST" }
  2. Page → Extension: { source: "ielts-page", action: "SYNC_RESPONSE", data: {...} }
  3. Extension → Page: { source: "ielts-extension", action: "SAVE_ITEM", item: {...} }
  4. Page → Extension: { source: "ielts-page", action: "ITEM_SAVED", id: "..." }
```

**Website JavaScript (bridge receiver):**

```typescript
// Injected into website page (main world)
window.addEventListener("message", (event) => {
  if (event.data?.source !== "ielts-extension") return;

  const { action, data } = event.data;

  switch (action) {
    case "SYNC_REQUEST":
      // Export all data from website's IndexedDB
      const exportData = await exportAllData();
      window.postMessage({
        source: "ielts-page",
        action: "SYNC_RESPONSE",
        data: exportData,
      }, "*");
      break;

    case "SAVE_ITEM":
      // Save item directly to website's IndexedDB
      await saveItem(data);
      window.postMessage({
        source: "ielts-page",
        action: "ITEM_SAVED",
        id: data.id,
      }, "*");
      break;
  }
});
```

**When bridge is active:**
- Saves go to **both** extension's IndexedDB **and** website's IndexedDB (dual-write)
- This ensures data is immediately available in both places without waiting for import/export

**When bridge is inactive (website not open):**
- Saves go only to extension's IndexedDB
- User must manually sync via export/import or the bridge will sync when they next open the website

### 5.3 Manual Sync Options

#### Export/Import JSON

Both extension and website support the same JSON export format (see `AppExportData` in `src/models/index.ts`).

**Export flow (extension):**
```
Settings → Export Data → Read all stores from IndexedDB
                       → Create AppExportData object
                       → Trigger download as ielts-journey-export-{date}.json
```

**Import flow (extension):**
```
Settings → Import Data → File picker → Validate JSON against AppExportData schema (Zod)
                       → Write all records to IndexedDB (with overwrite/merge option)
                       → Show import summary
```

#### Automatic Sync on Website Visit

When the user visits the main website:
1. Extension content script detects the website is open
2. Bridge activates
3. Extension checks if there are unsaved items (items in extension DB that are not in website DB, tracked by `extension.syncStatus` in chrome.storage)
4. If unsaved items exist, sync them to the website's IndexedDB via bridge
5. Show a toast: "Synced 5 new items to IELTS Journey ✓"

### 5.4 Sync Status Tracking

```
chrome.storage.local key: extension.syncStatus
Value: {
  lastSyncAt: "2026-07-01T12:00:00Z",
  unsavedCount: 0,
  pendingItems: [
    { id: "ext-123", type: "vocabulary", savedAt: "2026-07-01T11:30:00Z" }
  ]
}
```

Items are added to `pendingItems` when saved while bridge is inactive. They are removed when confirmed synced via bridge or import.

---

## 6. Messaging Protocol

### 6.1 Internal Messages (chrome.runtime.sendMessage)

All communication between extension components uses a typed message protocol.

```typescript
// packages/types/src/messages.ts

// ── Request Messages ────────────────────────────────────────

interface SaveItemRequest {
  type: "SAVE_ITEM"
  payload: {
    category: "vocabulary" | "phrase" | "sentence" | "grammar" | "reading"
           | "writing" | "speaking" | "mistake"
    text: string
    pageTitle: string
    pageUrl: string
    topic?: string
    skill?: string
    difficulty?: "easy" | "medium" | "hard"
    tags?: string[]
    note?: string
    // Vocabulary-specific
    sourceSentence?: string
    // Mistake-specific
    correction?: string
    explanation?: string
  }
}

interface AiRequest {
  type: "AI_REQUEST"
  payload: {
    action: "explain-simple" | "explain-vietnamese" | "ielts-vocab"
          | "grammar-explain" | "rewrite" | "example-sentences"
          | "quiz-questions" | "vocab-meaning" | "summarize"
          | "listening-questions" | "shadowing-practice"
    text: string
    context?: string  // surrounding text for context
    language?: "en" | "vi"
  }
}

interface SyncRequest {
  type: "SYNC_REQUEST"
  payload: {
    target: "extension-db" | "website-db"
    direction: "export" | "import"
    data?: AppExportData  // present for import
  }
}

interface GetPopupDataRequest {
  type: "GET_POPUP_DATA"
}

interface GetPageInfoRequest {
  type: "GET_PAGE_INFO"
}

interface SaveCurrentPageRequest {
  type: "SAVE_CURRENT_PAGE"
  payload: {
    topic?: string
    note?: string
  }
}

// ── Response Messages ───────────────────────────────────────

interface SuccessResponse {
  success: true
  id?: string
  data?: unknown
}

interface ErrorResponse {
  success: false
  error: "API_KEY_MISSING" | "AI_ERROR" | "STORAGE_ERROR" | "INVALID_DATA"
  message: string
}

interface PopupDataResponse {
  success: true
  data: {
    todaySavedCount: number
    todayVocabCount: number
    todayMistakeCount: number
    streak: number
    pendingReviews: number
    recentItems: Array<{ type: string; text: string; savedAt: string }>
  }
}

type ExtensionMessage =
  | SaveItemRequest
  | AiRequest
  | SyncRequest
  | GetPopupDataRequest
  | GetPageInfoRequest
  | SaveCurrentPageRequest

type ExtensionResponse =
  | SuccessResponse
  | ErrorResponse
  | PopupDataResponse
```

### 6.2 Bridge Protocol (window.postMessage)

For communication between extension content script and the website page:

```typescript
interface BridgeMessage {
  source: "ielts-extension" | "ielts-page"
  action: string
  data?: unknown
  requestId?: string  // for request-response correlation
}

// Extension → Page
interface BridgeSaveRequest extends BridgeMessage {
  source: "ielts-extension"
  action: "SAVE_ITEM" | "SYNC_REQUEST" | "PING"
  data?: unknown
}

// Page → Extension
interface BridgeSaveResponse extends BridgeMessage {
  source: "ielts-page"
  action: "ITEM_SAVED" | "SYNC_RESPONSE" | "PONG"
  data?: unknown
}
```

### 6.3 Message Routing Diagram

```
┌──────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  Content      │    │  Service Worker  │    │     Popup        │
│  Script       │    │  (Router)        │    │                  │
│              │    │                  │    │                  │
│ SAVE_ITEM ───┼───▶│                  │    │                  │
│              │    │  ┌────────────┐  │    │                  │
│              │    │  │ Storage    │  │    │                  │
│              │    │  │ Handler    │──┼───▶│ (no direct send)│
│              │    │  └────────────┘  │    │                  │
│              │    │                  │    │                  │
│ AI_REQUEST ──┼───▶│  ┌────────────┐  │    │                  │
│              │    │  │ AI Handler │──┼───▶│ (response only) │
│              │    │  └────────────┘  │    │                  │
│              │    │                  │    │                  │
│              │    │                  │    │ GET_POPUP_DATA ──┼───▶
│              │    │                  │    │                  │    │
│              │    │                  │    │◀─────────────────┼────│
└──────────────┘    └──────────────────┘    └──────────────────┘
                           │
                     ┌─────┴─────┐
                     │           │
                     ▼           ▼
              ┌──────────┐ ┌──────────┐
              │ IndexedDB│ │ chrome.  │
              │ (ext)    │ │ storage  │
              └──────────┘ └──────────┘
```

---

## 7. IndexedDB Schema (Extension)

The extension uses its own IndexedDB database (`ielts-journey-extension`) with the same schema as the main website (`ielts-journey`) for full compatibility.

### Object Stores

| Store               | Key Path | Indexes                          | Purpose                                 |
|---------------------|----------|----------------------------------|-----------------------------------------|
| `vocabulary`        | `id`     | `word`, `topic`, `status`        | Saved vocabulary items from web         |
| `vocabularyReviews` | `id`     | `vocabularyId`, `nextReviewDate` | Spaced repetition data                  |
| `mistakes`          | `id`     | `skill`, `status`                | Mistake notebook                        |
| `grammarNotes`      | `id`     | `topic`, `status`                | Grammar notes from web                  |
| `readingPassages`   | `id`     | `topic`                          | Saved articles/passages                 |
| `listeningTranscripts` | `id`  | `topic`                          | YouTube/saved transcripts               |
| `usefulPhrases`     | `id`     | `topic`, `skill`                 | Saved phrases from web                  |
| `exampleSentences`  | `id`     | `topic`                          | Saved example sentences                 |
| `progressRecords`   | `id`     | `date`, `skill`                  | Daily progress tracking                 |
| `studyNotes`        | `id`     | `topic`, `skill`                 | General study notes from web            |
| `speakingQuestions` | `id`     | `topic`, `part`                  | Speaking ideas from web                 |
| `writingPrompts`    | `id`     | `topic`, `taskType`              | Writing ideas from web                  |
| `aiCache`           | `word`   | `word` (unique)                  | Cached AI responses (dictionary panel)  |

### Extension-Only Stores

| Store                  | Key Path | Purpose                                    |
|------------------------|----------|---------------------------------------------|
| `savedPages`           | `id`     | Saved full pages (title, url, date, topic) |
| `youtubeSessions`      | `id`     | YouTube video save records                  |
| `syncLog`              | `id`     | Sync history with website                   |

### IndexedDB Connection Management

The extension uses the same `idb` library as the main website, wrapped in a shared `@ielts/storage` package.

```typescript
// packages/storage/src/db.ts
import { openDB, IDBPDatabase } from "idb"

const DB_NAME = "ielts-journey-extension"
const DB_VERSION = 1

export async function getExtensionDb(): Promise<IDBPDatabase<ExtensionSchema>> {
  return openDB<ExtensionSchema>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      // Same schema as website DB + extension-specific stores
      if (oldVersion < 1) {
        db.createObjectStore("vocabulary", { keyPath: "id" })
        db.createObjectStore("vocabularyReviews", { keyPath: "id" })
        db.createObjectStore("mistakes", { keyPath: "id" })
        db.createObjectStore("grammarNotes", { keyPath: "id" })
        db.createObjectStore("readingPassages", { keyPath: "id" })
        db.createObjectStore("listeningTranscripts", { keyPath: "id" })
        db.createObjectStore("usefulPhrases", { keyPath: "id" })
        db.createObjectStore("exampleSentences", { keyPath: "id" })
        db.createObjectStore("progressRecords", { keyPath: "id" })
        db.createObjectStore("studyNotes", { keyPath: "id" })
        db.createObjectStore("speakingQuestions", { keyPath: "id" })
        db.createObjectStore("writingPrompts", { keyPath: "id" })
        db.createObjectStore("aiCache", { keyPath: "word" })
        db.createObjectStore("savedPages", { keyPath: "id" })
        db.createObjectStore("youtubeSessions", { keyPath: "id" })
        db.createObjectStore("syncLog", { keyPath: "id" })
      }
    },
  })
}
```

---

## 8. Manifest V3 Configuration

```json
{
  "manifest_version": 3,
  "name": "IELTS Learning Journey",
  "version": "0.1.0",
  "description": "Collect English learning material from any webpage and save to your IELTS study app.",
  "permissions": [
    "activeTab",
    "contextMenus",
    "storage",
    "alarms",
    "offscreen"
  ],
  "host_permissions": [
    "https://www.youtube.com/*"
  ],
  "background": {
    "service_worker": "src/background/index.ts",
    "type": "module"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["src/content/index.ts"],
      "run_at": "document_idle",
      "world": "ISOLATED"
    }
  ],
  "action": {
    "default_popup": "popup/index.html",
    "default_title": "IELTS Learning Journey",
    "default_icon": {
      "16": "icons/icon-16.png",
      "48": "icons/icon-48.png",
      "128": "icons/icon-128.png"
    }
  },
  "options_page": "options/index.html",
  "icons": {
    "16": "icons/icon-16.png",
    "48": "icons/icon-48.png",
    "128": "icons/icon-128.png"
  },
  "web_accessible_resources": [
    {
      "resources": ["content/bridge-client.js"],
      "matches": ["http://localhost:*/*", "https://ielts-journey.app/*"]
    }
  ],
  "keyboard_shortcuts": {
    "Ctrl+Shift+S": "Save Selection",
    "Ctrl+Shift+E": "Explain Selection",
    "Ctrl+Shift+D": "Open Dictionary"
  },
  "privacy": {
    "no_backend": true,
    "data_collection": "none",
    "ai_api_keys": "stored_locally_only",
    "permissions_rationale": {
      "activeTab": "To read page title and URL when saving content",
      "contextMenus": "To add right-click save option",
      "storage": "To store your settings and AI cache",
      "alarms": "To check for pending vocabulary reviews daily"
    }
  }
}
```

---

## 9. Security & Privacy

### 9.1 Manifest V3 Security Practices

- **Isolated world** for content scripts — no access to page's JavaScript variables, preventing DOM clobbering and XSS
- **Service worker** handles all AI API calls — API key never exposed to page context
- **No `<all_urls>` host permission** — uses `activeTab` + minimal specific host permissions
- **`web_accessible_resources`** scoped to specific matches (localhost + production domain)
- **CSP** enforced by MV3 default — no inline scripts in extension pages
- **No eval()** — use Vite's ESM build output

### 9.2 AI API Key Security

```
┌─────────────────────────────────────────────────────────┐
│  API Key Storage & Access                               │
│                                                          │
│  Storage: chrome.storage.local (extension-scoped)        │
│  Never: hard-coded in source, sent to backend, or        │
│         exposed to webpage JavaScript                    │
│                                                          │
│  Access Flow:                                            │
│  1. User enters key in Options page                      │
│  2. Options page stores in chrome.storage.local          │
│  3. Service worker reads chrome.storage.local            │
│  4. Service worker includes in fetch() to AI endpoint    │
│  5. Content script NEVER sees the key                    │
│  6. Popup NEVER sees the key                             │
└─────────────────────────────────────────────────────────┘
```

### 9.3 Privacy Guarantees

- No browsing history is collected or transmitted
- Webpage content is only processed when the user explicitly triggers an action (select text, right-click, click toolbar)
- AI API calls only send the text the user explicitly selected (not the full page)
- No analytics, no telemetry, no third-party requests except to the user-configured AI API endpoint
- Extension permissions are minimal and documented in the privacy section of settings
- All data can be exported, imported, and deleted by the user at any time

### 9.4 Permission Rationale

| Permission       | Why Needed                                    | Risk                             |
|------------------|-----------------------------------------------|----------------------------------|
| `activeTab`      | Read current tab URL and title when saving    | Low — only when user triggers    |
| `contextMenus`   | Add right-click "Save to IELTS" option        | Low — single menu item           |
| `storage`        | Store settings, AI cache, sync state          | None — local only                |
| `alarms`         | Daily check for pending reviews               | None — infrequent                |
| `youtube.com`    | Detect YouTube pages for video helper         | Low — only URL pattern match     |

---

## 10. Build & Development

### 10.1 Vite Config for Extension

The extension uses Vite with the `@crxjs/vite-plugin` or a custom build setup to handle Manifest V3 multi-entry builds.

```typescript
// apps/extension/vite.config.ts
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import { crx } from "@crxjs/vite-plugin"
import manifest from "./public/manifest.json"

export default defineConfig({
  plugins: [react(), crx({ manifest })],
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        popup: "popup/index.html",
        options: "options/index.html",
        background: "src/background/index.ts",
        content: "src/content/index.ts",
      },
    },
  },
})
```

### 10.2 Build Commands

```bash
# Build extension
cd apps/extension
pnpm build          # Outputs to apps/extension/dist/

# Watch mode for development
pnpm dev            # Hot-reloads extension in browser

# Type check
pnpm typecheck

# Lint
pnpm lint
```

### 10.3 Loading in Chrome (Development)

1. Build the extension: `pnpm build`
2. Open Chrome → `chrome://extensions`
3. Enable "Developer mode" (top right)
4. Click "Load unpacked"
5. Select `apps/extension/dist/`
6. Extension icon appears in toolbar

### 10.4 Chrome Web Store Preparation

- Ensure all icons are provided in required sizes (16, 48, 128)
- Screenshots of popup, options page, and floating toolbar
- Privacy policy document (required by Chrome Web Store)
- Clear description of permissions in store listing
- No obfuscated code (MV3 requirement — source must be readable)

---

## 11. Component Interaction Matrix

| Component          | Talks To                    | Method                           | Purpose                         |
|--------------------|-----------------------------|----------------------------------|---------------------------------|
| Content Script     | Service Worker              | `chrome.runtime.sendMessage`     | Save items, AI requests         |
| Content Script     | Website Page (bridge)       | `window.postMessage`             | Direct sync when website open   |
| Popup              | Service Worker              | `chrome.runtime.sendMessage`     | Fetch dashboard data            |
| Popup              | IndexedDB (extension)       | Direct (via `idb` lib)           | Quick save operations           |
| Options Page       | Service Worker              | `chrome.runtime.sendMessage`     | AI key verification             |
| Options Page       | `chrome.storage.local`      | Direct                           | Read/write settings             |
| Options Page       | IndexedDB (extension)       | Direct                           | Export/import data              |
| Service Worker     | IndexedDB (extension)       | Direct                           | Persist data                    |
| Service Worker     | AI API (remote)             | `fetch()`                        | AI requests                     |
| Service Worker     | Content Script              | `chrome.tabs.sendMessage`        | Response delivery               |
| Background Alarm   | Service Worker              | `chrome.alarms.onAlarm`          | Daily review check              |

---

## 12. Error Handling Strategy

| Error                     | Source                  | Handling                                        |
|---------------------------|-------------------------|-------------------------------------------------|
| API key missing           | AI Request              | Return `API_KEY_MISSING` → show friendly UI     |
| AI API call fails         | AI Request              | Return error message → retry button             |
| IndexedDB write fails     | Storage                 | Log error, show toast "Save failed, try again"  |
| Storage quota exceeded    | Storage                 | Show warning, suggest export + clear            |
| Bridge not responding     | Sync (bridge)           | Fall back to extension-only storage             |
| Invalid import data       | Import                  | Show validation errors, reject import            |
| Network offline           | AI Request              | Show "No internet connection" message            |
| Manifest V3 SW killed     | Service Worker          | Re-initialize on next message (MV3 lifecycle)   |

---

## 13. Performance Considerations

- **AI cache** (`chrome.storage.session`) stores dictionary lookups for 24 hours — avoids repeated API calls for the same word
- **Content script is passive** until user interacts — no CPU usage during normal browsing
- **Floating toolbar** uses `position: fixed` with `z-index: 2147483647` (max) — but is hidden until selection
- **No MutationObserver** on the full DOM — only listen for `mouseup` events for selection detection
- **Popup loads lazily** — only React components for visible sections are rendered
- **IndexedDB queries are async and non-blocking** — no impact on page performance
- **Bridge communication is fire-and-forget** — no blocking waits for website sync

---

## 14. Extension-Only Data Types

```typescript
// packages/types/src/extension.ts

export type SaveCategory =
  | "vocabulary"
  | "phrase"
  | "sentence"
  | "grammar"
  | "reading"
  | "writing"
  | "speaking"
  | "mistake"

export interface SavedPage {
  id: string
  title: string
  url: string
  topic: string
  note: string
  savedAt: ISOString
}

export interface YouTubeSession {
  id: string
  videoTitle: string
  videoUrl: string
  transcript: string
  notes: string
  aiGeneratedContent?: {
    vocabulary?: string[]
    summary?: string
    listeningQuestions?: string[]
    shadowingPractice?: string[]
  }
  savedAt: ISOString
}

export interface ExtensionSettings {
  aiProvider: string
  aiBaseUrl: string
  aiApiKey: string
  aiModel: string
  themeMode: "light" | "dark" | "system"
  floatingToolbarEnabled: boolean
  autoSaveSelection: boolean
  defaultCategory: SaveCategory
  defaultTopic: string
  dictionaryPanelEnabled: boolean
}

export interface TodayStats {
  date: string
  totalSaved: number
  vocabSaved: number
  mistakesSaved: number
  phrasesSaved: number
  pagesSaved: number
}

export interface SyncStatus {
  lastSyncAt: ISOString | null
  pendingItems: Array<{
    id: string
    type: string
    savedAt: ISOString
  }>
  lastSyncResult: "success" | "partial" | "failed" | null
}
```

---

## 15. Shared Export/Import Format Compatibility

The extension uses the exact same `AppExportData` format as the main website (defined in `packages/types/src/import-export.ts`). This ensures:

1. **Extension export → Website import**: User can export from extension and import into website
2. **Website export → Extension import**: User can export from website and import into extension
3. **Full round-trip compatibility**: Same Zod schema validates both sides

```typescript
// packages/types/src/import-export.ts

export const AppExportDataSchema = z.object({
  version: z.number(),
  exportedAt: z.string(),
  vocabulary: z.array(VocabularyEntrySchema),
  vocabularyReviews: z.array(VocabReviewSchema),
  mistakes: z.array(MistakeEntrySchema),
  grammarNotes: z.array(GrammarNoteSchema),
  readingPassages: z.array(ReadingPassageSchema),
  listeningTranscripts: z.array(ListeningTranscriptSchema),
  usefulPhrases: z.array(UsefulPhraseSchema),
  exampleSentences: z.array(ExampleSentenceSchema),
  progressRecords: z.array(ProgressRecordSchema),
  studyNotes: z.array(StudyNoteSchema),
  speakingQuestions: z.array(SpeakingQuestionSchema),
  writingPrompts: z.array(WritingPromptSchema),
  savedPages: z.array(SavedPageSchema).optional(),
  youtubeSessions: z.array(YouTubeSessionSchema).optional(),
})
```

---

## 16. Sync Service Implementation

### 16.1 `@ielts/storage/syncService`

The sync service lives at `packages/storage/src/syncService.ts` and provides a framework-agnostic API for data export, import, sync tracking, and bridge communication.

**Design approach:** Rather than importing extension or website modules directly, the sync service uses **dependency injection** — callers provide `StorageHandlers` (getter/saver/deleter functions for each entity type) and `StorageGet`/`StorageSet` for `chrome.storage` operations. This keeps the package reusable and testable.

**Key exports:**

| Export | Purpose |
|--------|---------|
| `exportExtensionData(handlers)` | Reads all extension stores → `ExtensionExportData` JSON |
| `importExtensionData(data, handlers, mode)` | Writes `ExtensionExportData` into extension stores with merge/replace |
| `getSyncStatus(storageGet)` | Reads pending sync items from `chrome.storage.local` |
| `markItemPending(id, type, get, set)` | Adds an item to the pending sync queue |
| `markItemsSynced(ids, get, set)` | Removes items from pending queue after successful sync |
| `downloadJson(data, filename)` | Triggers a browser file download |
| `readJsonFile(file)` | Reads and parses a JSON `File` object |
| `validateExtensionExportData(data)` | Zod schema validation for backup files |
| `createBridgeMessage(action, data)` | Creates a typed bridge message for `postMessage` |
| `isValidBridgeMessage(data)` | Type guard for incoming bridge messages |

### 16.2 Extension Export Format (`ExtensionExportData`)

```typescript
interface ExtensionExportData {
  meta: {
    version: number
    exportedAt: string
    source: 'extension' | 'website'
    appVersion: string
  }
  learningEntries: Record<string, unknown>[]  // from indexedDB.ts
  vocabulary: Record<string, unknown>[]       // from vocabularyStore.ts
  articles: Record<string, unknown>[]          // from articleStore.ts
  mistakes: Record<string, unknown>[]          // from mistakeStore.ts
  videos: Record<string, unknown>[]            // from videoStore.ts
}
```

The format is extension-specific but convertible to the website's `AppExportData` format via the mapper functions in `syncService.ts`.

### 16.3 Import Modes

| Mode | Behavior |
|------|----------|
| `merge` | Adds new items, keeps existing items with same ID unchanged |
| `replace` | Clears all existing data in each store before importing |

The user chooses the mode in the Backup & Restore UI before uploading a backup file.

### 16.4 Bridge Protocol (Real-time Sync)

When the IELTS Journey website is open, the content script injects a bridge that communicates via `window.postMessage`. The protocol is request-response with `requestId` correlation:

```
Extension → Page: { source: "ielts-extension", action: "SYNC_REQUEST", requestId: "abc" }
Page → Extension: { source: "ielts-page", action: "SYNC_RESPONSE", data: {...}, requestId: "abc" }
```

The bridge is defined in `packages/storage/src/syncService.ts` with `BridgeMessage` and `BridgeResponse` types. The actual injection and message routing is handled by content scripts.

### 16.5 Browser Limitations

| Limitation | Impact | Mitigation |
|------------|--------|------------|
| IndexedDB is **origin-bound** | Extension origin (`chrome-extension://`) and website origin (`http://localhost:5173` or production domain) cannot share the same IndexedDB database | Each maintains its own database; sync is via JSON export/import or bridge when website is open |
| `chrome.storage` is extension-scoped | Website cannot read `chrome.storage.local` | Bridge uses `window.postMessage` for cross-origin communication |
| Service worker lifetime is limited (MV3) | Background sync cannot run indefinitely | Sync happens on-demand or when the user visits the website; no background polling |
| `window.postMessage` requires the website tab to be open | Bridge sync is unavailable when website is closed | Fall back to manual export/import |
| Content scripts run in an **isolated world** | Cannot directly access website's IndexedDB | Bridge script is injected into the page's main world via script element |

---

## 17. Summary

| Aspect                | Decision                                              |
|-----------------------|-------------------------------------------------------|
| Manifest              | V3                                                    |
| UI Framework          | React 18 + TypeScript + Vite                          |
| Styling               | Tailwind CSS 3 (shared theme tokens with website)     |
| Storage               | IndexedDB (primary) + chrome.storage.local (settings/cache) |
| AI                    | User's own API key, called from service worker via fetch |
| Sync with website     | Hybrid: extension-scoped IndexedDB + optional bridge via postMessage |
| Backup                | JSON export/import (shared `ExtensionExportData` format) |
| Content script world  | ISOLATED (MV3 default)                                |
| Permissions           | Minimal: activeTab, contextMenus, storage, alarms    |
| Build                 | Vite + CRXJS plugin                                   |
| Monorepo              | pnpm workspace with shared packages                   |
