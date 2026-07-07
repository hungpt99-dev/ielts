# Proactive AI Tutor — Codebase Audit Report

> **Date:** 2026-07-07
> **Scope:** Existing AI Tutor, local storage, user actions, extension actions, and settings

---

## 1. Project Architecture Overview

### Monorepo Structure (pnpm workspaces)

| Package/App | Path | Role |
|---|---|---|
| `apps/web` | `apps/web/` | Main web application (React + Vite + TypeScript) |
| `apps/extension` | `apps/extension/` | Chrome Extension (Manifest V3) |
| `packages/ai-tutor` | `packages/ai-tutor/` | Shared AI Tutor UI components, proactive engine, event bus |
| `packages/ai` | `packages/ai/` | AI provider abstraction (OpenAI adapter, `callAI`, caching) |
| `packages/storage` | `packages/storage/` | IndexedDB schema + repositories (33 tables) |
| `packages/settings` | `packages/settings/` | Shared settings schemas (Zod), bridge protocol |
| `packages/learning-engine` | `packages/learning-engine/` | Local learning analytics (weakness detection, SM-2, progress) |
| `packages/content` | `packages/content/` | Built-in IELTS content + search |
| `packages/exercises` | `packages/exercises/` | Exercise generation & scoring |
| `packages/ui` | `packages/ui/` | Shared UI components and icons |
| `packages/theme` | `packages/theme/` | Theme tokens and utilities |
| `packages/utils` | `packages/utils/` | Shared utility functions |

---

## 2. AI Tutor Implementation

### 2.1 Existing AI Tutor Code (4 distinct locations)

#### A. `apps/web/src/features/ai-tutor/` — Main AI Tutor Service

**Files:**
- `aiTutorService.ts` (801 lines) — Core `AITutorService` class: builds context, generates daily briefings, task suggestions, proactive messages, mistake reviews, exercise generation, question answering via `callAI`
- `AITutorChat.tsx` (235 lines) — Full-featured AI Tutor chat with voice support, wraps `ChatPopup`
- `components/AITutorCard.tsx` (198 lines) — Dashboard card showing greeting + stats
- `components/AITutorChatEntry.tsx` (245 lines) — Chat bubble component
- `components/AITutorPopup.tsx` (189 lines) — Popup/overlay chat widget

**Key Method:** `getProactiveMessage(ctx)` returns context-aware proactive message or `null`. Uses rule-based logic within the service.

#### B. `apps/web/src/components/aiTutor/` — Helper Functions

**Files:**
- `aiTutorHelper.ts` (940 lines) — 17+ AI generation functions with mode-specific prompts
  - Includes `aiGenerateProactiveMessage()` — generates proactive coaching messages
  - Includes `aiGenerateDailyCheckIn()` — generates daily check-in greeting
- `ReadingListeningTutor.tsx` (902 lines) — Reading/listening tutor helpers & components
- `WritingTutor.tsx` (1208 lines) — Writing tutor with brainstorming, outlining, feedback

#### C. `apps/web/src/pages/AITutorChat.tsx` — Main Chat Page

2048+ lines. Full-page AI Tutor with 11 assistant modes, teaching flows, voice support, memory panel, context manager. The primary user-facing tutor experience.

#### D. `apps/web/src/models/aiTutorModels.ts` (310 lines)

Types: `AssistantMode`, `ChatMessage`, `ChatSession`, `TutorMemory`, `UserTutorPreferences`, `ProactiveSuggestion`, `Reminder`, `TutorContext`, `WritingFeedbackRecord`, `ExerciseResult`

### 2.2 AI Service Layer (`packages/ai/`)

- `createAIClient()` / `callAI()` — Provider-agnostic AI invocation
- `OpenAIAdapter` — Default adapter
- Caching layer for explain, vocab, transcript, article functions
- Zod schemas for structured AI outputs

### 2.3 Current AI Tutor Data Flow

```
User Input → pages/AITutorChat.tsx
  → LocalTutorStorage (persist message)
  → aiTutorHelper functions (template + AI responses)
  → @ielts/ai callAI() → OpenAI/other provider
  → LocalTutorStorage (persist response)
```

