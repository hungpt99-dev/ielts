# Exercises and Attempts

## Purpose

Exercises are the atomic learning unit within a session. An attempt captures the learner's response to an exercise and its evaluation.

## Exercise Model

Defined in `@ielts/learning-engine` as `Exercise`:

| Field | Type | Description |
|---|---|---|
| `id` | string | UUID |
| `sessionId` | string | Parent learning session |
| `skill` | `IELTSSection` | Skill under practice |
| `exerciseType` | `ExerciseType` | `'lesson' \| 'quiz' \| 'essay' \| 'speaking' \| 'comprehension' \| 'error-correction' \| 'gap-fill' \| 'matching' \| 'shadowing'` |
| `questions` | `ExerciseQuestion[]` | 1+ questions of various types |
| `evaluationPolicy` | `'deterministic' \| 'ai-assisted' \| 'ai-only' \| 'self-evaluated'` | How answers are graded |
| `sourceType` | `ExerciseSourceType` | e.g. `'built-in'`, `'ai-generated'` |

### Question Types

16 question types in `@ielts/shared` — 8 primary types for IELTS practice:

| Type | Description | Evaluation |
|---|---|---|
| `multiple-choice` | Pick one correct option | Deterministic |
| `true-false-not-given` | Assertion classification | Deterministic |
| `gap-fill` | Fill blanks in text | Deterministic (with alternatives) |
| `short-answer` | Write a short response | Deterministic (with alternatives) |
| `matching` | Pair left/right items | Deterministic |
| `error-correction` | Identify and fix an error | Deterministic |
| `essay` | Free-form essay response | AI-assisted |
| `speaking-response` | Spoken response prompt | AI-assisted |

Additional types: `multiple-select`, `yes-no-not-given`, `matching-headings`, `sentence-completion`, `ordering`, `free-response`, `shadowing`, `reflection`.

## Attempt Model

Defined in `@ielts/learning-engine` as `LearningAttempt`:

| Field | Type | Description |
|---|---|---|
| `id` | string | UUID |
| `sessionId` | string | Parent session |
| `exerciseId` | string | Target exercise |
| `status` | `LearningAttemptStatus` | `'not-started' \| 'in-progress' \| 'submitted' \| 'evaluated' \| 'completed' \| 'abandoned'` |
| `answers` | `LearningAnswer[]` | Per-question responses |
| `evaluations` | `AnswerEvaluation[]` \| undefined | Per-question grading results |
| `timeSpentMs` | number | Total time |
| `hintsUsed` | number | Number of hints requested |

## Evaluation

- **Deterministic** (`gradeAnswer` in `domain/policies`): MC/TFNG/gap-fill/short-answer/matching/error-correction are graded by exact or fuzzy match.
- **AI-assisted** (via `TutorIntelligencePort`): essay and speaking responses are sent to the AI for rubric-based evaluation. Produces `WritingEvaluation` or `SpeakingEvaluation` with band scores per IELTS criterion.
- **Hybrid**: some exercises combine deterministic and AI evaluation.

## Lifecycle

```
Exercise generated → Attempt started → Answers submitted → Evaluation → Outcome produced
```

1. `startAttempt()` creates a `LearningAttempt` with status `'in-progress'`.
2. User answers questions → `submitAnswer()` evaluates each via the configured `evaluationPolicy`.
3. Evaluation produces `AnswerEvaluation[]` with status (`'correct' \| 'partially-correct' \| 'incorrect' \| 'not-evaluable'`), score, feedback, and `MistakeEvidence[]`.
4. `completeLearningSession()` aggregates all exercise evaluations into `LearningOutcome[]`.

## Persistence

- Exercises: stored per-session in memory during active session; persisted via `ExerciseRepository`.
- Attempts: persisted via `LearningAttemptRepository`.
- Legacy exercise tables (`speakingExercises`, `writingExercises`, `readingExercises`, `listeningExercises`) hold pre-built exercise content.

## Invariants

- Each attempt belongs to exactly one exercise.
- An exercise can be attempted multiple times (separate attempts).
- Evaluation is immutable once written — re-evaluation creates a new evaluation record.
