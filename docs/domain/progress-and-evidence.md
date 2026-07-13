# Progress and Evidence

## Purpose

Track learner progress across skills over time. Progress evidence is built from completed learning outcomes and aggregated to show trends, strengths, and weaknesses.

## Evidence Model

**ProgressEvidence** (`@ielts/learning-engine`):

| Field | Type | Description |
|---|---|---|
| `id` | string | UUID |
| `type` | `'session-completed' \| 'skill-improved' \| 'mistake-reduced' \| 'vocabulary-mastered' \| 'streak-milestone' \| 'consistency'` | Category of progress |
| `description` | string | Human-readable summary |
| `value` | number | Current measurement |
| `previousValue` | number \| undefined | Previous measurement for delta |
| `sourceSessionId` | string | Session that generated this evidence |
| `occurredAt` | string | ISO timestamp |

**SkillEvidence** (`@ielts/learning-engine`):

| Field | Type | Description |
|---|---|---|
| `skill` | `IELTSSection` | Skill identifier |
| `type` | `'strength' \| 'weakness' \| 'improvement' \| 'plateau'` | Evidence classification |
| `accuracy` | number | Score percentage |
| `confidence` | number | AI confidence in this assessment |

**SkillProgress:**

| Field | Type | Description |
|---|---|---|
| `currentBand` | number \| undefined | Estimated current band |
| `targetBand` | number \| undefined | User's target band |
| `exercisesCompleted` | number | Count |
| `trend` | `'improving' \| 'stable' \| 'declining' \| 'unknown'` | Trajectory |

## Build Pipeline

```
LearningOutcome → buildProgressEvidence() → ProgressEvidence[]
LearningOutcome → buildSkillEvidence()    → SkillEvidence[]
SkillEvidence[] → aggregateSkillProgress() → Record<IELTSSection, SkillProgress>
```

- `buildProgressEvidence` in `@ielts/learning-engine/domain/services` transforms outcomes into evidence records.
- `aggregateSkillProgress` consolidates skill evidence into per-skill progress summaries.
- `analyzeLearnerProgress` (in `@ielts/ai-tutor-engine`) adds trend detection, milestone detection, risk assessment, and confidence scoring.

## Storage

- `progressRecords` table (IndexedDB): stores raw progress data points.
- `topicsProgress` table (IndexedDB): per-topic progress snapshots.
- Progress evidence is computed on-demand; it is not persisted as a table.
- Learning outcomes are persisted through `LearningOutcomeRepository` (port interface).

## Consumption

- **Roadmap UI**: completion percentage, week-by-week progress.
- **Dashboard**: skill bars, accuracy trends, study streak.
- **AI Tutor**: `LearnerStateSnapshot` includes `ProgressContext` with aggregated skill progress, trends, and consistency metrics.
- **Proactive messages**: milestone celebrations, plateau alerts, decline warnings.

## Events

- `'skill_improved'`: fired when accuracy crosses a threshold.
- `'progress_milestone'`: fired at milestones (e.g., 50% plan completion, 7-day streak).
- `'difficulty_changed'`: fired when adaptive difficulty adjusts based on performance.

## Invariants

- Progress is derived data — always recomputed from outcomes, never edited directly.
- `SkillProgress.trend` requires at least 2 data points to be meaningful.
- A session with 0% accuracy still produces evidence (a weakness).

## Duplicate Models

The legacy `ProgressRecord` entry type stores flat date-skill-value records. The new evidence model is richer (typed evidence with previous value comparison). Both coexist; `progressRecords` table provides backward data for the dashboard.
