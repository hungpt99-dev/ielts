# Learning Engine

> Package: `@ielts/learning-engine` — files in `packages/learning-engine/src/`

## Architecture

The Learning Engine follows **hexagonal architecture** with tactical Domain-Driven Design:

```
┌─────────────────────────────────────────────────────┐
│                    Public API                        │
│  (createLearningEngine → LearningEngine interface)   │
├─────────────────────────────────────────────────────┤
│                 Application Layer                    │
│  create-session  │  generate-activity  │  submit-ans │
│  complete-session│  resume-session     │  adapt-diff │
│  get-recommend    │  create-from-task   │  get-summary│
├─────────────────────────────────────────────────────┤
│                  Domain Layer                        │
│  Entities    │  Value Objects  │  Services  │ Policies│
│  Sessions     │  BandScore      │  objective-analyzer │
│  Activities   │  DifficultyLevel│  exercise-selector  │
│  Exercises    │  ExerciseScore  │  progress-builder   │
│  Attempts     │  LocalDate      │  mistake-builder    │
│  Outcomes     │  ConfidenceScore│  skill-builder      │
│  Evaluations  │  SkillBandScores  │  evidence-builders│
├─────────────────────────────────────────────────────┤
│                     Ports                            │
│  LearnerContext  │  TutorIntelligence  │  StudyPlan   │
│  SessionRepo     │  AttemptRepo       │  OutcomeRepo  │
│  ExerciseRepo    │  ProgressRepo      │  MistakeRepo  │
│  VocabularyRepo  │  EventPublisher    │  Clock        │
├─────────────────────────────────────────────────────┤
│              Infrastructure Adapters                 │
│  InMemory repos  │  OfflineTutorIntelligence  │ Cache│
│  MigrationRunner │  InMemoryLearnerContext   │      │
└─────────────────────────────────────────────────────┘
```

## Current State vs. Target State

| Aspect | Current | Target |
|---|---|---|
| Exercise generation | Fragmented — hardcoded in feature components + engine path | All exercises via engine's `generateActivity` |
| Evaluation | Mixed — deterministic grader implemented, AI eval via `TutorIntelligencePort` but also direct `callAI` in components | All eval through `submitAnswer` |
| Feedback loop | Partial — outcomes produced but not reliably fed back to Tutor Engine | Bidirectional outcome subscription |
| Session lifecycle | Implemented — create → activity → attempt → evaluate → complete | Same, with richer state management |
| Skill modules | All 6 implemented | Feature parity, deeper AI integration |
| Progress tracking | `session.complete` writes to `progressRepository` | Real-time progress updates + Tutor Engine sync |

## Session Lifecycle

```
  CreateSession
       │
       ▼
   [PREPARED]  ──generateActivity──>  Activity Generated
       │
       ▼
   [IN-PROGRESS]  ──submitAnswer──>  Answer Evaluated
       │                                  │
       │                            [correct / partial / incorrect]
       │                                  │
       ├──────────────────────────────────┘
       │
       ▼
   completeSession ──>  [COMPLETED]
       │
       ▼
   LearningOutcome produced
       │
       ├──> MistakeEvidence stored
       ├──> SkillEvidence stored
       ├──> ProgressRepository updated
       ├──> StudyPlanPort.taskFulfilled
       └──> Event published to Tutor Engine
```

## LearningEngine Interface (`learning-engine-facade.ts:40`)

```typescript
interface LearningEngine {
  createSession(request, options?): Promise<Result<CreateSessionResult>>
  generateActivity(request, options?): Promise<Result<GenerateActivityResult>>
  submitAnswer(request, options?): Promise<Result<SubmitAnswerResult>>
  completeSession(request, options?): Promise<Result<CompleteSessionResult>>
  resumeSession(sessionId): Promise<Result<ResumeSessionResult>>
  getRecommendedActivity(request): Promise<Result<RecommendationResult>>
  createSessionFromRoadmapTask(task, options?): Promise<Result<CreateSessionResult>>
  createSessionFromContent(request, options?): Promise<Result<CreateSessionResult>>
  adaptDifficulty(request): Promise<Result<AdaptDifficultyResult>>
  generateReview(request, options?): Promise<Result<GenerateReviewResult>>
  getSessionSummary(sessionId): Promise<Result<SessionSummaryResult>>
}
```

## Skill Modules (6 Implemented)