### 2.4 Current Proactive Message Support

AI Tutor can proactively suggest, but **only within the chat context**:
- `aiTutorService.getProactiveMessage()` — runs per-user request
- `aiTutorHelper.aiGenerateProactiveMessage()` — AI-generated coaching
- No event-driven proactive system exists yet

### 2.5 Existing Event Emissions

| CustomEvent | Source | Purpose |
|---|---|---|
| `'vocabulary-changed'` | `vocabularyEvents.ts` | UI cross-component sync |
| `'ielts-settings-updated'` | `SettingsStorage.ts:156` | Settings cross-tab sync |
| `'toggle-ai-tutor-chat'` | AITutorPopup, AITutorChat | Chat widget toggle |
| `window.postMessage` bridge | `VocabularySync.ts` | Extension ↔ Web app sync |

**There is NO analytics, telemetry, or event logging system.** Zero user action tracking infrastructure exists.

---

## 3. Storage Abstractions

### 3.1 Storage Layers

| Layer | Technology | Used For | Validation |
|---|---|---|---|
| `@ielts/storage` (package) | Dexie.js + IndexedDB | All structured learning data (33 tables) | Zod at repository write boundary |
| `SettingsStorage.ts` (web) | localStorage | App settings, theme, notifications | Spread-merge with defaults (no Zod) |
| `configuration/storage.ts` (web) | localStorage | Deep config (`UserConfiguration`) | Manual validation + versioned migrations |
| `LocalTutorStorage.ts` (web) | Dexie.js + IndexedDB | Tutor chat sessions, messages, memory, proactive suggestions, exercises | Typescript interfaces |
| `settingsStorage.ts` (extension) | chrome.storage.sync + local | Extension settings + API key | Zod safeParse |
| `storage.ts` (extension) | chrome.storage.local | Daily progress, saved items, video info | Manual |
| `storage-bridge.ts` (extension) | chrome.storage.local + messages | Auth state, sync state | Manual |

### 3.2 IndexedDB Schema (`@ielts/storage`)

**Database:** `ielts-journey` (version 6), **33 object stores**:

| Store | Key Path |
|---|---|
| `vocabulary` | id |
| `vocabularyReviews` | id |
| `tasks` | id |
| `mistakes` | id |
| `readingSessions` | id |
| `listeningSessions` | id |
| `writingSessions` | id |
| `speakingSessions` | id |
| `readingPracticeSessions` | id |
| `listeningPracticeSessions` | id |
| `progressRecords` | id |
| `topicProgress` | id |
| `mockTests` | id |
| `grammarNotes` | id |
| `exampleSentences` | id |
| `studyNotes` | id |
| `customStudyPlans` | id |
| `usefulPhrases` | id |
| `aiContents` | id |
| `publicApiContent` | id |
| `contentMeta` | id |
| `userContentEdits` | id |
| `readingPassages` | id |
| `listeningTranscripts` | id |
| `writingPrompts` | id |
| `speakingQuestions` | id |
| `ieltsTopics` | id |
| `passageEntry` | id |
| `speakingExercises` | id |
| `writingExercises` | id |
| `readingExercises` | id |
| `listeningExercises` | id |
| `artifacts` | id |

### 3.3 Tutor-Specific IndexedDB (`LocalTutorStorage`)

**Database:** Internal Dexie database with 8 tables:

| Table | Key | Indices |
|---|---|---|
| `chatSessions` | id | mode, topic, lastMessageAt, isPinned, createdAt |
| `chatMessages` | id | sessionId, role, mode, createdAt |
| `tutorMemory` | id | — |
| `reminders` | id | type, isEnabled, createdAt |
| `savedAiNotes` | id | type, sessionId, createdAt |
| `proactiveSuggestions` | id | type, isAccepted, createdAt |
| `exerciseResults` | id | sessionId, type, createdAt |
| `writingFeedbacks` | id | sessionId, createdAt |

### 3.4 localStorage Key Registry

Tracked in `LOCAL_STORAGE_REGISTRY` (storageService.ts):

