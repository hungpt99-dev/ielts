# AI Tutor Engine

> Package: `@ielts/ai-tutor-engine` — files in `packages/ai-tutor-engine/src/`

## Architecture

Hexagonal architecture with ports, domain entities, application use cases, and infrastructure adapters.

```
┌──────────────────────────────────────────────────────────┐
│                     Public API                           │
│  (createAITutorEngine → AITutorEngine interface)         │
├──────────────────────────────────────────────────────────┤
│                  Application Layer                       │
│  chat          │  evaluateProactiveSupport               │
│  generateProgressReview │  getNextBestAction             │
│  generateContextSuggestions │  updateMemory              │
│  handleLearningEvent │  getTutorState                    │
├──────────────────────────────────────────────────────────┤
│                  Domain Layer                            │
│  Entities     │  Value Objects  │  Services     │ Policies│
│  LearnerProfile│  BandScore     │  skill-priority │ cooldown│
│  TutorMessage  │  IELTSSection  │  progress-analyze│ duplicate│
│  ProactiveMsg  │  StudyDuration │  mistake-pattern│ quiet-hrs│
│  TutorMemory   │  LocalDate     │                  │proactive│
│  LearnerContext│                │                  │ priority│
├──────────────────────────────────────────────────────────┤
│         Ports (12+ repository contracts)                  │
│  tutor-memory  │  learner-profile  │  learner-progress   │
│  proactive-msg │  tutor-message    │  saved-content     │
│  roadmap       │  vocabulary       │  reminder          │
│  mistake       │  clock            │  notification      │
│  tutor-settings│  event-publisher  │                    │
├──────────────────────────────────────────────────────────┤
│      Infrastructure   │    AI Layer    │    Memory        │
│  LocalStorage repos   │  TutorAIClient│  TutorMemoryMgr  │
│  ProactiveMsgStorage  │  GeneralChat  │  MemoryDedup     │
│                       │  FallbackCL   │  MemoryCompactor │
│                       │  JsonSchema   │  MemoryExtractor │
│  Context System       │               │                  │
│  LearnerContextBuilder│               │   Proactive      │
│  ContextSourceReg     │               │  TriggerRegistry │
│  CachedContextBuilder │               │  MsgGenRegistry  │
│  FreshnessEval        │               │  ProactiveOrch   │
└──────────────────────────────────────────────────────────┘
```

## AITutorEngine Interface (`ai-tutor-engine.ts:10`)

```typescript
interface AITutorEngine {
  initialize(): Promise<AITutorInitializationResult>
  chat(request, options?): Promise<TutorOperationResult<TutorChatResult>>
  getNextBestAction(request): Promise<TutorOperationResult<NextBestActionResult>>
  evaluateProactiveSupport(request): Promise<TutorOperationResult<ProactiveEvaluationResult>>
  generateProgressReview(request): Promise<TutorOperationResult<ProgressReviewResult>>
  generateContextSuggestions(request): Promise<TutorOperationResult<ContextSuggestion[]>>
  handleLearningEvent(event): Promise<TutorOperationResult<void>>
  updateMemory(request): Promise<TutorOperationResult<UpdateTutorMemoryResult>>
  getTutorState(): Promise<TutorStateSnapshot>
}
```

## Application Use Cases

Implemented in `packages/ai-tutor-engine/src/application/`:

| Use Case | File | Purpose |
|---|---|---|
| `sendTutorMessage` | `chat/send-tutor-message.ts` | Process chat message, build context, call AI, persist |
| `continueTutorSession` | `chat/continue-tutor-session.ts` | Continue existing chat session |
| `summarizeChatSession` | `chat/summarize-chat-session.ts` | Generate chat summary |
| `getDailyRecommendation` | `recommendations/get-daily-recommendation.ts` | Daily study recommendation |
| `getNextBestAction` | `recommendations/get-next-best-action.ts` | Determine best next action |
| `generateContextSuggestions` | `recommendations/generate-context-suggestions.ts` | Context-aware suggestions |
| `generateProgressReview` | `progress/generate-progress-review.ts` | Progress review with AI analysis |
| `updateTutorMemory` | `memory/update-tutor-memory.ts` | Store memories from interactions |
| `extractMemoryFromChat` | `memory/update-tutor-memory.ts` | Extract memory candidates from chat |
| `evaluateReminders` | `reminders/evaluate-reminders.ts` | Evaluate reminder conditions |
| `explainRoadmapTask` | `roadmap/` | Explain a specific roadmap task |
| `recommendRoadmapAdjustment` | `roadmap/` | Recommend plan adjustments |
| `evaluateProactiveOpportunity` | `proactive/` | Evaluate proactive trigger |
| `generateProactiveMessages` | `proactive/generate-proactive-messages.ts` | Generate proactive interventions |

