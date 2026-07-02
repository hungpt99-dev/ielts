# Exercise System

> The unified exercise system with strategy-based generation, scoring, difficulty adjustment, and review scheduling.

---

## 1. Overview

The exercise system provides a unified framework for creating, scoring, and reviewing exercises across all IELTS skills. It uses the **Strategy Pattern** to decouple exercise logic from the UI, enabling easy addition of new exercise types and sources.

**Package:** `packages/exercises/src/`

### 1.1 Supported Exercise Sources

| Source | Description | Strategy |
|--------|-------------|----------|
| Built-in | Pre-defined exercises in the content library | `BuiltInGenerationStrategy` |
| AI-generated | Exercises created by LLM based on user input | `AiGenerationStrategy` |
| Web content | Exercises extracted from saved web pages | `WebContentGenerationStrategy` |
| Mistake review | Correction exercises from user mistakes | `MistakeReviewGenerationStrategy` |
| Vocabulary | Gap-fill and multiple choice from vocabulary | `VocabularyPracticeGenerationStrategy` |

### 1.2 Supported Question Types

| Type | Description |
|------|-------------|
| `multiple-choice` | Select from options (A/B/C/D) |
| `true-false` | True / False / Not Given |
| `gap-fill` | Fill in the blank |
| `matching` | Match items from two lists |
| `short-answer` | Write a short response |
| `error-correction` | Identify and correct errors |
| `rewrite` | Rewrite a sentence |

---

## 2. Architecture

```
┌───────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                      │
│  features/exercises/components/                           │
│  ├── ExerciseCard.tsx          ← renders any exercise     │
│  ├── QuestionRenderer.tsx      ← renders by question type │
│  ├── ScoringFeedback.tsx       ← shows result + feedback  │
│  └── ExerciseSession.tsx       ← orchestrates a session   │
└───────────────────────┬───────────────────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                       │
│  features/exercises/services/                             │
│  ├── exerciseService.ts         ← orchestrates flow       │
│  ├── useExerciseSession.ts      ← React hook              │
│  └── exerciseWorkflow.ts        ← session logic           │
└───────────────────────┬───────────────────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────────────────┐
│                    DOMAIN / INFRASTRUCTURE                 │
│  packages/exercises/src/                                  │
│  ├── types.ts                 ← domain models             │
│  ├── models.ts                ← entity interfaces         │
│  ├── schemas.ts               ← Zod validation            │
│  ├── generationStrategies.ts  ← Strategy: exercise gen    │
│  ├── scoringStrategies.ts     ← Strategy: scoring         │
│  ├── difficulty.ts            ← Strategy: difficulty adj  │
│  └── reviewScheduler.ts       ← Strategy: review sched    │
└───────────────────────────────────────────────────────────┘
```

---

## 3. Core Models

### 3.1 Exercise

```typescript
interface Exercise {
  id: string
  skill: ExerciseSkill         // reading | listening | writing | speaking | vocabulary | grammar
  source: ExerciseSource       // built-in | ai-generated | web-content | mistake-review | vocabulary-practice
  title: string
  instructions: string
  questions: ExerciseQuestion[]
  difficulty: ExerciseDifficulty // beginner | intermediate | advanced
  tags: string[]
  timeEstimateMinutes: number
  createdAt: string
}
```

### 3.2 ExerciseQuestion

```typescript
interface ExerciseQuestion {
  id: string
  type: QuestionType           // multiple-choice | true-false | gap-fill | matching | short-answer | error-correction | rewrite
  prompt: string               // The question text
  options?: string[]            // For multiple-choice
  correctAnswer: string | string[] | MatchingPair[]
  acceptableAnswers?: string[]  // Alternative correct answers
  explanation?: string
  points: number
}
```

### 3.3 ExerciseAttempt & Result

```typescript
interface ExerciseAttempt {
  id: string
  exerciseId: string
  answers: ExerciseAttemptAnswer[]
  startedAt: string
  completedAt: string
  timeSpentSeconds: number
}

interface ExerciseResult {
  attempt: ExerciseAttempt
  totalPoints: number
  earnedPoints: number
  accuracy: number                // 0–100
  questionResults: QuestionResult[]
  feedback: string
  recommendations: string[]
}
```

---

## 4. Strategy Pattern

### 4.1 Generation Strategies

Each strategy implements a common interface to create exercises:

```typescript
interface GenerationStrategy {
  generate(params: GenerationParams): Promise<ExerciseQuestion[]>
  supports(skill: ExerciseSkill, source: ExerciseSource): boolean
}
```

**Strategy implementations:**

| Strategy | Behavior |
|----------|----------|
| `BuiltInGenerationStrategy` | Filters pre-registered exercises from the content library by skill/topic/difficulty |
| `AiGenerationStrategy` | Calls AI service with a prompt template to generate exercises dynamically; falls back gracefully if AI is unavailable |
| `WebContentGenerationStrategy` | Creates gap-fill and comprehension exercises from saved web page text (sentence splitting) |
| `MistakeReviewGenerationStrategy` | Creates error-correction exercises from user's mistake records |
| `VocabularyPracticeGenerationStrategy` | Creates gap-fill + multiple-choice exercises from vocabulary entries |

