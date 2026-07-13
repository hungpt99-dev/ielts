# Study Plan Engine — Architecture & Usage Guide

## Overview

The Study Plan Engine generates complete, personalized IELTS study roadmaps from a user's profile, current ability, target score, study preferences, available time, progress, and exam date. It lives in `packages/learning-engine/src/daily-plan/`.

The engine is **local-first**, works without a backend, and generates a useful plan even when no AI provider is configured. Deterministic scheduling logic is fully separated from AI content generation.

---

## Core Design Principles

1. **Deterministic calculations must not depend on AI.** Dates, capacity, task placement, and progress are computed by pure functions.
2. **AI must not control dates, capacity, or scheduling.** AI provides content suggestions only; the engine validates and schedules everything.
3. **The engine never schedules more time than available.** Daily, weekly, and total capacity constraints are enforced at every stage.
4. **No normal tasks after the exam date.** The exam date itself gets only light preparation tasks at most.
5. **Completed history is preserved during regeneration.** Only future/affected tasks change.
6. **The plan remains useful without AI.** A built-in offline task template library is used as fallback.
7. **All AI output uses strict Zod schemas.** Invalid output is caught, normalized, or rejected without crashing.
8. **The engine validates and repairs plans before persistence.** No invalid plan is saved.
9. **Plan generation is explainable.** Every task has a human-readable reason; a summary explains the full plan.
10. **A failed AI request does not fail the entire generation.** The engine continues with offline templates.

---

## Module Architecture

```
packages/learning-engine/src/daily-plan/
├── types.ts                    # All domain types, interfaces, AI types
├── DailyPlanEngine.ts          # Core deterministic engine
├── PlanRegenerator.ts          # Plan regeneration and adaptation
├── AiPlanOrchestrator.ts       # AI call orchestration, caching, schemas
├── ExplainabilityService.ts    # User-facing plan explanations
├── PlanPersistenceService.ts   # Validation + repair before persistence
├── PlanEngineIntegration.ts    # Profile building from app data sources
├── *.test.ts                   # Unit and integration tests
```

### types.ts — Domain Types & Interfaces

Defines every type in the engine: `NormalizedProfile`, `PlanningWindow`, `PlanFeasibility`, `SkillGapScore`, `SkillAllocation`, `StudyTimeBudget`, `StudyPhase`, `StudyWeek`, `StudyTask`, `StudyPlan`, `PlanGenerationMetadata`, `PlanValidationIssue`, `PlanRepairAction`, `PlanGenerationProgress`, `StudyPlanPreview`, `SettingsChangeImpact`, `GenerateStudyPlanResult`, `PlanGenerationSummary`, `MissedTaskResolution`, `AIGenerationPlan`, `AIProfileAnalysis`, `AIWeeklyObjective`, `AITaskCandidate`, `AICallLimits`, `AICacheRecord`, `TaskTemplate`, `PlanProgress`, `PlanSummary`, `PlanExplanation`, and all supporting enums and value types.

### DailyPlanEngine.ts — Core Deterministic Engine

**File:** `packages/learning-engine/src/daily-plan/DailyPlanEngine.ts:120`

The central orchestrator. Responsible for the entire generation pipeline:

| Method | Purpose |
|---|---|
| `generatePlan(profile)` | Full generation pipeline → `GenerateStudyPlanResult` |
| `previewPlan(profile)` | Deterministic preview without detailed task generation |
| `validatePlan(plan)` | Comprehensive validation against all constraints |
| `adaptToMissedTask(plan, taskId)` | Resolve a single missed task (reschedule, split, drop) |
| `adaptToProfileChange(plan, newProfile, mode)` | Adapt plan after profile changes |
| `calculateProgress(plan)` | Compute progress from actual task data |
| `createPlanSummary(plan)` | Build user-facing summary |

**Internal pipeline methods (private):**