## Context System

### LearnerContextBuilder (`context/learner-context-builder.ts:33`)

Constructs a `LearnerStateSnapshot` by collecting data from 9 source functions:

```typescript
interface LearnerContextDependencies {
  registry: ContextSourceRegistry
  getProfile(): Promise<Partial<LearnerProfile>>
  getExamContext(): Promise<Partial<ExamContext>>
  getRoadmapContext(): Promise<Partial<RoadmapContext> | null>
  getProgress(): Promise<Partial<ProgressContext>>
  getSkillStates(): Promise<Partial<Record<IELTSSection, Partial<SkillState>>>>
  getMistakes(): Promise<Partial<MistakeSummary>>
  getVocabulary(): Promise<Partial<VocabularySummary>>
  getActivity(): Promise<Partial<ActivitySummary>>
  getPreferences(): Promise<Partial<TutorPreferences>>
}
```

The `build(scope)` method (`learner-context-builder.ts:40`) runs all 9 fetchers in parallel via `Promise.all`, fills defaults for null/undefined values, constructs skill states for all 4 sections, determines constraints, and evaluates context quality.

### Context Sources

Defined in `learner-context.ts` as `TutorContextSource`:

- `user-profile` — LearnerProfile (bands, exam type, timezone, intensity)
- `study-roadmap` — RoadmapContext (phases, tasks, progress)
- `progress` — ProgressContext (completion, streak, consistency)
- `mistakes` — MistakeSummary (total, patterns, by skill)
- `vocabulary` — VocabularySummary (total, due, mastered)
- `saved-content` — Saved content items
- `tutor-history` — Past tutor interactions
- `environment` — Environment/time data
- `extension-page` — Browser extension page data

### Context Source Registry (`context/context-source-registry.ts:9`)

```typescript
class ContextSourceRegistry {
  register<T>(source: ContextSource<T>): void
  get<T>(source: TutorContextSource): ContextSource<T> | undefined
  getAll(): ContextSource<unknown>[]
  collectAll(): Promise<TutorContextItem<unknown>[]>
}
```

Sources are collected in priority order. Each source returns a `TutorContextItem<T>` with priority, confidence, timestamps.

### Freshness Evaluation (`context/context-freshness-evaluator.ts:21`)

Per-source TTL thresholds control staleness:

| Source | TTL |
|---|---|
| `user-profile` | 24h |
| `study-roadmap` | 5min |
| `progress` | 10min |
| `mistakes` | 5min |
| `vocabulary` | 10min |
| `saved-content` | 10min |
| `tutor-history` | 5min |
| `environment` | 1min |
| `extension-page` | 1min |

### CachedContextBuilder (`context/cached-context-builder.ts:6`)

Wraps `LearnerContextBuilder` with a TTL-based cache (default 30s). Uses `AiGenerateResultCache` from `@ielts/ai` for deduplication and concurrent request coalescing.

### Scope Types

`TutorContextScope` (`learner-context.ts:4`): `chat | proactive | progress-review | roadmap | writing | speaking | reading | listening | vocabulary | saved-content | reminder`

The `context-selector` (`context/context-selector.ts`) filters collected sources to only those relevant for a given scope.

### Quality Assessment

`evaluateContextQuality` (`learner-context-builder.ts:167`) compares available sources against scope requirements:

- `complete` — no missing sources
- `partial` — ≤ 2 missing
- `insufficient` — > 2 missing

## Memory System

### TutorMemoryManager (`memory/tutor-memory-manager.ts:6`)

Central memory manager, wrapping `TutorMemoryRepository`:

```typescript
class TutorMemoryManager {
  constructor(repository: TutorMemoryRepository)
  getMemory(learnerId: string): Promise<TutorMemory | null>
  updateMemory(request: UpdateTutorMemoryRequest): Promise<UpdateTutorMemoryResult>
}
```

On update, it:
1. Retrieves existing memory (or creates empty)
2. Deduplicates incoming weak points, mistake patterns, preferences
3. Compacts stale entries
4. Increments version and saves

### MemoryDeduplicator (`memory/memory-deduplicator.ts:3`)

- `isDuplicateWeakPoint` — matches on skill + description (case-insensitive, within 24h)
- `isDuplicateMistakePattern` — matches on skill + pattern (case-insensitive)
- `mergePreferences` — upserts by key, marking `lastConfirmedAt`

### MemoryCompactor (`memory/memory-compactor.ts:3`)

- Weak points: filters to last 30 days, sorts by frequency, keeps top 20
- Mistake patterns: filters to last 30 days, sorts by frequency, keeps top 15
- Open learning loops: marks `active → stale` after 7 days of inactivity

### MemoryExtractor (`memory/memory-extractor.ts:3`)

Basic regex-based extraction from chat responses. Currently detects:
- Skill-specific weakness mentions (e.g. "your writing needs improvement")

This is a minimal implementation — target state uses LLM-based extraction.

## Proactive System

### TriggerRegistry (`proactive/trigger-registry.ts:9`)

```typescript
class TriggerRegistry {
  register(handler: TriggerHandler): void
  evaluateAll(params): TriggerHandlerResult[]
}
```

Each `TriggerHandler` has a `triggerType` and `evaluate(params)` that returns `{ shouldTrigger, score }`. All triggers are evaluated on each cycle; only scored ≥ threshold are kept.

### MessageGeneratorRegistry (`proactive/message-generator-registry.ts:10`)

```typescript
class MessageGeneratorRegistry {
  register(generator: MessageGenerator): void
  generateForTrigger(state, triggerType): ProactiveInterventionCandidate | null
  generateAll(state): ProactiveInterventionCandidate[]
}
```

Each generator maps a trigger type to a concrete message.

### ProactiveTutorOrchestrator (`proactive/proactive-tutor-orchestrator.ts:11`)

The orchestrator runs the full evaluation pipeline:

1. Check if proactive is enabled
2. Check quiet hours (if in quiet hours, return empty)
3. Check daily message limit
4. Evaluate all triggers against learner state
5. Filter triggered triggers through cooldown policy
6. Generate candidates for non-cooldown triggers
7. Score/rank candidates via `selectBestInterventions`
8. Convert to `ProactiveMessage[]` with priority mapping
9. Deduplicate against recent messages
10. Return selected + throttled count

### createDefaultGenerators (`proactive/default-generators.ts`)

Pre-built generators for common triggers:
- `vocabulary_review_due` — vocabulary items due
- `due_review_not_completed` — overdue reviews
- `long_inactivity` — learner inactive
- `exam_approaching` — exam date nearing
- `study_streak_achieved` — streak milestone
- `low_accuracy_trend` — declining accuracy
- `missed_study_days` — consecutive missed days
- `new_content_available` — new saved content
- `progress_milestone` — progress milestone
- `daily_study_reminder` — daily check-in

## AI Layer

### TutorAIClient (`ai/tutor-ai-client.ts:27`)

```typescript
interface TutorAIClient {
  generateStructured<TSchema>(
    request: TutorAIRequest<TSchema>,
    options?: TutorAIRequestOptions,
  ): Promise<TutorAIResult<TSchema>>
}
```

### GeneralChatPromptBuilder

Builds chat prompts from tutor context, learner state, and message history.

### FallbackPolicy (`ai/fallback-policy.ts:9`)

```typescript
class FallbackPolicy {
  async execute<T>(
    primary: () => Promise<T>,
    fallback: () => Promise<T>,
    errorFilter?: (error: TutorError) => boolean,
  ): Promise<FallbackResult<T>>
}
```

Retries primary (max 2 retries by default), then falls back if all attempts fail or error matches filter.

### FallbackTutorAIClient (`ai/tutor-ai-client.ts:34`)

