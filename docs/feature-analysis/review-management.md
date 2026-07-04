# Review Management and Pending Review Tracking

## Overview

The review system tracks learning items (vocabulary, mistakes, grammar notes, exercise results, writing/speaking sessions) through spaced repetition, determines which are due for review, and surfaces them to the user via manual navigation and AI-driven proactive reminders.

---

## System Architecture

```
┌──────────────────────────────────────────────────────────┐
│                  Data Sources (IndexedDB)                 │
│                                                          │
│  vocabularyReviews   mistakes   grammarNotes   exercises  │
│  writingSessions     speakingSessions                    │
└────────────────────────┬─────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│              Due Item Calculation Layer                   │
│                                                          │
│  VocabReviewRepository   ExerciseReviewScheduler         │
│  MistakeService          ReviewCenter (6 groups)         │
│  DashboardService        spaced-repetition.ts            │
└────────────────────────┬─────────────────────────────────┘
                         │
            ┌────────────┴────────────┐
            ▼                         ▼
┌───────────────────────┐  ┌──────────────────────────┐
│   Manual UI Triggers   │  │  AI / Automation Layer   │
│                       │  │                          │
│  Sidebar nav links    │  │  ProactiveMessageEngine  │
│  (/review, /review-   │  │  SuggestionEngine        │
│   center)             │  │  ReminderService         │
│  Dashboard cards      │  │  ChatContext (AI tutor)  │
│  Review Center page   │  │                          │
│  Vocabulary/Mistakes/ │  │                          │
│   Grammar pages       │  │                          │
└───────────────────────┘  └──────────────────────────┘
```

---

## Pending Review Data Model

### 1. Vocabulary Reviews (`vocabularyReviews` table — IndexedDB)

```typescript
interface VocabReviewEntry {
  id: string
  vocabularyId: string   // FK → vocabulary.id
  interval: number        // SM-2 interval in days
  easeFactor: number      // Min 1.3
  repetitions: number     // Consecutive correct recalls
  nextReviewDate: string  // ISO date — when this item is next due
  lastReviewDate: string  // ISO date — last review timestamp
  history: Array<{
    date: string
    rating: ReviewRating  // 'again' | 'hard' | 'good' | 'easy'
  }>
}
```

**Due calculation**: `nextReviewDate <= today` (date-only comparison, time truncated).

### 2. Exercise Reviews (`ExerciseReviewRecord` — in-memory / localStorage)

```typescript
interface ExerciseReviewRecord {
  id: string
  exerciseId: string
  resultId: string
  lastReviewedAt: string
  nextReviewAt: string     // ISO datetime — when due
  interval: number
  easeFactor: number
  repetitions: number
  history: Array<{ date: string; rating: ReviewRating; score: number }>
  createdAt: string
  updatedAt: string
}
```

**Due calculation**: `new Date(nextReviewAt) <= now` plus `ReviewEligibilityChecker` categorizes into `dueNow`, `dueSoon` (within 3 days), `notDue`.

### 3. Mistakes (`mistakes` table)

```typescript
interface MistakeEntry {
  id: string
  mistake: string
  correction: string
  status: MistakeStatus  // 'new' | 'reviewed' | 'resolved'
  repetitionCount: number
  // ...
}
```

**Due calculation**: status `'new'` → always due; status `'reviewed'` → due if 1+ day since `updatedAt`; status `'resolved'` → never due.

### 4. Grammar Notes

- Status-based: `'weak'` → due; `'reviewing'` or `'mastered'` → not due.

### 5. Writing / Speaking Sessions

- Age-based: sessions older than 7 days without an improved version are flagged for review.

---

## Review Initiation Flow

### Manual UI Triggers

| Trigger | Route | Component | Behavior |
|---------|-------|-----------|----------|
| Sidebar nav "Review" | `/review` | `VocabularyReview.tsx` | Loads daily vocab queue via `getDailyReviewQueue()`, starts flashcard session |
| Sidebar nav "Review Center" | `/review-center` | `ReviewCenter.tsx` | Aggregates all 6 review group counts, links to each dedicated page |
| Dashboard "Reviews Due" card | `/dashboard` | `Dashboard.tsx` | Shows count, clicking navigates to `/review` |
| Dashboard Proactive Suggestion cards | `/dashboard` | Suggestion cards | "Start review" / "Review Now" buttons navigate to relevant review page |
| Mistakes page | `/mistakes` | `Mistakes.tsx` | Lists mistakes with "mark reviewed" / "mark resolved" actions |
| Grammar page | `/grammar-notes` | `GrammarNotes.tsx` | Lists grammar notes with status toggles |

### Review Session Lifecycle (Vocabulary)

```
User navigates to /review
        │
        ▼
VocabularyReview.tsx mounts
        │
        ▼
getDailyReviewQueue() called
  → fetches all vocabularyReviews from IndexedDB
  → filters where nextReviewDate <= today
  → fetches vocabulary entries for each review
  → returns queue of { vocab, reviewEntry } pairs
        │
        ▼
Flashcard session starts
  │
  ├─ Review modes: Word→Meaning, Meaning→Word, Gap-fill, Collocations
  │
  ├─ User rates: Again | Hard | Good | Easy
  │     │
  │     ▼
  │   calculateNextReview(entry, rating) — SM-2 algorithm
  │     → updates interval, easeFactor, repetitions
  │     → sets nextReviewDate
  │     → saves to IndexedDB
  │     → updates vocabulary status (new→learning→reviewing→mastered)
  │
  └─ Queue exhausted
        │
        ▼
  "Review Complete!" summary shown
    → counts per rating
    → "Start New Review" button (loads refreshed queue)
```