- `calculatePlanningWindow` — enumerates the date range, counts study days and total available minutes, reserves buffer
- `calculateDailyCapacities` — builds per-date capacity with availability exceptions applied
- `analyzeSkillGaps` — weighted priority scoring by band gap, error rate, user preference, confidence
- `createSkillAllocation` — normalizes skill gap scores into percentage allocation
- `analyzeFeasibility` — compares available vs recommended study time, returns status + warnings + suggestions
- `planPhases` — selects phase types and lengths based on total days and band gap
- `allocateTimeBudget` — distributes available minutes across learning categories
- `buildPlan` — creates weeks and schedules all tasks
- `scheduleAllTasks` — iterates daily capacities, selects skills, creates tasks, then adds reviews, mock tests, and final-week preparation
- `createStudyTask` — builds a single task with reason, difficulty, priority
- `addReviewTasks` — schedules spaced-repetition reviews at configurable intervals (1, 3, 7, 14 days)
- `addMockTestTasks` — places mock tests with associated analysis tasks
- `applyFinalWeekRules` — ensures final week follows special planning rules

**Engine configuration (`DailyPlanEngineConfig`):**

```typescript
interface DailyPlanEngineConfig {
  bufferPercentage?: number;   // default 0.1 (10%)
  maxRepairAttempts?: number;  // default 3
  engineVersion?: string;      // default '1.0.0'
  schemaVersion?: string;      // default '1.0.0'
}
```

### PlanRegenerator.ts — Regeneration & Adaptation

**File:** `packages/learning-engine/src/daily-plan/PlanRegenerator.ts:98`

Handles plan evolution after initial generation.

| Method | Purpose |
|---|---|
| `regenerate(params)` | Full regeneration with mode-aware merging of completed tasks |
| `adaptToMissedTasks(params)` | Batch-adapt multiple missed tasks |
| `previewSettingsChange(params)` | Calculate impact of profile changes before applying |
| `determineRegenerationMode(oldProfile, newProfile)` | Detect which mode is appropriate from profile diff |

**Regeneration modes (`RegenerationMode`):**

- `"full"` — complete regen from scratch
- `"future-only"` — preserve completed/in-progress, regen future
- `"rebalance"` — preserve everything, redistribute future tasks
- `"settings-change"` — minor profile updates
- `"exam-date-change"` — exam date moved
- `"availability-change"` — study time changed
- `"target-change"` — band target changed

### AiPlanOrchestrator.ts — AI Content Orchestration

**File:** `packages/learning-engine/src/daily-plan/AiPlanOrchestrator.ts:171`

Manages all AI interactions with configurable call limits, caching, and fallback.

| Method | Purpose |
|---|---|
| `enrichPlan(params)` | Run the full AI enrichment pipeline (profile analysis → weekly objectives → task candidates) |
| `buildExplanation(context)` | Generate a user-facing `PlanExplanation` from contextual data |

**AI generation strategy (`AIGenerationPlan`):**

The orchestrator builds a plan dynamically based on the number of weeks and phases, creating batched calls:

1. **Profile analysis** (1 optional call) — analyzes weaknesses, strengths, and learning sequence
2. **Weekly objectives** (batched, ~4-6 weeks per call) — pedagogical focus per week
3. **Task candidates** (batched, one per phase) — content suggestions for the deterministic scheduler
4. **Optional repair call** (at most 1) — fixes content-related issues

**AI call limits (`AICallLimits`):**

| Setting | Default |
|---|---|
| `maximumCallsPerGeneration` | 5 |
| `maximumRepairCalls` | 1 |
| `maximumTokensPerGeneration` | 32000 |
| `maximumCandidatesPerBatch` | 15 |
| `maximumWeeksPerBatch` | 6 |
| `requestTimeoutMs` | 30000 |

**Zod schemas for AI output:**

