# Proactive AI Tutor — Data Sources & API Analysis

## Overview

This document maps every data source required for proactive AI Tutor messages to the existing implementation. It identifies the storage layer (`@ielts/storage`), the computation/composition layer (`@ielts/learning-engine`), and the current AI Tutor consumption patterns (`@ielts/ai-tutor`).

---

## 1. Data Models

### 1.1 User Profile

| Field | Source | Type | Access |
|---|---|---|---|
| `targetBand` | `ProfileSettings` (manual) | `number` | `learningEngine.getProfile()` → `ProfileData.targetBand` |
| `currentBand` | Manual entry + mock test history | `number` | `ProfileData.currentBand`, `BandProgressHistory` |
| `bandProgress` | Computed: `currentBand / targetBand` | `number` | `ProfileData.bandProgress` |
| `examDate` | `ProfileSettings` | `ISOString \| null` | `ProfileData.examDate` |
| `examCountdownDays` | Computed from examDate | `number \| null` | `ProfileData.examCountdownDays` |
| `studyStreak` | Computed from session dates | `number` | `ProfileData.studyStreak` |
| `lastStudyDate` | Computed from session dates | `ISOString \| null` | `ProfileData.lastStudyDate` |
| `dailyStudyMinutes` | `ProfileSettings` | `number` | `ProfileData.dailyStudyMinutes` |
| `weakSkills` | `ProfileSettings` (manual) | `string[]` | `ProfileSettings.weakSkills` |
| `preferredTopics` | `ProfileSettings` | `string[]` | `ProfileSettings.preferredTopics` |

**Storage:** `ProfileSettings` is stored/managed by the app shell (not in IndexedDB — passed as input to `LearningEngine`).

**API:**
```
learningEngine.getProfile(settings, sessionDates) → ProfileData
```

---

### 1.2 Study Plan

| Model | Fields | Source | Access |
|---|---|---|---|
| `DailyPlan` | `date`, `totalMinutes`, `studyPriority`, `items[]`, `focusSkills[]` | Computed by `DailyPlanService` | `learningEngine.getDailyPlan(tasks, weakSkills, dueReviews, dailyStudyMinutes)` |
| `DailyPlanItem` | `skill`, `activity`, `minutes`, `reason` | Nested in `DailyPlan` | — |
| `CustomStudyPlan` | `id`, `name`, `goal`, `startDate`, `endDate`, `dailyMinutes`, `tasks[]` | `CustomStudyPlanRepository` (IndexedDB) | `customStudyPlanRepository.findAll()` |
| `TaskEntry` | `id`, `title`, `category`, `date`, `isDone`, `timeMinutes`, `completedAt` | `TaskRepository` (IndexedDB) | `taskRepository.findByDateRange()`, `taskRepository.findAll()` |

**Computations include:**
- `DailyPlanService.generateDailyPlan()` — prioritizes weak skills, due reviews, pending tasks
- `NextBestActionService.calculateNextBestActions()` — priority 1–10 actions (vocab review, mistake review, weak skill practice, mock test, streak start)

**Trigger for proactive messages:**
- `DailyPlan` is ready → `daily_plan_ready` trigger
- Study tasks are incomplete → `missed_task` trigger (not yet implemented, but data exists)

---

### 1.3 Vocabulary

| Model | Key Fields | Source | Access |
|---|---|---|---|
| `VocabularyEntry` | `id`, `word`, `meaning`, `meaningVi`, `difficulty`, `status`, `topic`, `tags`, `createdAt` | `VocabularyRepository` (IndexedDB) | `vocabularyRepository.findAll()`, `findByStatus()`, `queryByIndex('topic')` |
| `VocabReviewEntry` | `id`, `vocabularyId`, `interval`, `easeFactor`, `repetitions`, `nextReviewDate`, `lastReviewDate`, `history[]` | `VocabReviewRepository` (IndexedDB) | `vocabReviewRepository.findAll()`, `getDueReviews()` (standalone), `findByIndex('nextReviewDate')` |