All in `packages/learning-engine/src/skills/`:

| Module | File | Generates | Evaluates |
|---|---|---|---|
| `WritingSkillModule` | `skills/writing/writing-module.ts` | Writing prompts, task types | Writing evaluation via rubric |
| `SpeakingSkillModule` | `skills/speaking/speaking-module.ts` | Speaking prompts | Speaking evaluation |
| `ReadingSkillModule` | `skills/reading/reading-module.ts` | Reading passages + questions | MCQ/TFNG grading |
| `ListeningSkillModule` | `skills/listening/listening-module.ts` | Listening exercises | Listening evaluation |
| `VocabularySkillModule` | `skills/vocabulary/vocabulary-module.ts` | Vocabulary exercises | Vocab grading |
| `GrammarSkillModule` | `skills/grammar/grammar-module.ts` | Grammar exercises | Grammar grading |

`SkillRegistry` (`skills/skill-registry.ts`) manages registration and lookup. `createDefaultSkillRegistry` creates a registry with all 6 modules.

## Domain Entities

Key entities in `packages/learning-engine/src/domain/entities/`:

- **`LearningSession`** (`learning-session.ts:36`) — Status lifecycle: `prepared → in-progress → paused → completed | abandoned | expired`
- **`LearningObjective`** (`learning-objective.ts`) — Goal for a session (skill, type, criteria, priority)
- **`LearningActivity`** (`learning-activity.ts`) — Single activity within a session
- **`Exercise`** (`exercise.ts`) — Exercise container with type, difficulty, source, template
- **`ExerciseQuestion`** (`exercise-question.ts`) — 8 question types: `MultipleChoice`, `GapFill`, `TrueFalseNotGiven`, `ShortAnswer`, `Matching`, `ErrorCorrection`, `Essay`, `SpeakingResponse`
- **`LearningAttempt`** (`learning-attempt.ts`) — Learner's answer submission
- **`AnswerEvaluation`** (`evaluation.ts:7`) — Status (`correct | partially-correct | incorrect | not-evaluable`), method (`deterministic | ai-assisted | ai-only | hybrid | self-evaluated`), feedback, mistakes, skill evidence
- **`WritingEvaluation`** (`evaluation.ts:29`) — IELTS Writing rubric (TA, CC, LR, GR) with band
- **`SpeakingEvaluation`** (`evaluation.ts:44`) — IELTS Speaking rubric (FC, LR, GR, Pronunciation)
- **`MistakeEvidence`** (`mistake-evidence.ts`) — Recorded mistakes with severity, category, review status
- **`SkillEvidence`** (`skill-evidence.ts`) — Demonstrated skill levels
- **`ProgressEvidence`** (`progress-evidence.ts`) — Aggregated progress data
- **`LearningOutcome`** (`learning-outcome.ts`) — Session outcome: score, accuracy, mistakes, strengths, vocabulary
- **`LearningRecommendation`** (`learning-recommendation.ts`) — Next-action recommendation
- **`LearningLesson`** (`learning-lesson.ts`) — Generated lesson content with examples
- **`LearningContext`** (`learning-context.ts`) — Context for personalization

## Policies

| Policy | File | Purpose |
|---|---|---|
| `difficulty-policy` | `domain/policies/difficulty-policy.ts` | Determines difficulty level from band, accuracy, streak |
| `evaluation-policy` | `domain/policies/evaluation-policy.ts` | Selects evaluation method per question type |
| `deterministic-grader` | `domain/policies/deterministic-grader.ts` | Grades MCQ, TFNG, gap-fill deterministically |
| `activity-selection-policy` | `domain/policies/activity-selection-policy.ts` | Plans activities for a session |
| `question-count-policy` | `domain/policies/question-count-policy.ts` | Estimates question count per duration |

Test coverage: `difficulty-policy.test.ts`, `deterministic-grader.test.ts`, `evaluation-policy.test.ts`.

## Domain Services

| Service | File | Purpose |
|---|---|---|
| `objective-analyzer` | `domain/services/learning-objective-analyzer.ts` | Analyzes objectives for optimal approach |
| `exercise-selector` | `domain/services/exercise-selector.ts` | Selects appropriate exercise configs |
| `progress-evidence-builder` | `domain/services/progress-evidence-builder.ts` | Builds progress evidence from outcomes |
| `mistake-evidence-builder` | `domain/services/mistake-evidence-builder.ts` | Detects recurrence patterns in mistakes |
| `skill-evidence-builder` | `domain/services/skill-evidence-builder.ts` | Aggregates skill evidence across sessions |