Every AI response is validated against a strict Zod schema:
- `AIProfileAnalysisSchema` — primary/secondary weaknesses, recommended sequence, task types, risks, learner summary
- `AIWeeklyObjectiveSchema` — per-week title, focus, objectives, recommended task types, pedagogical reason
- `AITaskCandidateSchema` — candidate ID, skill, task type, title, description, objective, reason, duration, difficulty, priority

**Caching (`AiCache`):**

In-memory cache with configurable TTL. Cache keys are built from normalized inputs (profile scores, dates, exam type). Hit reduces redundant AI calls.

### ExplainabilityService.ts — User-Facing Explanations

**File:** `packages/learning-engine/src/daily-plan/ExplainabilityService.ts:48`

Makes the plan understandable to the user.

| Method | Purpose |
|---|---|
| `explainTaskSchedule(task, plan, skillGaps)` | Why a task is scheduled on a specific date |
| `explainPrioritization(task, plan, skillGaps)` | Why a task has its priority level |
| `explainAdaptation(resolution, plan)` | What happened when a task was missed |
| `generatePlanExplanation(plan, enrichResult?)` | Full plan summary for UI |
| `summarizeAiUsage(enrichResult)` | Human-readable AI contribution summary |

### PlanPersistenceService.ts — Persistence & Validation

**File:** `packages/learning-engine/src/daily-plan/PlanPersistenceService.ts:59`

Wraps the engine with transactional persistence, validation, and repair.

| Method | Purpose |
|---|---|
| `savePlan(plan)` | Validate → repair → persist transactionally |
| `loadPlan(id)` | Load by ID with validation |
| `loadActivePlan()` | Load current active plan |
| `listPlans()` | All plans ordered by update time |
| `deletePlan(id)` | Remove a plan |
| `regenerateWithPreservation(plan, newProfile, mode)` | Regenerate and merge completed tasks |

**Repository interface (`PlanRepository`):**

```typescript
interface PlanRepository {
  save(plan: StudyPlan): Promise<StudyPlan>;
  findById(id: string): Promise<StudyPlan | null>;
  findActive(): Promise<StudyPlan | null>;
  findAll(orderBy?: 'createdAt' | 'updatedAt'): Promise<StudyPlan[]>;
  deleteById(id: string): Promise<void>;
  saveVersion(plan: StudyPlan): Promise<StudyPlan>;
  findVersions(planId: string): Promise<StudyPlan[]>;
}
```

### PlanEngineIntegration.ts — Profile Building

**File:** `packages/learning-engine/src/daily-plan/PlanEngineIntegration.ts:390`

Connects the engine to app data sources (settings, personalization context, learning profile).

| Function | Purpose |
|---|---|
| `mergeProfileSources(settings, personalization)` | Merge data from multiple sources into a partial `UserProfileInput` |
| `validateCriticalFields(input)` | Check required fields are present |
| `normalizeProfile(input)` | Convert `UserProfileInput` → `NormalizedProfile` |
| `buildNormalizedProfile(params)` | One-step profile building with validation |
| `PlanEngineIntegration.loadNormalizedProfile()` | Async load from data providers |

---

## Generation Pipeline

The pipeline proceeds through these stages in order:

```
User Profile (raw)
    ↓
NormalizedProfile (normalizeProfile)
    ↓
Critical field validation (validateCriticalFields)
    ↓
PlanningWindow (calculatePlanningWindow)
    ↓
Daily capacities (calculateDailyCapacities)
    ↓
Skill gap analysis (analyzeSkillGaps)
    ↓
Feasibility analysis (analyzeFeasibility)
    ↓
[Optional] User confirmation if high-risk
    ↓
Phase generation (planPhases)
    ↓
Study time budget (allocateTimeBudget)
    ↓
Week creation (createWeeks)
    ↓
[AiPlanOrchestrator.enrichPlan — AI tasks]
    ↓
Deterministic task scheduling (scheduleAllTasks)
    ↓
Spaced review scheduling (addReviewTasks)
    ↓
Mock test scheduling (addMockTestTasks)
    ↓
Final-week preparation (applyFinalWeekRules)
    ↓
Plan validation (validatePlan)
    ↓
[If errors] Deterministic repair (repairPlan)
    ↓
[Optional] AI content repair
    ↓
Final validation
    ↓
[PlanPersistenceService.savePlan] Transactional persistence
```