**Review Service (standalone API):**
```
getDueReviews()              → VocabReviewEntry[] (due for review)
updateReview(id, rating)     → void (SM-2 algorithm)
getReviewStats()             → { dueCount, totalCount, masteredCount, learningCount }
addVocabularyToReview(...)   → creates VocabReviewEntry
```

**Learning Engine aggregates:**
```
learningEngine.getDueReviews(vocabulary, vocabReviews, mistakes)
  → DueReviews { vocabularyDue: VocabReviewDue[], mistakesDue: MistakeDue[], totalDue: number }
```

**Proactive message triggers:**
- `dueVocabularyCount > 0` → vocabulary review suggestion
- New words saved → low-priority `new_content_saved` message

---

### 1.4 Mistakes

| Model | Key Fields | Source | Access |
|---|---|---|---|
| `MistakeEntry` | `id`, `mistake`, `correction`, `explanation`, `source`, `date`, `skill`, `status` (new/reviewed/resolved), `repetitionCount` | `MistakeRepository` (IndexedDB) | `mistakeRepository.findAll()`, `findByStatus()`, `findBySkill()` |
| `MistakeDue` | `mistake`, `daysSinceLastReview` | Computed from `MistakeEntry` + review schedule | Nested in `DueReviews.mistakesDue` |
| `RepeatedMistake` | `pattern`, `skill`, `frequency`, `suggestion` | `WeaknessDetectionService` | `weaknessReport.repeatedMistakes` |
| `MistakeCategorySummary` | `skill`, `totalMistakes`, `unresolvedCount`, `resolvedCount` | `WeaknessDetectionService` | `weaknessReport.frequentMistakeCategories` |

**Standalone Mistake Service:**
```
saveMistake(data)       → id
getAllMistakes()        → MistakeEntry[]
getMistakeById(id)      → MistakeEntry | null
updateMistake(id, data) → void
deleteMistake(id)       → void
getMistakeStats()       → { total, byStatus, bySkill, dueForReview }
```

**Learning Engine aggregates:**
```
learningEngine.getWeaknessReport(mistakes, readingPractices, ...)
  → WeaknessReport { weakSkills, repeatedMistakes, frequentMistakeCategories }
```

**Proactive message triggers:**
- `dueMistakeCount > 0` → mistake review suggestion
- `recentMistakeCount >= 5` → `mistake_pattern_detected`
- Combined vocab + mistake due → `due_review` trigger

---

### 1.5 Progress & Session Data

| Model | Key Fields | Source | Access |
|---|---|---|---|
| `ReadingSession` | `id`, `title`, `accuracy`, `timeSpentMinutes`, `correctAnswers`, `totalQuestions`, `createdAt` | `ReadingSessionRepository` | `findByDateRange()` |
| `ListeningSession` | Same structure as ReadingSession | `ListeningSessionRepository` | `findByDateRange()` |
| `WritingSession` | `id`, `prompt`, `essay`, `wordCount`, `feedback`, `band`, `timeSpentMinutes`, `createdAt` | `WritingSessionRepository` | `findByDateRange()` |
| `SpeakingSession` | `id`, `part`, `question`, `recordingUrl`, `feedback`, `band`, `timeSpentMinutes`, `createdAt` | `SpeakingSessionRepository` | `findByDateRange()` |
| `PracticeSession` | Detailed per-question answers with scoring | `ReadingPracticeSessionRepository`, `ListeningPracticeSessionRepository` | `findAll()`, `findByDateRange()` |
| `ProgressRecord` | `date`, `skill`, `metric`, `value`, `unit` | `ProgressRecordRepository` | `findByDateRange()` |
| `MockTestEntry` | `id`, `listeningScore`, `readingScore`, `writingBand`, `speakingBand`, `overallBand`, `date` | `MockTestRepository` | `findAll()`, sorted by date |

