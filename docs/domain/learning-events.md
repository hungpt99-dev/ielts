# Learning Events

## Purpose

Event-driven communication between domains. Learning events capture meaningful actions and state changes for persistence, analytics, tutor context building, and proactive message triggering.

## Event Definitions

Three event systems exist, each in its own package:

### SharedLearningEvent (`@ielts/shared`)

Cross-package contract. Used for inter-engine communication.

| Field | Description |
|---|---|
| `type` | `SharedLearningEventType` (30+ event types) |
| `source` | `'web-app' \| 'extension' \| 'ai-tutor' \| 'roadmap' \| 'vocabulary' \| 'mistakes' \| 'dashboard' \| 'learning-engine' \| 'study-plan'` |
| `occurredAt` | ISO timestamp |
| `id` | UUID |
| `correlationId` | Optional trace ID |
| `schemaVersion` | Currently `'1.0'` |

Subtypes: `SessionEvent`, `ExerciseEvent`, `MistakeEvent`, `TaskEvent`, `VocabularyEvent`, and inline types for `answer_evaluated`, `skill_improved`, `difficulty_changed`, `roadmap_task_fulfilled`, `writing_reviewed`, etc.

### LearningEvent (`@ielts/learning-engine`)

Internal events for the learning engine domain.

| Events | Description |
|---|---|
| `learning_session_*` | Session lifecycle (created, started, paused, completed, abandoned) |
| `exercise_generated` / `exercise_completed` | Exercise progress |
| `answer_evaluated` | Per-question evaluation |
| `mistake_detected` / `mistake_repeated` | Mistake tracking |
| `skill_improved` / `difficulty_changed` | Progress transitions |
| `roadmap_task_fulfilled` | Task completion from session |

### TutorEvent (`@ielts/ai-tutor-engine`)

Internal events for the tutor domain.

| Events | Description |
|---|---|
| `proactive_message_*` | Proactive message lifecycle (generated, shown, dismissed, clicked, expired) |
| `tutor_chat_started` / `tutor_chat_message_sent` | Chat session events |
| `tutor_memory_updated` | Memory changes |
| `tutor_recommendation_made` | Recommendation produced |
| `next_best_action_selected` | Action chosen by policy |

## Event Bus

The web app has a concrete `LearningEventBus` singleton:

1. `emitLearningEvent(input)` → validates event type, persists via `learningEventRepository` to IndexedDB `learningEvents` table, dispatches to in-memory subscribers.
2. Subscribers can be registered via `subscribe()`.
3. Persistence stores events with `syncStatus` (`'local_only' \| 'synced'`) for future sync capability.
4. The `learningEvents` table was added in schema v7.

## Consumption

- **Proactive engine**: `ProactiveTutorOrchestrator` listens for events to trigger interventions.
- **Tutor context**: `handleLearningEvent()` on `AITutorEngine` feeds events into tutor memory.
- **Progress tracking**: events flow into progress evidence builders.
- **Analytics**: event history supports streak tracking, consistency metrics, and milestone detection.

## Invariants

- Each event has exactly one `type`.
- `source` is the producing subsystem, not the observer.
- `schemaVersion` enables forward-compatible schema evolution.
- Events are immutable after creation.

## Duplicate Models

- The learning engine's `LearningEvent` and the shared `SharedLearningEvent` overlap in purpose. The shared variant is the canonical cross-package contract; engine-specific events are mapped to shared events via `createSharedEvent()`.
- `TutorEvent` is separate and only used within the AI tutor engine.

## Migration Considerations

- v7 added the `learningEvents` table to IndexedDB — existing databases get the new table on upgrade.
- Events in the table are append-only; there is no event deletion strategy yet.
- Future: may add event TTL and auto-cleanup for events older than N days.
