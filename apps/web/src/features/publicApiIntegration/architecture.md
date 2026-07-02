# Public API Integration — Architecture & Data Model

## 1. Overview

The Public API Integration feature adds **optional** content import from external
open/public APIs into the local IndexedDB. It is entirely frontend-only and
local-first — no backend server involved. The core IELTS app experience does not
depend on it.

### Principles

- **Optional**: The app works fully from built-in, user-created, AI-generated, and
  user-collected web content. Public APIs are an enrichment layer.
- **Local-first**: All imported content is stored in IndexedDB. No remote sync.
- **License-aware**: Every import carries source, license, and attribution
  metadata. Content with unclear licenses is rejected.
- **Key-safe**: API keys are user-owned and user-entered. No keys are hardcoded
  or shipped in frontend bundles.

---

## 2. Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                        User Interface                            │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │ Source Panel │  │ Search Panel │  │ Preview Panel          │ │
│  │ (select API  │→ │ (query API,  │→ │ (show content, license,│ │
│  │  source)     │  │  show results)│  │  attribution)          │ │
│  └──────────────┘  └──────────────┘  └───────────┬────────────┘ │
│                                                    │              │
│                                           user confirms import   │
│                                                    │              │
│                                           ┌────────▼───────────┐│
│                                           │ Classification Step││
│                                           │ (AI or manual tags) ││
│                                           └────────┬───────────┘│
│                                                    │              │
│                                           ┌────────▼───────────┐│
│                                           │  IndexedDB Storage ││
│                                           └────────┬───────────┘│
└──────────────────────────────────────────────────────────────────┘
                                                      │
                                                      ▼
┌──────────────────────────────────────────────────────────────────┐
│                     Service Layer                                │
│                                                                  │
│  ┌────────────┬───────────┬────────────┬──────────────┐        │
│  │ ApiService │ Wiktionary│ Datamuse   │ Wikipedia    │        │
│  │ (registry) │ Adapter   │ Adapter    │ Adapter      │        │
│  ├────────────┼───────────┼────────────┼──────────────┤        │
│  │ Tatoeba    │ OER       │ Gutendex   │ YouTube      │        │
│  │ Adapter    │ Commons   │ Adapter    │ Adapter      │        │
│  │            │ Adapter   │            │              │        │
│  └────────────┴───────────┴────────────┴──────────────┘        │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    ImportService                            │ │
│  │  (validation → license check → save to IndexedDB)          │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    CorsService                              │ │
│  │  (proxy fallback, status reporting)                        │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    KeyService                               │ │
│  │  (localStorage for user-entered API keys)                  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    AiClassifyService                        │ │
│  │  (calls existing AI pipeline to classify imported content) │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

---

## 3. Data Flow

### 3.1 Search Flow

```
1. User selects a source (e.g. Wikipedia)
2. User enters a query (e.g. "climate change")
3. UI calls ApiService.search(source, query, options)
4. ApiService routes to the correct adapter
5. Adapter fetches from external API
6. Response is normalized to PublicApiSearchResult[]
7. UI displays results in a list
8. If CORS blocks the request, CorsService offers a proxy fallback
```

### 3.2 Preview Flow

```
1. User clicks a search result
2. UI calls ApiService.preview(source, resultId)
3. Adapter fetches full content (if not already in search result)
4. Response is normalized to PublicApiPreview
5. UI shows:
   - Title and content body
   - Source name and URL
   - License name and attribution text
   - Content type badge
6. If license is missing or "All Rights Reserved":
   - Import button is disabled
   - Warning message is shown
```

### 3.3 Import Flow

```
1. User confirms import in preview panel
2. UI calls ImportService.import(preview)
3. ImportService:
   a. Validates license is open/known
   b. Generates a UUID for the content
   c. Creates a PublicApiImportedContent object with all fields
   d. Saves to IndexedDB via DatabaseService.safeAdd('publicApiContent', ...)
   e. Returns content ID
4. UI shows success message with the imported item
```

### 3.4 Classification Flow (Optional, Post-Import)

```
1. User selects imported content and clicks "Classify with AI"
2. UI calls AiClassifyService.classify(contentId)
3. Service sends content to the existing AI pipeline
   (see packages/ai/src/aiClient.ts — explain function)
4. AI returns: topic, skill, difficulty, tags, vocabulary, summary
5. Classification is saved to the content's aiClassification field
   via DatabaseService.safeUpdate
6. User can also set tags/difficulty manually
```

---

## 4. API Key Handling

### Strategy

| Approach | Applied to |
|---|---|
| **No key required** — use directly from browser | Wiktionary, Datamuse, Tatoeba, OER Commons, Wikipedia, Gutendex |
| **User-owned key (stored in localStorage)** | YouTube Data API |

### Implementation

- Keys are stored in `localStorage` under a namespaced prefix:
  `ielts-api-key-{sourceName}`
- Keys are never logged, never sent to any server other than the API's
  own endpoint, and never included in the frontend bundle.
- Users enter their key through a settings UI panel.
- A `KeyService` module handles read/write/delete of keys.
- The `AppSettings` interface is extended with an optional
  `apiKeys: Record<string, string>` field for export/restore.

### Security Notes

- No hardcoded keys exist in the codebase.
- API calls are made directly from the browser. Users are warned that
  keys are visible in network requests (mitigation: only used for
  low-risk public APIs like YouTube Data API).
- A future improvement could use a browser extension background script
  to proxy requests and hide keys from the page context.

---

## 5. CORS Error Handling

### Source CORS Status