**Learning Engine computations:**
```
learningEngine.getSkillProgress(readingPractices, listeningPractices, writingSessions, speakingSessions, progressRecords)
  → SkillProgress[] { skill, sessions, totalMinutes, accuracy, trend }

learningEngine.getExerciseAccuracy(readingPractices, listeningPractices, writingSessions, speakingSessions)
  → ExerciseAccuracy[] { skill, totalExercises, correctAnswers, accuracyPercent }

learningEngine.getSkillBalance(readingPractices, listeningPractices, writingSessions, speakingSessions)
  → SkillBalance[] { skill, sessions, hours, percentage }

learningEngine.getWeeklyProgress(tasks, sessionDates)
  → WeeklyProgress { weekStart, weekEnd, totalMinutes, tasksCompleted, daysActive, dailyBreakdown }

learningEngine.getBandProgressHistory(mockTests)
  → BandProgress[] { date, overall, listening, reading, writing, speaking }

learningEngine.getWeeklyReflection(skills, consistency, bandHistory)
  → WeeklyReflection { weekStart, weekEnd, totalStudyMinutes, consistencyScore, skillBreakdown, weakAreas, suggestions }
```

**Proactive message triggers:**
- `weakSkills.length > 0` → `weak_skill_warning`
- Exam countdown ≤ 90 days → `exam_countdown`
- Skills trending `declining` → practice suggestion
- Session completed → encouragement / next-action suggestion (not yet implemented as trigger)
- Disproportionate skill balance → rebalancing suggestion

---

### 1.6 Activity Logs & Study Consistency

| Model | Key Fields | Source | Access |
|---|---|---|---|
| `StudyConsistency` | `currentStreak`, `longestStreak`, `totalStudyDays`, `consistencyPercent`, `weeklyHistory[]` | `AnalyticsService` | `learningEngine.getStudyConsistency(sessionDates, taskDates)` |
| `WeeklyStudyDay` | `date`, `studied`, `minutes` | Computed from session dates | Nested in `StudyConsistency.weeklyHistory` |

**Derived from:** All session `createdAt` dates + completed task dates. No standalone activity log table — activity is inferred from the presence of session/task records on a given day.

**Proactive message triggers:**
- `studyStreak >= 3` → streak celebration (`study_streak`)
- `lowActivityDays >= 2` → re-engagement (`low_activity`)
- `lowActivityDays >= 7` → high-priority re-engagement
- Missed study days in `weeklyHistory` → missed task reminder

---

### 1.7 Saved Content (Articles, Selected Text)

| Model | Key Fields | Source | Access |
|---|---|---|---|
| `Artifact` | `id`, `url`, `title`, `description`, `tags`, `category`, `createdAt` | `ArtifactRepository` (IndexedDB) | `artifactRepository.findAll()`, `queryByIndex('createdAt')` |
| `StudyNote` | `id`, `title`, `content`, `source`, `tags`, `createdAt` | `StudyNoteRepository` | `findByDateRange()` |
| `UsefulPhrase` | `id`, `phrase`, `meaning`, `context`, `createdAt` | `UsefulPhraseRepository` | `findAll()` |

The extension saves content via `ArtifactRepository` and `StudyNoteRepository`. The `newContentCount` field in `ProactiveEngineInput` tracks recently saved items.

**Proactive message triggers:**
- `newContentCount > 0` → `new_content_saved`
- Saved words from articles → vocabulary review prompt

---

## 2. Current AI Tutor Data Consumption

### 2.1 ProactiveMessageEngine Input

```typescript
interface ProactiveEngineInput {
  dueVocabularyCount?: number      // from learningEngine.getDueReviews().vocabularyDue.length
  dueMistakeCount?: number         // from learningEngine.getDueReviews().mistakesDue.length
  dailyPlanReady?: boolean         // true when DailyPlan exists
  newContentCount?: number         // from artifactRepository.count()
  recentMistakeCount?: number      // from MistakeEntry with status='new' or recent date
  lowActivityDays?: number         // computed from lastStudyDate
  lastVisitDate?: string           // from session dates
  learnerProfile?: LearnerProfile  // mapped from ProfileData
}
```

### 2.2 Current Generators (9 rule-based)

