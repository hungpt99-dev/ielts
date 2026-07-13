# Daily Plan Engine — Design Document

## 1. Module Overview

The Daily Plan Engine (Study Plan Engine) generates a complete, realistic, personalized, date-accurate IELTS study roadmap from the user's profile, current ability, target score, study preferences, available time, progress, and exam date.

It is a **local-first** engine that works fully offline without AI, and uses AI only for pedagogical content enrichment when available.

## 2. Module Boundaries

```
packages/learning-engine/src/daily-plan/
├── DailyPlanEngineDesign.md          (this file)
├── types.ts                          (core interfaces and data models)
├── domain/
│   ├── entities/                     (StudyPlan, StudyPhase, StudyWeek, StudyTask)
│   ├── value-objects/                (LocalDate, Availability, SkillGap, Feasibility)
│   ├── types/                        (enums, union types, type aliases)
│   └── rules/                        (business rule constants, constraints)
├── engine/
│   ├── profile-normalizer.ts         (normalize raw user profile into engine input)
│   ├── profile-validator.ts          (check required fields, return structured errors)
│   ├── planning-window-calculator.ts (derive start/end, available days, total minutes)
│   ├── availability-calculator.ts    (weekly + exception-based capacity calculation)
│   ├── skill-gap-analyzer.ts         (deterministic priority scoring per skill)
│   ├── feasibility-analyzer.ts       (classify plan as comfortable/challenging/high-risk/insufficient)
│   ├── phase-planner.ts              (select and size phases from capacity + skill gaps)
│   ├── time-budget-allocator.ts      (distribute total minutes across categories)
│   ├── ai-generation-strategy.ts     (decide AI call batching plan)
│   ├── task-candidate-provider.ts    (orchestrate built-in + AI candidate generation)
│   ├── task-candidate-deduplicator.ts(merge/remove duplicate candidates)
│   ├── task-scheduler.ts             (constraint-based deterministic daily placement)
│   ├── review-scheduler.ts           (spaced repetition review insertion)
│   ├── mock-test-scheduler.ts        (mock test + analysis pair scheduling)
│   ├── final-week-planner.ts         (special rules for final exam preparation)
│   ├── progress-calculator.ts        (derive progress from task data)
│   ├── plan-validator.ts             (validate all plan constraints before persist)
│   └── plan-repairer.ts              (bounded deterministic repair of validation issues)
├── infrastructure/
│   ├── ai/
│   │   ├── plan-ai-client.ts         (orchestrate batched AI calls)
│   │   ├── prompt-builders/          (context-minimized prompt construction)
│   │   ├── schemas/                  (Zod schemas for AI input/output)
│   │   └── cache/                    (AI result caching layer)
│   ├── persistence/                  (Dexie-based transactional persistence)
│   ├── repositories/                 (data access for plan entities)
│   └── task-library/                 (offline built-in task templates catalog)
├── application/
│   ├── generate-study-plan.usecase.ts
│   ├── preview-study-plan.usecase.ts
│   ├── regenerate-study-plan.usecase.ts
│   ├── rebalance-study-plan.usecase.ts
│   ├── resolve-missed-task.usecase.ts
│   ├── validate-study-plan.usecase.ts
│   └── repair-study-plan.usecase.ts
└── __tests__/
```

### 2.1 Interaction with Other Packages

| Package | Dependency Direction | Purpose |
|---|---|---|
| `@ielts/storage` | → | Persistence of plans via Dexie repositories |
| `@ielts/ai` | → | AI provider abstraction for content generation |
| `@ielts/settings` | → | Reading user profile and app settings |
| `apps/web` | ← | Consumes generated plans for roadmap UI |
| `apps/web` | ← | Setup flow writes user profile to settings/storage |

## 3. Core Data Flow

