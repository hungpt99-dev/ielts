# Refactor Analysis Report

> Comprehensive codebase analysis for the IELTS Learning Journey project.
> Date: 2026-07-01
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
