# Extension Storage

## Overview

The browser extension (`apps/extension`) uses three storage mechanisms:

1. **chrome.storage.local** — settings, API key, daily progress, sync metadata.
2. **IndexedDB** (`'ielts-journey-extension'`) — offline learning entries, vocabulary, articles, videos, mistakes.
3. **chrome.storage.sync** — cross-device settings subset (no API key).

## chrome.storage.local

| Key | Data | Type |
|---|---|---|
| `extensionSettings` | Full extension settings (toolbar, auto-save, highlight prefs) | `ExtensionSettings` |
| `aiApiKey` | AI API key (separate for security) | string |
| `dailyProgress` | Today's study activity summary | object |
| `lastSyncTime` | Last sync with web app | ISO string |
| `savedItems` | Saved vocabulary/phrases from browsing | array |

`ExtensionSettings` extends `SharedSettings` from `@ielts/settings` with extension-specific fields:
- `floatingToolbar`, `autoSaveSelected`, `autoHighlightSavedVocabulary`
- `autoAiLookup`, `autoTranslateTranscript`
- `highlightExcludedHosts`, `defaultCategory`, `defaultTopic`

## IndexedDB (Extension)

Database name: `'ielts-journey-extension'`, version 5.

| Store | Indexes | Purpose |
|---|---|---|
| `learningEntries` | category, createdAt, topic, skill, status | Captured learning content from web pages |
| `vocabulary` | word, topic, status, createdAt, addedToReview | Saved vocabulary |
| `articles` | topic, status, isReadingPractice, createdAt | Saved articles for reading practice |
| `videos` | platform, topic, status, createdAt | Tracked YouTube/video content |
| `mistakes` | status, skill, topic, createdAt | Captured mistakes |

All stores use `id` as keyPath.

## Settings Bridge

The extension syncs settings with the web app via `SETTINGS_BRIDGE_ACTIONS`:

- `syncFromWebsite(websiteSettings)`: applies web app settings to extension (AI provider, model, base URL, theme).
- `getOverlappingForWebsite(settings)`: extracts settings to send to the web app.
- API key is handled separately via `chrome.storage.local` (never exposed to the web page).

## Sync

- `DataSyncPayload`, `SyncEntityType`, `SyncOperation` types in `@ielts/storage/syncProtocol` define the sync contract.
- `createMessageId()` generates unique message identifiers.
- The extension syncs data to the web app; the web app is the canonical store.