| Key | Schema Version |
|---|---|
| `ielts-settings` | 1 |
| `ielts-tutor-preferences` | 1 |
| `ielts-tutor-memory-legacy` | 1 |
| `ielts-theme-mode` | 1 |
| `ielts-accent-color` | 1 |
| `ielts-dark-mode` | 1 |
| `ielts-notification-prefs` | 1 |
| `ai-tutor-chat-memory` | 1 |

**Untracked keys** (proactive system):
- `ielts-proactive-settings-v3` — ProactiveMessageSettings (web app)
- `ielts-proactive-message-settings` — settings (ProactiveMessageService, packages)
- `ielts-proactive-messages` — stored messages (ProactiveMessageService)
- `ielts-proactive-triggered-today` — triggered IDs (ProactiveMessageEngine)

### 3.5 Storage Service Facade (`storageService.ts`)

Singleton `StorageService` combining IndexedDB + localStorage + tutor storage:
- `initialize()` — opens DB, runs migrations
- `getAppSettings()`, `saveAppSettings()`, `patchAppSettings()`
- `exportAllData()`, `importAllData()` — full data portability
- `clearAllData()`, `resetAllData()` — destructive operations

---

## 4. Proactive Message Infrastructure (Existing)

### 4.1 In `@ielts/ai-tutor` (package)

| Module | Lines | Purpose |
|---|---|---|
| `types/proactiveMessage.ts` | 221 | Zod schemas: `ProactiveMessage`, `ProactiveMessageSettings`, trigger types (21), categories (13), priorities (3), action, interaction |
| `services/proactiveMessageEngine.ts` | 901 | Engine: 20 message generators, cooldown logic, quiet hours, frequency enforcement, `canSendProactiveMessage()`, `generateProactiveMessages()`, `generateProactiveMessagesWithSettings()` |
| `services/proactiveEventBus.ts` | 98 | Observer-pattern event bus: newMessage, messageRead, messageDismissed, messageSnoozed, messagesCleared, settingsChanged |
| `services/proactiveMessageService.ts` | 107 | localStorage persistence for settings + messages, `canSendNow()`, `getMessagesForToday()` |
| `hooks/useProactiveMessages.ts` | 220 | React hook: messages state, generate, mark read/dismiss/snooze, settings management |
| `components/ProactiveMessagePreview.tsx` | 74 | Preview card component |
| `components/NotificationCenter.tsx` | — | Notification center UI |

### 4.2 In `apps/web/src/` (web app)

| Module | Lines | Purpose |
|---|---|---|
| `services/ProactiveMessageEngine.ts` | 1216 | `ProactiveMessageEngine` class: periodic checks (120s interval), 10 checker methods, AI-enhanced generation, browser notifications, persistence, read/dismiss/snooze |
| `features/aiTutor/hooks/useProactiveSettings.ts` | 261 | Hook + types: `ProactiveMessageSettings`, 13 categories, validation, load/save/reset |
| `features/aiTutor/components/ProactiveSettings.tsx` | 602 | Full settings UI: tone, frequency, quiet hours, categories, skill priority, channels |
| `features/aiTutor/components/ProactiveMessageCard.tsx` | 204 | Message card with action/dismiss/snooze |
| `features/aiTutor/components/ProactiveMessageList.tsx` | 198 | Filterable message list with category filter |
| `features/aiTutor/tests/ProactiveSettings.test.tsx` | — | Settings tests |

### 4.3 In `apps/extension/` (extension)

| Module | Lines | Purpose |
|---|---|---|
| `popup/components/ExtensionProactiveMessages.tsx` | 356 | Popup widget showing pending proactive messages |
| `content-script/proactiveMessagePanel.tsx` | — | In-page proactive message panel |

### 4.4 Key Observations on Existing Proactive Infrastructure

- **Two parallel settings systems:** `apps/web` has `ielts-proactive-settings-v3` with `enabled: true` default; the `@ielts/ai-tutor` package has `ielts-proactive-message-settings` with `enabled: true` default
- **Two message storage systems:** Web app uses `LocalTutorStorage.proactiveSuggestions` (IndexedDB) + localStorage for messages/triggered; package uses localStorage for all messaging
- **Two proactive engines:** `ProactiveMessageEngine` in web app (class-based, periodic timer) and `proactiveMessageEngine.ts` in package (stateless generators)
- **No event-driven architecture exists yet:** Current proactive system is timer-based (`checkAndGenerate` runs every 120s), not action-event-driven
- **No learning event model exists:** User actions (vocabulary save, task complete, etc.) do not emit standardized events
- **Default is `enabled: true`** which contradicts the spec requirement of defaulting to off

