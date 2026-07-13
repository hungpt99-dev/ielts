# Data Ownership

This document describes where each category of data lives and which component is the authoritative source.

## Ownership Map

| Data | Authoritative Source | Location | Owner Package |
|---|---|---|---|
| User settings/profile | Web app | `localStorage` key `'ielts-settings'` | `@ielts/settings` |
| AI configuration | Web app (mirrored to extension) | `localStorage` + `chrome.storage.local` | `@ielts/settings` |
| Study plan tasks | Web app | IndexedDB `tasks` table | `@ielts/storage` |
| Learning sessions (new) | Learning engine | Repository port (in-memory/IDB) | `@ielts/learning-engine` |
| Legacy practice sessions | Web app | IndexedDB `readingSessions`, `listeningSessions`, `writingSessions`, `speakingSessions` | `@ielts/storage` |
| Exercises | Web app | IndexedDB `speakingExercises`, `writingExercises`, `readingExercises`, `listeningExercises` | `@ielts/storage` |
| Mistakes | Web app (+ extension) | IndexedDB `mistakes` table | `@ielts/storage` |
| Vocabulary | Web app (+ extension) | IndexedDB `vocabulary` table | `@ielts/storage` |
| Vocabulary reviews | Web app | IndexedDB `vocabularyReviews` table | `@ielts/storage` |
| Progress records | Web app | IndexedDB `progressRecords` table | `@ielts/storage` |
| Learning events | Web app | IndexedDB `learningEvents` table | `@ielts/storage` |
| AI tutor chat | Web app | `localStorage` key `'ai-tutor-chat-memory'` | `@ielts/ai-tutor-engine` |
| Tutor memory | Web app | `localStorage` key `'tutor-memory-{learnerId}'` | `@ielts/ai-tutor-engine` |
| Proactive messages | Web app | `localStorage` | `@ielts/ai-tutor-engine` |
| Public API imported content | Web app | IndexedDB `publicApiContent` table | `@ielts/storage` |
| YouTube data | Web app | IndexedDB 20+ tables (v8) | `@ielts/storage` |
| Extension learning entries | Extension | Extension IndexedDB `learningEntries` store | Extension |
| Extension daily progress | Extension | `chrome.storage.local` | Extension |

## Principles

1. **Web app is primary**: all canonical data lives in the web app's IndexedDB or localStorage.
2. **Extension is secondary**: the extension has its own IndexedDB for offline capture; sync pushes data to the web app.
3. **No server**: there is no backend server. All data is client-side.
4. **Packages own domain logic**: `@ielts/storage` owns persistence; `@ielts/learning-engine` and `@ielts/ai-tutor-engine` own domain models and use repository ports for persistence.
5. **Settings bridge**: the web app and extension sync overlapping settings (AI provider, model, URL, theme) via `SETTINGS_BRIDGE_ACTIONS`.