```
UserProfile
    ↓
[profile-normalizer] ─→ NormalizedProfile
    ↓
[profile-validator] ──→ MissingProfileResult | ok
    ↓
[planning-window-calculator] ──→ PlanningWindow
    ↓
[availability-calculator] ──→ DailyCapacity[]
    ↓
[skill-gap-analyzer] ──→ SkillAllocation
    ↓
[feasibility-analyzer] ──→ PlanFeasibility
    ↓
  (user confirmation for high-risk plans)
    ↓
[phase-planner] ──→ StudyPhase[]
    ↓
[time-budget-allocator] ──→ StudyTimeBudget
    ↓
[ai-generation-strategy] ──→ AIGenerationPlan
    ↓
[ai profile analysis] ──→ AIProfileAnalysis (optional)
    ↓
[week objective generation] ──→ AIWeeklyObjective[] (optional)
    ↓
[task-candidate-provider] ──→ AITaskCandidate[] + TaskTemplate[]
    ↓
[task-candidate-deduplicator] ──→ TaskCandidate[]
    ↓
[task-scheduler] ──→ ScheduledTask[]
    ↓
[review-scheduler] ──→ ReviewTask[]
    ↓
[mock-test-scheduler] ──→ MockTestPair[]
    ↓
[final-week-planner] ──→ FinalWeekTask[]
    ↓
[plan-validator] ──→ PlanValidationIssue[]
    ↓
  (loop with repairer if issues found)
    ↓
[plan-repairer] ──→ repaired plan or failure
    ↓
[transactional persistence] ──→ saved StudyPlan
```

## 4. Module Responsibilities

### 4.1 Domain Layer

Pure types, entities, and business rules with zero external dependencies.

| Module | Responsibility |
|---|---|
| `entities/` | StudyPlan, StudyPhase, StudyWeek, StudyTask as immutable data objects |
| `value-objects/` | LocalDate (YYYY-MM-DD string), DayAvailability, WeeklyAvailability, SkillGapScore, PlanFeasibility |
| `types/` | All union types, enums, and type aliases (IELTSSection, StudyTaskStatus, StudyPhaseType, etc.) |
| `rules/` | Constants: minimum/maximum duration values, weight configs for skill-gap scoring, buffer percentages, review intervals |

### 4.2 Engine Layer

Deterministic computation. No React, no AI calls, no persistence.

| Engine Module | Responsibility |
|---|---|
| `profile-normalizer` | Validate and normalize raw user input → structured normalized profile |
| `profile-validator` | Check for missing critical fields → structured MissingProfileResult |
| `planning-window-calculator` | Compute start/end dates, available days, total minutes, buffers |
| `availability-calculator` | Combine weekly availability + date exceptions → per-date capacity map |
| `skill-gap-analyzer` | Priority-score each skill from band gaps, error rates, preferences, recency |
| `feasibility-analyzer` | Classify plan risk level; produce suggestions if insufficient time |
| `phase-planner` | Select phase types + durations based on profile, gaps, and capacity |
| `time-budget-allocator` | Distribute total minutes across learning categories |
| `ai-generation-strategy` | Decide AI call count, batching, and token budget |
| `task-candidate-provider` | Retrieve built-in templates + orchestrate AI candidate generation |
| `task-candidate-deduplicator` | Merge/remove duplicate candidates by skill + type + objective |
| `task-scheduler` | Constraint-satisfaction placement: respect capacity, sessions, dependencies, priorities |
| `review-scheduler` | Insert spaced-repetition review tasks at configurable intervals |
| `mock-test-scheduler` | Place mock tests + companion analysis activities |
| `final-week-planner` | Special light-prep rules for the last days before the exam |
| `progress-calculator` | Derive all progress metrics from actual task status data |
| `plan-validator` | Enforce 20+ validation rules; return structured issues |
| `plan-repairer` | Bounded deterministic repair loop for fixable validation errors |

### 4.3 Infrastructure Layer

External IO: AI provider, database, repository, task templates.

| Module | Responsibility |
|---|---|
| `ai/plan-ai-client` | Call AI provider with generated strategy; handle failures, timeouts, cancellation |
| `ai/prompt-builders/` | Build context-minimized prompts (profile analysis, weekly objectives, task candidates, repair) |
| `ai/schemas/` | Zod schemas for all AI request/response contracts |
| `ai/cache/` | Hash-based AI result caching with invalidation rules |
| `persistence/` | Transactional Dexie-based plan save/load (all-or-nothing) |
| `repositories/` | Data access objects for plan entities |
| `task-library/` | Offline built-in task templates catalog (no AI required) |

