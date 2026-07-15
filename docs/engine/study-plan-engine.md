# Study Plan Engine

> Package: `@ielts/learning-engine` — files in `packages/learning-engine/src/daily-plan/`

## Purpose

The Study Plan Engine generates personalized IELTS study roadmaps. Given a learner's current band, target band, exam date, and weekly availability, it produces a phased study plan with daily tasks, spaced-repetition reviews, and mock tests. It operates fully offline by default and optionally enriches plans via AI.

## IELTS Band Model

**Official IELTS bands** use only whole and half-band values:  
0, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9

**Internal proficiency scores** are continuous values (e.g., 5.72) used for internal calculations.
They are never displayed as "official" IELTS scores.

### Domain Types

Defined in `packages/learning-engine/src/domain/value-objects/ielts-band.ts`:

```typescript
type OfficialIeltsBand = 0 | 1 | 1.5 | ... | 9
type InternalProficiencyScore = number // continuous, 0-9

function isOfficialIeltsBand(value: number): boolean
function toNearestOfficialBand(score: number): OfficialIeltsBand
function toDisplayBand(band: OfficialIeltsBand): string
function normalizeInternalScore(score: number): number
```

### Rounding Policy

- Scores are first rounded to the nearest 0.5 using `Math.floor(x * 2 + 0.5) / 2`
- Then mapped to the nearest official IELTS band value
- Values of .25 and above round up to the next half band
- Values below .25 round down

### Phase Band Goals

Phase titles now reference official band goals. Examples:
- "Building foundations for Band 6.0"
- "Developing Band 6.5 skills"
- "Ready for Band 7.0"

Phase band goals are distributed across valid official bands between current and target.

## Current Files

| File | Role |
|---|---|
| `DailyPlanEngine.ts` | Core plan generation engine — deterministic scheduler |
| `AiPlanOrchestrator.ts` | AI enrichment layer (profile analysis, weekly objectives, task candidates) |
| `PlanRegenerator.ts` | Handles plan regeneration after profile changes, missed-task adaptation |
| `PlanEngineIntegration.ts` | Profile normalization, data source merging, convenience builders |
| `types.ts` | All shared types (~800 lines) |
| `DailyPlanEngine.test.ts` | Engine unit tests |
| `AiPlanOrchestrator.test.ts` | AI orchestrator unit tests |
| `PlanRegenerator.test.ts` | Regenerator unit tests |
| `PlanEngineIntegration.test.ts` | Integration tests |

## Public API (from `packages/learning-engine/src/index.ts`)

### DailyPlanEngine (`DailyPlanEngine.ts:121`)

```typescript
class DailyPlanEngine {
  constructor(config?: DailyPlanEngineConfig)

  // Primary entry point
  generatePlan(profile: NormalizedProfile, signal?: AbortSignal): GenerateStudyPlanResult

  // Preview without generating full plan
  previewPlan(profile: NormalizedProfile): StudyPlanPreview

  // Validation
  validatePlan(plan: StudyPlan, tasks?: StudyTask[]): PlanValidationIssue[]

  // Adaptations
  adaptToMissedTask(plan: StudyPlan, missedTaskId: string): { updatedPlan: StudyPlan; resolution: MissedTaskResolution }
  adaptToProfileChange(plan: StudyPlan, newProfile: NormalizedProfile, mode: RegenerationMode): GenerateStudyPlanResult

  // Progress tracking
  calculateProgress(plan: StudyPlan): PlanProgress
  createPlanSummary(plan: StudyPlan): PlanSummary
}
```

### AiPlanOrchestrator (`AiPlanOrchestrator.ts:171`)

```typescript
class AiPlanOrchestrator {
  constructor(callAI: AICallFn, config?: AiPlanOrchestratorConfig)

  enrichPlan(params: EnrichPlanParams): Promise<EnrichPlanResult>
  buildExplanation(context: ExplainabilityContext): PlanExplanation
}
```

### PlanRegenerator (`PlanRegenerator.ts:98`)

```typescript
class PlanRegenerator {
  constructor(engine: DailyPlanEngine, config?: PlanRegeneratorConfig)

  regenerate(params: RegeneratePlanParams): GenerateStudyPlanResult
  adaptToMissedTasks(params: MissedTaskAdaptationParams): { updatedPlan: StudyPlan; resolutions: MissedTaskResolution[] }
  previewSettingsChange(params: SettingsChangePreviewParams): SettingsChangeImpact
  determineRegenerationMode(oldProfile: NormalizedProfile, newProfile: NormalizedProfile): RegenerationMode
}
```

### PlanEngineIntegration (`PlanEngineIntegration.ts:390`)

```typescript
class PlanEngineIntegration {
  constructor(dataProvider: DataProvider)
  loadNormalizedProfile(overrides?: Partial<UserProfileInput>): Promise<NormalizedProfile>
  loadUserProfile(overrides?: Partial<UserProfileInput>): Promise<UserProfileInput>
}
```

