# Learning Session

## Purpose

A learning session is a cohesive study unit — one focused practice block on a specific skill, composed of one or more exercises. It is the primary container for learning activity in the system.

## Canonical Model

Defined in `@ielts/learning-engine` as `LearningSession`.

| Field | Type | Description |
|---|---|---|
| `id` | string | UUID |
| `objective` | `LearningObjective` | What the session aims to achieve |
| `skill` | `IELTSSection` | e.g. `'reading'`, `'writing'` |
| `mode` | `LearningMode` | `'learn' \| 'practice' \| 'review' \| 'assess' \| 'apply'` |
| `source` | `LearningSessionSource` | `'roadmap' \| 'tutor-recommendation' \| 'user-selected' \| 'mistake-review' \| ...` |
| `status` | `LearningSessionStatus` | `'prepared' \| 'in-progress' \| 'paused' \| 'completed' \| 'abandoned' \| 'expired'` |
| `plannedDurationMinutes` | number | Target length |
| `actualDurationMinutes` | number \| undefined | Actual length after completion |
| `difficulty` | `ExerciseDifficulty` | Session difficulty level |
| `activities` | `LearningActivity[]` | Ordered list of activities |
| `roadmapTaskId` | string \| undefined | Link to roadmap task |
| `startedAt` | string \| undefined | When the session began |

**Status lifecycle:**

```
prepared → in-progress ⇄ paused → completed
                                      → abandoned
                                      → expired (timeout)
```

## Lifecycle

1. **Create**: `createLearningSession()` builds a session from an objective, skill, mode, and source. Stores via `LearningSessionRepository`.
2. **Start**: user begins → `status` → `'in-progress'`, `startedAt` set.
3. **Generate activity**: `generateLearningActivity()` produces exercises for the session.
4. **Submit answers**: `submitAnswer()` evaluates responses per exercise.
5. **Complete**: `completeLearningSession()` → `status` → `'completed'`, produces `LearningOutcome[]`.
6. **Abandon**: session closed without completion.

## Invariants

- A session belongs to exactly one skill.
- Exercises within a session share the session's `sessionId`.
- A session cannot be completed without all exercises being attempted.
- `plannedDurationMinutes` is set at creation and never mutated.

## Ownership

Domain model owned by `@ielts/learning-engine`. Persistence delegates to `LearningSessionRepository` port (in-memory in tests; IndexedDB via the storage package in production).

## Persistence

Session data is persisted through the learning session repository. The web app's `Database.ts` adapts `@ielts/storage` repositories for session entities (reading, listening, writing, speaking sessions map to legacy table entries).

## Events

- `'learning_session_created'`, `'learning_session_started'`, `'learning_session_paused'`
- `'learning_session_completed'`, `'learning_session_abandoned'`
- Each event carries `sessionId`, `skill`, and correlation ID.

## Duplicate Models

Legacy session tables (`readingSessions`, `listeningSessions`, `writingSessions`, `speakingSessions`) remain in the database for backward compatibility. The new `LearningSession` domain entity is the canonical model going forward. Mappers in `@ielts/shared` (`mapLegacySessionToOutcome`) bridge between old and new.

## Migration Considerations

- New sessions should use the `LearningSession` entity.
- Legacy tables are read-only for history; new writes go through the learning session repository port.