### 4.4 Application Layer

Use-case orchestration. Each use case wires engine + infrastructure into one public operation.

| Use Case | Responsibility |
|---|---|
| `generate-study-plan` | Full pipeline from raw profile to persisted plan |
| `preview-study-plan` | Deterministic preview (before AI tasks) showing feasibility, phases, allocation |
| `regenerate-study-plan` | Full or future-only regeneration preserving completed history |
| `rebalance-study-plan` | Preserve future tasks; redistribute based on missed work + new evidence |
| `resolve-missed-task` | Evaluate one missed task: reschedule, split, replace, merge, or drop |
| `validate-study-plan` | Run validator against an existing plan |
| `repair-study-plan` | Apply deterministic repair to an existing plan |

## 5. Key Design Decisions

1. **Deterministic-first**: All dates, durations, capacity, and placement are computed without AI. AI enriches only pedagogical content.
2. **Strict separation**: The engine layer never calls AI directly. AI orchestration lives in `infrastructure/ai/`.
3. **Offline-first**: Built-in task templates guarantee a usable plan even without AI.
4. **Batched AI calls**: Long plans use 2-5 controlled batched AI calls, never one giant call or one-per-task.
5. **Validate before persist**: Every plan passes through PlanValidator before transactionally saving.
6. **Bounded repair**: Deterministic repair has a maximum attempt limit; no infinite loops.
7. **Explainability**: Tasks include a `reason` field; a plan summary exposes allocation, feasibility, and weakness rationale.
8. **LocalDate type**: All domain dates use `YYYY-MM-DD` strings with centralized utility functions.

## 6. AI Integration Points

| Point | Input | Output | Required? | Batching |
|---|---|---|---|---|
| Profile analysis | Normalized profile, skill gaps, performance evidence | AIProfileAnalysis (weaknesses, sequence, task types) | No (skippable) | Single call |
| Weekly objectives | Phase/Week IDs, date ranges, capacity, skill allocation | AIWeeklyObjective[] (title, focus, objectives, task types) | No (skippable) | 4-6 weeks per batch |
| Task candidates | Phase, weeks, objectives, skill allocation, mistakes, vocabulary | AITaskCandidate[] (unscheduled) | No (template fallback) | One phase or bounded batch |
| Content repair | Invalid candidates + structured validation issues | Fixed candidates | No (at most 1 call) | Single repair call |
| Progress review | Completed tasks, progress data, weaknesses | Text summary | No | Single call |

## 7. Regeneration Strategy

| Mode | Preserves | Regenerates | Trigger |
|---|---|---|---|
| `full` | Nothing | Everything | User request, initial generation |
| `future-only` | Completed tasks, history, AI reviews | Incomplete tasks from today onward | Settings changes |
| `rebalance` | Completed + future tasks (redistributed) | Only scheduling, not content | Missed tasks, new evidence |
| `settings-change` | Completed tasks | Future-only regeneration | Profile/schedule/target changes |
| `exam-date-change` | Completed tasks | Full future recalculation | Exam date moved |
| `availability-change` | Completed tasks | Future schedule rebalancing | Study days/minutes changed |
| `target-change` | Completed tasks | Phase re-plan + future tasks | Band target changed |

## 8. Error Handling

All domain errors use typed discriminated unions, not exceptions:

- `MissingProfileResult` — critical fields absent
- `InsufficientTimeResult` — impossible schedule
- `GenerationCancelled` — aborted mid-generation
- `ValidationFailedResult` — validation issues uncorrectable by repair
- `StorageError` — Dexie persistence failure
- `PlanFailureResult` — combined failure with suggestions

Unrecoverable errors return a structured result with validation issues + adjustment suggestions. The existing valid plan is never replaced by a partial or failed generation.
