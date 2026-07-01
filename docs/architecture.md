# IELTS Learning Journey — Architecture

## Overview

A fully client-side, offline-first personal IELTS study website. All data lives in the browser (IndexedDB + localStorage). No backend, no authentication, no cloud.

## Tech Stack

| Layer          | Choice                       |
|----------------|------------------------------|
| Framework      | React 18                     |
| Language       | TypeScript                   |
| Build          | Vite                         |
| Styling        | Tailwind CSS 3               |
| Routing        | React Router v6              |
| DB             | IndexedDB (via `idb` lib)    |
| Settings       | localStorage                 |
| Charts         | Recharts                     |
| PWA            | vite-plugin-pwa              |
| AI (optional)  | Fetch to OpenAI-compatible API directly from browser |

---

## Folder Structure

```
src/
├── main.tsx                  # App entry point
├── App.tsx                   # Root component (Router + Layout)
├── index.css                 # Tailwind imports + global styles
├── vite-env.d.ts
│
├── models/                   # TypeScript interfaces & enums
│   └── index.ts              # All data models
│
├── services/                 # Data access layer (IndexedDB operations)
│   ├── db.ts                 # DB connection, schema versioning, migration
│   ├── vocabulary.ts         # Vocabulary CRUD
│   ├── tasks.ts              # Daily tasks CRUD
│   ├── reading.ts            # Reading journal CRUD
│   ├── listening.ts          # Listening journal CRUD
│   ├── writing.ts            # Writing practice CRUD
│   ├── speaking.ts           # Speaking practice CRUD
│   ├── grammar.ts            # Grammar notes CRUD
│   ├── mistakes.ts           # Mistake notebook CRUD
│   ├── mockTests.ts          # Mock test tracker CRUD
│   ├── reviews.ts            # Review/spaced repetition logic
│   ├── topics.ts             # Topic library queries
│   ├── settings.ts           # localStorage settings service
│   ├── importExport.ts       # JSON import/export for all stores
│   ├── seed.ts               # Seed data initialization
│   └── search.ts             # Global full-text search across stores
│
│   # Data flow:
│   #   Components → Custom Hooks → Services (IndexedDB) → idb lib → Browser API
│   #   Settings → localStorage directly via settings service
│
├── hooks/                    # Custom React hooks
│   ├── useDashboard.ts       # Dashboard aggregation logic
│   ├── useVocabulary.ts      # Vocabulary hook wrapping service
│   ├── useTasks.ts           # Daily plan hook
│   ├── useReading.ts         # Reading journal hook
│   ├── useListening.ts       # Listening journal hook
│   ├── useWriting.ts         # Writing practice hook
│   ├── useSpeaking.ts        # Speaking practice hook
│   ├── useGrammar.ts         # Grammar notes hook
│   ├── useMistakes.ts        # Mistake notebook hook
│   ├── useMockTests.ts       # Mock test tracker hook
│   ├── useReviews.ts         # Review queue hook
│   ├── useProgress.ts        # Analytics/aggregation hook
│   ├── useSearch.ts          # Global search hook
│   ├── useSettings.ts        # Settings hook
│   └── useAI.ts              # Optional AI helper hook
│
├── context/                  # React contexts
│   ├── ThemeContext.tsx       # Dark/light mode provider
│   └── SettingsContext.tsx    # Global settings provider
│
├── components/               # Reusable UI components
│   ├── layout/
│   │   ├── AppLayout.tsx     # Sidebar + main content shell
│   │   ├── Sidebar.tsx       # Navigation sidebar
│   │   ├── MobileNav.tsx     # Bottom tab nav for mobile
│   │   └── Header.tsx        # Top bar with breadcrumb/search
│   ├── ui/                   # Generic UI primitives
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── Button.tsx
│   │   ├── Modal.tsx
│   │   ├── EmptyState.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── SearchInput.tsx
│   │   ├── FilterBar.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── StatCard.tsx
│   │   ├── ConfirmDialog.tsx
│   │   └── Toast.tsx
│   ├── forms/
│   │   ├── VocabularyForm.tsx
│   │   ├── TaskForm.tsx
│   │   ├── ReadingForm.tsx
│   │   ├── ListeningForm.tsx
│   │   ├── WritingForm.tsx
│   │   ├── SpeakingForm.tsx
│   │   ├── GrammarForm.tsx
│   │   ├── MistakeForm.tsx
│   │   └── MockTestForm.tsx
│   ├── charts/
│   │   ├── StudyDaysChart.tsx
│   │   ├── StudyHoursChart.tsx
│   │   ├── VocabularyProgressChart.tsx
│   │   ├── ReadingAccuracyChart.tsx
│   │   ├── ListeningScoreChart.tsx
│   │   ├── WritingBandChart.tsx
│   │   ├── SpeakingTrendChart.tsx
│   │   ├── MockTestBandChart.tsx
│   │   └── SkillBalanceChart.tsx
│   ├── review/
│   │   ├── ReviewCard.tsx          # Flashcard-style review
│   │   ├── ReviewModeSelector.tsx
│   │   └── ReviewButtons.tsx       # Again/Hard/Good/Easy
│   ├── plan/
│   │   ├── TaskCard.tsx
│   │   ├── TaskList.tsx
│   │   └── DailyPlanGenerator.tsx
│   ├── vocabulary/
│   │   ├── VocabCard.tsx
│   │   ├── VocabTable.tsx
│   │   └── VocabContextPassage.tsx
│   └── dashboard/
│       ├── TodayPlan.tsx
│       ├── StudyStreak.tsx
│       ├── WeeklyProgress.tsx
│       ├── WeakSkills.tsx
│       └── MotivationalSummary.tsx
│
├── pages/                    # Route-level page components
│   ├── DashboardPage.tsx
│   ├── DailyPlanPage.tsx
│   ├── VocabularyPage.tsx
│   ├── VocabularyReviewPage.tsx
│   ├── ReadingJournalPage.tsx
│   ├── ListeningJournalPage.tsx
│   ├── WritingPracticePage.tsx
│   ├── SpeakingPracticePage.tsx
│   ├── GrammarNotesPage.tsx
│   ├── MistakeNotebookPage.tsx
│   ├── MockTestTrackerPage.tsx
│   ├── IELTSTopicsPage.tsx
│   ├── ProgressAnalyticsPage.tsx
│   ├── SettingsPage.tsx
│   └── ImportExportPage.tsx
│
├── utils/                    # Pure utility functions
│   ├── dates.ts              # Date formatting, streak calculation
│   ├── stats.ts              # Band calculations, averages
│   ├── validators.ts         # Form validation helpers
│   ├── debounce.ts
│   └── sampleData.ts         # Inline seed data constants
│
├── pwa-config.ts             # PWA manifest & service worker config
└── router.tsx                # Route definitions
```

