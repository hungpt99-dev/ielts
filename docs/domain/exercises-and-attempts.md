# Exercises and Attempts

## Purpose

Exercises are the atomic learning unit within a session. An attempt captures the learner's response to an exercise and its evaluation.

## Exercise Engine Architecture

The Exercise Engine is a blueprint-driven system in `@ielts/learning-engine` (`packages/learning-engine/src/exercise-engine/`) that provides one consistent exercise lifecycle across all modules.

### Architecture Flow

```
Request → Profile → Variant → Module → Mode → Blueprint → Generate → Validate → Repair → Attempt → Score → Progress → Recommend
```

### Exercise Modules

```ts
type ExerciseModule =
  | 'reading'
  | 'listening'
  | 'writing'
  | 'speaking'
  | 'grammar'
  | 'vocabulary'
  | 'saved_content'
  | 'mistake_review'
```

### Exercise Modes

```ts
type ExerciseMode =
  | 'full_test'          // Complete official IELTS simulation
  | 'full_section'       // One complete passage/section
  | 'full_part'          // One IELTS part (e.g. Listening Part 2)
  | 'focused_practice'   // Targeted skill/question type practice
  | 'adaptive_practice'  // Adjusts based on learner evidence
  | 'review'             // Replays mistakes and weak areas
  | 'diagnostic'         // Measures current ability
```

### Exercise Families

```ts
type ExerciseFamily =
  | 'objective_questions'
  | 'completion_questions'
  | 'matching_questions'
  | 'classification_questions'
  | 'ordering_questions'
  | 'writing_task'
  | 'speaking_session'
  | 'interactive_listening'
  | 'vocabulary_activity'
  | 'grammar_activity'
  | 'content_comprehension'
  | 'review_activity'
```

## Exercise Domain Model

Exercises use a discriminated union with shared `BaseExercise` metadata:

| Field | Type | Description |
|---|---|---|
| `id` | string | UUID |
| `schemaVersion` | number | Schema version for migration |
| `blueprintVersion` | string | Blueprint version reference |
| `module` | `ExerciseModule` | Exercise module |
| `mode` | `ExerciseMode` | Exercise mode |
| `family` | `ExerciseFamily` | Behavioural family |
| `title` | string | Human-readable title |
| `instructions` | string[] | Instructions for the learner |
| `source` | `ExerciseSource` | Origin of the exercise |
| `estimatedDurationSeconds` | number | Estimated time |
| `difficulty` | `ExerciseDifficultyProfile` | Structured difficulty |
| `ieltsVariant` | `'academic' \| 'general_training'` | IELTS variant (where applicable) |

### Module-Specific Exercise Types

- **ReadingExercise** — `passages: ReadingPassage[]` with grouped questions
- **ListeningExercise** — `parts: ListeningPart[]` with audio segments and grouped questions
- **WritingExercise** — `tasks: WritingTask[]` (not questions)
- **SpeakingExercise** — `parts: SpeakingPart[]` with timing per part
- **GrammarExercise** — `items: GrammarItem[]` with grammar concepts
- **VocabularyExercise** — `terms: VocabularyTerm[]` with activities
- **SavedContentExercise** — `contentReference` + activities
- **MistakeReviewExercise** — `mistakes: MistakeEvidence[]` + review activities

## Blueprint System

Blueprints define the structural rules, timing, scoring, and validation for exercises.

```ts
interface ExerciseBlueprint {
  id: string
  version: string
  module: ExerciseModule
  mode: ExerciseMode
  family: ExerciseFamily
  structure: ExerciseStructureRule
  timing: ExerciseTimingRule
  scoring: ExerciseScoringRule
  difficulty: ExerciseDifficultyProfile
  allowedQuestionTypes: string[]
  validationRules: ExerciseValidationRule[]
}
```

### Official IELTS Blueprints

| Blueprint | Structure | Timing | Scoring |
|---|---|---|---|
| Full Listening | 4 parts × 10 questions = 40 | 30 min audio + 10 min review | Raw/40, band conversion |
| Full Academic Reading | 3 passages, 40 questions | 60 min | Raw/40, band conversion |
| Full Writing | 2 tasks (T1 weight 1, T2 weight 2) | 60 min | Rubric, T2 weighted 2× |
| Full Speaking | 3 parts, Part 2: 60s prep + 120s response | 11–14 min | Rubric (FC, LR, GR, P) |

Blueprints are **immutable** after an attempt starts. Adaptive logic creates new blueprints.

## Question Model

Discriminated question types with stable unique IDs:

| Type | Fields | Evaluation |
|---|---|---|
| `multiple_choice` | options, correctIndex | Deterministic |
| `multiple_select` | options, correctIndices | Deterministic (partial credit) |
| `true_false_not_given` | statement, correctAnswer | Deterministic |
| `yes_no_not_given` | statement, correctAnswer | Deterministic |
| `completion` | text, gaps, wordLimit | Deterministic (with alternatives) |
| `matching` | leftItems, rightItems, correctMatches | Deterministic (partial credit) |
| `ordering` | items, correctOrder | Deterministic |
| `short_answer` | correctAnswer, acceptableAlternatives | Deterministic |
| `classification` | categories, correctCategory | Deterministic |
| `map_labelling` | mapImageUrl, labels, correctPositions | Deterministic |
| `diagram_labelling` | diagramImageUrl, labels, correctAnswers | Deterministic |

