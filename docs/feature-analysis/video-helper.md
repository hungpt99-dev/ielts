# Video Helper Feature Analysis

## Overview

The Video Helper feature allows users to save YouTube and other video content as learning materials. It runs as a browser extension content script that detects video pages and provides a UI badge for saving, plus a popup panel for transcript-based AI analysis.

## Architecture

### Flow

```
YouTube Page
  → content-script/videoHelper.ts (VideoHelperUI)
    → detects video page, injects floating badge
    → badge click → background/messaging.ts (VIDEO_HELPER_OPEN)
      → services/storage.ts (setPendingVideoInfo → chrome.storage.local)
    → popup/VideoHelper.tsx reads video info via message passing (GET_VIDEO_PAGE_INFO)
      → user pastes transcript manually
      → AI analysis via packages/ai/src/services/video.ts
    → saves to:
      - apps/extension/src/storage/videoStore.ts (IndexedDB)
      - apps/extension/src/storage/vocabularyStore.ts (IndexedDB) — vocab items
      - apps/extension/src/storage/indexedDB.ts — learning entry
```

### Key Components

| Layer | File | Purpose |
|-------|------|---------|
| **Content Script** | `apps/extension/src/content-script/videoHelper.ts` | Detects YouTube pages, injects floating badge, handles click-to-open |
| **Content Script Entry** | `apps/extension/src/content-script/index.ts:4` | Imports videoHelper as side-effect module |
| **Background Messaging** | `apps/extension/src/background/messaging.ts:167-177` | Handles `VIDEO_PAGE_DETECTED` and `VIDEO_HELPER_OPEN` messages |
| **Background Storage** | `apps/extension/src/services/storage.ts:98-108` | Stores/retrieves video page info in `chrome.storage.local` |
| **Popup Component** | `apps/extension/src/popup/components/VideoHelper.tsx` | Main popup UI for transcript paste, AI analysis, and save |
| **Popup Routing** | `apps/extension/src/popup/App.tsx:52-59` | Routes to VideoHelper when view === 'videoHelper' |
| **Dashboard Entry** | `apps/extension/src/popup/components/PopupDashboard.tsx:305-311` | "Video Helper" button on dashboard |
| **Video Storage** | `apps/extension/src/storage/videoStore.ts` | IndexedDB store for saved video entries |
| **AI Services** | `packages/ai/src/services/video.ts` | 4 AI functions: vocabulary, summary, questions, shadowing |
| **AI Schemas** | `packages/ai/src/schemas/video.ts` | Zod schemas: `transcriptVocabularySchema`, `transcriptSummarySchema`, `listeningQuestionSchema`, `shadowingScriptSchema` |
| **AI Prompts** | `packages/ai/src/prompts/video.ts` | System/user prompt builders for each AI analysis type |

## Detection Logic

`detectVideoPage()` in `videoHelper.ts:12-37` checks `window.location.hostname` for `youtube.com` or `youtu.be`. It extracts:
- `videoId` from `?v=` param or pathname (for youtu.be)
- `videoTitle` from `h1.ytd-watch-metadata` selector or `document.title`

Only YouTube is supported. Other platforms return `isVideoPage: false`.

## Content Script UI

`VideoHelperUI` class (`videoHelper.ts:130-205`):
- Injects a fixed-position badge at top-right (80px from top, 16px from right)
- Badge has icon + "IELTS Video Helper / Save for learning" text
- Click sends `VIDEO_HELPER_OPEN` message to background, which stores pending video info
- Uses `MutationObserver` to re-init on URL changes (SPA navigation)
- Responds to `GET_VIDEO_PAGE_INFO` messages from popup

## Popup UI (VideoHelper.tsx)

The popup component presents:
1. **Video Info** — title, URL, platform badge (read-only)
2. **Notes** — free text area
3. **IELTS Topic** — text input for categorization
4. **Transcript** — toggle-able textarea for manual paste; shows character count when filled
5. **AI Analysis** — appears when transcript is present:
   - 4 action buttons: Vocabulary, Summary, Questions, Shadowing
   - Each calls respective AI function from `@ielts/ai`
   - Results shown in tabbed view below buttons
   - Error handling for missing API key