| Generator | Input Fields Used | Trigger Condition | Priority |
|---|---|---|---|
| `generateVocabularyReview` | `dueVocabularyCount` | > 0 | medium (high if > 20) |
| `generateMistakeReview` | `dueMistakeCount` | > 0 | medium (high if > 10) |
| `generateWeakSkill` | `learnerProfile.weakSkills` | has entries | medium |
| `generateExamCountdown` | `learnerProfile.examDate` | ≤ 90 days until exam | low/medium/high |
| `generateStudyStreak` | `learnerProfile.studyStreak` | ≥ 3 | medium (high if ≥ 30) |
| `generateLowActivity` | `lowActivityDays` | ≥ 2 | low (high if ≥ 7) |
| `generateNewContent` | `newContentCount` | > 0 | low |
| `generateDailyPlan` | `dailyPlanReady` | true | medium |
| `generateMistakePattern` | `recentMistakeCount` | ≥ 5 | medium (high if > 15) |

### 2.3 AIProgressReviewController

Aggregates `AIProgressReviewData` (from `AIProgressReviewService`) and calls LLM via `buildLearningProgressReviewPrompt()` to generate structured progress review reports.

**Input:** `ProgressReviewData` containing:
- `dateRange`, `summary` (tasks, sessions, vocab, mistakes stats)
- `skillProgress[]`, `weaknessReport`
- `vocabularyStatus` (total, new, learning, reviewing, mastered)
- `progressTrend`, `recommendations`, `tutorFeedback`

---

## 3. Repositories & Access Methods

### 3.1 IndexedDB Repositories (via `@ielts/storage`)

Each table has a typed repository extending `BaseRepository<T>` with:

| Method | Description |
|---|---|
| `findAll()` | Get all records |
| `findAllPaginated(params)` | Paginated results |
| `findById(id)` | Single record |
| `findByDateRange(start, end, field)` | Date-filtered |
| `queryByIndex(index, value)` | Indexed query |
| `count()` | Record count |
| `searchByText(field, query)` | Text search |
| `create(data)` | Insert |
| `update(id, data)` | Full update |
| `patch(id, data)` | Partial update |
| `delete(id)` | Remove |

**Key tables for proactive triggers:**

| Table | Repository | Relevant Queries |
|---|---|---|
| `vocabulary` | `VocabularyRepository` | `findByStatus('new')`, `count()`, `queryByIndex('topic')` |
| `vocabularyReviews` | `VocabReviewRepository` | `queryByIndex('nextReviewDate')` for due items |
| `mistakes` | `MistakeRepository` | `findByStatus('new')`, `queryByIndex('skill')`, `count()` |
| `tasks` | `TaskRepository` | `findByDateRange()` for plan adherence |
| `readingSessions` | `ReadingSessionRepository` | Recent accuracy & time |
| `listeningSessions` | `ListeningSessionRepository` | Recent accuracy & time |
| `writingSessions` | `WritingSessionRepository` | Band scores & feedback |
| `speakingSessions` | `SpeakingSessionRepository` | Band scores & feedback |
| `readingPracticeSessions` | `ReadingPracticeSessionRepository` | Per-question scoring |
| `listeningPracticeSessions` | `ListeningPracticeSessionRepository` | Per-question scoring |
| `mockTests` | `MockTestRepository` | Band progress history |
| `progressRecords` | `ProgressRecordRepository` | `findByDateRange()` |
| `artifacts` | `ArtifactRepository` | Recent saved content |
| `studyNotes` | `StudyNoteRepository` | Saved text selections |
| `customStudyPlans` | `CustomStudyPlanRepository` | User-created study plans |
| `topicProgress` | `TopicProgressRepository` | Topic-based progress |

### 3.2 Standalone Services