---

## 5. Website User Actions Audit

### 5.1 Current User Actions and Storage

| Action | Storage | Events Emitted? |
|---|---|---|
| Vocabulary saved | IndexedDB `vocabulary` | `'vocabulary-changed'` CustomEvent |
| Vocabulary reviewed | IndexedDB `vocabularyReviews` | No |
| Vocabulary rated | IndexedDB `vocabularyReviews` (SM-2) | No |
| Task created | IndexedDB `tasks` | No |
| Task completed | IndexedDB `tasks` (isDone flag) | No |
| Task deleted | IndexedDB `tasks` | No |
| Mistake saved | IndexedDB `mistakes` | No |
| Reading practice | IndexedDB `readingSessions` | No |
| Listening practice | IndexedDB `listeningSessions` | No |
| Writing practice | IndexedDB `writingSessions` | No |
| Speaking practice | IndexedDB `speakingSessions` | No |
| Study plan generated | localStorage `ielts-roadmap` | No |
| Roadmap viewed | — | No |
| Dashboard opened | — | No |
| Today plan opened | IndexedDB `tasks` | No |
| Progress viewed | Computed from all stores | No |
| Settings changed | localStorage | `'ielts-settings-updated'` CustomEvent |
| AI provider configured | localStorage | No |

### 5.2 Key Service Files

| File | Purpose |
|---|---|
| `features/vocabulary/vocabularyService.ts` | Vocabulary CRUD (add, update, delete, rate, toggle favorite, change status, get due reviews, compute stats, generate exercises) |
| `features/vocabulary/vocabularyEvents.ts` | Emits `'vocabulary-changed'` on vocabulary mutations |
| `services/storage/VocabularySync.ts` | Extension ↔ Web app vocabulary sync via postMessage |
| `pages/DailyPlan.tsx` | Daily plan CRUD (load, toggle done, create/update, delete) |
| `features/roadmap/roadmapService.ts` | Roadmap generation, task toggling, progress recalculation |
| `features/progress/progressService.ts` | Full progress computation from all IndexedDB stores |
| `hooks/useDashboard.ts` | Dashboard data loading |
| `services/storage/Database.ts` | Dexie.js IndexedDB setup (33 stores) |

### 5.3 Key Hook Files

| Hook | File | Purpose |
|---|---|---|
| `useDashboard()` | `hooks/useDashboard.ts` | Loads dashboard data |
| `useTutorNavigation()` | `hooks/useTutorNavigation.ts` | Navigate to AI Tutor with context |
| `useAutosave()` | `hooks/useAutosave.ts` | Debounced form autosave |
| `useVoice()` | `voice/useVoice.ts` | Voice recording for speaking |

---

## 6. Extension Actions Audit

### 6.1 Extension Structure