The `GenerationEngine` orchestrates strategies, preferring built-in content and falling back to AI:

```typescript
class GenerationEngine {
  async generate(params: GenerationParams): Promise<Exercise>
  async generateFromBestSource(params: GenerationParams): Promise<Exercise>
  // Prefers built-in → web content → mistake review → vocabulary → AI
}
```

### 4.2 Scoring Strategies

```typescript
interface ScoringStrategy {
  score(attempt: ExerciseAttemptAnswer, question: ExerciseQuestion): Score
  supports(type: QuestionType): boolean
}
```

| Strategy | How It Scores |
|----------|---------------|
| `MultipleChoiceScoring` | Exact match on selected option |
| `GapFillScoring` | Normalized text comparison with acceptable answers |
| `TrueFalseScoring` | Accepts "T"/"F" or full words |
| `ErrorCorrectionScoring` | Word-match ratio with 80% threshold |
| `MatchingScoring` | Pair-by-pair matching validation |
| `ShortAnswerScoring` | Exact match + acceptable arrays + substring |
| `RewriteScoring` | Word-match ratio with significant-words filtering |

The `ScoringEngine` selects the appropriate strategy per question type.

### 4.3 Difficulty Adjustment Strategies

```typescript
interface DifficultyStrategy {
  calculateNextDifficulty(current: ExerciseDifficulty, recentAccuracy: number[]): ExerciseDifficulty
}
```

| Strategy | Behavior |
|----------|----------|
| `ProgressiveDifficultyStrategy` | Gradually increases with sustained success |
| `ConservativeDifficultyStrategy` | Slow progression, quick to reduce |
| `AggressiveDifficultyStrategy` | Faster jumps on success |

### 4.4 Review Scheduling Strategies

```typescript
interface ReviewSchedulerStrategy {
  calculateNextReview(attempt: ExerciseAttempt, result: ExerciseResult): ReviewSchedule
}
```

| Strategy | Behavior |
|----------|----------|
| `SpacedRepetitionScheduler` | SM-2 algorithm with configurable parameters |
| `AdaptiveSchedulerStrategy` | Considers accuracy, time taken, and mistake ratio |

---

## 5. Exercise Flow

```
User selects skill + topic + difficulty
        │
        ▼
GenerationEngine.generateFromBestSource(params)
        │
        ├── BuiltInGenerationStrategy → exercise found? → return
        │
        └── No built-in found:
            ├── WebContentGenerationStrategy → has web content? → return
            ├── MistakeReviewGenerationStrategy → has mistakes? → return
            ├── VocabularyPracticeGenerationStrategy → has vocab? → return
            └── AiGenerationStrategy → AI available? → return
                └── No source available → return empty with suggestion
        │
        ▼
User answers questions
        │
        ▼
ScoringEngine.evaluate(attempt, exercise)
  ├── Per-question scoring
  ├── Calculate accuracy percentage
  └── Generate feedback + recommendations
        │
        ▼
ReviewScheduler.schedule(attempt, result)
  ├── Calculate next review date
  └── Update spaced repetition data
        │
        ▼
Save attempt + result to IndexedDB
        │
        ▼
Show result to user (accuracy, feedback, recommendations)
```

---

## 6. Difficulty System

Exercises are tagged at three difficulty levels:

| Level | Label | Description |
|-------|-------|-------------|
| `beginner` | Beginner | Band 4.0–5.0 level questions |
| `intermediate` | Intermediate | Band 5.5–6.5 level questions |
| `advanced` | Advanced | Band 7.0+ level questions |

The difficulty adjuster tracks recent accuracy (last 10 attempts) and adjusts:

```
Accuracy > 80% over last 10 → consider increasing difficulty
Accuracy < 50% over last 10 → decrease difficulty
Accuracy 50–80% → maintain current level
```

---

## 7. Data Persistence

Exercise attempts and results are stored in IndexedDB:

```
exercises → Exercise objects (created with metadata)
exerciseAttempts → User attempt records
exerciseResults → Scored results with feedback
exerciseReviewRecords → Spaced repetition data
```

---

## 8. Adding a New Exercise Type

1. Add the new `QuestionType` to the `QuestionType` union in `packages/exercises/src/types.ts`
2. Create a `ScoringStrategy` implementation for the new type
3. Register it in the `ScoringEngine` registry
4. Create a UI renderer component in `features/exercises/components/`
5. Add test cases for scoring and rendering

---

## 9. Adding a New Generation Source

1. Create a new strategy implementing `GenerationStrategy`
2. Register it in the `GenerationEngine` with a priority level
3. Implement `generate()` with your source logic
4. Add unit tests