---

## Component Hierarchy

```
App
├── ThemeContext.Provider
│   └── SettingsContext.Provider
│       └── BrowserRouter
│           └── AppLayout
│               ├── Header (search bar, theme toggle)
│               ├── Sidebar (desktop nav)
│               ├── MobileNav (bottom tabs)
│               └── <Routes>
│                   ├── DashboardPage
│                   │   ├── TodayPlan
│                   │   ├── StudyStreak
│                   │   ├── WeeklyProgress
│                   │   ├── StatCard (×5)
│                   │   ├── WeakSkills
│                   │   └── MotivationalSummary
│                   ├── DailyPlanPage
│                   │   ├── TaskList
│                   │   │   └── TaskCard (×n)
│                   │   ├── TaskForm
│                   │   └── DailyPlanGenerator
│                   ├── VocabularyPage
│                   │   ├── SearchInput
│                   │   ├── FilterBar
│                   │   ├── VocabTable / VocabCard
│                   │   ├── VocabularyForm (modal)
│                   │   └── VocabContextPassage
│                   ├── VocabularyReviewPage
│                   │   ├── ReviewModeSelector
│                   │   ├── ReviewCard
│                   │   └── ReviewButtons
│                   ├── ReadingJournalPage → ReadingForm
│                   ├── ListeningJournalPage → ListeningForm
│                   ├── WritingPracticePage → WritingForm
│                   ├── SpeakingPracticePage → SpeakingForm
│                   ├── GrammarNotesPage → GrammarForm
│                   ├── MistakeNotebookPage → MistakeForm
│                   ├── MockTestTrackerPage → MockTestForm
│                   ├── IELTSTopicsPage
│                   ├── ProgressAnalyticsPage
│                   │   └── charts/*
│                   ├── SettingsPage
│                   └── ImportExportPage
```

---

## Data Flow

```
User Action
    │
    ▼
Page Component (reads from custom hook)
    │
    ▼
Custom Hook (useVocabulary, useTasks, etc.)
    │  ├── Manages loading / error / empty states
    │  ├── Calls service functions
    │  └── Returns { data, isLoading, error, create, update, delete }
    │
    ▼
Service Layer (vocabulary.ts, tasks.ts, etc.)
    │  ├── Pure async functions
    │  ├── Uses db.ts to get IDB connection
    │  └── Handles IndexedDB transactions
    │
    ▼
db.ts (database.ts)
    │  ├── Opens / upgrades IndexedDB
    │  ├── Schema versioning via upgrade callback
    │  ├── Provides typed transaction helpers
    │  └── Exports: getDB(), withStore()
    │
    ▼
idb library (wraps IndexedDB API)
    │
    ▼
Browser IndexedDB
```

**Settings flow** (separate path):
```
SettingsPage → useSettings → settings.ts → localStorage
```

**AI flow** (optional, separate path):
```
User Action → Component → useAI hook → fetch(LLM API) → Response
                                    └─ API key from localStorage
```

---

## PWA Strategy

See `src/pwa-config.ts` for full configuration.

- `vite-plugin-pwa` generates service worker with precaching
- App shell cached on first load
- All data from IndexedDB (already offline)
- Manifest for install prompt
- Works fully offline after initial load

---

## Routing

Defined in `src/router.tsx`:

| Path                    | Page                  |
|-------------------------|-----------------------|
| `/`                     | DashboardPage         |
| `/plan`                 | DailyPlanPage         |
| `/vocabulary`           | VocabularyPage        |
| `/vocabulary/review`    | VocabularyReviewPage  |
| `/reading`              | ReadingJournalPage    |
| `/listening`            | ListeningJournalPage  |
| `/writing`              | WritingPracticePage   |
| `/speaking`             | SpeakingPracticePage  |
| `/grammar`              | GrammarNotesPage      |
| `/mistakes`             | MistakeNotebookPage   |
| `/mock-tests`           | MockTestTrackerPage   |
| `/topics`               | IELTSTopicsPage       |
| `/progress`             | ProgressAnalyticsPage |
| `/settings`             | SettingsPage          |
| `/import-export`        | ImportExportPage      |
