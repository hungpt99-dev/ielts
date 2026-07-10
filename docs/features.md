# IELTS Journey — Features

> Detailed technical documentation of all project features, their architecture, data flow, and implementation details.

---

## Table of Contents

1. [Feature Overview](#1-feature-overview)
2. [Vocabulary Management](#2-vocabulary-management)
3. [Skill Tracking](#3-skill-tracking)
4. [Daily Study Plan](#4-daily-study-plan)
5. [Mistake Notebook](#5-mistake-notebook)
6. [Mock Test Tracker](#6-mock-test-tracker)
7. [Progress Analytics](#7-progress-analytics)
8. [Learning Journey Engine](#8-learning-journey-engine)
9. [AI Tutor Chat](#9-ai-tutor-chat)
10. [Exercise Generator](#10-exercise-generator)
11. [Content Library](#11-content-library)
12. [Browser Extension](#12-browser-extension)
13. [Import / Export](#13-import--export)
14. [PWA Support](#14-pwa-support)
15. [Theme System](#15-theme-system)
16. [AI Learning Progress Review](#16-ai-learning-progress-review)

---

## 1. Feature Overview

All features are implemented as **feature modules** under `apps/web/src/features/`. Each module owns its components, hooks, services, and types. Shared business logic lives in `packages/` and is consumed by both the web app and the browser extension.

| Feature | Package Dependency | Data Store | AI Optional |
|---------|------------------|------------|-------------|
| Vocabulary | `packages/learning-engine` | IndexedDB | Yes |
| Skill Tracking | `packages/storage` | IndexedDB | No |
| Daily Plan | `packages/learning-engine` | IndexedDB | No |
| Mistake Notebook | `packages/storage` | IndexedDB | No |
| Mock Tests | `packages/storage` | IndexedDB | No |
| Analytics | `packages/learning-engine` | IndexedDB | No |
| Progress Review | `packages/ai-tutor`, `packages/learning-engine` | IndexedDB | Yes |
| AI Tutor | `packages/ai`, `packages/ai-tutor` | IndexedDB + localStorage | Yes |
| Exercises | `packages/exercises` | IndexedDB | Yes |
| Content Library | `packages/content` | IndexedDB | No |
| Import/Export | `packages/import-export` | File system | No |

---

## 2. Vocabulary Management

### Architecture

The vocabulary system implements **SM-2 spaced repetition** for optimal review scheduling.

```
Feature Module (apps/web/src/features/vocabulary/)
├── components/          # UI: vocabulary list, review cards, tag editor
├── hooks/               # useVocabulary, useReviewSession
├── services/            # VocabularyService (CRUD + review scheduling)
└── types/               # VocabularyEntry, ReviewSession types

Domain Package (packages/learning-engine/)
└── src/
    ├── engines/
    │   └── vocabulary-review-engine.ts  # SM-2 algorithm
    └── models/
        └── vocabulary.ts               # Domain entities
```

### Data Model

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` (UUID) | Unique identifier |
| `word` | `string` | The vocabulary word/phrase |
| `definition` | `string` | Meaning or translation |
| `examples` | `string[]` | Usage example sentences |
| `tags` | `string[]` | User-defined categories |
| `source` | `"manual" \| "extension" \| "ai"` | Origin of the entry |
| `reviewData` | `SM2ReviewData` | SM-2 scheduling state |
| `createdAt` | `number` | Unix timestamp |
| `updatedAt` | `number` | Unix timestamp |

### SM-2 Review Cycle

1. New words start with an initial ease factor and interval
2. Each review updates the ease factor based on quality rating (0-5)
3. Intervals grow exponentially: 1 day → 6 days → 16 days → ...
4. Words with ease factor below threshold are flagged for more frequent review
5. Review queue is sorted by due date, overdue items appear first

### API Surface

```typescript
// VocabularyService
getDueReviews(limit?: number): Promise<VocabularyEntry[]>
addEntry(entry: CreateVocabularyEntry): Promise<VocabularyEntry>
updateEntry(id: string, updates: Partial<VocabularyEntry>): Promise<void>
submitReview(id: string, quality: number): Promise<SM2ReviewData>
searchByTag(tags: string[]): Promise<VocabularyEntry[]>
deleteEntry(id: string): Promise<void>
exportAll(): Promise<VocabularyEntry[]>
```

---

## 3. Skill Tracking

### Architecture

Each IELTS skill (Reading, Listening, Writing, Speaking) plus Grammar is tracked via a shared session logging pattern.

```
Feature Module (apps/web/src/features/reading|listening|writing|speaking|grammar/)
└── components/       # Session form, history list, score input
└── hooks/            # useStudySession
└── services/         # StudySessionService
```

### Data Model

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` (UUID) | Unique identifier |
| `skill` | `"reading" \| "listening" \| "writing" \| "speaking" \| "grammar"` | Skill category |
| `duration` | `number` | Minutes spent |
| `score` | `number \| null` | Optional score/band estimate |
| `notes` | `string` | User notes |
| `timestamp` | `number` | Unix timestamp of session |
| `tags` | `string[]` | Optional categorization |

### Key Behaviors

- Sessions are immutable after creation (no editing, only deletion)
- Duration and score contribute to analytics calculations
- Each session is stored in IndexedDB via `StudySessionRepository`

---

## 4. Daily Study Plan

### Architecture

The daily plan is generated by the Learning Journey Engine based on weakness analysis, due reviews, and user preferences.

```
Domain Package (packages/learning-engine/)
└── src/
    ├── engines/
    │   ├── daily-plan-engine.ts       # Plan generation
    │   └── weakness-detection-engine.ts  # Weakness identification
    └── models/
        └── daily-plan.ts              # Plan domain entities
```

### Generation Algorithm

1. **Collect inputs**: Due vocabulary reviews, due mistake reviews, recent session history, user target
2. **Compute weaknesses**: Compare time spent per skill against target distribution
3. **Prioritize tasks**: Apply weighted priority formula
4. **Allocate time**: Distribute available study time across tasks
5. **Return plan**: Sorted list of study tasks with time estimates

### Plan Structure

```typescript
interface DailyPlan {
  date: string; // ISO date
  totalTime: number; // Estimated total minutes
  tasks: StudyTask[];
  generatedAt: number;
}

interface StudyTask {
  type: "vocabulary_review" | "skill_practice" | "mistake_review" | "mock_test" | "exercise";
  skill?: SkillType;
  priority: number; // 0-100
  estimatedMinutes: number;
  description: string;
}
```

---

## 5. Mistake Notebook

### Architecture

Mistakes are tracked by skill and surfaced for review based on frequency and recency.

```
Feature Module (apps/web/src/features/mistakes/)
├── components/       # Mistake list, editor, review cards
├── hooks/            # useMistakes, useMistakeReview
└── services/         # MistakeService
```

### Data Model

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` (UUID) | Unique identifier |
| `skill` | `SkillType` | Which skill the mistake relates to |
| `description` | `string` | What the mistake was |
| `correction` | `string` | Correct answer or approach |
| `explanation` | `string` | Why it was wrong |
| `frequency` | `number` | How many times this mistake occurred |
| `lastOccurred` | `number` | Unix timestamp |
| `tags` | `string[]` | Optional categorization |

### Review Scheduling

- Mistakes are scored by `frequency × recencyWeight`
- High-scoring mistakes appear more often in review queues
- Mistakes with no review in 30+ days get priority boost

---

## 6. Mock Test Tracker

### Architecture

Stores mock test results with overall band and per-skill band scores for trend analysis.

```
Feature Module (apps/web/src/features/mock-test/)
├── components/       # Score form, history table, trend chart
├── hooks/            # useMockTests
└── services/         # MockTestService
```

### Data Model

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` (UUID) | Unique identifier |
| `testName` | `string` | Name or identifier of the test |
| `testDate` | `string` | ISO date string |
| `overallBand` | `number` | Overall IELTS band score (0-9) |
| `reading` | `number` | Reading band |
| `listening` | `number` | Listening band |
| `writing` | `number` | Writing band |
| `speaking` | `number` | Speaking band |
| `notes` | `string` | Optional notes |

### Trend Analysis

- Band scores are plotted over time using Recharts
- Per-skill trend lines show improvement or regression
- Moving average (last 3 tests) is computed for each skill

---

## 7. Progress Analytics

### Architecture

Analytics are computed from raw session and mock test data using the Learning Journey Engine.

```
Feature Module (apps/web/src/features/analytics/)
├── components/       # Charts: study days, hours, band trends, skill balance
├── hooks/            # useAnalytics
└── services/         # AnalyticsService

Domain Package (packages/learning-engine/)
└── src/
    ├── engines/
    │   ├── progress-engine.ts         # Study stats computation
    │   └── analytics-engine.ts        # Chart data transformation
    └── models/
        └── analytics.ts               # Analytics domain entities
```

### Computed Metrics

| Metric | Source | Formula |
|--------|--------|---------|
| Total study days | Sessions | Count of unique dates with sessions |
| Hours per skill | Sessions | Sum(duration) / 60 grouped by skill |
| Skill balance | Sessions | Percentage of total time per skill |
| Study streak | Sessions | Consecutive days with at least one session |
| Band trend | Mock tests | Moving average of overallBand |
| Weekly reflection | Sessions + mock tests | Aggregate stats for the past 7 days |

### Data Flow

```
Sessions (IndexedDB) → ProgressEngine → AnalyticsService → useAnalytics hook → Charts
```

---

## 8. Learning Journey Engine

### Architecture

The core domain logic package (`packages/learning-engine/`) is a **framework-agnostic** pure TypeScript library with no React or browser dependencies.

```
packages/learning-engine/
└── src/
    ├── engines/
    │   ├── vocabulary-review-engine.ts
    │   ├── daily-plan-engine.ts
    │   ├── weakness-detection-engine.ts
    │   ├── progress-engine.ts
    │   ├── analytics-engine.ts
    │   └── next-best-action-engine.ts
    ├── models/
    │   ├── vocabulary.ts
    │   ├── daily-plan.ts
    │   ├── weakness.ts
    │   ├── progress.ts
    │   └── analytics.ts
    ├── services/
    │   └── learning-journey-service.ts  # Facade over all engines
    └── utils/
        ├── date-utils.ts
        └── math-utils.ts
```

### Engines

| Engine | Responsibility |
|--------|---------------|
| `VocabularyReviewEngine` | SM-2 spaced repetition algorithm |
| `DailyPlanEngine` | Personalized daily study plan generation |
| `WeaknessDetectionEngine` | Identifies lowest-accuracy skills |
| `ProgressEngine` | Study statistics and streak calculations |
| `AnalyticsEngine` | Chart data transformations and aggregations |
| `NextBestActionEngine` | Priority-ranked study recommendations |

### Design Principles

- **Zero framework dependencies**: Can be tested in any JS runtime
- **Pure functions**: All engines are stateless; state comes from repositories
- **Composable**: Engines can be combined via `LearningJourneyService`
- **Testable**: Each engine has dedicated Vitest test suite

---

## 9. AI Tutor Chat

### Architecture

Messenger-style AI assistant with conversation memory and proactive messaging.

```
Feature Module (apps/web/src/features/ai-tutor/)
├── components/         # Chat bubble, input, proactive message banner
├── hooks/              # useChat, useProactiveMessages
└── services/           # ChatService, ProactiveMessageService

Packages:
├── packages/ai/
│   ├── src/
│   │   ├── adapters/          # OpenAI-compatible adapter
│   │   ├── prompts/           # Versioned prompt templates
│   │   └── validation/        # Zod response validation schemas
│   └── types.ts               # IAiAdapter interface
│
└── packages/ai-tutor/
    └── src/
        ├── conversation.ts     # Conversation context management
        ├── memory.ts           # Short-term and long-term memory
        └── context-builder.ts  # Builds context from learning engine data
```

### Data Flow

```
User message → ChatService → ContextBuilder → AI Adapter → OpenAI API
                                                                    ↓
User ← ChatService ← ResponseValidator ← prompt result ← API response
```

### Proactive Messages

| Trigger | Message Type | Content |
|---------|-------------|---------|
| Due vocabulary reviews | Reminder | "You have 12 words due for review" |
| Weak skill detected | Suggestion | "Your listening score dropped 0.5. Practice now?" |
| Exam countdown | Motivation | "IELTS in 14 days. Here's your focus plan." |
| Study streak | Encouragement | "7-day streak! Keep going." |

Proactive messages are generated locally by the learning engine, not by AI (unless the user enables AI-driven messages in settings).

### AI Provider Configuration

```typescript
interface AiConfig {
  provider: "openai" | "custom";
  apiKey: string; // user-provided, stored in localStorage
  baseUrl?: string; // custom endpoint
  model: string; // e.g., "gpt-4o"
  temperature: number; // 0-2
  maxTokens: number;
}
```

---

## 10. Exercise Generator

### Architecture

Dual-strategy exercise generation: AI-powered (for variety) and rule-based (for deterministic practice).

```
Package (packages/exercises/)
└── src/
    ├── strategies/
    │   ├── ai-exercise-strategy.ts        # AI-generated exercises
    │   ├── grammar-exercise-strategy.ts   # Rule-based grammar drills
    │   └── vocabulary-exercise-strategy.ts # Rule-based vocab drills
    ├── models/
    │   ├── exercise.ts                    # Exercise domain entities
    │   └── scoring.ts                     # Scoring models
    ├── services/
    │   ├── exercise-generator.ts          # Strategy dispatcher
    │   └── exercise-scorer.ts             # Answer evaluation
    └── types.ts                           # Shared types
```

### Exercise Types

| Type | Strategy | Example |
|------|----------|---------|
| Grammar fill-in-blank | Rule-based | "She ___ (go) to school yesterday." |
| Vocabulary matching | Rule-based | Match words to definitions |
| Sentence completion | AI-generated | Contextual cloze exercises |
| Error correction | AI-generated | "Find the mistake: He go to school." |

### Scoring Flow

```
User answer → ExerciseScorer → Compare with expected answer
    → Score (correct/partial/incorrect) → Save to MistakeNotebook if wrong
```

---

## 11. Content Library

### Architecture

Built-in IELTS reading passages, listening transcripts, and vocabulary lists with versioned seeding.

```
Package (packages/content/)
└── src/
    ├── seed/
    │   ├── reading-passages.ts
    │   ├── listening-transcripts.ts
    │   ├── vocabulary-lists.ts
    │   └── index.ts              # Seeder with version tracking
    ├── models/
    │   └── content.ts
    └── services/
        └── content-service.ts    # Query, version check, update
```

### Versioning

- Each content item has a `version` field (semver-like)
- On first run, all content is seeded into IndexedDB
- On subsequent runs, the seeder checks the current version and applies incremental updates
- Content is never deleted — only added or deprecated

---

## 12. Browser Extension

See [extension-architecture.md](extension-architecture.md) for complete documentation.

### Architecture

```
apps/extension/
├── src/
│   ├── background/        # Service worker (MV3)
│   ├── content/           # Content scripts for webpage interaction
│   ├── popup/             # Mini AI tutor popup
│   ├── bridge/            # Bridge protocol for web app sync
│   └── utils/             # Shared utilities
```

### Key Capabilities

- Right-click context menu to save vocabulary/phrases
- Floating toolbar for quick capture
- YouTube transcript extraction for listening practice
- AI explanation for selected text (with API key)
- Mini AI tutor popup for quick lookups
- Bridge protocol communicates with web app via shared IndexedDB or message passing

---

## 13. Import / Export

### Architecture

```
Package (packages/import-export/)
└── src/
    ├── export-service.ts    # Serialize all data to JSON
    ├── import-service.ts    # Deserialize and validate JSON
    ├── schema.ts            # Zod schema for backup file format
    └── merge-strategies.ts  # Merge vs replace logic
```

### Export Format

```json
{
  "version": "1.0",
  "exportedAt": "2024-01-15T10:30:00Z",
  "data": {
    "vocabulary": [...],
    "studySessions": [...],
    "mistakes": [...],
    "mockTests": [...],
    "exercises": [...],
    "settings": {...}
  }
}
```

### Import Modes

| Mode | Behavior |
|------|----------|
| `merge` | Inserts new records, skips duplicates by ID |
| `replace` | Clears existing data, then inserts all records |

All imports are validated against Zod schemas before any data is written.

---

## 14. PWA Support

### Configuration

PWA is implemented via `vite-plugin-pwa` with the following service worker strategy:

- **Pre-cached**: Application shell (HTML, JS, CSS)
- **Runtime-cached**: None (all dynamic data comes from IndexedDB)
- **Offline fallback**: App shell loads, IndexedDB serves data

### Manifest

| Property | Value |
|----------|-------|
| `name` | IELTS Journey |
| `short_name` | IELTS Journey |
| `display` | `standalone` |
| `start_url` | `/` |
| `theme_color` | `#1e293b` |
| `background_color` | `#0f172a` |
| Icons | 192×192 and 512×512 PNG |

---

## 15. Theme System

See [theme-system.md](theme-system.md) for complete documentation.

### Architecture

```
Package (packages/theme/)
└── src/
    ├── tokens.css         # CSS custom properties for all design tokens
    ├── ThemeProvider.tsx  # React context for theme state
    └── types.ts           # Theme, ColorMode types
```

### Color Modes

| Mode | Description |
|------|-------------|
| `light` | Light background, dark text |
| `dark` | Dark background, light text |
| `system` | Follows OS preference via `prefers-color-scheme` |

All colors, spacing, typography, and shadows are defined as CSS custom properties in `packages/theme/src/tokens.css`.

---

## 16. AI Learning Progress Review

### Architecture

The AI Learning Progress Review feature generates a comprehensive, tutor-style report analyzing a user's study activity over a specified date range. It combines data aggregation from the Learning Journey Engine with AI-powered analysis via the AI Tutor pipeline.

```
Feature Module (apps/web/src/features/progressReview/)
├── components/
│   ├── ProgressReviewPanel.tsx     # Main report UI (all sections)
│   ├── DateRangeSelector.tsx       # 7-day / 30-day / custom range picker
│   └── ReportSection.tsx           # Shared section wrapper
├── hooks/
│   └── useProgressReview.ts        # State management hook
├── services/
│   ├── progressReviewService.ts    # Data aggregation + AI orchestration
│   └── __tests__/                  # Unit tests
├── index.ts                        # Public exports
└── ProgressReviewPage.tsx          # Page wrapper

Packages:
packages/learning-engine/src/progress/
└── AIProgressReviewService.ts      # Server-side data aggregation (fallback)

packages/ai-tutor/
├── src/
│   ├── controllers/
│   │   └── AIProgressReviewController.ts  # AI call + response parsing
│   └── prompts/
│       └── learningProgressReview.ts      # Prompt + response schema
```

### Data Model

The report is built from the `AIProgressReviewResponse` interface defined at `packages/ai-tutor/src/prompts/learningProgressReview.ts:78`:

| Field | Type | Description |
|-------|------|-------------|
| `overallSummary` | `string` | Concise paragraph summarizing the learning period |
| `improvements` | `string[]` | Specific skills or habits where the user improved |
| `struggles` | `string[]` | Areas needing focused practice |
| `repeatedMistakes` | `RepeatedMistake[]` | Mistake patterns with frequency and analysis |
| `vocabularyReviewStatus` | `VocabReviewStatus` | Total saved, mastered, still-learning counts + recommendation |
| `skillProgress` | `SkillProgressItem[]` | Per-skill stats: sessions, accuracy, trend, analysis |
| `studyPlanAdherence` | `string` | Evaluation of study consistency and plan adherence |
| `recommendedFocus` | `string[]` | 3-5 prioritized actions for the next period |
| `tutorFeedback` | `string` | Warm, personalized encouraging message |

Supporting input types (`ProgressReviewData`) include:

| Input | Source | Description |
|-------|--------|-------------|
| `summary` | Aggregated sessions + tasks | Study stats (minutes, sessions, days active, streak) |
| `skillProgress` | Reading/listening/writing/speaking sessions | Per-skill session count, accuracy, trend |
| `weaknessReport` | Mistakes + session data | Weak skills by severity, repeated mistake patterns |
| `vocabularyStatus` | Vocabulary entries + reviews | New, learning, reviewing, mastered counts |
| `recommendations` | Generated by detection engine | Data-driven study suggestions |
| `tutorFeedback` | Generated by feedback engine | Encouraging message based on metrics |

### Date Range Presets

The `DateRangeSelector` component (`apps/web/src/features/progressReview/components/DateRangeSelector.tsx:4`) offers three options:

| Preset | Range | Description |
|--------|-------|-------------|
| `7d` | Last 7 days | Weekly review for short-term progress |
| `30d` | Last 30 days | Monthly review for broader trends |
| `custom` | User-defined | Arbitrary start/end date via date inputs |

### Data Flow

```
User selects date range → DateRangeSelector
       ↓
User clicks "Generate Progress Report" → ProgressReviewPanel
       ↓
useProgressReview hook → generateProgressReview service
       ↓
┌────────────────────────────────────────────────────┐
│               progressReviewService                │
│                                                    │
│ 1. Query IndexedDB for all records in date range   │
│    (tasks, reading, listening, writing, speaking,  │
│     vocabulary, vocab reviews, mistakes, progress) │
│                                                    │
│ 2. Compute local skill stats & fallback report     │
│                                                    │
│ 3. Check if AI is configured (API key present)     │
│    ├─ Yes → build AI prompt → call AI → parse JSON │
│    │         └─ parse fails? → use fallback        │
│    └─ No  → return data-driven report directly     │
└────────────────────────────────────────────────────┘
       ↓
ProgressReviewReport → ProgressReviewPanel (render)
```

### AI Prompt Design

The AI prompt is constructed in `buildAiPrompt()` at `apps/web/src/features/progressReview/services/progressReviewService.ts:282`. It injects structured study data into a prompt that instructs the AI to behave as a personal IELTS tutor.

**System prompt** roles:
- Act as an experienced IELTS tutor
- Be specific, reference actual data
- Be honest but encouraging
- Write in warm, professional tutor tone with "you"
- Return valid JSON only

**User prompt** includes:
- Study period with start/end dates
- Active days, total study time, session count, streak
- Skill-by-skill progress table
- Unresolved mistakes with frequency
- Vocabulary status breakdown
- Explicit instruction to cover all 9 report sections

### Fallback Mechanism

When the AI call fails (no API key, network error, unparseable response), the system falls back to `buildReportFromData()` at `apps/web/src/features/progressReview/services/progressReviewService.ts:157`. This generates a structured report using local computation:

- Skill trends computed from `ProgressRecord` comparisons
- Study consistency from session date arithmetic
- Vocabulary stats from review intervals and repetitions
- Recommendations from rule-based heuristics (weak skills, low consistency, unresolved mistakes)

The fallback always produces a valid `ProgressReviewReport` — the feature never shows an empty state after generation.

### AI Provider Configuration

Uses the same configuration as the AI Tutor (section 9). If the user has not configured an API key, the feature returns a data-driven report without attempting an AI call.

### UI Components

| Component | File | Responsibility |
|-----------|------|----------------|
| `ProgressReviewPanel` | `components/ProgressReviewPanel.tsx` | Main layout, state management, all 9 report sections |
| `DateRangeSelector` | `components/DateRangeSelector.tsx` | Preset buttons + custom date inputs |
| `ReportSection` | `components/ReportSection.tsx` | Reusable section wrapper with icon and badge |
| `TrendBadge` | `components/ProgressReviewPanel.tsx` | Colored badge for skill trend (↑ improving / ↓ declining / → stable) |
| `SkillProgressSection` | `components/ProgressReviewPanel.tsx` | Per-skill progress bars with accuracy and trend |
| `VocabSection` | `components/ProgressReviewPanel.tsx` | Vocabulary stats: total, mastered, still-learning with progress bar |
| `RepeatedMistakesCard` | `components/ProgressReviewPanel.tsx` | Mistake list with pattern, skill badge, frequency |
| `RecommendationsList` | `components/ProgressReviewPanel.tsx` | Numbered recommendation list |
| `TutorFeedbackCard` | `components/ProgressReviewPanel.tsx` | Styled card with motivational feedback |

### Report Sections (Display Order)

1. **Overall Learning Summary** — High-level paragraph with study stats
2. **What You Improved** — Bullet list of improvement areas (green accent)
3. **What You Still Struggle With** — Bullet list of challenges (red accent)
4. **Repeated Mistakes** — Cards showing mistake patterns with frequency and analysis
5. **Vocabulary Review Status** — 3-column stat grid (total / mastered / learning) with progress bar
6. **Skill-by-Skill Progress** — Progress bars per skill with accuracy %, trend badge, and analysis
7. **Study Plan Adherence** — Consistency evaluation based on active days and streak
8. **Recommended Focus for Next Period** — Numbered action items
9. **Tutor's Feedback** — Encouraging message in a highlighted card with AI icon

### States

| State | Behavior |
|-------|----------|
| **Initial (no report)** | Empty state with icon and instructions to generate |
| **Loading** | Full-page spinner with status message |
| **Error (AI failure)** | Error card with retry button, fallback report shown |
| **Success** | Full report with all 9 sections + "Regenerate Report" button |
| **Empty data** | Sections gracefully display "No data" messages instead of hiding |