Each stage has a clear input and output contract (pure functions or class methods operating on defined types).

---

## Data Flow

### Profile Data Flow

```
App Settings ──┐
               ├──→ mergeProfileSources → validateCriticalFields → normalizeProfile → NormalizedProfile
Personalization ┘
```

### Generation Data Flow

```
NormalizedProfile
    ↓
calculatePlanningWindow → PlanningWindow
    ↓
analyzeSkillGaps → SkillGapScore[]
    ↓
analyzeFeasibility → PlanFeasibility (may return requires-confirmation)
    ↓
planPhases → StudyPhase[]
    ↓
allocateTimeBudget → StudyTimeBudget
    ↓
createWeeks → StudyWeek[]
    ↓
  ┌─ [AI available] ─→ AiPlanOrchestrator.enrichPlan → AIProfileAnalysis, AIWeeklyObjective[], AITaskCandidate[]
  │                    (batched calls, cached, with fallback)
  └─ [No AI] ──────────→ Use built-in templates only
    ↓
scheduleAllTasks → StudyTask[]
    ↓
validatePlan → PlanValidationIssue[]
    ↓
  ┌─ [errors] ─→ repairPlan → [loop] → validatePlan
  └─ [ok] ─────→
    ↓
StudyPlan (complete)
```

### Adaptation Data Flow

```
Missed task → adaptToMissedTask → resolve action + updated plan
Profile change → determineRegenerationMode → adaptToProfileChange → updated plan
Settings change → previewSettingsChange → SettingsChangeImpact (before applying)
```

---

## AI Integration

### Call Strategy

The engine uses 2-5 AI calls for initial generation, decided by `buildAiGenerationPlan()`:

1. **Profile analysis** (1 call, optional) — skipped when AI is disabled, cached, or deterministic analysis suffices
2. **Weekly objectives** (batched, ~5 weeks per call) — each batch includes continuity summary from previous batch
3. **Task candidates** (1 batch per phase) — bounded by `maximumCandidatesPerBatch` (default 15)
4. **Repair call** (at most 1, optional) — only for content issues, not scheduling

### AI Output Validation

All AI responses are validated against Zod schemas. Invalid output is:
1. Parsed with the strict schema
2. Normalized where possible
3. Rejected if unsalvageable
4. Replaced with offline templates as fallback

### Caching

AI results are cached in-memory with cache keys built from normalized inputs. Cache invalidation considers: band changes, target changes, exam-date changes, availability changes, skill priority changes, new performance evidence, and schema/engine version changes.

---

## Validation & Repair

### Plan Validation (`validatePlan`)

Validates 20+ constraint types including:
- Start date before exam date
- No tasks after exam or on exam date
- No tasks on disabled/rest days
- Daily capacity not exceeded
- Session duration within limits
- Session count within daily limit
- Total scheduled ≤ schedulable minutes
- Valid week/phase date ranges
- Dependencies in correct order
- Reviews after source tasks
- Unique IDs
- Mock tests have associated analysis
- Final-week rules respected
- No guaranteed score claims

### Plan Repair

Deterministic repair handles: tasks after exam (move to final study date), tasks on exam date (move to day before), daily capacity exceeded (reschedule lower-priority tasks), session duration exceeded (clamp to max), tasks on disabled dates (move to next available date).

---

## Key Types Reference

### GenerateStudyPlanResult

```typescript
type GenerateStudyPlanResult =
  | { status: "success"; plan: StudyPlan; feasibility: PlanFeasibility; warnings: PlanWarning[]; generationSummary: PlanGenerationSummary }
  | { status: "needs-profile-completion"; missingFields: UserProfileField[] }
  | { status: "requires-confirmation"; preview: StudyPlanPreview; feasibility: PlanFeasibility }
  | { status: "cancelled" }
  | { status: "failure"; reason: PlanGenerationFailureReason; validationIssues: PlanValidationIssue[]; suggestions: PlanAdjustmentSuggestion[] }
```