| Service | Methods | Purpose |
|---|---|---|
| `MistakeService` (`storage/src/mistakeService.ts`) | `getMistakeStats()` | Quick mistake counts by status/skill |
| `ReviewService` (`storage/src/reviewService.ts`) | `getDueReviews()`, `getReviewStats()`, `addVocabularyToReview()` | Spaced-repetition review operations |
| `LearningEngine` (`learning-engine/src/LearningEngine.ts`) | `computeFullState()`, `getProfile()`, `getWeaknessReport()`, `getDueReviews()`, `getDailyPlan()`, `getNextBestActions()`, `getStudyConsistency()`, etc. | Composed analytics |

---

## 4. Trigger-to-Data Mapping for Proactive Messages

Below is the mapping of each desired proactive message scenario to the data source needed and how to access it.

| Proactive Message | Data Required | Access Method | Current Support |
|---|---|---|---|
| **Remind what to study today** | `DailyPlan` items + `DueReviews` | `learningEngine.getDailyPlan()` + `getDueReviews()` | Partial (`daily_plan_ready`) |
| **Suggest next lesson from plan** | `NextBestAction` (priority 1) | `learningEngine.getNextBestActions()` | Not directly used as trigger |
| **Remind to review vocabulary** | `VocabReviewEntry` due count | `learningEngine.getDueReviews().vocabularyDue.length` | ✅ `generateVocabularyReview` |
| **Warn when falling behind** | Tasks incomplete vs plan date | `taskRepository.findByDateRange()` filtered by `isDone=false` | Not implemented |
| **Encourage after completing lessons** | Recent completed tasks/sessions | `taskRepository.findByDateRange()` with `isDone=true` | Not implemented |
| **Suggest practice from repeated mistakes** | `RepeatedMistake[]` | `weaknessReport.repeatedMistakes` | Partial (`mistake_pattern_detected`) |
| **Recommend practice from weak skills** | `WeakSkill[]` with `severity='high'` | `weaknessReport.weakSkills` | ✅ `generateWeakSkill` |
| **Remind about missed study days** | `StudyConsistency.weeklyHistory` | `learningEngine.getStudyConsistency()` → missed days | Partial (`low_activity`) |
| **Suggest lighter session when inactive** | `lowActivityDays` + last session intensity | Computed from session dates + total minutes | Partial (`low_activity` — generic) |
| **Celebrate streaks** | `studyStreak >= 3` | `learningEngine.getProfile().studyStreak` | ✅ `generateStudyStreak` |
| **Review progress after 7/30 days** | `WeeklyReflection` + `AIProgressReviewData` | `learningEngine.getWeeklyReflection()` + `AIProgressReviewService` | ✅ via `AIProgressReviewController` |
| **Ask to continue unfinished lesson** | Tasks with `isDone=false` from recent dates | `taskRepository.findByDateRange()` | Not implemented |
| **Recommend exercises from saved words** | Saved vocabulary by `status='new'` or `'learning'` | `vocabularyRepository.findAll()` filtered by status | Partial (`new_content_saved`) |
| **Give daily IELTS tip** | No data needed (general tip) | N/A — time-based only | Not implemented |
| **Suggest mock test** | `examCountdownDays <= 7` | `profile.examCountdownDays` | Not in engine (only in `NextBestActionService`) |
| **Remind of exam date + target** | `ProfileData.examDate` + `targetBand` | `learningEngine.getProfile()` | ✅ `generateExamCountdown` |

---

## 5. Gaps & Recommendations

### 5.1 Missing Triggers in Current Engine

| Trigger | Data Exists? | Engine Has Generator? |
|---|---|---|
| `missed_task` | ✅ Tasks + dates | ❌ |
| `lesson_completed` | ✅ Sessions + tasks | ❌ |
| `falling_behind_plan` | ✅ Plan + tasks | ❌ |
| `incomplete_lesson` | ✅ Tasks | ❌ |
| `mock_test_ready` | ✅ NextBestAction | ❌ |
| `daily_tip` | ✅ (no data needed) | ❌ |
| `weak_skill_rebalance` | ✅ SkillBalance | ❌ |

### 5.2 Data Not Currently Wired to AI Tutor

The AI Tutor currently takes a flat `ProactiveEngineInput` struct and does not call the Learning Engine directly. In production, the consuming app (web/extension) must:

1. Fetch data from storage repositories
2. Pass it to `learningEngine.computeFullState()`
3. Extract relevant fields and construct `ProactiveEngineInput`
4. Call `generateProactiveMessages(input)`

The `NextBestAction[]` from the Learning Engine is currently not consumed by the AI Tutor at all — it is the most actionable pre-computed suggestion list and should be wired into proactive message generation for richer, more targeted messages.

### 5.3 Recommended Integration Flow

```
┌─────────────────────────────────────────────────────────┐
│ App Shell (web / extension)                              │
│                                                          │
│  1. Collect raw data from storage repositories            │
│     → vocabulary, mistakes, tasks, sessions, mock tests   │
│                                                          │
│  2. Call learningEngine.computeFullState(input)            │
│     → ProfileData, SkillProgress, WeaknessReport,         │
│       DueReviews, DailyPlan, NextBestActions,             │
│       StudyConsistency, WeeklyReflection, SkillBalance    │
│                                                          │
│  3. Build ProactiveEngineInput from LearningEngineState   │
│     + enrich with NextBestActions, RepeatedMistakes,      │
│       SkillBalance data                                   │
│                                                          │
│  4. Call generateProactiveMessages(input)                  │
│     → ProactiveMessage[] sorted by priority               │
│                                                          │
│  5. Display via ChatWidget / NotificationCenter            │
│     + respect ProactiveMessageSettings (quiet hours,      │
│       frequency caps, per-category toggles)               │
│                                                          │
│  6. For weekly/monthly reviews:                           │
│     → AIProgressReviewController.generateReview(data)     │
│       → calls LLM via @ielts/ai                           │
│       → structured AIProgressReviewResponse               │
└─────────────────────────────────────────────────────────┘
```

---

## 6. File Reference

| File | Purpose |
|---|---|
| `packages/storage/src/schema.ts` | All Zod entity schemas (33+ entities) |
| `packages/storage/src/db.ts` | Dexie database setup (33 tables) |
| `packages/storage/src/repositories/*.ts` | Typed CRUD repositories |
| `packages/storage/src/mistakeService.ts` | Standalone mistake operations |
| `packages/storage/src/reviewService.ts` | Standalone review operations |
| `packages/learning-engine/src/types.ts` | Learning engine type definitions |
| `packages/learning-engine/src/LearningEngine.ts` | Orchestrator — all computed analytics |
| `packages/learning-engine/src/profile/ProfileService.ts` | Profile computation |
| `packages/learning-engine/src/progress/ProgressService.ts` | Skill progress & weekly progress |
| `packages/learning-engine/src/weakness-detection/WeaknessDetectionService.ts` | Weakness & repeated mistake detection |
| `packages/learning-engine/src/review-scheduler/ReviewSchedulerService.ts` | SM-2 spaced repetition |
| `packages/learning-engine/src/daily-plan/DailyPlanService.ts` | Daily study plan generation |
| `packages/learning-engine/src/next-best-action/NextBestActionService.ts` | Prioritized next-best-action suggestions |
| `packages/learning-engine/src/analytics/AnalyticsService.ts` | Study consistency, skill balance, weekly reflection |
| `packages/learning-engine/src/progress/AIProgressReviewService.ts` | AI progress review data aggregation |
| `packages/ai-tutor/src/types/index.ts` | Proactive message types & trigger types |
| `packages/ai-tutor/src/services/proactiveMessageEngine.ts` | Rule-based message generators |
| `packages/ai-tutor/src/services/proactiveMessageService.ts` | Message persistence & settings |
| `packages/ai-tutor/src/services/proactiveEventBus.ts` | Pub/sub for real-time events |
| `packages/ai-tutor/src/hooks/useProactiveMessages.ts` | React hook for proactive messages |
| `packages/ai-tutor/src/controllers/AIProgressReviewController.ts` | AI review generation controller |
| `packages/ai-tutor/src/prompts/learningProgressReview.ts` | LLM prompt builders for progress review |
| `packages/ai/src/client/index.ts` | AI LLM client |