Also exported: `mergeProfileSources`, `mapScheduleToStudyDays`, `createWeeklyAvailability`, `validateCriticalFields`, `normalizeProfile`, `buildUserProfile`, `buildNormalizedProfile` (`PlanEngineIntegration.ts:74-367`).

## Input Profile Normalization

`PlanEngineIntegration.ts` provides a three-layer profile construction pipeline:

1. **`mergeProfileSources`** (`PlanEngineIntegration.ts:74`) — Shallow-merges data from `SettingsSource` and `PersonalizationSource`. Later sources fill gaps left by earlier ones.
2. **`buildUserProfile`** (`PlanEngineIntegration.ts:311`) — Calls `mergeProfileSources`, applies explicit overrides, then validates critical fields (`currentOverallBand`, `targetOverallBand`, `examDate`, `planStartDate`, `weeklyAvailability`). Throws `ProfileValidationError` if missing.
3. **`normalizeProfile`** (`PlanEngineIntegration.ts:245`) — Converts `UserProfileInput` to `NormalizedProfile`, applying defaults for skill bands, timezone, session limits, and availability exceptions.

The `NormalizedProfile` (`types.ts:262`) carries everything the engine needs: band scores, exam type, weekly availability, availability exceptions (unavailable dates + custom capacity overrides), session limits, study intensity, weak/strong skills, exercise accuracy, mistake history, mock results, and optional AI availability flags.

## Planning Window

Calculated in `DailyPlanEngine.calculatePlanningWindow` (`DailyPlanEngine.ts:610`). Given start date and exam date, it computes:

- `totalCalendarDays` — days between start and exam
- `totalAvailableStudyDays` — study days respecting weekly availability and exceptions
- `totalAvailableMinutes` — sum of per-day available minutes
- `reservedBufferMinutes` — buffer for rescheduling (default 10%)
- `schedulableMinutes` — total minus buffer

Availability is determined by `weeklyAvailability` (per-day-of-week settings) overridden by `availabilityExceptions` (date-specific `unavailable` or `custom-capacity`).

## Availability

`WeeklyAvailability` (`types.ts:197`) models each day of the week with `DayAvailability`:

```typescript
interface DayAvailability {
  enabled: boolean
  availableMinutes: number
  preferredTime?: StudyTimePreference
  maximumSessionMinutes?: number
  maximumSessions?: number
}
```

`createWeeklyAvailability` (`PlanEngineIntegration.ts:154`) converts a `string[]` of short day names and a daily minute count into a full `WeeklyAvailability`, disabling unlisted days and setting rest days to zero.

## Skill-Gap Analysis

`analyzeSkillGaps` (`DailyPlanEngine.ts:694`) produces a `SkillGapScore[]` for all 6 skills. The priority score is a weighted combination of:

- **Band gap** (40%) — target minus current (capped at 9)
- **Error rate** (25%) — 1 minus exercise accuracy
- **User preference** (20%) — weak skill bonus (+2), strong skill penalty (-1)
- **Confidence score** (15%) — inverse of user-reported confidence

Vocabulary and grammar always get a baseline score (30% of overall band gap). Scores are normalized to weights summing to 100% for skill allocation.

## Feasibility

`analyzeFeasibility` (`DailyPlanEngine.ts:789`) compares `schedulableMinutes` to `recommendedMinutes` (band gap × 600 minutes, with 1.5× multiplier if < 30 days). Statuses:

| Status | Condition |
|---|---|
| `comfortable` | Ratio ≥ 1.0 |
| `challenging` | Ratio 0.8–1.0 |
| `high-risk` | Ratio 0.5–0.8 |
| `insufficient-time` | Ratio < 0.5 or no study time or < 7 days with gap > 1.0 |

### Phases

`planPhases` (`DailyPlanEngine.ts:850`) selects a sequence of `StudyPhaseType` based on total days and band gap:

| Duration | Phases |
|---|---|
| ≤ 7 days | diagnostic, exam-readiness |
| ≤ 14 days | diagnostic, error-correction, mock-examination, final-review |
| ≤ 30 days | diagnostic, skill-building, guided-practice, timed-practice, mock-examination, final-review |
| ≤ 60 days (gap > 2) | diagnostic, foundation, skill-building, guided-practice, mock-examination, exam-readiness |
| ≤ 60 days | diagnostic, skill-building, guided-practice, timed-practice, mock-examination, final-review |
| > 60 days | All 9 phases |

Each phase (defined in `PHASE_CONFIGS` at `DailyPlanEngine.ts:44`) has `minDays`, `optimalDays`, and scales proportionally to fit the planning window.

## Weekly Plans

`createWeeks` (`DailyPlanEngine.ts:993`) divides phases into week-long segments. Each `StudyWeek` (`types.ts:391`) tracks `availableMinutes`, `scheduledMinutes`, `bufferMinutes`, `skillAllocation`, and `taskIds`.

## Tasks

`scheduledAllTasks` (`DailyPlanEngine.ts:1042`) iterates over daily capacities and assigns sessions using:

- `selectSkillsForDay` — picks up to 3 skills per day by remaining minutes and phase targets
- `clampMinutes` — snaps durations to allowed values [10, 15, 20, 30, 45, 60, 90]
- `createStudyTask` — creates tasks with difficulty, priority, metadata