---

## Pending Review Count Calculation

### Vocabulary Due Count

```typescript
function countDueReviews(reviews: VocabReviewEntry[]): number {
  const today = new Date().toISOString().slice(0, 10)
  return reviews.filter(r => r.nextReviewDate.slice(0, 10) <= today).length
}
```

Used by: `dashboardService.ts`, `VocabReviewRepository.getDueCount()`, `getDailyReviewQueue()`.

### Review Stats

```typescript
interface ReviewStats {
  dueCount: number    // nextReviewDate <= today
  totalCount: number  // all review entries
  masteredCount: number   // interval >= 21 && repetitions >= 5
  learningCount: number   // interval < 21 || repetitions < 5
}
```

### Mistake Due Count

Calculated in `mistakeService.ts`:
- `'new'` mistakes: always due
- `'reviewed'` mistakes: due if `daysSinceUpdate >= 1`
- `'fixed'` mistakes: never due

### Review Center Aggregation (6 groups)

| Group | Source | Due Criterion |
|-------|--------|---------------|
| Vocabulary Due Today | `vocabularyReviews` | `nextReviewDate <= today` |
| Difficult Words | `vocabulary` | `difficulty === 'hard'` OR `status === 'new' \| 'learning'` |
| Grammar Weak Points | `grammarNotes` | `status === 'weak'` |
| Repeated Mistakes | `mistakes` | Sorted by `repetitionCount` desc (top 20) |
| Old Essays | `writingSessions` | Created >7 days ago, no improved version |
| Old Speaking Answers | `speakingSessions` | Created >7 days ago, no improved answer |

---

## AI / Automation Layer

### ProactiveMessageEngine

**File**: `apps/web/src/services/ProactiveMessageEngine.ts`

- `checkDueReview()` — auto-detects vocabulary due for review, generates high-priority message when >10 words due
- `checkWeakSkillWarning()` — detects mistake patterns and exercise scores <60%, generates `mistake-review` messages
- Messages include "Review Now" navigation action

### SuggestionEngine

**File**: `apps/web/src/services/aiTutor/SuggestionEngine.ts`

- `analyzeSavedVocabulary()` — if >=3 saved vocab notes, generates `vocabulary-review` suggestion with "Review Now"
- `analyzeExerciseResults()` — if recent scores <70%, generates `mistake-review` suggestion
- `analyzeMistakePatterns()` — detects repeated mistake patterns
- `analyzeStudyConsistency()` — if no study >2 days, suggests "Let's begin with a short review"
- `getPendingSuggestions()` — auto-generates if fewer than 3 suggestions are pending

### ReminderService

**File**: `apps/web/src/services/aiTutor/ReminderService.ts`

- Registers browser alarms for `vocabulary-review` and `mistake-review` types
- Message: "Take a few minutes to review your recent mistakes"
- Exam-approaching reminders also include review suggestions

### AI Tutor Chat Context

**File**: `apps/web/src/services/ChatContext.ts`

- When on `/review` path, AI tutor context switches to `vocabulary-review` mode
- Instruction: "You are a vocabulary review assistant. Keep sessions short, about 5-10 words. Use spaced repetition."
- AI can generate on-demand review exercises

---

## Spaced Repetition Algorithm (SM-2)

### Implementation

**Vocabulary**: `apps/web/src/utils/spaced-repetition.ts`
**Exercises**: `packages/exercises/src/reviewScheduler.ts`

| Rating | Interval Effect | Ease Factor Effect |
|--------|----------------|-------------------|
| Again | Reset to 0, next = 1 day | EF -= 0.2 (min 1.3) |
| Hard | interval *= 1.2 | EF -= 0.15 (min 1.3) |
| Good | 0→1 day, 1→6 days, then interval * EF | Unchanged |
| Easy | 0→2 days, 1→10 days, then interval * EF * 1.3 | EF += 0.15 |

### Exercise Scheduling Strategies

Two strategies in `reviewScheduler.ts`:

1. **DefaultSchedulerStrategy**: Maps accuracy to rating (>=90 easy, >=70 good, >=50 hard, else again). Demotes to 'hard' if mistakes present.
2. **AdaptiveSchedulerStrategy**: Considers accuracy + time ratio + mistake ratio. Adjusts interval down by 30% if time >3x expected and accuracy <80%.

---

## Current Limitations

1. **No auto-start**: Reviews never begin automatically — always requires user navigation or click
2. **No push notifications**: ReminderService uses browser alarms (visible only when app is open), not push notifications
3. **No smart prioritization**: `getDailyReviewQueue()` sorts by `nextReviewDate` only — no priority weighting by item difficulty, performance history, or exam proximity
4. **AI quiz generator unused**: `generateVocabularyQuiz()` exists in `packages/ai` but is not wired into the review flashcard flow — reviews use hardcoded formats from stored data
5. **No session resumption**: If user leaves mid-review, there is no "continue where you left off" — next visit loads a fresh queue
6. **No cross-device sync**: Pending review counts are per-device (IndexedDB local), so review progress is not shared between extension and web app
7. **No adaptive queue sizing**: Queue returns all due items at once — no session length configuration or intelligent card limit