6. **Save** — saves video entry, learning entry, and vocabulary items

### AI Analysis Types

| Type | AI Function | Output Schema | Prompt |
|------|------------|---------------|--------|
| Vocabulary | `generateVocabularyFromTranscript` | `{ words: [{ word, meaning, partOfSpeech, example, synonyms, collocations, context }] }` | Extract 5-10 IELTS-level vocabulary words |
| Summary | `generateSummaryFromTranscript` | `{ summary, keyPoints[], ieltsTopics[] }` | Summarize in 3-5 sentences for listening practice |
| Questions | `generateListeningQuestions` | `{ questions: [{ type, question, options?, correctAnswer, explanation, bandScore? }] }` | Create 3-5 listening comprehension questions |
| Shadowing | `generateShadowingScripts` | `{ scripts: [{ sentence, translation, focusWords[], notes }] }` | Create 5-8 shadowing sentences with Vietnamese translations |

All AI calls use `gpt-4o-mini` by default, configurable via extension settings.

## Storage

### Video Entries (IndexedDB)
- **Database**: `ielts-journey-extension` (version 4)
- **Store**: `videos`
- **Schema** (`videoEntrySchema` in `videoStore.ts:29-57`):
  - `id`, `videoTitle`, `videoUrl`, `platform`, `notes`, `transcript`, `topic`, `tags`
  - `aiVocabulary`, `aiSummary`, `aiKeyPoints`, `aiIeltsTopics`, `aiQuestions`, `aiShadowingScripts`
  - `ai*GeneratedAt` timestamps for each AI result
  - `savedToListening`, `savedToVocabulary` flags
  - `status` ('new' | 'processing' | 'completed'), `createdAt`, `updatedAt`
- **Indexes**: platform, topic, status, createdAt
- **CRUD**: `saveVideoEntry`, `getAllVideos`, `getVideoById`, `updateVideoEntry`, `deleteVideoEntry`, `getVideosByPlatform`, `getVideoStats`

### Chrome Storage
- `lastVideoPage` (key) — stores current video page info via `VIDEO_PAGE_DETECTED`
- `pendingVideoInfo` (key) — stores video info when badge is clicked via `VIDEO_HELPER_OPEN`

### Side Effects on Save

When saving, the popup also:
1. Saves a **learning entry** to `apps/extension/src/storage/indexedDB.ts` with category 'reading' and skill 'listening'
2. Saves each AI-extracted **vocabulary item** to `vocabularyStore.ts` (IndexedDB), marked `addedToReview: true`
3. Increments `dailyProgress.wordsAdded` and `dailyProgress.articlesSaved` in `chrome.storage.local`

## Transcript Acquisition Gap

The most significant user friction point: **transcripts must be manually copied and pasted** by the user. There is no:
- YouTube Captions API integration
- YouTube Data API v3 transcript fetching
- Automatic speech-to-text processing

This is explicitly noted in the UI: _"For YouTube videos, the Video Helper badge appears on the video page. Paste the transcript manually for AI analysis."_ (`VideoHelper.tsx:534`)

## Automation Opportunities

1. **Automatic transcript fetch** — Use YouTube Captions API or `youtube-transcript` library to fetch transcripts automatically when `videoId` is known
2. **Auto-detect non-YouTube video pages** — Extend `detectVideoPage()` to support other platforms (Vimeo, TED, etc.)
3. **Background transcript processing** — When `videoId` is present, fetch transcript in background without requiring popup open
4. **Auto-trigger AI analysis** — Run vocabulary/summary generation automatically once transcript is available
5. **Batch video import from playlists/channels** — Allow users to import multiple videos at once
6. **Speech-to-text fallback** — For videos without captions, offer audio extraction + STT

## Tests

- `apps/extension/src/__tests__/backgroundMessaging.test.ts` — tests `VIDEO_HELPER_OPEN` handler (stores pending video info)
- `apps/extension/src/__tests__/storageService.test.ts` — tests `setVideoPageInfo`/`getVideoPageInfo` and `setPendingVideoInfo`/`getPendingVideoInfo`