```
apps/extension/
├── manifest.json            — MV3, permissions: storage, contextMenus, activeTab
├── src/
│   ├── types.ts             — Zod schemas for learning entries
│   ├── background/
│   │   ├── index.ts         — Service worker: context menus, messaging, AI service
│   │   ├── messaging.ts     — 13 message type handlers
│   │   ├── storage-bridge.ts— Chrome.storage ↔ IndexedDB sync
│   │   ├── ai-service.ts    — AI explain service
│   │   └── settingsStorage.ts — Extension settings (Zod validated)
│   ├── content-script/
│   │   ├── index.ts         — Entry: initializes all modules
│   │   ├── bridge-client.ts — postMessage bridge for web app communication
│   │   ├── saveSelectedText.ts — Handle SAVE_SELECTION, SAVE_SELECTION_FULL
│   │   ├── vocabularySaveHandler.ts — Show proactive messages after vocabulary saves
│   │   ├── selectionPanel.ts — Floating selection action panel
│   │   ├── aiExplain.ts     — AI-powered text explanation
│   │   ├── miniTutor.ts     — Mini AI tutor trigger
│   │   ├── videoHelper.ts   — YouTube video helper
│   │   ├── dictionaryPanel.ts — Dictionary lookup panel
│   │   ├── proactiveMessagePanel.tsx — In-page proactive learning reminders
│   │   └── highlighter/     — Saved keyword highlighter
│   ├── popup/
│   │   ├── main.tsx         — React DOM entry
│   │   ├── App.tsx          — View router
│   │   └── components/      — 18 components (PopupDashboard, VocabularyCollector, etc.)
│   ├── services/
│   │   ├── storage.ts       — Chrome.storage.local helper + daily progress
│   │   ├── storage-bridge.ts— Auth/sync state management
│   │   └── api-client.ts    — API client
│   └── storage/
│       ├── db.ts            — Extension IndexedDB (5 stores)
│       ├── vocabularyStore.ts
│       ├── articleStore.ts
│       ├── videoStore.ts
│       ├── mistakeStore.ts
│       └── indexedDB.ts     — Generic operations
```

### 6.2 Extension Message Types (background/messaging.ts)

| Type | Handler |
|---|---|
| `GET_DAILY_PROGRESS` | Returns daily progress |
| `UPDATE_PROGRESS` | Updates daily progress |
| `OPEN_OPTIONS` | Opens options page |
| `VIDEO_PAGE_DETECTED` | Caches video page info |
| `VIDEO_HELPER_OPEN` | Sets pending video info |
| `MINI_TUTOR_SAVE_RESULT` | Saves learning entry |
| `MINI_TUTOR_OPEN_PAGE` | Opens mini tutor in tab |
| `SAVE_SELECTION_FULL` | Saves full entry + vocab |
| `AI_EXPLAIN` | Forwards to AI service |
| `SETTINGS_SYNC` | Syncs settings from website |
| `VOCAB_SAVED` | Broadcasts to all tabs |

### 6.3 Extension Actions and Event State

| Extension Action | Event Emitted? |
|---|---|
| Popup opened | No |
| Vocabulary saved from webpage | No |
| Selected text explained | No |
| Selected text simplified | No |
| Article saved from webpage | No |
| Video content saved | No |
| Saved word highlighted | No |
| Auto-highlight enabled/disabled | No |
| Vocabulary review from extension | No |
| AI Tutor opened from extension | No |

### 6.4 Extension ↔ Web Bridge

```
Extension Content Script (bridge-client.ts)
  ↔ postMessage ↔ Web App (VocabularySync.ts)

Protocols: VOCAB_SAVED, VOCAB_LIST_SYNC, VOCAB_SAVED_BY_WEB,
           REQUEST_EXTENSION_VOCAB, SETTINGS_CHANGED, SETTINGS_SYNC
```

---

## 7. Settings Audit

### 7.1 Settings Systems

#### A. Legacy `AppSettings` (SettingsStorage.ts + useSettings context)

Stored in `ielts-settings` (localStorage). Used by main Settings pages.

```typescript
interface AppSettings {
  targetBand, currentBand, examDate, dailyStudyMinutes,
  weakSkills, preferredTopics, studyReminder, studyGoal,
  preferredSchedule, aiApiKey, aiProvider, aiBaseUrl,
  aiEndpoint, aiModel, darkMode, aiEnabled
}
```

#### B. Configuration `UserConfiguration` (configuration/storage.ts + ConfigProvider)

Stored in `ielts-configuration` (localStorage). Used by DeepConfigPanel.

```typescript
interface UserConfiguration {
  basic: { targetBand, examDate, responseLanguage, tutorMode, dailyStudyMinutes }
  advanced: {
    activeProviderId, providers, tutorConfig, vocabReview,
    speakingFeedback, writingCorrection, privacy
  }
}
```

#### C. Proactive Settings (useProactiveSettings hook)

Stored in `ielts-proactive-settings-v3` (localStorage).