### Question Groups

Questions are organized in groups with shared instructions:

```ts
interface QuestionGroup {
  id: string
  type: string
  startNumber?: number
  endNumber?: number
  instructions: string[]
  sharedContent?: unknown
  questions: ExerciseQuestion[]
}
```

## Answer Model

Typed learner responses (not plain strings):

```ts
type LearnerResponse =
  | ChoiceResponse
  | MultiChoiceResponse
  | TextResponse
  | MatchingResponse
  | OrderingResponse
  | WritingResponse
  | SpeakingResponse
  | ClassificationResponse
  | MapResponse
```

Supports normalization: case, whitespace, punctuation, British/American variants, accepted alternatives.

## Attempt Lifecycle

```ts
type ExerciseAttemptStatus =
  | 'not_started'
  | 'in_progress'
  | 'paused'
  | 'submitted'
  | 'evaluating'
  | 'completed'
  | 'abandoned'
  | 'failed'
```

Valid transitions:
- `not_started → in_progress`
- `in_progress → paused | submitted | abandoned | failed`
- `paused → in_progress | abandoned`
- `submitted → evaluating | completed | failed`
- `evaluating → completed | failed`
- `completed | abandoned | failed` → terminal (no transitions)

Attempts reference an **immutable exercise snapshot** — later edits don't change existing attempts.

## Scoring Engine

Module-specific scoring strategies:

| Module | Strategy | Evaluation |
|---|---|---|
| Reading | `ReadingScoringStrategy` | Raw/40, module-specific band conversion |
| Listening | `ListeningScoringStrategy` | Raw/40, listening band table |
| Writing | `WritingScoringStrategy` | AI rubric evaluation (TA/TR, CC, LR, GR) |
| Speaking | `SpeakingScoringStrategy` | AI rubric evaluation (FC, LR, GR, P) |
| Grammar | `GrammarScoringStrategy` | Concept-level, supports semantic evaluation |
| Vocabulary | `VocabularyScoringStrategy` | Term-level, tracks recognition/recall |

Band conversion uses **separate tables** for Listening, Academic Reading, and General Training Reading.

Partial practice shows raw score, percentage, and question-type performance — **not** authoritative band scores.

## Timing Engine

Family-specific timing that considers actual workload:

- **Reading**: passage length, question count, question types, complexity
- **Listening**: audio duration, instructions, pauses, review policy
- **Writing**: task-level time recommendations, full-test total
- **Speaking**: preparation time, response time, examiner turns
- **Grammar/Vocabulary**: item count, response complexity

Differentiates: `officialDuration`, `estimatedDuration`, `elapsedTime`, `remainingTime`.

## Difficulty Model

Structured difficulty profile (not just easy/medium/hard):

```ts
interface ExerciseDifficultyProfile {
  targetBand?: OfficialIeltsBand
  cefrLevel?: CefrLevel
  linguisticComplexity: number    // 0-1
  lexicalComplexity: number       // 0-1
  grammaticalComplexity: number   // 0-1
  inferenceDepth: number          // 0-1
  distractorStrength: number      // 0-1
  informationDensity: number      // 0-1
  paraphraseDistance: number      // 0-1
  responseComplexity: number      // 0-1
  timePressure: number            // 0-1
}
```

## AI Generation Contracts

All AI-generated exercises use typed structured output. The application decides the blueprint; the AI fills it.

Generation flow: Generate → Parse → Validate → Detect → Repair (bounded, max 3) → Revalidate → Reject or Persist.

The AI does **not** decide: part count, question count, task weights, part order, or official timing.

## Events

Domain events for integration:

- `exercise_created`, `exercise_generated`
- `exercise_started`, `exercise_paused`, `exercise_resumed`
- `exercise_submitted`, `exercise_evaluated`, `exercise_completed`
- `exercise_abandoned`, `mistake_recorded`, `learning_progress_updated`

## Migration

Legacy exercises (without `schemaVersion`) are migrated via `migrateLegacyExercise()`:

- Compatible exercises → converted with `schemaVersion: 1`, tags include `'migrated'`
- Unknown skills → marked as `legacy_practice`
- Incompatible records → rejected (not silently reinterpreted as full tests)

Migration is idempotent and preserves completed attempts as read-only history.

## Invariants

- Each attempt belongs to exactly one exercise
- An exercise can be attempted multiple times (separate attempts)
- Evaluation is immutable once written
- Full tests satisfy official IELTS structural rules
- Focused exercises are never labelled as full tests
- Writing and Speaking use tasks/parts, not flat question arrays
- Blueprint is immutable after attempt starts