After initial scheduling, three supplementary phases run:
1. **`addReviewTasks`** (`DailyPlanEngine.ts:1264`) — spaced repetition at intervals [1, 3, 7, 14] days for high-priority tasks
2. **`addMockTestTasks`** — mock tests with post-test analysis tasks
3. **`applyFinalWeekRules`** — ensures no intensive new material in the final week

## AI Enrichment

`AiPlanOrchestrator` (`AiPlanOrchestrator.ts:171`) enriches the deterministic plan with three optional AI calls:

1. **Profile Analysis** — Identifies primary/secondary weaknesses, recommends skill sequence and task types
2. **Weekly Objectives** — Generates pedagogical objectives per week (batched)
3. **Task Candidates** — Produces AI-suggested tasks per phase (batched)

Each call uses Zod-validated JSON schemas (`AIProfileAnalysisSchema`, `AIWeeklyObjectiveSchema`, `AITaskCandidateSchema` at `AiPlanOrchestrator.ts:35-72`). Calls are cached with a TTL-based `AiCache`. The orchestrator respects `maximumCallsPerGeneration` (default 5) and falls back gracefully when AI is unavailable.

## Validation

`validatePlan` (`DailyPlanEngine.ts:243`) checks:

- Date sanity (start ≤ task dates ≤ exam date)
- Daily capacity limits (minutes + sessions)
- Session duration limits (per `maxSessionMinutes`)
- Rest day violations (tasks on disabled dates)
- Total scheduled vs schedulable minutes
- Phase/week date validity
- Dependency ordering (prerequisites before dependents)
- Review scheduling (review after source task)
- Duplicate IDs
- Mock test analysis follow-up requirement
- Final week violation (no intensive new material)

Each issue has a `PlanValidationCode` (24 codes in `types.ts:65`) with severity `warning` or `error` and a `repairable` flag.

## Regeneration

`PlanRegenerator` (`PlanRegenerator.ts:98`) handles:

- **Full regeneration** — delegates to `DailyPlanEngine.generatePlan`
- **Mode-aware regeneration** — preserves completed/in-progress tasks, merges with newly generated plan:
  - `exam-date-change` / `target-change` — full regeneration
  - `future-only` / `rebalance` / `settings-change` / `availability-change` — preserves completed, regenerates remaining
- **Missed-task adaptation** (`adaptToMissedTasks`) — attempts reschedule, split, or drop per task priority and buffer capacity
- **Settings change preview** (`previewSettingsChange`) — computes change description, flags what's preserved, determines if user confirmation is needed

Repair strategy applies automatically for capacity exceeded, session duration, task-after-exam, and total-scheduled-exceeded issues, up to `maxRepairAttempts` (default 3).

## Persistence

The engine itself is stateless — plans are returned as `StudyPlan` objects. Persistence is the consumer's responsibility. The web app stores tasks via `DatabaseService` in IndexedDB (`engineBootstrap.ts`).

Plan progress is computed on-the-fly by `calculateProgress` (`DailyPlanEngine.ts:520`), which evaluates completed/skipped/rescheduled tasks against phases, weeks, and skills.

## Consumer Paths

In the web app (`apps/web/src/`):

- **`features/roadmap/roadmapService.ts`** — consumes `DailyPlanEngine` to generate study plans
- **`engineBootstrap.ts`** — wires `PlanEngineIntegration` with localStorage settings + IndexedDB personalization data
- **Learning Engine** — receives roadmap tasks via `StudyPlanPort.getCurrentTask()` to create sessions

## Limitations

1. **No auto-persistence** — The engine returns plans but does not save them
2. **Scheduling is first-fit** — No optimization for task ordering beyond priority sorting
3. **Review intervals are fixed** — `REVIEW_INTERVALS = [1, 3, 7, 14]` — not adaptive
4. **Single-threaded** — `generatePlan` is synchronous and blocks for large windows
5. **No incremental updates** — After initial generation, the plan is mostly static until regeneration
6. **AI is advisory** — AI-generated task candidates are currently not injected into the final plan (the engine uses its own deterministic task creation)

## IELTS Band Correctness

The engine now enforces **strict separation** between:

1. **Official IELTS bands**: whole/half-band values only (5.0, 5.5, 6.0, etc.)
2. **Internal proficiency scores**: continuous values (5.72, etc.) for calculations
3. **Phase band goals**: official bands used in phase titles and labels
4. **Skill-specific bands**: official bands per skill, used for prioritization

Key protections:
- Input bands are normalized to official values via `toNearestOfficialBand()` in `normalizeProfile()`
- Phase titles use `toDisplayBand()` to ensure correct formatting
- `planConverter.ts` now uses `toNearestOfficialBand()` and `OFFICIAL_IELTS_BANDS` for phase range labels
- AI prompts include explicit instructions to only use valid IELTS band values
- Zod validation at AI output boundaries prevents invalid bands from reaching persistence
- The domain type `OfficialIeltsBand` is a strict union type (not `number`)