```typescript
interface ProactiveMessageSettings {
  enabled: boolean  // defaults to true
  tone: TutorTone
  preferredStudyTime: string
  dailyReminderTime: string
  reminderFrequency: ReminderFrequency
  weakSkillPriority: string[]
  notificationChannels: NotificationChannel[]
  automationLevel: AutomationLevel
  autoSuggestExercises: boolean
  autoWeeklyReview: boolean
  categories: Record<ProactiveMessageCategory, boolean>  // 13 categories
  quietHoursStart: string  // '22:00'
  quietHoursEnd: string    // '08:00'
  maxMessagesPerDay: number  // 5
  lastRemindedAt?: string
  updatedAt: string
}
```

#### D. `@ielts/ai-tutor` Package Settings (ProactiveMessageService)

Stored in `ielts-proactive-message-settings` (localStorage).

```typescript
interface ProactiveMessageSettings {
  enabled: boolean  // defaults to true
  browserNotifications: boolean
  aiEnhanced: boolean
  quietHoursStart, quietHoursEnd, reminderTime
  maxMessagesPerDay: number  // 5
  categories: Record<string, boolean>  // 8 categories
}
```

### 7.2 Settings Pages

| File | Type | Features |
|---|---|---|
| `pages/Settings.tsx` | Tabbed sidebar | 7 sections: Goal, AI Tutor, Study Plan, Appearance, Notifications, Advanced, Data |
| `features/settings/Settings.tsx` | Single scroll | 11 cards stacked vertically |
| `features/aiTutor/components/ProactiveSettings.tsx` | Standalone | Proactive-specific settings (602 lines) |

### 7.3 Settings Bridge (Extension ↔ Web)

- `packages/settings/bridge.ts` — Bridge protocol types
- `SettingsStorage.ts` + `bridge-client.ts` — postMessage sync
- `background/settingsStorage.ts` — Extension settings with Zod + chrome.storage.sync
- Extension settings schema extends `sharedSettingsSchema` with toolbar, auto-save, highlight options

---

## 8. Learning Engine Package

**Path:** `packages/learning-engine/src/`

| Service | Key Methods |
|---|---|
| `LearningEngine` | `computeFullState()` — orchestrator |
| `AnalyticsService` | `getStudyConsistency()`, `getWeeklyReflection()`, `getSkillBalance()`, `getBandProgressHistory()` |
| `ProgressService` | `getWeeklyProgress()`, `getSkillProgress()`, `getExerciseAccuracy()` |
| `WeaknessDetectionService` | `getWeaknessReport()`, `detectWeakSkills()`, `detectRepeatedMistakes()` |
| `ReviewSchedulerService` | `getDueReviews()`, `calculateNextReview()`, `getReviewStats()` — SM-2 algorithm |
| `DailyPlanService` | `generateDailyPlan()`, `getTasksForToday()`, `getWeeklySchedule()` |
| `NextBestActionService` | `calculateNextBestActions()` |

**All services are local computation only** — no external analytics or telemetry.

---

## 9. Gap Analysis Summary

### What Exists
- AI Tutor with full chat, proactive suggestion generation, multiple modes
- Proactive message engine with timer-based checks (120s interval)
- Proactive settings UI and persistence
- Proactive message display in web app, extension popup, and content script
- Shared proactive types, generators, cooldown logic in `@ielts/ai-tutor`
- Comprehensive storage layer (IndexedDB 33 tables + localStorage)
- Extension ↔ Web bridge for vocabulary and settings sync
- Learning engine for progress analytics

### What's Missing (for Event-Driven Proactive System)

| Requirement | Status |
|---|---|
| Typed learning event model | ❌ Missing |
| Event bus / event dispatcher | ❌ Missing (ProactiveEventBus only handles messages, not learning events) |
| Event repository (IndexedDB) | ❌ Missing |
| Centralized event emission from user actions | ❌ Missing — actions write directly to DB |
| Event-driven (not timer-driven) proactive engine | ❌ Current system is timer-based |
| Rule engine for decision making | ⚠️ Partial — generators exist but no `shouldShow` decision layer |
| Cooldown / anti-spam rules | ⚠️ Partial — cooldown + quiet hours exist but not integrated with event system |
| Time-based event checks on app open/focus | ❌ Missing |
| Settings toggle with `enabled: false` default | ⚠️ Exists but defaults to `true` |
| Integration with vocabulary save / task completion events | ❌ Missing |
| Integration with extension actions | ❌ Missing |
| Unified settings (single source of truth) | ⚠️ 4 parallel settings systems exist |
| Proactive message inbox (persistent messages) | ⚠️ Partial — multiple storage implementations |
| AI prompt builder for proactive messages | ❌ Missing (uses generic message generators) |
| AI response validation | ❌ Missing |