Test coverage: `progress-evidence-builder.test.ts`, `mistake-evidence-builder.test.ts`, `skill-evidence-builder.test.ts`.

## Ports

9 repository/interaction ports in `packages/learning-engine/src/ports/`:

| Port | Type | Purpose |
|---|---|---|
| `LearnerContextPort` | interface | Build learning context from domain state |
| `TutorIntelligencePort` | interface | AI-powered teaching strategy + content generation |
| `StudyPlanPort` | interface | Roadmap task retrieval, fulfillment marking |
| `LearningSessionRepository` | interface | Session CRUD |
| `LearningAttemptRepository` | interface | Attempt CRUD |
| `LearningOutcomeRepository` | interface | Outcome storage |
| `ExerciseRepository` | interface | Exercise CRUD |
| `ProgressRepository` | interface | Skill/overall progress storage |
| `MistakeRepository` | interface | Mistake CRUD + pattern detection |
| `VocabularyRepository` | interface | Vocabulary storage, due-for-review queries |
| `LearningEventPublisher` | interface | Domain event publishing |
| `ClockPort` | interface | Time abstraction |

## Use Cases

Implemented in `packages/learning-engine/src/application/`:

| Use Case | File | Input | Output |
|---|---|---|---|
| `createLearningSession` | `sessions/create-learning-session.ts` | Objective, skill, mode, duration | Session |
| `resumeLearningSession` | `sessions/resume-learning-session.ts` | Session ID | Session + current activity + saved answers |
| `completeLearningSession` | `sessions/complete-learning-session.ts` | Session ID, actual duration | Session + outcomes + recommendations |
| `generateLearningActivity` | `activities/generate-learning-activity.ts` | Session context | Activity with exercises |
| `startAttempt` | `attempts/start-attempt.ts` | Session + activity | Attempt |
| `submitAnswer` | `attempts/submit-answer.ts` | Answers | Evaluation |
| `adaptDifficulty` | `adaptation/adapt-difficulty.ts` | Skill, accuracy, streak | Difficulty level |
| `generateMistakeReview` | `review/generate-mistake-review.ts` | Skill, count | Exercise reviewing mistakes |

## Current Fragmentation

### Exercise Generation

Exercises are generated through two parallel paths:

1. **Engine path** — `generateLearningActivity` → `skillRegistry.get(skill).generate(...)` → returns exercises via the engine
2. **Component path** — Feature components (reading, listening, writing, etc.) call `callAI` directly with hardcoded prompts and build exercises manually

The engine path exists but is not universally adopted. Components still contain their own generation logic.

### Evaluation

Similarly split:

1. **Engine path** — `submitAnswer` → `evaluation-policy.selectEvaluationMethod` → deterministic grader or `TutorIntelligencePort.evaluateOpenResponse`
2. **Component path** — Components evaluate their own answers using AI calls or hardcoded logic

`submitAnswer` in `engineBootstrap.ts` (`engineBootstrap.ts:92`) wires the `TutorIntelligencePort` to `callAI`, so AI evaluation flows through the engine. But feature components bypass this.

### Feedback Loop

`completeSession` produces `LearningOutcome` objects and publishes events (via `LearningEventPublisher`). However:

- The Tutor Engine's `handleLearningEvent` is called only in specific flows, not universally
- Outcomes stored in the `progressRepository` use placeholder implementations (empty stubs in `engineBootstrap.ts:159-164`)
- The feedback loop from outcomes back to recommendations is partially implemented in `getRecommendedActivity` (recent mistakes + active sessions + due vocabulary)

## Test Files

12 test files across:
- `skills/__tests__/reading-module.test.ts`, `vocabulary-module.test.ts`
- `domain/services/__tests__/progress-evidence-builder.test.ts`, `mistake-evidence-builder.test.ts`, `skill-evidence-builder.test.ts`
- `domain/policies/__tests__/difficulty-policy.test.ts`, `deterministic-grader.test.ts`, `evaluation-policy.test.ts`
- `daily-plan/DailyPlanEngine.test.ts`, `AiPlanOrchestrator.test.ts`, `PlanRegenerator.test.ts`, `PlanEngineIntegration.test.ts`