### StudyPlan

```typescript
interface StudyPlan {
  id: string;
  version: number;
  profile: NormalizedProfile;
  planningWindow: PlanningWindow;
  feasibility: PlanFeasibility;
  timeBudget: StudyTimeBudget;
  skillAllocation: SkillAllocation;
  phases: StudyPhase[];
  weeks: StudyWeek[];
  tasks: StudyTask[];
  generationMetadata: PlanGenerationMetadata;
  createdAt: string;
  updatedAt: string;
}
```

### StudyTask

```typescript
interface StudyTask {
  id: string;
  roadmapId: string;
  phaseId: string;
  weekId: string;
  date: LocalDate;
  sessionOrder: number;
  skill: StudyTaskSkill;
  taskType: string;
  title: string;
  description: string;
  objective: string;
  reason: string;
  estimatedMinutes: number;
  difficulty: TaskDifficulty;
  priority: TaskPriority;
  sourceType: StudyTaskSourceType;
  status: StudyTaskStatus;
  scheduledAt: string;
  startedAt?: string;
  completedAt?: string;
  actualMinutes?: number;
  dependencies?: string[];
  reviewOfTaskId?: string;
  rescheduledFromDate?: LocalDate;
  metadata: { targetBand?: number; focusArea?: string; generationReason?: string; templateId?: string; aiCandidateId?: string };
}
```

### NormalizedProfile

```typescript
interface NormalizedProfile {
  currentOverallBand: number;
  targetOverallBand: number;
  currentSkillBands: SkillBandScores;
  targetSkillBands: Partial<SkillBandScores>;
  examType: IELTSExamType;
  examDate: LocalDate;
  planStartDate: LocalDate;
  timezone: string;
  weeklyAvailability: WeeklyAvailability;
  availabilityExceptions: AvailabilityException[];
  maximumSessionMinutes: number;
  maximumSessionsPerDay: number;
  studyIntensity: StudyIntensity;
  weakSkills: StudyTaskSkill[];
  strongSkills: StudyTaskSkill[];
  preferredTaskTypes: string[];
  recentMistakes: MistakeRecord[];
  exerciseAccuracy: SkillAccuracyMap;
  previousMockResults: MockResultRecord[];
  taskCompletionHistory: TaskCompletionRecord[];
  userConfidence: Partial<Record<StudyTaskSkill, number>>;
  manuallySelectedPrioritySkills: StudyTaskSkill[];
  offlineOnlyMode: boolean;
  aiProviderAvailable: boolean;
}
```

---

## Integration Points

### Creating the Engine

```typescript
const engine = new DailyPlanEngine({
  bufferPercentage: 0.1,
  maxRepairAttempts: 3,
  engineVersion: '1.0.0',
  schemaVersion: '1.0.0',
});
```

### Building a Profile

```typescript
// From app data sources
const integration = new PlanEngineIntegration(dataProvider);
const profile = await integration.loadNormalizedProfile({ /* overrides */ });

// Or directly
import { buildNormalizedProfile } from './PlanEngineIntegration';
const profile = buildNormalizedProfile({ settings, personalization, overrides });
```

### Generating a Plan

```typescript
const result = engine.generatePlan(profile);

if (result.status === 'success') {
  // result.plan — the complete StudyPlan
  // result.feasibility — PlanFeasibility
  // result.warnings — PlanWarning[]
  // result.generationSummary — PlanGenerationSummary
} else if (result.status === 'needs-profile-completion') {
  // result.missingFields — fields the user needs to fill
} else if (result.status === 'requires-confirmation') {
  // result.preview — deterministic preview before AI generation
  // result.feasibility — shows high-risk status
} else if (result.status === 'failure') {
  // result.reason — failure reason with suggested actions
  // result.validationIssues — what went wrong
}
```