### Redundancies Detected

1. **Two proactive settings systems** — `ielts-proactive-settings-v3` (web app) vs `ielts-proactive-message-settings` (package)
2. **Two message storage systems** — localStorage in package vs `LocalTutorStorage.proactiveSuggestions` (IndexedDB) in web app
3. **Two proactive engines** — `ProactiveMessageEngine` class (web app) vs `proactiveMessageEngine.ts` generators (package)
4. **Two settings pages** — `pages/Settings.tsx` (tabbed) vs `features/settings/Settings.tsx` (scroll)
5. **Two config storage systems** — `AppSettings` (SettingsStorage) vs `UserConfiguration` (configuration/storage.ts) with overlapping fields

---

## 10. Reuse Opportunities

### Can Reuse Directly

| Module | Location | For |
|---|---|---|
| `ProactiveEventBus` | `packages/ai-tutor/` | Message events (new, read, dismissed, snoozed) |
| `ProactiveMessageService` | `packages/ai-tutor/` | Message persistence (localStorage) |
| `proactiveMessageEngine` generators | `packages/ai-tutor/` | Message generation with cooldown + quiet hours |
| `proactiveMessageSchema` | `packages/ai-tutor/types/` | Zod-validated message model |
| `ProactiveMessageSettings` | `packages/ai-tutor/types/` | Settings type with Zod schema |
| `canSendProactiveMessage()` | `packages/ai-tutor/` | Frequency/quiet hours enforcement |
| `DatabaseService` | `apps/web/src/services/storage/Database.ts` | IndexedDB access for any event repository |
| `StorageService` | `apps/web/src/services/storage/storageService.ts` | Unified storage facade |
| `LocalTutorStorage` | `apps/web/src/services/storage/LocalTutorStorage.ts` | Tutor-specific persistence |
| `loadAppSettings()` | `apps/web/src/services/storage/SettingsStorage.ts` | App settings access |
| `loadConfiguration()` | `apps/web/src/features/configuration/storage.ts` | AI provider config |
| `useTutorNavigation()` | `apps/web/src/hooks/useTutorNavigation.ts` | "Ask AI Tutor" navigation |
| Analytics + Progress services | `packages/learning-engine/` | Context building for proactive decisions |
| Weakness detection | `packages/learning-engine/` | Identify weak skills for context |
| Review scheduler | `packages/learning-engine/` | Due review detection |
| CustomEvent patterns | `vocabularyEvents.ts` | Pattern for website event emission |
| PostMessage bridge | `VocabularySync.ts` + `bridge-client.ts` | Extension event forwarding |

### Needs Adaptation or Rewrite

| Module | Current | Needed |
|---|---|---|
| Event emission | Scattered CustomEvents | Centralized `emitLearningEvent()` |
| Event model | None | Typed event discriminated union |
| Event storage | IndexedDB (no events table) | `learningEvents` IndexedDB table |
| Decision engine | Timer-based `checkAndGenerate()` | Event-driven `ProactiveTutorRuleEngine` |
| Context builder | Inline in `AITutorService` | Dedicated `ProactiveTutorContextBuilder` |
| AI prompt builder | Generic `aiGenerateProactiveMessage()` | Specific prompt templates per event type |
| Message repository | Multiple storage locations | Unified `ProactiveTutorMessageRepository` |
| Local scheduler | `setInterval(120000)` | Time-based checks on app open/focus + cleaner interval |
| Settings | 4 systems, enabled:true default | Single proactive settings, enabled:false default |

---

## 11. Integration Points

### Web App Event Emission Points (where to add `emitLearningEvent`)

