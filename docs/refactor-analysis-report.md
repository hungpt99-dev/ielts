# Refactor Analysis Report

> Comprehensive codebase analysis for the IELTS Learning Journey project.
> Date: 2026-07-05 (updated with Vietnamese assumptions, stale features, and product direction analysis)
> Analyzed by: OpenCode

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Current Architecture Analysis](#2-current-architecture-analysis)
3. [Directory Structure Audit](#3-directory-structure-audit)
4. [Feature Boundary Analysis](#4-feature-boundary-analysis)
5. [Clean Architecture Violations](#5-clean-architecture-violations)
6. [Code Duplication & Smells](#6-code-duplication--smells)
7. [Storage Layer Issues](#7-storage-layer-issues)
8. [AI Layer Issues](#8-ai-layer-issues)
9. [Extension Issues](#9-extension-issues)
10. [Theme & UI Issues](#10-theme--ui-issues)
11. [Testing Coverage Gaps](#11-testing-coverage-gaps)
12. [Documentation Gaps](#12-documentation-gaps)
13. [Recommended Incremental Refactor Plan](#13-recommended-incremental-refactor-plan)

---

## 1. Project Overview

### 1.1 What It Is

A **local-first, offline-capable** IELTS learning system comprising:
- **Web app** (React SPA with PWA)
- **Chrome extension** (Manifest V3)
- **Shared packages** (`@ielts/ai`, `@ielts/storage`, `@ielts/ui`)

### 1.2 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19, TypeScript 5.8 |
| Bundler | Vite 6 |
| Styling | Tailwind CSS 4 + CSS custom properties |
| Routing | React Router v7 |
| Database | IndexedDB (via `idb`, also `dexie` in tests) |
| Local storage | localStorage (settings) |
| Charts | Recharts |
| Testing | Vitest + Testing Library |
| PWA | vite-plugin-pwa |
| AI | OpenAI-compatible REST API (optional, user-provided key) |
| Extension build | Vite 6 (popup/options) + esbuild (background/content) |
| Package mgr | pnpm workspaces |

### 1.3 Size Estimates

| Area | Files | Lines (est.) |
|------|-------|-------------|
| `src/` (web app) | ~80 | ~30,000 |
| `apps/extension/src/` | ~34 | ~10,000 |
| `packages/` | ~11 | ~1,700 |
| `features/` | ~41 | ~25,000 |
| Totals | ~166 | ~66,700 |

---

## 2. Current Architecture Analysis

### 2.1 Current Architecture (As-Is)

```
main.tsx
  │
  └── BrowserRouter
        │
        └── App.tsx
              ├── ThemeProvider (context)
              ├── SettingsProvider (context)
              ├── ToastProvider (context)
              ├── SeedDataLoader
              └── AppLayout (components/)
                    ├── Headbar
                    ├── Sidebar / MobileNav
                    └── <Routes>
                          ├── Dashboard (pages/ or features/)
                          ├── Planner (features/)
                          ├── Vocabulary (features/)
                          ├── Reading (features/)
                          ├── Listening (features/)
                          ├── Writing (features/)
                          ├── Speaking (features/)
                          ├── Grammar (features/)
                          ├── Mistakes (features/)
                          ├── Progress (pages/)
                          ├── Search (pages/)
                          ├── Settings (pages/)
                          ├── AITutorChat (pages/)
                          └── ... (more pages/)
```

### 2.2 Current Data Flow

```
User Action
  → Page/Feature Component (React)
    → Custom Hook (e.g., useDashboard)
      → Service Layer (e.g., DatabaseService)
        → IndexedDB (via idb library)  OR  localStorage
          → Returns data back up the chain
```

### 2.3 Current AI Flow

```
Component (e.g., WordForm, AITutorChat)
  → Imports callAI() directly from @ielts/ai
    → fetch() to OpenAI-compatible endpoint
      → JSON response
        → Zod validation
          → Back to component
```

### 2.4 Key Finding: Mixed Architecture

The codebase has **two competing architectural patterns** that were introduced at different times:

**Pattern A — Pages + Services (older):**
- `src/pages/` — thick page components with inline data fetching
- `src/services/` — service layer with Database, ProactiveMessageEngine, etc.
- `src/models/` — all domain types in one file
- `src/hooks/` — custom hooks like `useDashboard`
- `components/` — shared UI and aiTutor components

**Pattern B — Features (newer):**
- `src/features/` — feature folders with their own components/
- Each feature has a main page component
- Some features have data/ subdirectories with static content

**These two patterns coexist inconsistently.** Some features live in `src/features/` while others are in `src/pages/`. Some service files duplicate logic across directories.

---

## 3. Directory Structure Audit

### 3.1 Root `src/` — Mixed Concerns

```
src/
  ├── models/          ← All domain types mixed together (773 lines)
  ├── types/           ← Barrel re-export of models/ (redundant layer)
  ├── services/        ← Mixed application + infrastructure logic
  │     storage/       ← Database, LocalTutorStorage, SettingsStorage
  │     aiTutor/       ← ContextManager, MemoryService, ReminderService, SuggestionEngine
  │     ai/            ← AIService
  │     ChatContext.ts ← Singleton chat context
  │     ProactiveMessageEngine.ts  ← 1209 lines (monolithic)
  │     LocalChatMemory.ts
  ├── components/      ← UI components + business-logic-heavy aiTutor/ components
  │     aiTutor/       ← 10 components, ~5700 lines total
  │     layout/
  │     ui/
  ├── features/        ← Feature-based modules
  │     dashboard/, planner/, vocabulary/, reading/, listening/,
  │     writing/, speaking/, grammar/, mistakes/, notes/,
  │     analytics/, settings/, publicApiIntegration/
  ├── pages/           ← Thick page components (competing with features/)
  │     Dashboard.tsx, AITutorChat.tsx (2833 lines!), Progress.tsx, etc.
  ├── hooks/           ← 2 hooks
  ├── context/         ← 2 contexts
  ├── utils/           ← Utility functions
  ├── data/            ← Seed data (1370 lines)
  ├── app/             ← App wrapper (37 lines)
  ├── styles/          ← theme.css with design tokens
  ├── extension/       ← Extension-specific proactive assistant
  └── test/ + tests/   ← Test files (3 files)
```

### 3.2 Key Structural Problems

1. **`pages/` vs `features/` duplication** — `src/pages/Dashboard.tsx` vs `src/features/dashboard/Dashboard.tsx`
2. **`models/` monolith** — All domain types in a single 773-line file with no separation by domain
3. **`types/` is a redundant barrel** — Simply re-exports `models/` without adding value
4. **`components/aiTutor/` is overly large** — Contains business logic (SpeakingPartner, WritingTutor, TeachingMode) that should be in services/ or features/
5. **`services/storage/Database.ts` is 1673 lines** — Mixes DB schema, CRUD, validation, and queries in one file
6. **`extension/` inside `src/`** — The web app's `src/` contains extension-specific code (`src/extension/ProactiveAssistant.ts`)

### 3.3 Extension Structure

```
apps/extension/
  ├── manifest.json
  ├── package.json
  ├── tsconfig.json
  ├── vite.config.ts
  ├── scripts/build.mjs, package.mjs
  └── src/
        ├── background/    ← Service worker
        ├── content/       ← Content scripts (8 files)
        ├── contentScripts/ ← Thin re-export barrels
        ├── popup/         ← React popup UI
        ├── options/       ← React options page
        └── storage/       ← Extension-specific IndexedDB stores
```

**Issues:**
- `contentScripts/saveSelectedText.ts` is a one-line re-export — unnecessary indirection
- `storage/` duplicates IndexedDB operations already present in `src/services/storage/` and `packages/storage/`
- No proper dependency on `@ielts/storage` — extension has its own stores
- Theme is duplicated across `popup/index.css`, `options/index.css`, and `content/sharedStyles.ts`

---

## 4. Feature Boundary Analysis

### 4.1 Feature Completeness Score

| Feature | In `features/` | In `pages/` | Has `components/` | Has `hooks/` | Has `services/` | Has `schemas/` | Has `types/` | Has `utils/` | Has `tests/` |
|---------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Dashboard | ✓ | ✓ | ✓ | - | - | - | - | - | - |
| Planner | ✓ | - | ✓ | - | - | ✓ | - | - | - |
| Vocabulary | ✓ | ✓ | ✓ | - | - | - | - | - | - |
| Reading | ✓ | ✓ | ✓ | - | - | - | - | - | ✓ |
| Listening | ✓ | ✓ | ✓ | - | - | - | - | - | - |
| Writing | ✓ | ✓ | ✓ | - | - | - | - | - | - |
| Speaking | ✓ | ✓ | ✓ | - | - | - | - | - | - |
| Grammar | ✓ | - | ✓ | - | - | - | - | - | - |
| Mistakes | ✓ | ✓ | - | - | - | - | - | - | - |
| Notes | ✓ | - | - | - | - | - | - | - | - |
| Analytics | ✓ | - | - | - | - | - | - | - | - |
| Settings | ✓ | ✓ | - | - | - | - | - | - | - |
| Public API | ✓ | ✓ | ✓ | - | ✓ | - | ✓ | ✓ | ✓ |
| AI Tutor | - | ✓ | ✓ | - | ✓ | - | - | - | ✓ |
| Progress | - | ✓ | - | - | - | - | - | - | ✓ |
| Review Center | - | ✓ | - | - | - | - | - | - | - |
| Daily Plan | - | ✓ | - | - | - | - | - | - | - |
| Search | - | ✓ | - | - | - | - | - | - | - |
| Import/Export | - | ✓ | - | - | - | - | - | - | - |
| Mock Tests | - | ✓ | - | - | - | - | - | - | - |

### 4.2 Feature Duplications

1. **Dashboard** exists in both `src/features/dashboard/Dashboard.tsx` (492 lines) and `src/pages/Dashboard.tsx` (446 lines). They are different implementations.
2. **Vocabulary** exists in both `src/features/vocabulary/Vocabulary.tsx` (772 lines) and `src/pages/Vocabulary.tsx` (1036 lines). They are different implementations.
3. **Reading** exists in both `src/features/reading/` and `src/pages/ReadingJournal.tsx` (865 lines).
4. **Listening** exists in both `src/features/listening/` and `src/pages/ListeningJournal.tsx` (895 lines).
5. **Writing** exists in both `src/features/writing/` and `src/pages/WritingPractice.tsx` (1055 lines).
6. **Speaking** exists in both `src/features/speaking/` and `src/pages/SpeakingPractice.tsx` (1081 lines).
7. **Mistakes** exists in both `src/features/mistakes/MistakeNotebook.tsx` (1068 lines) and `src/pages/Mistakes.tsx` (750 lines).
8. **Settings** exists in both `src/features/settings/Settings.tsx` (591 lines) and `src/pages/Settings.tsx` (340 lines) plus `src/pages/Settings/DataManagement.tsx` (415 lines).

**Critical finding: The `features/` directory and `pages/` directory have near-complete overlap, suggesting an incomplete migration from one pattern to another.**

---

## 5. Clean Architecture Violations

### 5.1 Layer Mixing

| Violation | Location | Description |
|-----------|----------|-------------|
| Business logic in UI | `src/components/aiTutor/SpeakingPartner.tsx` (871 lines) | Contains IELTS scoring logic, question generation, band estimation |
| Business logic in UI | `src/components/aiTutor/WritingTutor.tsx` (1157 lines) | Contains grammar check logic, band estimation, outline generation |
| Business logic in UI | `src/components/aiTutor/TeachingMode.tsx` (1006 lines) | Contains lesson content, exercise generation, answer evaluation |
| Business logic in UI | `src/components/aiTutor/ReadingListeningTutor.tsx` (901 lines) | Contains content analysis, question generation, topic detection |
| Business logic in UI | `src/pages/AITutorChat.tsx` (2833 lines) | Contains teaching logic, speaking partner logic, writing coach logic |
| DB access in UI | `src/features/vocabulary/components/WordForm.tsx` | Directly imports callAI from AI package |
| DB access in UI | Various feature components | Direct `DatabaseService` calls throughout components |
| Settings access in UI | `publicApiIntegration/components/ApiKeySettings.tsx` | Direct localStorage read/write |

### 5.2 Missing Layers

- **No application/use-case layer** — Services and components directly call IndexedDB
- **No domain layer separation** — All domain types are in `models/index.ts`
- **No repository abstraction** — `DatabaseService` is a thin wrapper around `idb`
- **No input validation at boundaries** — Zod is used only in the AI package and extension types
- **No consistent error boundary** — Error handling is ad-hoc (try/catch blocks throughout)

### 5.3 Dependency Inversion Violations

- `@ielts/ai` package has no interface for provider — it calls `fetch()` directly
- `packages/storage/` has no repository interface — consumers depend on concrete implementations
- Extension storage (`indexedDB.ts`) does not implement a shared interface
- No dependency injection — singletons are used everywhere (`DatabaseService`, `chatContext`, etc.)

---

## 6. Code Duplication & Smells

### 6.1 Duplicate IndexedDB Operations

There are **three separate IndexedDB implementations**:

1. **`packages/storage/`** — `mistakeService.ts`, `reviewService.ts`, `syncService.ts` (generic)
2. **`src/services/storage/Database.ts`** — `DatabaseService` with full CRUD (1673 lines)
3. **`apps/extension/src/storage/`** — `indexedDB.ts`, `articleStore.ts`, `videoStore.ts`, `mistakeStore.ts`, `vocabularyStore.ts` (separate implementation)

Each implements its own schema, CRUD operations, and connection management.

### 6.2 Duplicate SM-2 Algorithm

1. `src/utils/spaced-repetition.ts` — `calculateNextReview`, `getInitialReviewEntry`, `getDailyReviewQueue`
2. `packages/storage/reviewService.ts` — SM-2 algorithm (slightly different API)

These have overlapping but not identical functionality.

### 6.3 Duplicate AI Configuration

1. `src/features/settings/AISettings.tsx` — AI settings UI
2. `publicApiIntegration/components/ApiKeySettings.tsx` — AI key management (duplicate)
3. `packages/ai/aiClient.ts` — Uses `ProviderConfig` interface
4. `apps/extension/src/background/settingsStorage.ts` — Extension AI settings
5. `src/context/SettingsContext.tsx` — Wraps `AppSettings` with AI fields

### 6.4 Large File Code Smells

| File | Lines | Problem |
|------|-------|---------|
| `src/services/ProactiveMessageEngine.ts` | 1209 | Monolithic engine with 10 trigger types inline |
| `src/services/storage/Database.ts` | 1673 | Mixes schema, CRUD, validation, queries |
| `src/pages/AITutorChat.tsx` | 2833 | All AI tutor modes in one file |
| `src/data/seed.ts` | 1370 | All seed data in one file |
| `src/components/aiTutor/SpeakingPartner.tsx` | 871 | Business logic mixed with UI |
| `src/components/aiTutor/WritingTutor.tsx` | 1157 | Business logic mixed with UI |
| `src/components/aiTutor/TeachingMode.tsx` | 1006 | Teaching content mixed with UI |
| `src/components/aiTutor/ReadingListeningTutor.tsx` | 901 | Business logic mixed with UI |
| `src/pages/WritingPractice.tsx` | 1055 | Thick page component |
| `src/pages/SpeakingPractice.tsx` | 1081 | Thick page component |
| `src/pages/ListeningJournal.tsx` | 895 | Thick page component |
| `src/pages/ReadingJournal.tsx` | 865 | Thick page component |
| `src/pages/Progress.tsx` | 825 | Thick page component with 15 chart sections |
| `publicApiIntegration/ai/classify.ts` | 537 | Multiple AI generation functions inline |
| `publicApiIntegration/components/PublicApiSearch.tsx` | 887 | All search sources inline |

### 6.5 Other Code Smells

- **Hardcoded colors** throughout components (e.g., `bg-blue-600`, `text-emerald-600` in Tailwind classes) instead of using CSS custom properties
- **Inconsistent naming** — `vocabulary` vs `Vocabulary`, `mistakes` vs `MistakeNotebook`, `ielts-settings` vs `'ielts-ai-base-url'`
- **Magic strings** — localStorage keys like `'ielts-settings'`, `'ielts-dark-mode'` not centralized
- **`any` types** — `Record<string, unknown>` used as escape hatch in several places
- **Inline SVG icons** — Icons duplicated across components instead of centralized
- **`try/catch {}` with empty blocks** — Silent error swallowing throughout (`/* ignore */`)
- **Comments as documentation** — `pwa-config.ts` is entirely a comment file (never executed)

---

## 7. Storage Layer Issues

### 7.1 Architecture

Currently:
- **Main DB**: `src/services/storage/Database.ts` — Uses `idb` library directly, 26 tables, version 3
- **Settings**: `src/services/storage/SettingsStorage.ts` — localStorage
- **Tutor storage**: `src/services/storage/LocalTutorStorage.ts` — localStorage + 732 lines
- **Extension DB**: `apps/extension/src/storage/` — Separate IndexedDB via raw API
- **Package storage**: `packages/storage/` — Uses `mistakeService`, `reviewService`, `syncService`

### 7.2 Problems

1. **No unified repository pattern** — Three different IndexedDB implementations
2. **No input validation at storage boundaries** — Database.ts has some validation but most services trust inputs
3. **Settings split across localStorage** — `ielts-settings`, `ielts-dark-mode`, `ielts-proactive-message-settings`, `ielts-ai-api-key`, etc.
4. **Database.ts is version 3** — But migrations are hardcoded, no versioned migration file
5. **No backup integrity check** — Import accepts any JSON that matches the schema shape
6. **Extension uses `chrome.storage.local` for API key** — Web app uses `localStorage` — inconsistent

---

## 8. AI Layer Issues

### 8.1 Architecture

```
packages/ai/
  ├── aiClient.ts         ← Core fetch + Zod validation + prompt templates
  ├── articleService.ts   ← AI article question generation
  ├── dictionaryService.ts ← AI dictionary lookup with caching
  ├── videoService.ts     ← AI video transcript processing
  └── vocabularyService.ts ← AI vocabulary generation + quiz

src/features/publicApiIntegration/ai/classify.ts  ← Duplicate AI call logic
src/services/ai/AIService.ts                      ← Separate AI service
```

### 8.2 Problems

1. **No adapter pattern** — Provider is hardcoded to OpenAI-compatible in `aiClient.ts`
2. **No Provider interface** — Cannot add new providers without modifying core
3. **Duplicate AI call implementations** — `classify.ts` has its own `callAiApi()` with different error handling
4. **AIService.ts** (482 lines) duplicates logic already in `packages/ai/`
5. **Prompts are embedded in code** — Not versioned, not externalized
6. **No rate limiting** — No client-side throttling for AI calls
7. **No streaming support** — All calls are non-streaming

---

## 9. Extension Issues

### 9.1 Architecture

```
apps/extension/
  ├── manifest.json        ← Manifest V3 (correct)
  ├── src/background/      ← Service worker
  ├── src/content/         ← Content scripts (ISOLATED world, correct)
  ├── src/popup/           ← React popup
  ├── src/options/         ← React options page
  └── src/storage/         ← Extension-specific IndexedDB
```

### 9.2 Problems

1. **Separate IndexedDB database** — Extension stores data in an IndexedDB under the extension's origin, which is **not accessible** from the web app. Users have separate data silos.
2. **No data sync** — The `extension-architecture.md` describes a bridge protocol but it's not fully implemented
3. **Duplicate Chrome storage** — Uses `chrome.storage.local` for API key AND `chrome.storage.sync` for settings, but web app uses `localStorage`
4. **Hardcoded colors** — `popup/index.css` and `options/index.css` duplicate theme variables
5. **`contentScripts/` indirection** — Single-file re-exports add no value
6. **No shared UI package usage** — Extension reimplements buttons, cards, etc.
7. **No connection to `@ielts/storage`** — Extension storage doesn't use the shared storage package

---

## 10. Theme & UI Issues

### 10.1 Current State

- `src/styles/theme.css` — CSS custom properties (design tokens) for light/dark modes
- Tailwind CSS 4 with dark variant
- `packages/ui/` — Only contains a Toast component
- `src/components/ui/` — 12 reusable UI components

### 10.2 Problems

1. **Hardcoded Tailwind colors** throughout components — e.g., `text-blue-600`, `bg-emerald-500`, `border-gray-200`
2. **`packages/ui/` is minimal** — Only 1 component (Toast)
3. **Theme context** (`ThemeContext.tsx`) is minimal — Only toggles dark class, doesn't manage accent colors
4. **CSS variables exist but aren't consistently used** — Many components use Tailwind utility colors instead
5. **No design token documentation** — Tokens exist in theme.css but aren't documented
6. **No component library** — UI components are scattered across `components/ui/` and `features/*/components/`
7. **Accessibility concerns** — `Toast.tsx` has `z-index: 2147483647`, keyboard navigation is inconsistent

---

## 11. Testing Coverage Gaps

### 11.1 Current Tests

| Test File | Lines | What's Tested |
|-----------|-------|---------------|
| `src/test/Button.test.tsx` | 28 | Button component rendering |
| `src/utils/spaced-repetition.test.ts` | 236 | SM-2 algorithm |
| `src/tests/storage/DatabaseMigration.test.ts` | 582 | DB schema, validation, migrations |
| `src/pages/VocabularyReview.test.tsx` | 210 | Vocabulary review page |
| `src/pages/TopicsProgress.test.tsx` | 237 | Topics progress page |
| `src/pages/Progress.test.tsx` | 194 | Progress page topics section |
| `features/publicApiIntegration/utils/errorHandling.test.ts` | 242 | Error handling utilities |
| `features/publicApiIntegration/__tests__/publicApiIntegration.test.ts` | 1161 | Full integration tests |
| `components/aiTutor/FloatingTutorButton.test.tsx` | 22 | Floating button |

### 11.2 Coverage Gaps

- **Learning Journey Engine** — No tests
- **AI prompt builders** — No tests
- **AI response validation** — No tests (Zod schemas used but not tested)
- **All repository operations** — No unit tests
- **Import/export logic** — No tests
- **Content seeding** — No tests
- **Exercise scoring** — No tests
- **Proactive message rules** — No tests
- **Dashboard hooks** — No tests
- **All extension code** — No tests
- **E2E tests** — None exist

---

## 12. Documentation Gaps

### 12.1 Current Docs

| File | Lines | Status |
|------|-------|--------|
| `README.md` | 167 | Outdated (references old structure) |
| `docs/architecture.md` | 297 | Partially outdated |
| `docs/extension-architecture.md` | 1255+ | Comprehensive but dated |
| `docs/extension-loading.md` | 133 | Good |
| `docs/reminder-limitations.md` | 104 | Good |
| `docs/schema.md` | 360 | Good but not exhaustive |
| `docs/debug/progress-slice-error-analysis.md` | 77 | Good |

### 12.2 Missing Documentation

- Product overview
- Local-first design rationale
- AI architecture (no doc exists)
- Learning journey engine
- Storage design
- Database schema (exists but outdated)
- Import/export flow
- Exercise system
- Content library
- Theme system
- Security & privacy
- Testing strategy
- Deployment guide
- Contribution guide
- Architecture Decision Records (ADRs)

---

## 13. Recommended Incremental Refactor Plan

### Phase 1: Foundation (Week 1-2)

#### 1.1 Consolidate Feature Directories
- **Merge** `src/pages/` into `src/features/` — For each page that has a feature counterpart, merge them. For pages without a feature folder, create one.
- **Remove** duplicate feature implementations — Keep the more complete version, remove the other.
- **Flatten** `src/features/` — Ensure each feature has `components/`, `hooks/`, `services/`, `types/` subdirectories.

#### 1.2 Split Monolithic Files
- **`src/models/index.ts`** → Split into `packages/types/` with separate files per domain (vocabulary, mistakes, exercises, etc.)
- **`src/services/storage/Database.ts`** → Extract into `packages/storage/repositories/` with one file per entity
- **`src/services/ProactiveMessageEngine.ts`** → Split into trigger-specific modules under `packages/learning-engine/`
- **`src/data/seed.ts`** → Extract content into `packages/content/` with versioned seed modules

#### 1.3 Centralize Shared Configuration
- **LocalStorage keys** → Create `packages/config/` with constant definitions
- **AI prompts** → Extract to `packages/ai/prompts/` with versioned prompt files
- **Theme tokens** → Document in `packages/theme/` with CSS variable definitions

### Phase 2: Storage Layer (Week 3-4)

#### 2.1 Unify Repository Pattern
- **Define** `Repository<T>` interface in `packages/storage/`
- **Implement** IndexedDB-backed repositories for each entity
- **Migrate** `DatabaseService` consumers to repository pattern
- **Add** Zod validation at all storage boundaries

#### 2.2 Address Extension Storage Split
- **Implement** data bridge between extension IndexedDB and web app IndexedDB
- OR use `chrome.storage.session` + message passing for real-time sync

#### 2.3 Add Versioned Migrations
- Replace hardcoded migrations with numbered migration functions
- Add migration test suite

### Phase 3: AI Layer (Week 4-5)

#### 3.1 Implement Adapter Pattern
- Define `AiProvider` interface: `generateCompletion(params) => AiResponse`
- Implement `OpenAIAdapter` (existing functionality)
- Implement `OpenAICompatibleAdapter` (for custom endpoints)
- Add provider registry

#### 3.2 Extract and Version Prompts
- Remove inline prompt strings from `aiClient.ts`
- Create `packages/ai/prompts/` with categorized, versioned prompts
- Add prompt testing

#### 3.3 Remove Duplicate AI Code
- `src/services/ai/AIService.ts` → Merge into `packages/ai/services/`
- `publicApiIntegration/ai/classify.ts` → Use `packages/ai/` instead

### Phase 4: Component Refactor (Week 5-6)

#### 4.1 Extract Business Logic from UI
- `SpeakingPartner.tsx` → Extract scoring/feedback logic to `packages/exercises/strategies/`
- `WritingTutor.tsx` → Extract writing analysis to `packages/exercises/`
- `TeachingMode.tsx` → Extract lesson content to `packages/content/`
- `ReadingListeningTutor.tsx` → Extract to `packages/learning-engine/`

#### 4.2 Build UI Component Library
- Move all `src/components/ui/` to `packages/ui/`
- Add stories/examples
- Ensure consistent use of CSS custom properties
- Replace hardcoded Tailwind colors with token-based classes

#### 4.3 Refactor AI Tutor Chat
- Split `AITutorChat.tsx` (2833 lines) into feature-based modules
- Create mode-specific components in `features/ai-tutor/`
- Extract shared logic to hooks and services

### Phase 5: Learning Engine (Week 6-7)

#### 5.1 Create Learning Journey Engine
- Create `packages/learning-engine/` with modules:
  - `profile/` — User profile, target/current band
  - `progress/` — Streak, consistency, accuracy
  - `weakness-detection/` — Pattern detection, weak skill identification
  - `review-scheduler/` — SM-2 + mistake review scheduling
  - `next-best-action/` — Recommended next study action
  - `daily-plan/` — Plan generation
  - `analytics/` — Aggregated analytics

#### 5.2 Integrate Engine
- Dashboard → Use engine for data
- AI Tutor → Use engine for proactive messages
- Exercise generator → Use engine for difficulty adjustment

### Phase 6: Testing (Week 7-8)

#### 6.1 Add Unit Tests
- All repository operations
- All AI prompt builders
- All learning engine modules
- Import/export logic
- Content seeding
- Exercise scoring
- Proactive message rules

#### 6.2 Add Integration Tests
- Onboarding flow
- Add vocabulary → Review → Mistake flow
- Generate exercise flow
- Export → Import backup flow
- AI tutor chat flow
- Extension save text flow

### Phase 7: Documentation (Week 8)

#### 7.1 Create Documentation
- `docs/architecture.md` — Updated with new architecture
- `docs/ai-architecture.md` — Adapter pattern, provider setup
- `docs/learning-journey-engine.md` — Engine modules and data flow
- `docs/storage-design.md` — Repository pattern, migrations
- `docs/exercise-system.md` — Strategy pattern
- `docs/extension-architecture.md` — Updated with sync bridge
- `docs/theme-system.md` — Design tokens
- `docs/security-privacy.md` — Local-first, API key handling
- `docs/testing-strategy.md` — Test organization
- `docs/deployment.md` — Build and deploy
- `docs/contribution-guide.md` — How to add features
- `docs/adr/*.md` — Architecture Decision Records

#### 7.2 Update README.md
- Reflect new project structure
- Update scripts table
- Add architecture summary
- Add privacy notes
- Add troubleshooting section

### Phase 8: Finishing (Week 8-9)

#### 8.1 Final Verification
- Run `pnpm typecheck` — Fix all errors
- Run `pnpm lint` — Fix all warnings
- Run `pnpm test` — All tests pass
- Run `pnpm build` — Clean build
- Verify extension builds
- Verify docs match implementation

---

## Summary of Key Findings

### What's Working Well

- Local-first architecture is correct for the use case
- Manifest V3 extension with isolated content scripts
- Seed data system for first-run experience
- SM-2 spaced repetition implementation
- Zod validation at AI response boundaries
- CSS custom properties theme system
- Test infrastructure (Vitest + Testing Library)
- Feature folder pattern (good direction, incomplete)

### What Needs Immediate Attention

1. **Dual page/feature directories** — Merge `pages/` into `features/`
2. **Monolithic files** — Split 6+ files over 700 lines
3. **Triple IndexedDB implementations** — Unify storage layer
4. **Business logic in UI components** — Extract to service layer
5. **No AI provider abstraction** — Implement adapter pattern
6. **No application/use-case layer** — Add between components and storage
7. **Duplicate feature implementations** — Choose one version per feature
8. **Missing tests** — Especially for storage, AI, and learning engine
9. **Outdated documentation** — Multiple docs don't match current code
10. **Extension-web data isolation** — No sync mechanism exists

### What to Preserve

- All existing features (vocabulary, reading, listening, writing, speaking, grammar, mistakes, analytics, search, planner, AI tutor, extension)
- Local-first, no-backend philosophy
- User-provided API key model
- PWA offline capability
- Import/export functionality
- Seed data and content
- Existing test infrastructure

### Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Total files | ~166 | ~200 (more, smaller files) |
| Largest file | 2833 lines | <400 lines |
| IndexedDB implementations | 3 | 1 |
| Feature completeness (structure) | ~30% | 100% |
| Test coverage | ~5% | >60% |
| Documentation coverage | ~25% | 100% |
| Hardcoded colors | Many | Zero |

---

## 14. Vietnamese-Specific Assumptions & Hard-Coded Content

### 14.1 Data Model Level

| Location | Issue | Impact |
|----------|-------|--------|
| `apps/web/src/models/index.ts:103` | `VocabularyEntry.meaningVi: string` — Dedicated Vietnamese meaning field | All vocabulary entries carry Vietnamese baggage; the model assumes bi-lingual (EN-VI) storage |
| `apps/web/src/models/aiTutorModels.ts:144` | `UserTutorPreferences.language: 'english' \| 'vietnamese' \| 'both'` | Language system is hardcoded to just English/Vietnamese; no extensibility for other languages |
| `apps/web/src/models/aiTutorModels.ts:147` | `UserTutorPreferences.useVietnamese: boolean` | Overlapping boolean flag that duplicates `language` field |
| `apps/web/src/features/configuration/models.ts:15` | `AiTutorMode: 'vietnamese-explanation-tutor'` | Specific tutor mode for Vietnamese explanations |
| `apps/web/src/features/configuration/models.ts:31` | `AiResponseLanguage: 'english' \| 'vietnamese' \| 'both'` | Only 3 options; not extensible |
| `packages/ai/src/prompts/explain.ts:5` | `AiExplainType: 'vietnamese'` | Vietnamese explain is a first-class type, not a plugin |
| `packages/ai/src/schemas/vocabulary.ts:5` | `meaningVi` field in vocabulary Zod schema | AI output schema requires Vietnamese |
| `packages/ai/src/schemas/dictionary.ts:6` | `meaningVi` field in dictionary Zod schema | AI output schema requires Vietnamese |
| `packages/storage/src/schema.ts:55` | `meaningVi` field in storage schema | DB schema stores Vietnamese field for every vocabulary entry |
| `packages/ai-tutor/src/types/proactiveMessage.ts:126` | `TutorTone: 'vietnamese'` | Vietnamese is a built-in tone, not one of many possible languages |

### 14.2 AI Prompt Level — `vietnamese` as a Built-in Feature

| Location | Issue |
|----------|-------|
| `packages/ai/src/prompts/explain.ts:36` | System prompt: _"Translate this text to Vietnamese and explain any difficult English words"_ |
| `packages/ai/src/prompts/explain.ts:46` | System prompt: _"You are an IELTS tutor. Translate to Vietnamese and add vocabulary notes."_ |
| `packages/ai/src/prompts/vocabulary.ts:21` | Prompt asks for `meaningVi` — Vietnamese translation |
| `packages/ai/src/prompts/dictionary.ts:19` | Prompt asks for `meaningVi` — Vietnamese translation |
| `packages/ai/src/prompts/video.ts:120` | Prompt asks for Vietnamese `translation` in shadowing scripts |
| `apps/web/src/components/aiTutor/aiTutorHelper.ts:5` | `LANGUAGE_INSTRUCTION.vietnamese = 'Respond in Vietnamese only.'` |
| `apps/web/src/components/aiTutor/aiTutorHelper.ts:6` | `LANGUAGE_INSTRUCTION.both = 'Respond in both English and Vietnamese, separated by "---".'` |

### 14.3 AI Tutor Level — Hard-coded Vietnamese Fallback Responses

| File | Function | Lines | Description |
|------|----------|-------|-------------|
| `apps/web/src/pages/AITutorChat.tsx` | `generateFriendModeVietnamese()` | 186-202 | 4 Vietnamese chat responses for friendly mode (e.g. "Chào bạn! 😊 Rất vui được trò chuyện!") |
| `apps/web/src/pages/AITutorChat.tsx` | `generateVietnameseExplanation()` | 639-666 | 7 Vietnamese grammar/vocabulary explanations (e.g. "Mạo từ (a/an/the) có thể khó!") |
| `apps/web/src/components/aiTutor/SpeakingPartner.tsx` | `generateFeedbackVietnamese()` | 670-703 | Full Vietnamese speaking feedback with band estimates ("Ước tính Band Nói") |
| `apps/web/src/components/aiTutor/WritingTutor.tsx` | `generateFeedbackVietnamese()` | 927-946 | Full Vietnamese writing feedback with categories ("Điểm mạnh", "Cần cải thiện") |
| `apps/web/src/components/aiTutor/TeachingMode.tsx` | `generateLessonText()` | 640 | Vietnamese lesson text ("Giải thích", "Quy tắc chính") |
| `apps/web/src/components/aiTutor/TeachingMode.tsx` | `generateFeedbackMessage()` | 666-672 | Vietnamese lesson completion ("Hoàn thành bài học", "Điểm của bạn") |
| `apps/web/src/components/aiTutor/ReadingListeningTutor.tsx` | `getSummaryVietnamese()` | 269-276 | Vietnamese topic summaries ("Tóm tắt") |
| `apps/web/src/components/aiTutor/ReadingListeningTutor.tsx` | `generateVocabVietnamese()` | 325-344 | Vietnamese vocabulary headers ("Từ vựng IELTS quan trọng") |
| `apps/web/src/components/aiTutor/ReadingListeningTutor.tsx` | `generateComprehensionQuestions()` | 355 | Vietnamese question header ("Câu hỏi đọc hiểu") |
| `apps/web/src/components/aiTutor/ReadingListeningTutor.tsx` | Various | 417,473,626-661 | Vietnamese labels for opinion questions, exercises, IELTS connections |

### 14.4 Proactive Message Level

| Location | Issue |
|----------|-------|
| `packages/ai-tutor/src/services/proactiveMessageEngine.ts:87` | `TONE_PREFIXES.vietnamese = ['Chào bạn! ', 'Xin chào! ', 'Bạn ơi! ']` — Vietnamese greeting prefixes for proactive messages |

### 14.5 Extension Level — Vietnamese UI Labels

| Location | Issue |
|----------|-------|
| `apps/extension/src/popup/components/VocabularyCollector.tsx:684` | `<strong>Nghĩa:</strong>` — Vietnamese label for "Meaning" |
| `apps/extension/src/popup/components/WordDetails.tsx:171` | `title="Nghĩa (Vietnamese)"` — Vietnamese sub-header in word details |
| `apps/extension/src/popup/components/MiniTutor.tsx:32` | `description: 'Translate to Vietnamese'` — Action description hardcodes Vietnamese |
| `apps/extension/src/content-script/aiExplain.ts:368` | `renderSection('Vietnamese Translation', ...)` — Tab label hardcodes Vietnamese |

### 14.6 User-Facing Creator Info

| Location | Issue |
|----------|-------|
| `apps/web/src/pages/landing/config.ts:2` | `name: 'Phạm Thanh Hưng'` — Creator's Vietnamese name (appropriate for About page but not landing) |
| `apps/web/src/pages/LandingPage.tsx:63` | `"Built by Phạm Thanh Hưng · Free for all IELTS learners"` — Vietnamese name in main hero |

### 14.7 Default Language Settings

| Location | Issue |
|----------|-------|
| `apps/web/src/models/aiTutorModels.ts:156-168` | `DEFAULT_TUTOR_PREFERENCES` default `language: 'english'` is correct, but `useVietnamese: false` is redundant |
| `apps/web/src/features/configuration/storage.ts` | Configuration storage — no `nativeLanguage` or `explanationLanguage` fields are separated |
| `apps/web/src/features/configuration/models.ts:61` | `responseLanguage` is single field — doesn't separate app language from AI explanation language |
| `packages/ai-tutor/src/types/proactiveMessage.ts` | No language-agnostic message generation — all proactive messages are English-first with Vietnamese special case |

### 14.8 Missing Globalization Infrastructure

The app has **no**:
- i18n / l10n library (react-i18next, react-intl, etc.)
- Locale files (.json, .po, .yaml)
- Language detection (browser navigator.language)
- Right-to-left (RTL) support
- Country/region selection
- Locale-aware date/number formatting (uses `toLocaleDateString('en-US')` hardcoded)
- Language preference in localStorage keys (all hardcoded English)

Vietnamese support is implemented as **code-level branching** (`if (language === 'vietnamese')`) rather than through a proper translation system.

---

## 15. Inappropriate / Stale / Unused Features

### 15.1 Features to Remove (Not IELTS-Related)

| Feature | File | Reason |
|---------|------|--------|
| **Public API Importer** | `apps/web/src/features/publicApiIntegration/` (~2,000+ lines) | Searches Wiktionary, Datamuse, Tatoeba, Wikipedia, Project Gutenberg — not IELTS-specific; complex, unused dependency; duplicates existing content |
| **Artifacts (Saved URLs)** | `apps/web/src/features/artifacts/ArtifactsPage.tsx` (466 lines) | Generic bookmarking feature; not IELTS-specific; extension already saves articles |
| **Import/Export** | `apps/web/src/pages/ImportExport.tsx` (306 lines) | Duplicated by `packages/storage/backup/` export/import; extension has its own BackupRestore; two competing implementations |
| **Website Info Pages** | `apps/web/src/components/PublicTabPage.tsx` | About/Recruit/Donate/Feedback tabs — not learning features; personal website content mixed into product |
| **About Me Page** | `apps/web/src/features/info/AboutMe.tsx` | Personal portfolio content, not IELTS learning |
| **Recruit Page** | `apps/web/src/features/info/Recruit.tsx` | Recruitment info, not IELTS learning |
| **Donate Page** | `apps/web/src/features/info/Donate.tsx` | Donation page, not IELTS learning |
| **Send Feedback** | `apps/web/src/features/info/SendFeedback.tsx` | Could be useful but currently just a form with no backend |
| **WebsiteInfo** | `apps/web/src/features/info/WebsiteInfo.tsx` | Meta info page about the website itself |

### 15.2 Features to Review (Potentially Remove or Refactor)

| Feature | File | Reason |
|---------|------|--------|
| **Grammar Learning** | `apps/web/src/features/grammar/GrammarLearning.tsx` (1407 lines) | Duplicated by `GrammarNotes` page; two separate grammar features with overlapping functionality |
| **Grammar Notes** | `apps/web/src/pages/GrammarNotes.tsx` (728 lines) | Duplicates GrammarLearning; both are CRUD for grammar topics |
| **Mock Tests Tracker** | `apps/web/src/pages/MockTests.tsx` (749 lines) | Manual mock test entry tracker — no actual mock tests; just stores scores the user inputs manually |
| **Topics Progress** | `apps/web/src/pages/TopicsProgress.tsx` | Tracks progress by IELTS topic — useful but overlaps with dashboard and progress pages |
| **Progress Review (AI)** | `apps/web/src/features/progressReview/ProgressReviewPage.tsx` | AI-generated progress report — useful but duplicates `Progress.tsx` charts |
| **Analytics** | `apps/web/src/features/analytics/Analytics.tsx` (805 lines) | Recharts-based analytics page — duplicates `Progress.tsx` which already shows charts |
| **Search** | `apps/web/src/pages/Search.tsx` (675 lines) | Full-text search across all entities — useful but complex; edge-case feature |
| **Planner** | `apps/web/src/features/planner/Planner.tsx` | AI-generated schedule — duplicated by `StudyPlan` feature |
| **DailyPlan** | `apps/web/src/pages/DailyPlan.tsx` | Daily view of study tasks — overlaps with Dashboard and StudyPlan |
| **Review Center** | `apps/web/src/pages/ReviewCenter.tsx` | Centralized review hub — useful but duplicates vocabulary review flow |
| **Study Notes** | `apps/web/src/features/notes/StudyNotesPage.tsx` | Free-form notes feature — not IELTS-specific; generic note-taking |

### 15.3 Duplicate Page/Feature Implementations

These are the most critical duplicates that need consolidation:

| Feature | `pages/` file | `features/` file | Status |
|---------|--------------|------------------|--------|
| Dashboard | `src/pages/Dashboard.tsx` (446 lines) | `src/features/dashboard/Dashboard.tsx` (492 lines) | Different implementations |
| Vocabulary | `src/pages/Vocabulary.tsx` (1036 lines) | `src/features/vocabulary/Vocabulary.tsx` (772 lines) | Different implementations |
| Reading | `src/pages/ReadingJournal.tsx` (865 lines) | `src/features/reading/ReadingPractice.tsx` | Different approaches |
| Listening | `src/pages/ListeningJournal.tsx` (895 lines) | `src/features/listening/ListeningPractice.tsx` | Different approaches |
| Writing | `src/pages/WritingPractice.tsx` (1055 lines) | `src/features/writing/WritingPractice.tsx` | Different approaches |
| Speaking | `src/pages/SpeakingPractice.tsx` (1081 lines) | `src/features/speaking/SpeakingPractice.tsx` | Different approaches |
| Settings | `src/pages/Settings.tsx` + `DataManagement.tsx` (755 lines) | `src/features/settings/Settings.tsx` (591 lines) | Different implementations |
| Mistakes | `src/pages/Mistakes.tsx` (750 lines) | `src/features/mistakes/MistakeNotebook.tsx` (1068 lines) | Different implementations |
| Grammar | `src/pages/GrammarNotes.tsx` (728 lines) | `src/features/grammar/GrammarLearning.tsx` (1407 lines) | Different implementations |

### 15.4 Stale/Dead Code

| Item | Location | Evidence |
|------|----------|----------|
| `App.tsx` (root) | `src/App.tsx` | Not imported by `main.tsx` which imports from `src/app/App.tsx` instead |
| `pwa-config.ts` | `src/pwa-config.ts` | Contains only comments — JS file that never executes |
| `src/extension/` | `src/extension/ProactiveAssistant.ts` (445 lines) | Extension-specific code in web app's src/ — not imported by any web app component |
| Old landing components | `src/components/LandingPage.tsx`, `HeroSection.tsx`, etc. | `src/pages/landing/` has a separate, newer landing page implementation |
| `useDashboard` hook | `src/hooks/useDashboard.ts` | Only used by the OLD `src/pages/Dashboard.tsx`, not the `features/dashboard/` version |
| `useAutosave` hook | `src/hooks/useAutosave.ts` | Not imported anywhere in the current codebase |
| `data/ieltsContent.ts` | `src/features/tasks/ieltsContent.ts` | Static IELTS content — not imported by any component |
| `Phrases` data | `src/features/speaking/data/phrases.ts` | Speaking phrases — not imported by any speaking component |
| `DashboardPreviewSection` | `src/components/DashboardPreviewSection.tsx` | Old landing component — not used by new landing |
| `FeatureSection` | `src/components/FeatureSection.tsx` | Old landing component — not used by new landing |
| `DonationSection` | `src/components/DonationSection.tsx` | Old landing component — not used by new landing |
| `RecruitmentSection` | `src/components/RecruitmentSection.tsx` | Old landing component — not used by new landing |
| Duplicate UI component | `packages/ui/src/components/Toast.tsx` vs `src/components/ui/Toast.tsx` | Two Toast implementations |
| `AITutorSection` | `src/components/AITutorSection.tsx` | Maybe unused on landing |
| `FinalCTASection` | `src/components/FinalCTASection.tsx` | Maybe unused on landing |
| `Footer` | `src/components/Footer.tsx` | Has both old and new implementations |
| `SEOHead` | `src/components/SEOHead.tsx` | Not using react-helmet anywhere else |

### 15.5 Duplicate Services / Logic

| Area | Files | Problem |
|------|-------|---------|
| AI Service | `src/services/ai/AIService.ts` vs `packages/ai/` | Two separate AI call implementations |
| Storage | `src/services/storage/Database.ts` vs `packages/storage/` vs `apps/extension/src/storage/` | Three IndexedDB implementations |
| SM-2 Algorithm | `src/utils/spaced-repetition.ts` vs `packages/storage/reviewService.ts` vs `packages/exercises/reviewScheduler.ts` vs `packages/learning-engine/review-scheduler/` | Four implementations of the same algorithm |
| Settings Context | `src/context/SettingsContext.tsx` vs `src/features/configuration/configSlice.tsx` | Two settings management systems |
| Error Classes | `packages/utils/src/errors.ts` (22 classes) vs `packages/ai/src/errors/types.ts` (6) vs `packages/storage/src/errors.ts` (6) | Error classes duplicated with different messages |
| `generateId()` | `packages/exercises/utils/id.ts` vs `packages/ai-tutor/utils/id.ts` | Same function in 2 packages |
| `isInQuietHours()` | 3 files in `packages/ai-tutor/` | Same logic in 3 files |
| Writing Prompts | `src/features/writing/data/prompts.ts` vs extension's own data | Writing prompt data in both apps |
| Speaking Questions | `src/features/speaking/data/questions.ts` vs extension's own data | Speaking questions in both apps |

### 15.6 Dead Navigation Routes (from Layout.tsx)

These routes in the sidebar should be reviewed:

- `/artifacts` — Generic bookmarking feature
- `/search` — Full-text search (edge case)
- `/public-api` — Not IELTS-specific
- `/mock-tests` — Manual score tracker only
- `/grammar` — Duplicated by GrammarLearning
- `/topics` — Overlaps with dashboard/progress
- `/import-export` — Duplicated by backup system
- `/info` — Personal website content

---

## 16. Extension-Specific Issues

### 16.1 Vietnamese in Extension

| File | Line | Issue |
|------|------|-------|
| `VocabularyCollector.tsx` | 684 | `<strong>Nghĩa:</strong>` — Vietnamese UI label |
| `WordDetails.tsx` | 171 | `title="Nghĩa (Vietnamese)"` — Vietnamese header |
| `MiniTutor.tsx` | 32 | `'Translate to Vietnamese'` — action description |
| `aiExplain.ts` | 368 | `'Vietnamese Translation'` — tab label |

### 16.2 Stale/Half-Finished Extension Features

| Feature | Issue |
|---------|-------|
| **Video Helper** (`VideoHelper.tsx`) | Only works with YouTube; Vimeo detection is present but non-functional; no transcript for Vimeo |
| **Website Bridge** (`bridge-client.ts`) | Bridge to web app is defined but web app has no matching bridge server; sync is incomplete |
| **Proactive Message Panel** (`proactiveMessagePanel.tsx`) | In-page toast messages — intrusive UX; disabled by default |
| **Dictionary Panel** (`dictionaryPanel.ts`) | Quick word lookup on double-click — may conflict with page functionality |
| **Public Content Search** (`ImportExportSection.tsx`) | Searches 5 external APIs; complex feature with licensing/attribution requirements; not IELTS-specific |

### 16.3 Extension Duplicates Web App Data

The extension stores its own data in a **separate IndexedDB database** that is not accessible from the web app:
- `vocabularyStore.ts` — separate vocabulary data
- `articleStore.ts` — separate articles
- `mistakeStore.ts` — separate mistakes
- `videoStore.ts` — separate video data

This means users who use both the extension and the web app have **completely separate data silos**.

---

## 17. Localization System Requirements

### 17.1 Current State

The app uses a **custom ad-hoc language system** with these characteristics:
- `type Language = 'english' | 'vietnamese' | 'both'` in multiple files
- Language is propagated as a parameter to every AI generation function
- Vietnamese responses are generated via `if (language === 'vietnamese')` branching
- No locale files, no translation dictionaries, no i18n library
- `meaningVi` fields assume Vietnamese is the only second language worth storing

### 17.2 Required Changes for Globalization

1. **Separate language settings:**
   - `appDisplayLanguage` — language for UI chrome/menus/buttons
   - `aiExplanationLanguage` — language for AI tutor explanations
   - `contentLanguage` — language for exercise content/instructions
   - `nativeLanguage` — user's native language (for translation features)

2. **Remove hard-coded Vietnamese branching:**
   - Replace `if (language === 'vietnamese')` with `if (language === userSettings.aiExplanationLanguage)`
   - Replace hardcoded Vietnamese strings with AI-generated translations or locale files

3. **Data model changes:**
   - Remove `meaningVi` from core vocabulary schema; replace with language-agnostic `translations: Record<string, string>`
   - Remove `'vietnamese'` from `AiTutorMode`, `TutorTone`, `AiExplainType`; make language a separate dimension
   - Remove `useVietnamese` boolean (duplicates `language` field)

4. **AI prompt changes:**
   - Remove hardcoded Vietnamese-specific prompts
   - Make language instruction dynamic: `Respond in {language} only.`
   - Remove Vietnamese-specific schema fields from AI responses

5. **Default settings:**
   - Default app language: `'en'` (English)
   - Default AI explanation language: `'en'` (English)
   - Vietnamese available as an option, not the default

---

## 18. Product Direction Alignment

### 18.1 Features Aligned with Product Direction

| Feature | Alignment | Keep/Refactor |
|---------|-----------|---------------|
| Vocabulary Notebook | Core | **Keep** |
| Vocabulary Review (SM-2) | Core | **Keep** |
| AI Tutor | Core | **Refactor** |
| Study Plan | Core | **Refactor** |
| Dashboard | Core | **Refactor** |
| Reading Practice | Core | **Refactor** |
| Listening Practice | Core | **Refactor** |
| Writing Practice | Core | **Refactor** |
| Speaking Practice | Core | **Refactor** |
| Mistake Tracking | Core | **Keep** |
| Progress Review | Core | **Refactor** |
| Chrome Extension | Core | **Refactor** |
| PWA Support | Core | **Keep** |
| Local-first Storage | Core | **Keep** |
| AI Provider Config | Core | **Refactor** |

### 18.2 Features NOT Aligned with Product Direction

| Feature | Reason | Action |
|---------|--------|--------|
| Public API Import | Not IELTS-specific; complex dependencies | **Remove** |
| Artifacts (Bookmarks) | Generic bookmarking; not learning | **Remove** |
| Import/Export (page) | Duplicated by proper backup system | **Remove** |
| Website Info / About / Recruit / Donate | Personal website content; not IELTS | **Remove** |
| Grammar Learning (Gamified) | Duplicates Grammar Notes; half-finished | **Remove or Merge** |
| Grammar Notes (CRUD) | Basic CRUD; no actual grammar engine | **Merge into core** |
| Mock Tests Tracker | Manual entry only; no actual tests | **Remove or Refactor** |
| Topics Progress | Overlaps with Dashboard/Progress | **Merge** |
| Search | Edge-case feature; complex | **Consider removing** |
| Study Notes | Generic notes; not IELTS-specific | **Consider removing** |
| Review Center | Duplicates vocabulary review | **Merge** |

---

## 19. Cleanup Priority Matrix

| Priority | Item | Effort | Impact | Type |
|----------|------|--------|--------|------|
| P0 | Remove hardcoded Vietnamese fallback strings from AI Tutor components | Medium | High | Globalization |
| P0 | Remove `meaningVi` from core schemas; use flexible translations | Medium | High | Globalization |
| P0 | Separate language settings (app language vs AI language) | Medium | High | Globalization |
| P1 | Remove Public API Import feature | Low | High | Cleanup |
| P1 | Remove Artifacts feature | Low | High | Cleanup |
| P1 | Remove Info/About/Donate/Recruit pages | Low | Medium | Cleanup |
| P1 | Consolidate duplicate page/feature implementations | High | High | Architecture |
| P1 | Remove `'vietnamese'` from tutor modes, tones, and explain types | Medium | High | Globalization |
| P2 | Remove Mock Tests page | Low | Medium | Cleanup |
| P2 | Remove or consolidate duplicate Grammar features | Medium | Medium | Cleanup |
| P2 | Remove duplicate Import/Export page | Low | Medium | Cleanup |
| P2 | Remove old landing page components | Low | Low | Cleanup |
| P2 | Remove unused hooks (`useAutosave`) | Low | Low | Cleanup |
| P2 | Remove dead `src/App.tsx` (unused entry) | Low | Low | Cleanup |
| P2 | Remove `src/pwa-config.ts` (comment-only file) | Low | Low | Cleanup |
| P2 | Remove `src/extension/ProactiveAssistant.ts` from web app | Low | Medium | Cleanup |
| P3 | Consolidate 4 SM-2 algorithm implementations | High | Medium | Architecture |
| P3 | Consolidate 3 IndexedDB implementations | High | Medium | Architecture |
| P3 | Consolidate duplicate AI services | Medium | Medium | Architecture |
| P3 | Consolidate duplicate error classes | Medium | Low | Architecture |
| P3 | Add i18n library and locale files | High | High | Globalization |
| P3 | Update extension to use shared `@ielts/storage` package | High | Medium | Architecture |

---

## 20. Code Quality Metrics Summary

| Metric | Current | Target |
|--------|---------|--------|
| Vietnamese hardcoded strings | ~80 lines across 10 files | 0 |
| Vietnamese-specific data model fields | 6 locations (`meaningVi` × 4, `AiResponseLanguage`, `TutorTone`) | 0 (replaced by flexible system) |
| Duplicate features (`pages/` vs `features/`) | 9 pairs | 0 (consolidated) |
| Separate IndexedDB implementations | 3 | 1 |
| SM-2 implementations | 4 | 1 |
| Unused components | ~10 | 0 |
| Non-IELTS feature modules | 6-8 | 0 |
| `any`/`unknown` escape hatches | ~30 | 0 |
| Files >700 lines | 12 | 0 |
| Comment-only files | 2 | 0 |
