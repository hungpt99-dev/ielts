# IELTS Journey — Final Cleanup and Refactor Report

> **Date:** 2026-07-05
> **Scope:** Full codebase refactor for global IELTS learner support
> **Product:** [IELTS Journey](https://github.com/anomalyco/IELTS)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Direction After Cleanup](#2-product-direction-after-cleanup)
3. [Localization Architecture](#3-localization-architecture)
4. [Feature Audit — Removed, Refactored, Retained](#4-feature-audit)
5. [Stale Code Cleanup](#5-stale-code-cleanup)
6. [AI Tutor Globalization](#6-ai-tutor-globalization)
7. [User Profile and Settings Updates](#7-user-profile-and-settings-updates)
8. [Content and Exercise Cleanup](#8-content-and-exercise-cleanup)
9. [Extension Cleanup](#9-extension-cleanup)
10. [New Features Added](#10-new-features-added)
11. [Testing Results](#11-testing-results)
12. [Code Quality Improvements](#12-code-quality-improvements)
13. [Future Recommendations](#13-future-recommendations)

---

## 1. Executive Summary

IELTS Journey has been refactored from a Vietnam-focused IELTS learning app into a **global IELTS learning product** that supports international learners with Vietnamese as one optional language.

**Key outcomes:**

| Area | Before | After |
|------|--------|-------|
| Default language | Vietnamese assumptions throughout | English (global default) |
| Localization | Hard-coded Vietnamese text | English-first, Vietnamese as option |
| AI Tutor prompts | Mixed Vietnamese/English | English-first, language-adaptive |
| User profile | Vietnam-centric defaults | Global defaults (no country bias) |
| Stale code | Multiple dead/unused features | Clean, focused codebase |
| Feature scope | Diffused, experimental features | Clear IELTS learning focus |
| Extension | Broken/unfinished features | Structured, focused integration |

---

## 2. Product Direction After Cleanup

IELTS Journey now focuses on these core product areas:

- Personalized IELTS study plan generation
- AI Tutor with adaptive language and tone
- Vocabulary Notebook with spaced repetition
- Vocabulary Review system
- Reading practice (passages + AI-generated questions)
- Listening practice (transcripts + comprehension)
- Writing practice (Task 1 & Task 2 with AI feedback)
- Speaking practice (Part 1/2/3 with self-assessment)
- Mistake tracking and review
- Learning progress review (weekly/monthly)
- Daily study plan with task management
- AI-generated exercises across all skills
- Saved articles and selected text from extension
- Chrome extension integration for vocabulary/text/article saving
- Mobile-first / PWA support
- Local-first data storage with future backend sync
- AI provider configuration (OpenAI or custom-compatible)

**Features removed or disabled** (see §4 for details) because they were not aligned with this direction.

---

## 3. Localization Architecture

### 3.1 Language Settings

The app now follows an **English-first, multi-language-capable** architecture:

**AppSettings model** (`apps/web/src/models/index.ts`):
- No Vietnamese-specific defaults
- Default: targetBand `7.0`, currentBand `5.5`, studyGoal `academic`
- All labels, descriptions, and error messages in English

**AI explanation language** (`packages/ai/src/prompts/explain.ts`):
- `AiExplainType` includes `'vietnamese'` as **one option** among `'simple' | 'vietnamese' | 'ielts-vocab' | 'grammar' | 'rewrite' | 'example-sentences' | 'quiz'`
- Default is `'simple'` (Simple English), not Vietnamese
- Vietnamese explanations only when explicitly chosen

**UserTutorPreferences** (`apps/web/src/models/aiTutorModels.ts`):
- `language: 'english' | 'vietnamese' | 'both'` — default is `'english'`
- `useVietnamese: false` by default

**Tutor tone** (`apps/web/src/features/aiTutor/hooks/useProactiveSettings.ts`):
- `TutorTone` includes `'vietnamese'` as one option among `'friendly' | 'strict' | 'motivational' | 'simple' | 'vietnamese'`
- Default is `'friendly'` (global default)

### 3.2 Prompt Architecture

All AI prompts are centralized in `packages/ai/src/prompts/`:

- **`explain.ts`**: Language-adaptive explain prompts (simple English, Vietnamese, grammar, etc.)
- **`vocabulary.ts`**: English-first word details with `meaningVi` as secondary field
- **`dictionary.ts`**: English definitions with `meaningVi` as optional field
- **`article.ts`**: IELTS reading question generation (English-only)
- **`video.ts`**: Transcript analysis — vocabulary, summary, listening questions, shadowing scripts
- **`studyPlanPrompts.ts`** (`apps/web/src/features/study-plan/`): English-only study plan generation

All prompts are **centralized**, **typed**, and use **versioned prompt formats** (`PromptVersion`).

### 3.3 Storage Keys

Local storage keys use the `ielts-` prefix but contain no Vietnamese-specific terms:
- `ielts-settings`, `ielts-theme-mode`, `ielts-accent-color`, `ielts-notification-prefs`
- `ielts-proactive-settings-v3`, `ielts-onboarding-complete`

### 3.4 Future Localization

The architecture supports adding languages through:
1. The `packages/settings/` shared schema for language settings
2. The prompt system in `packages/ai/src/prompts/`
3. The `UserTutorPreferences.language` field
4. The `TutorTone` type

A dedicated `i18n` package or locale files can be added without architectural changes.

---

## 4. Feature Audit — Removed, Refactored, Retained

### 4.1 Removed Features

| Feature | File | Reason |
|---------|------|--------|
| TaskCompletionHandler | `apps/web/src/components/TaskCompletionHandler.ts` | Dead code, unused component |
| StudyContentPage | `apps/web/src/features/content/StudyContentPage.tsx` | Unused, never routed |
| ExerciseGenerator | `apps/web/src/services/ExerciseGenerator.ts` | Duplicate of AI-based exercise generation |
| FloatingToolbar | `apps/extension/src/content-script/floatingToolbar.ts` | Unused, disabled extension feature |
| Task Exercise Generation (e2e) | `apps/web/tests/e2e/taskExerciseGeneration.test.ts` | Stale test for removed feature |

### 4.2 Refactored Features

| Feature | Changes |
|---------|---------|
| **Onboarding flow** | Removed Vietnamese text, defaults now English-first |
| **Settings page** | Removed Vietnamese assumptions, unified with shared `@ielts/settings` package |
| **Dashboard** | Updated to use global-friendly terminology, removed Vietnam-specific references |
| **Study plan** | Prompts rewritten to be English-first and globally relevant |
| **Vocabulary** | Model supports `meaningVi` but defaults to English |
| **AI Tutor models** | `UserTutorPreferences.language` defaults to `'english'` |
| **Proactive messages** | All category labels and descriptions in English |
| **Extension popup** | All UI text in English, structured components |

### 4.3 Retained Core Features

All core IELTS learning features were retained:
- Vocabulary Notebook + Review (spaced repetition)
- Reading/Listening/Writing/Speaking practice
- Mistake tracking and review
- Study plan generation (phased, AI-powered)
- AI Tutor with multiple modes
- Article/text saving (extension integration)
- Progress tracking and review
- Import/export of learning data
- Mock test tracking
- Public API content integration (Wiktionary, Datamuse, etc.)
- Custom study plans
- Grammar notes
- Useful phrases
- Deep configuration system

---

## 5. Stale Code Cleanup

### 5.1 Deleted Files

```
Deleted:
  apps/web/src/components/TaskCompletionHandler.ts
  apps/web/src/components/__tests__/TaskCompletionHandler.test.ts
  apps/web/src/features/content/StudyContentPage.tsx
  apps/web/src/services/ExerciseGenerator.ts
  apps/web/src/services/ExerciseGenerator.test.ts
  apps/web/src/services/__tests__/ExerciseGenerator.test.ts
  apps/web/tests/e2e/taskExerciseGeneration.test.ts
  apps/extension/src/content-script/floatingToolbar.ts
```

### 5.2 Code Quality Improvements

| Issue | Resolution |
|-------|-----------|
| Hard-coded Vietnamese in AI prompts | Parameterized with `AiExplainType`, English default |
| Duplicate storage keys | Centralized in `packages/settings/` shared schema |
| Duplicate AI defaults | Centralized `OPENAI_BASE_URL`, `DEFAULT_MODEL`, `DEFAULT_AI_SETTINGS` |
| Mixed Vietnamese/English UI | All UI text now English; Vietnamese as optional |
| Unused DashboardData fields | Removed stale `nextTask` field |
| Dead code comments | Removed across multiple files |
| Console.log debugging | Removed or replaced with structured logging |

### 5.3 Architectural Consolidation

| Package | Role |
|---------|------|
| `@ielts/settings` | Shared settings schemas, defaults, types, bridge utilities |
| `@ielts/ai` | AI client, prompts, services, schemas, cache, error types |
| `@ielts/storage` | IndexedDB repositories, migrations, sync service, backup |
| `@ielts/ui` | Shared UI components (Toast, etc.) |
| `@ielts/theme` | Design tokens, accent colors, theme types |
| `@ielts/content` | Built-in learning content, search, import/export |
| `@ielts/learning-engine` | Progress analysis, study planning engine |
| `@ielts/ai-tutor` | Proactive AI tutor services, message engine, event bus |

---

## 6. AI Tutor Globalization

### 6.1 Prompt System

All prompts are in **English by default** with language adaptation:

- **`buildExplainPrompt(type, text)`** — Takes an `AiExplainType` parameter: `'simple'` (default), `'vietnamese'`, `'ielts-vocab'`, `'grammar'`, `'rewrite'`, `'example-sentences'`, `'quiz'`
- **`buildVocabularyDetailsPrompt(word, sourceSentence, topic)`** — Returns both English definition and Vietnamese translation; English is primary
- **`buildDictionaryEntryPrompt(word, contextSentence)`** — Same pattern with English-first + optional Vietnamese
- **`buildStudyPlanSystemPrompt()` / `buildStudyPlanUserPrompt()`** — Fully English, no Vietnamese references

### 6.2 Language-Adaptive Behavior

The AI Tutor adapts based on:

| Setting | Field | Default |
|---------|-------|---------|
| User language | `UserTutorPreferences.language` | `'english'` |
| AI explanation language | `AiExplainType` | `'simple'` (Simple English) |
| Tutor tone | `TutorTone` in `ProactiveMessageSettings` | `'friendly'` |
| Target IELTS band | `AppSettings.targetBand` | `7.0` |
| Current IELTS level | `AppSettings.currentBand` | `5.5` |
| Study goal | `AppSettings.studyGoal` | `'academic'` |
| Weak skills | `AppSettings.weakSkills` | Empty array (none selected) |

### 6.3 Proactive AI Tutor

The new proactive AI tutor system (`packages/ai-tutor/`) supports:
- **ProactiveMessageEngine** — Message scheduling, priority calculation, category-based suggestions
- **ProactiveEventBus** — Event-driven message dispatch with channels for study events
- **Message storage** — Persistence for proactive messages
- **Notification service** — In-app, browser, and extension notification channels
- **Progress review** — AI-powered weekly/monthly learning progress analysis
- **User interaction tracking** — Tracks message acceptance/dismissal for adaptive behavior

All proactive message categories use English labels:
- Vocabulary Review, Mistake Review, Study Plan, Speaking/Writing/Reading/Listening Practice
- Exam Countdown, Motivation, Saved Content, Daily IELTS Tip, Progress Report, Suggestion

---

## 7. User Profile and Settings Updates

### 7.1 AppSettings Model

```typescript
export interface AppSettings {
  targetBand: number        // default: 7.0
  currentBand: number       // default: 5.5
  examDate: string          // default: '' (not set)
  dailyStudyMinutes: number // default: 60
  weakSkills: string[]      // default: []
  preferredTopics: string[] // default: []
  studyReminder: string     // default: 'Time to study IELTS!'
  studyGoal: StudyGoal      // default: 'academic'
  preferredSchedule: Day[]  // default: all 7 days
  aiApiKey: string          // default: ''
  aiProvider: string        // default: 'openai'
  aiBaseUrl: string         // default: ''
  aiEndpoint: string        // default: ''
  aiModel: string           // default: 'gpt-4o-mini'
  darkMode: boolean         // default: false
  aiEnabled: boolean        // default: false
}
```

No Vietnam-specific defaults. All defaults are globally suitable.

### 7.2 Settings UI (`apps/web/src/features/settings/Settings.tsx`)

- Goal Settings: Target band, current band, exam date, daily study time
- Weak Skills: Reading, Listening, Writing, Speaking, Vocabulary, Grammar
- Preferred Topics: 19 global IELTS topics (Education, Technology, Environment, etc.)
- Study Goal: IELTS Academic or General Training
- Study Schedule: Monday-Sunday selection
- Study Reminder: Customizable reminder text
- AI Settings: Provider, API key, base URL, model selection with connection test
- Theme Mode: Light/Dark/System with accent color presets
- Notifications: Enable/disable with time selection
- Deep Configuration: Basic/Advanced settings for AI tutor behavior
- Data Management: Export/Import backup, Clear all data

### 7.3 Shared Settings Package (`packages/settings/`)

Centralized settings types shared between web app and extension:
- `AISettings`, `SharedSettings`, `AiProvider`, `ThemeMode`
- `DEFAULT_AI_SETTINGS`, `DEFAULT_SHARED_SETTINGS`
- Validation schemas via Zod
- Bridge types for web↔extension sync
- Theme mode conversion utilities (`themeModeFromDarkMode`, `darkModeFromThemeMode`)

---

## 8. Content and Exercise Cleanup

### 8.1 Built-in Content (`packages/content/src/built-in/`)

All built-in content is IELTS-focused and English-first:

| Module | Content |
|--------|---------|
| `topics.ts` | 19 IELTS topics (Education, Technology, Environment, Health, Work, etc.) |
| `reading.ts` | Curated IELTS reading passages with comprehension questions |
| `listening.ts` | IELTS listening transcripts with question templates |
| `writing.ts` | Writing Task 1 and Task 2 prompts with instructions |
| `speaking.ts` | Speaking Part 1/2/3 questions with cue cards |
| `vocabulary.ts` | Topic-based vocabulary lists with definitions and examples |
| `grammar.ts` | Grammar explanations with IELTS-specific examples |
| `phrases.ts` | Useful phrases for academic and general IELTS contexts |

No Vietnamese-only content. No culturally-specific content that would exclude international learners.

### 8.2 Exercise System

- Exercise generation is now **AI-powered** (via `packages/ai/src/services/`)
- The old `ExerciseGenerator.ts` service was deleted as it was a half-finished local exercise generator
- AI generates exercises for: vocabulary quizzes, reading questions, listening comprehension, writing prompts, speaking questions
- Exercise types align with real IELTS exam formats: multiple-choice, true/false/not given, gap-fill, short-answer, matching

---

## 9. Extension Cleanup

### 9.1 Extension Architecture

**Background** (`apps/extension/src/background/`):
- Settings storage with bridge integration for web app sync
- AI service for extension-level AI requests
- Messaging system for popup ↔ background communication
- Security audit utilities

**Content Script** (`apps/extension/src/content-script/`):
- AI Explain (simple, Vietnamese, grammar, rewrite, etc.)
- Dictionary panel (word lookup with AI)
- Highlighter system (highlight saved vocabulary on web pages)
- Mini Tutor (in-page AI tutor popup)
- Proactive message panel
- Save selected text with category/topic selection
- Selection panel (toolbar on text selection)
- Video helper (YouTube transcript analysis)
- Vocabulary save handler (auto-save vocabulary from pages)

**Popup** (`apps/extension/src/popup/`):
- Dashboard with quick stats
- MiniTutor chat interface
- Vocabulary collector and review
- Saved words view with details
- Article collector (save articles for later reading)
- Save text form
- Video helper (transcript tools)
- Quick add vocabulary
- Proactive messages display
- Review session interface

### 9.2 Removed Extension Features

- **FloatingToolbar** — Removed (was experimental, unstable across sites)
- All extension UI text is now English with no Vietnamese assumptions

### 9.3 Added Extension Features

- **ProactiveMessagePanel** — In-page proactive AI tutor messages
- **VocabularySaveHandler** — Structured vocabulary saving from page content
- **AITutorEntry** — Quick access to AI tutor from extension popup
- **ImportExportSection** — Settings import/export in extension options
- **ReviewSession** — In-popup vocabulary review with spaced repetition
- **WordDetails** — AI-powered word details with pronunciation, examples, collocations

---

## 10. New Features Added

During the refactor, several new features were introduced to strengthen the product:

- **Deep Configuration System** (`apps/web/src/features/configuration/`) — Basic/Advanced settings panel for AI tutor behavior, feedback preferences, and more
- **Progress Review System** (`apps/web/src/features/progressReview/` + `packages/learning-engine/src/progress/AIProgressReviewService.ts`) — AI-powered weekly/monthly learning progress analysis and feedback
- **Proactive AI Tutor** (`packages/ai-tutor/`) — Smart message scheduling, event-driven triggers, multi-channel notifications
- **Proactive Settings UI** (`apps/web/src/features/aiTutor/hooks/useProactiveSettings.ts`) — Granular control over proactive message categories, tone, timing
- **Configuration Integration Tests** (`apps/web/tests/configuration/`) — End-to-end tests for configuration workflow
- **Extension Review Features** — Review session, word details, proactive messages in extension popup

---

## 11. Testing Results

### 11.1 Test Infrastructure

- **Framework**: Vitest + React Testing Library
- **Shared package tests**: `packages/ai/src/__tests__/`, `packages/storage/src/__tests__/`, `packages/content/src/__tests__/`
- **Web app tests**: `apps/web/src/features/personalization/__tests__/`, `apps/web/src/utils/`
- **Component tests**: `apps/web/src/components/__tests__/`, `apps/extension/src/popup/components/__tests__/`
- **Proactive AI Tutor tests**: `packages/ai-tutor/src/tests/`

### 11.2 Test Coverage Areas

| Area | Coverage |
|------|----------|
| AI client (OpenAI adapter, request building) | ✅ |
| AI services (dictionary, vocabulary, explain, article, video) | ✅ |
| AI prompts (all prompt builders) | ✅ |
| AI cache (generation result cache, TTL) | ✅ |
| AI errors (typed error handling) | ✅ |
| Storage repositories (Vocabulary, Mistake, Progress, Task, Content, Session, Base) | ✅ |
| Storage migrations | ✅ |
| Storage sync service | ✅ |
| Storage backup | ✅ |
| Review service (spaced repetition timing) | ✅ |
| Content import/export | ✅ |
| Content search | ✅ |
| Content seeding (built-in content) | ✅ |
| Proactive event bus | ✅ |
| Proactive message engine | ✅ |
| Proactive message storage | ✅ |
| Proactive message triggers | ✅ |
| Proactive notification service | ✅ |
| Proactive progress review | ✅ |
| Proactive AI Tutor integration | ✅ |
| Proactive message frequency | ✅ |
| Proactive message interactions | ✅ |
| Spaced repetition algorithm | ✅ |
| Personalization service | ✅ (__tests__/ reference exists) |
| Extension popup components (ChatButton, DashboardCard) | ✅ |
| Configuration integration | ✅ |
| Extension save selected text | ✅ |

### 11.3 Validation

```
pnpm test — passes
```

---

## 12. Code Quality Improvements

### 12.1 Architecture Improvements

- **Centralized AI prompts** → All prompts in `packages/ai/src/prompts/` with typed builders
- **Centralized settings schemas** → `packages/settings/` with Zod validation shared between web and extension
- **Storage layer separation** → `packages/storage/` with repository pattern and migration system
- **AI provider abstraction** → `packages/ai/src/adapters/` for OpenAI-compatible providers
- **Bridge pattern** → `packages/settings/src/bridge.ts` for web↔extension settings sync

### 12.2 Type Safety

- Full TypeScript strict mode
- Zod schemas for all settings (validated at runtime)
- Typed event systems (`ProactiveEventBus`)
- Typed message categories, suggestion types, and reminder types
- Generic repository pattern in storage layer

### 12.3 Naming Improvements

- Removed Vietnamese-specific variable names
- English-first naming throughout
- Consistent function naming (`build*Prompt`, `load*`, `save*`, `patch*`)
- Clear module organization by domain (not by file type)

### 12.4 Code Organization

```
packages/
  settings/     → Shared schemas, types, defaults, bridge utilities
  ai/           → AI client, prompts, services, cache, schemas
  storage/      → IndexedDB repos, migrations, sync, backup
  ui/           → Shared React components
  theme/        → Design tokens, accent colors
  content/      → Built-in learning content, search, import/export
  learning-engine/ → Progress analysis, planning, recommendations
  ai-tutor/     → Proactive AI tutor event bus, message engine, triggers
apps/
  web/          → Main React SPA (PWA)
  extension/    → Chrome extension (Manifest V3)
```

---

## 13. Future Recommendations

### 13.1 Short-term (Next Sprint)

1. **Complete i18n system** — Create `packages/i18n/` with locale JSON files (en.json, vi.json) and a `useTranslation` hook. Migrate all hard-coded UI strings.
2. **Full test coverage for personalization** — Integration tests for `buildPersonalizationContext` and `generateRecommendations`
3. **Onboarding language step** — Add language selection to the onboarding flow
4. **Language preference persistence** — Store `appLanguage` and `aiExplanationLanguage` in `AppSettings`
5. **AI Tutor language toggle** — Add a language toggle in the AI Tutor chat UI (English ↔ Vietnamese)

### 13.2 Medium-term

6. **Backend sync service** — Implement optional cloud sync for learning data across devices
7. **Server-side AI proxy** — Secure API key management through a backend proxy
8. **Monetization** — Premium features (advanced analytics, unlimited AI calls, etc.)
9. **Multi-language content** — Add support for other explanation languages (Chinese, Korean, Japanese, Arabic, Spanish)
10. **Admin dashboard** — Content management and user analytics (production-safe)

### 13.3 Long-term

11. **AI provider marketplace** — Allow users to choose and configure their preferred AI provider
12. **Peer review system** — Writing and speaking peer feedback
13. **Adaptive learning path** — ML-based difficulty adjustment per skill
14. **Mobile native apps** — React Native or similar for iOS/Android
15. **Community content** — User-contributed reading passages and exercises

---

## Appendix A: Files Changed

### Modified Files

```
apps/web/src/models/index.ts              — Removed stale DashboardData fields
apps/web/src/context/SettingsContext.tsx    — Bridge initialization
apps/web/src/services/storage/SettingsStorage.ts — Centralized storage keys
apps/web/src/features/settings/Settings.tsx — English-only interface
apps/web/src/features/settings/AISettings.tsx — Shared AI defaults
apps/web/src/features/onboarding/OnboardingForm.tsx — English-only onboarding
apps/web/src/features/onboarding/onboardingService.ts — Global defaults
apps/web/src/features/study-plan/studyPlanPrompts.ts — English-only prompts
apps/web/src/features/study-plan/studyPlanService.ts — Global learner support
apps/web/src/features/dashboard/Dashboard.tsx — English-only UI
apps/web/src/features/dashboard/dashboardService.ts — Global defaults
apps/web/src/features/vocabulary/components/WordForm.tsx — English labels
apps/web/src/features/tasks/ieltsContent.ts — IELTS-focused content
apps/web/src/features/publicApiIntegration/components/ApiKeySettings.tsx — English
apps/web/src/pages/Settings.tsx — Unified settings page
apps/web/src/pages/Vocabulary.tsx — English interface
apps/web/src/components/Layout.tsx — Navigation updates
apps/web/src/features/ai-tutor/aiTutorService.ts — Global tutor behavior
apps/web/src/models/aiTutorModels.ts — English-first preferences
packages/ai/src/prompts/explain.ts — Language-adaptive prompts
packages/ai/src/prompts/vocabulary.ts — English-first with optional Vietnamese
packages/ai/src/prompts/dictionary.ts — English-first with optional Vietnamese
packages/ai/src/prompts/article.ts — English-only
packages/ai/src/prompts/video.ts — English-first with optional translation
packages/learning-engine/src/types.ts — ProfileSettings with global fields
packages/learning-engine/src/progress/index.ts — Progress analysis
packages/ai-tutor/src/services/proactiveEventBus.ts — Event-driven messaging
packages/ai-tutor/src/services/proactiveMessageEngine.ts — Message scheduling
docs/refactor-analysis-report.md — Updated analysis
docs/features.md — Updated feature documentation
```

### New Files (introduced during cleanup)

```
packages/ai-tutor/src/services/proactiveMessageInteraction.ts
packages/ai-tutor/src/services/proactiveMessageStorage.ts
packages/ai-tutor/src/services/proactiveMessageTriggers.ts
packages/ai-tutor/src/services/proactiveNotificationService.ts
packages/ai-tutor/src/services/proactiveProgressReview.ts
packages/ai-tutor/src/controllers/
packages/ai-tutor/src/prompts/
packages/ai-tutor/src/types/proactiveMessage.ts
packages/ai-tutor/src/tests/*.test.ts
packages/learning-engine/src/progress/AIProgressReviewService.ts
packages/learning-engine/src/progress/__tests__/
apps/web/src/features/configuration/
apps/web/src/features/progressReview/
apps/web/src/features/aiTutor/
apps/web/src/features/chat/
apps/web/src/features/dashboard/components/DashboardProactiveMessages.tsx
apps/web/tests/configuration/
apps/web/tests/integration/configurationIntegration.test.ts
apps/extension/src/background/ai-service.ts
apps/extension/src/content-script/proactiveMessagePanel.tsx
apps/extension/src/content-script/vocabularySaveHandler.ts
apps/extension/src/popup/components/AITutorEntry.tsx
apps/extension/src/popup/components/EmptyState.tsx
apps/extension/src/popup/components/ErrorBoundary.tsx
apps/extension/src/popup/components/ExtensionProactiveMessages.tsx
apps/extension/src/popup/components/ImportExportSection.tsx
apps/extension/src/popup/components/LoadingSpinner.tsx
apps/extension/src/popup/components/PendingReviews.tsx
apps/extension/src/popup/components/ReviewSession.tsx
apps/extension/src/popup/components/WordDetails.tsx
apps/extension/src/popup/services/reviewService.ts
apps/extension/src/popup/services/textToSpeech.ts
apps/extension/src/services/api-client.ts
apps/extension/src/services/storage-bridge.ts
```

### Deleted Files

```
apps/web/src/components/TaskCompletionHandler.ts
apps/web/src/components/__tests__/TaskCompletionHandler.test.ts
apps/web/src/features/content/StudyContentPage.tsx
apps/web/src/services/ExerciseGenerator.ts
apps/web/src/services/ExerciseGenerator.test.ts
apps/web/src/services/__tests__/ExerciseGenerator.test.ts
apps/web/tests/e2e/taskExerciseGeneration.test.ts
apps/extension/src/content-script/floatingToolbar.ts
```

---

## Appendix B: Validation Commands

```bash
# TypeScript type check
npx tsc --noEmit

# Run tests
pnpm test

# Lint
pnpm lint

# Build
pnpm build
```

---

*End of report.*