| Source | CORS | Strategy |
|---|---|---|
| Wiktionary | ✅ Direct | No action needed |
| Datamuse | ✅ Direct | No action needed |
| Tatoeba | ✅ Direct | No action needed |
| OER Commons | ✅ Direct | No action needed |
| Wikipedia | ✅ Direct | No action needed |
| Gutendex | ✅ Direct | No action needed |
| YouTube | ❌ Requires server | Redirect user to paste video URL + transcript manually |

### Handling Flow

```
1. ApiAdapter makes a fetch request
2. If fetch succeeds → return data
3. If fetch fails with CORS error (TypeError: Failed to fetch):
   a. CorsService checks if the source has a configured proxy
   b. If proxy is enabled, retry through: proxyUrl + encodeURIComponent(originalUrl)
   c. If proxy also fails or is disabled, return an error message:
      "This source cannot be accessed directly from the browser.
       Configure a CORS proxy in Settings or choose a different source."
4. UI shows the error with:
   - Explanation of why CORS blocks the request
   - Link to configure a proxy (e.g. corsproxy.io, a self-hosted proxy)
   - Alternative sources that work without CORS issues
```

### YouTube Workaround

YouTube Data API does not support browser-side CORS requests. Instead:

1. User enters their YouTube API key in settings
2. App explains that a CORS proxy is required
3. App provides a text input for manually pasting:
   - Video URL
   - Video title
   - Manual transcript
   - User's own notes
4. This manually-entered content is saved with `sourceType: 'public-api'`
   and `sourceName: 'youtube'` so it is treated the same as imported content

---

## 6. Data Model

### IndexedDB Table

New table: `publicApiContent`

Dexie schema: `id, sourceName, contentType, topic, skill, difficulty, *tags, importedAt`

### PublicApiImportedContent

See `src/features/publicApiIntegration/types.ts` for the full TypeScript
interface.

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | `string` (UUID) | Yes | Unique identifier |
| `title` | `string` | Yes | Display title |
| `content` | `string` | Yes | The actual content body |
| `contentType` | `PublicApiContentType` | Yes | Type of content |
| `sourceType` | `'public-api'` | Yes | Fixed value |
| `sourceName` | `PublicApiSourceName` | Yes | Which API provided it |
| `sourceUrl` | `string` | Yes | URL to the original source |
| `licenseName` | `string` | Yes | License name (e.g. "CC BY-SA 3.0") |
| `attribution` | `string` | Yes | Attribution text |
| `importedAt` | `ISOString` | Yes | When it was imported |
| `skill` | `string` | Yes | Mapped IELTS skill |
| `topic` | `string` | Yes | IELTS topic |
| `difficulty` | `'easy'\|'medium'\|'hard'` | Yes | Difficulty level |
| `tags` | `string[]` | Yes | User/classifier tags |
| `userNotes` | `string` | Yes | User's personal notes |
| `aiClassification` | `object` | No | AI classification result |

### Extending AppExportData

The export/import system in `Database.ts` will include the new table:

```typescript
export interface AppExportData {
  // ... existing fields ...
  publicApiContent: PublicApiImportedContent[]
}
```

---

## 7. Database Migration

Add version 3 to the Dexie schema in `Database.ts`:

```typescript
this.version(3).stores({
  // ... all existing table schemas from version 2 ...
  publicApiContent: 'id, sourceName, contentType, topic, skill, difficulty, *tags, importedAt',
})
```

No data migration logic is needed — the table is additive.

---

## 8. AI Integration

### After Import

Users can trigger AI processing on any imported item:

1. **Classify**: Detect IELTS topic, skill, difficulty, and tags
2. **Extract vocabulary**: Pull key vocabulary with definitions
3. **Generate questions**: Create reading/listening questions from the content
4. **Simplify**: Rewrite at a lower language level
5. **Generate prompts**: Create writing/speaking prompts

All AI calls go through the existing `explain()` function in
`packages/ai/src/aiClient.ts`, which uses the user's own AI API key.
AI never runs automatically — only on explicit user action.

---

## 9. Licensing Rules

| License Status | Action |
|---|---|
| Public Domain (CC0, etc.) | Allow import |
| Creative Commons (CC BY, CC BY-SA, etc.) | Allow import |
| Open Educational Resource | Allow import |
| "All Rights Reserved" | Block import, show warning |
| Missing/Unknown | Block import, show warning |
| Custom license (not recognized) | Block with explanation |

---

## 10. Directory Structure

```
src/features/publicApiIntegration/
├── architecture.md           # This document
├── types.ts                  # TypeScript interfaces & constants
├── adapters/                 # One adapter per source
│   ├── WiktionaryAdapter.ts
│   ├── DatamuseAdapter.ts
│   ├── TatoebaAdapter.ts
│   ├── OerCommonsAdapter.ts
│   ├── WikipediaAdapter.ts
│   ├── GutendexAdapter.ts
│   └── YouTubeAdapter.ts
├── services/
│   ├── ApiService.ts         # Registry & routing to adapters
│   ├── ImportService.ts      # Import pipeline
│   ├── CorsService.ts        # CORS proxy handling
│   ├── KeyService.ts         # API key storage
│   └── AiClassifyService.ts  # AI classification bridge
├── components/               # UI components
│   ├── SourceSelector.tsx
│   ├── SearchPanel.tsx
│   ├── PreviewPanel.tsx
│   └── ImportedContentList.tsx
└── hooks/
    ├── usePublicApiSearch.ts
    ├── usePublicApiImport.ts
    └── usePublicApiKeys.ts
```