Returns `{ success: false, error: { code: 'ai_not_configured' } }` — used when no AI provider is configured.

### JsonSchemaParser (`ai/structured-output-parser.ts`)

Parses AI JSON responses into typed structures.

## Skill Modules (6 Implemented)

In `packages/ai-tutor-engine/src/skill-modules/`:

| Module | File | Purpose |
|---|---|---|
| `WritingTutorModule` | `skill-modules/writing/` | Writing review, feedback, task types |
| `SpeakingTutorModule` | `skill-modules/speaking/` | Speaking review, feedback, parts |
| `ReadingTutorModule` | `skill-modules/reading/` | Reading explanation |
| `ListeningTutorModule` | `skill-modules/listening/` | Listening explanation |
| `VocabularyTutorModule` | `skill-modules/vocabulary/` | Vocabulary explanation |
| `GrammarTutorModule` | `skill-modules/grammar/` | Grammar explanation |

## Repository Ports (12+)

| Port | File | Purpose |
|---|---|---|
| `tutor-memory` | `ports/tutor-memory-repository.ts` | TutorMemory CRUD |
| `learner-profile` | `ports/learner-profile-repository.ts` | LearnerProfile CRUD |
| `learner-progress` | `ports/learner-progress-repository.ts` | Progress records |
| `proactive-message` | `ports/proactive-message-repository.ts` | Persisted proactive messages |
| `tutor-message` | `ports/tutor-message-repository.ts` | Chat messages |
| `saved-content` | `ports/saved-content-repository.ts` | Saved learning content |
| `roadmap` | `ports/roadmap-repository.ts` | Study roadmap data |
| `vocabulary` | `ports/vocabulary-repository.ts` | Vocabulary entries |
| `reminder` | `ports/reminder-repository.ts` | Reminders |
| `mistake` | `ports/mistake-repository.ts` | Mistakes |
| `clock` | `ports/clock-port.ts` | Time abstraction |
| `notification` | `ports/notification-port.ts` | Push/browser notifications |
| `tutor-settings` | `ports/tutor-settings-repository.ts` | Proactive settings |
| `event-publisher` | `ports/tutor-event-publisher.ts` | Domain events |

## Proactive System Architecture

The proactive messaging system follows a hexagonal architecture with ports, domain policies, and application use cases. The legacy `services/` directory (`proactiveEventBus.ts`, `proactiveMessageEngine.ts`, `messageStorage.ts`) has been removed and consolidated into:

### Current Proactive Implementation

| File | Purpose |
|---|---|
| `proactive/proactive-tutor-orchestrator.ts` | Full orchestration pipeline |
| `proactive/trigger-registry.ts` | Pluggable trigger handlers |
| `proactive/message-generator-registry.ts` | Pluggable message generators |
| `proactive/default-generators.ts` | Pre-built generators |
| `proactive/cached-proactive-evaluator.ts` | Cached evaluation wrapper |
| `ports/proactive-message-repository.ts` | Repository contract |
| `infrastructure/proactive-message-storage.ts` | LocalStorage implementation |

## Domain Services

| Service | File | Purpose |
|---|---|---|
| `skill-priority-analyzer` | `domain/services/skill-priority-analyzer.ts` | Ranks skills by priority for improvement |
| `progress-analyzer` | `domain/services/progress-analyzer.ts` | Analyzes progress trends, detects milestones |
| `mistake-pattern-analyzer` | `domain/services/mistake-pattern-analyzer.ts` | Detects recurring mistake patterns |

## Domain Policies

| Policy | File | Purpose |
|---|---|---|
| `cooldown-policy` | `domain/policies/cooldown-policy.ts` | Rate-limits per-trigger + global |
| `duplicate-message-policy` | `domain/policies/duplicate-message-policy.ts` | Deduplication by key |
| `proactive-trigger-policy` | `domain/policies/proactive-trigger-policy.ts` | Trigger evaluation logic |
| `quiet-hours-policy` | `domain/policies/quiet-hours-policy.ts` | Quiet hours (22:00-08:00 default) |
| `recommendation-priority-policy` | `domain/policies/recommendation-priority-policy.ts` | Scoring + selection of best interventions |