| Action | File | Function |
|---|---|---|
| Dashboard opened | `pages/Dashboard.tsx` | mount/effect |
| AI Tutor opened | `pages/AITutorChat.tsx` | mount/effect |
| Today plan opened | `pages/TodayPlanPage.tsx` | mount/effect |
| Study task started | `pages/DailyPlan.tsx` | `handleToggleDone` or task creation |
| Study task completed | `pages/DailyPlan.tsx` | `handleToggleDone` (isDone=true) |
| Study task skipped | `pages/DailyPlan.tsx` | skip action |
| Study plan generated | `features/roadmap/roadmapService.ts` | after roadmap generation |
| Vocabulary saved | `features/vocabulary/vocabularyService.ts` | `addVocabulary()` |
| Vocabulary reviewed | `features/vocabulary/vocabularyService.ts` | `rateWord()` |
| Mistake saved | (mistake service) | after mistake save |
| Progress viewed | `pages/Progress.tsx` | mount/effect |
| Settings changed | `SettingsStorage.ts` | `saveAppSettings()` |

### Extension Event Emission Points

| Action | File | Function |
|---|---|---|
| Popup opened | `apps/extension/src/popup/App.tsx` | mount |
| Vocabulary saved from webpage | `background/messaging.ts` | `SAVE_SELECTION_FULL` handler |
| Selected text explained | `content-script/aiExplain.ts` | after AI explain |
| Article saved | `background/messaging.ts` | `SAVE_SELECTION_FULL` handler |
| AI Tutor opened from extension | `popup/components/AITutorEntry.tsx` | on open |

---

## 12. Existing Test Coverage

| Test File | Tests |
|---|---|
| `apps/web/src/features/ai-tutor/__tests__/aiTutorService.test.ts` | AITutorService (daily briefing, task suggestions, proactive messages, mistake review, exercises, question answering) |
| `apps/web/src/features/aiTutor/tests/ProactiveSettings.test.tsx` | Proactive settings |
| `apps/extension/src/background/__tests__/settingsStorage.test.ts` | Extension settings storage |
| `apps/extension/src/__tests__/storageService.test.ts` | Extension storage service |
| `packages/storage/src/__tests__/` | 11 test files for repositories |
| `apps/web/tests/configuration/storage.test.ts` | Configuration storage |

---

## 13. Design Documents Already Created

| Document | Content |
|---|---|
| `docs/features/proactive-ai-tutor.md` | Full feature spec (21 trigger types, 13 categories, service architecture, anti-annoyance, 13 localStorage keys) |
| `docs/design/proactive-ai-tutor-settings.md` | ProactivePreferences design, migration from v3, 6-section settings UI |
| `docs/design/proactive-ai-tutor-ui-integration.md` | 12 integration surfaces, component tree, message lifecycle, a11y |
| `docs/feature-analysis/proactive-ai-tutor-data-sources.md` | Data source mapping: 16 IndexedDB tables + 3 services, 7 missing triggers |
| `docs/redesign/pages/ai-tutor-chat-spec.md` | AI Tutor chat redesign spec |

---

## 14. Key Recommendations for Implementation

1. **Single event model** — Create `LearningEvent` discriminated union in a shared package or web app
2. **Single event bus** — `ProactiveEventBus` pattern extended for learning events (not just message events)
3. **Reuse `@ielts/ai-tutor` generators** — Build the rule engine decision layer around existing generators
4. **Unify settings** — Consolidate proactive settings into one key (decide between `ielts-proactive-settings-v3` in web app vs `ielts-proactive-message-settings` in package)
5. **Default enabled: false** — Change default to match spec requirement
6. **IndexedDB for events** — Add `learningEvents` table to existing IndexedDB (not a new DB)
7. **Event emission in existing actions** — Add `emitLearningEvent` call to each action point listed above
8. **Time-based checks** — Add `visibilitychange` and `focus` listeners, plus periodic checks
9. **UI surfaces** — Reuse existing `ProactiveMessageCard`, `ProactiveMessageList`, `ExtensionProactiveMessages`
10. **Gradual deprecation** — Transition from `ProactiveMessageEngine` (timer-based class) to event-driven architecture while keeping both operational during migration