### Preview Before Generation

```typescript
const preview = engine.previewPlan(profile);
// planningWindow, feasibility, skillAllocation, phases, estimated tasks/mocks
```

### AI Enrichment

```typescript
const orchestrator = new AiPlanOrchestrator(callAI, {
  callLimits: { maximumCallsPerGeneration: 5 },
  enableCache: true,
});

const enrichResult = await orchestrator.enrichPlan({
  profile,
  planningWindow,
  phases,
  weeks,
  feasibility,
  skillGaps,
  signal: abortSignal,
});
```

### Persistence

```typescript
const persistence = new PlanPersistenceService(engine, repository, {
  validateBeforeSave: true,
  repairBeforeSave: true,
});

const persistResult = await persistence.savePlan(plan);
// persistResult.success, persistResult.repairsPerformed
```

### Regeneration

```typescript
const regenerator = new PlanRegenerator(engine);

const result = regenerator.regenerate({
  currentPlan,
  newProfile,
  mode: 'future-only',
});

// Or preview impact before applying
const impact = regenerator.previewSettingsChange({
  currentPlan,
  newProfile,
  updatedFields: ['examDate', 'targetOverallBand'],
});
```

### Missed Task Adaptation

```typescript
const { updatedPlan, resolutions } = regenerator.adaptToMissedTasks({
  plan,
  missedTaskIds: ['task-1', 'task-3'],
});
```

### Progress & Explanations

```typescript
const progress = engine.calculateProgress(plan);
// overallTaskProgress, phaseProgress, weeklyProgress, skillProgress, etc.

const summary = engine.createPlanSummary(plan);
// currentBand, targetBand, examDate, daysRemaining, feasibility, etc.

const explainer = new ExplainabilityService();
const explanation = explainer.explainTaskSchedule(task, plan, skillGaps);
const planExplanation = explainer.generatePlanExplanation(plan, enrichResult);
```

---

## Test Coverage

The engine is covered by unit and integration tests:

| File | Tests |
|---|---|
| `DailyPlanEngine.test.ts` | Core generation, validation, adaptation |
| `PlanRegenerator.test.ts` | Regeneration modes, missed task adaptation, settings preview |
| `PlanPersistenceService.test.ts` | Save, load, validate, repair, versioning |
| `AiPlanOrchestrator.test.ts` | AI enrichment, caching, fallback, schemas |
| `ExplainabilityService.test.ts` | Explanation generation |
| `PlanEngineIntegration.test.ts` | Profile building and integration |

---

## Skill Gap Analysis

Weighted scoring formula (configurable weights):

```typescript
priorityScore =
  (bandGap / 9) * 0.4 +           // bandGapWeight
  errorRate * 0.25 +               // errorWeight
  userPriorityNormalized * 0.2 +    // preferenceWeight
  confidenceScore * 0.15;           // confidenceWeight
```

Supports 6 skills: listening, reading, writing, speaking, vocabulary, grammar. Vocabulary and grammar support the four main IELTS skills and do not dominate the plan.

---

## Capacity Model

- **Weekly availability** — per-day enabled/disabled + available minutes + max sessions + preferred time
- **Availability exceptions** — per-date unavailable or custom-capacity overrides
- **Buffer** — configurable percentage (default 10%) reserved for missed tasks and future adaptation
- **Allowed durations** — 10, 15, 20, 30, 45, 60, 90 minutes
- **Session limits** — max duration and max sessions per day, per day-configuration
- **Capacity is never exceeded** — validated before and after scheduling

---

## Required Profile Fields

The engine requires these fields to generate a plan:
- `currentOverallBand`
- `targetOverallBand`
- `examDate`
- `planStartDate`
- `weeklyAvailability` (at least one enabled day)

Missing fields return a structured `needs-profile-completion` result.
