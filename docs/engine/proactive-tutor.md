# Proactive Tutor

The proactive tutor surfaces timely interventions (reminders, encouragement, study suggestions) without the learner initiating contact.

## Pipeline

```
Learner State Snapshot
        │
        ▼
   TriggerRegistry.evaluateAll()
   (all triggers run; scored ≥ threshold pass)
        │
        ▼
   Cooldown Check (per-trigger + global)
        │
        ▼
   MessageGeneratorRegistry.generateForTrigger()
   (one generator per triggered type)
        │
        ▼
   Intervention Scoring (calculateInterventionScore)
        │
        ▼
   Selection (selectBestInterventions)
   (top N by score, respecting daily limit)
        │
        ▼
   Deduplication (filterDuplicates)
        │
        ▼
   ProactiveMessage[]
```

## Triggers

Registered via `TriggerRegistry` (`trigger-registry.ts:9`). Each `TriggerHandler` implements:

```typescript
interface TriggerHandler {
  triggerType: ProactiveTriggerType
  evaluate(params: TriggerEvaluationParams): TriggerPolicyResult
}
```

`evaluateAll` (`trigger-registry.ts:24`) runs all handlers, filters to those where `shouldTrigger` is true, sorts by score descending.

## Candidate Generation

`MessageGeneratorRegistry` (`message-generator-registry.ts:10`) maps trigger types to message generators:

```typescript
interface MessageGenerator {
  triggerType: ProactiveTriggerType
  category: ProactiveCategory
  generate(state: LearnerStateSnapshot): ProactiveInterventionCandidate | null
}
```

`createDefaultGenerators` (`proactive/default-generators.ts`) provides pre-built generators:

| Generator | Trigger | Category | When |
|---|---|---|---|
| Vocabulary Review | `vocabulary_review_due` | `vocabulary-review` | Due vocab > 0 |
| Mistake Review | `due_review_not_completed` | `mistake-review` | Unreviewed mistakes > 0 |
| Inactivity | `long_inactivity` | `motivation` | Inactive > 2 days |
| Exam Approaching | `exam_approaching` | `exam-countdown` | ≤ 30 days to exam |
| Study Streak | `study_streak_achieved` | `motivation` | Streak ≥ 3 days |
| Accuracy Decline | `low_accuracy_trend` | `progress-report` | Declining trend |
| Missed Days | `missed_study_days` | `study-plan` | Consecutive missed |
| New Content | `new_content_available` | `saved-content` | Saved items unread |
| Progress Milestone | `progress_milestone` | `progress-report` | Completion milestone |
| Daily Reminder | `daily_study_reminder` | `study-plan` | No activity today |

## Scoring / Intervention Scoring

`calculateInterventionScore` (`domain/policies/recommendation-priority-policy.ts`) produces a `0-1` score based on:

- Urgency of trigger
- Learner's current engagement
- Historical effectiveness (not yet implemented — scoring is rule-based)

`selectBestInterventions` ranks candidates by score and selects the top N, respecting `maxMessagesPerDay`.

## Cooldown Policy

`cooldown-policy.ts` prevents message flooding:

- **Global cooldown**: 60s between any messages (default)
- **Per-trigger cooldown**: Configurable per trigger type
  - `long_inactivity`: 24h
  - `exam_approaching`: 24h
  - `study_streak_achieved`: 24h
  - `vocabulary_review_due`: 12h
  - `due_review_not_completed`: 12h

`evaluateCooldown` (`cooldown-policy.ts:22`) checks both global and per-trigger cooldown states.

## Quiet Hours

`quiet-hours-policy.ts` suppresses proactive messages during configurable hours:

- Default: 22:00 – 08:00
- Handles overnight periods (start > end means spans midnight)
- `isInQuietHours` returns boolean; `getQuietHoursRemainingMs` returns time until end

## Deduplication

`duplicate-message-policy.ts` prevents sending the same message twice:

- `isDuplicate` checks by `deduplicationKey` against recent messages
- `filterDuplicates` filters a candidate list against a baseline

Deduplication is based on `${triggerType}-${category}` as the default deduplication key.

## Settings

Stored in `tutor-settings-repository.ts`. Default settings (`engineBootstrap.ts:249-268`):

| Setting | Default | Description |
|---|---|---|
| `enabled` | `true` | Master toggle |
| `browserNotifications` | `false` | Browser notification delivery |
| `extensionNotifications` | `false` | Extension notification delivery |
| `aiEnhanced` | `false` | AI-generated messages |
| `quietHoursStart` | `22:00` | Quiet hours start |
| `quietHoursEnd` | `08:00` | Quiet hours end |
| `maxMessagesPerDay` | `5` | Daily message cap |
| `minIntervalMinutes` | `60` | Minimum interval between messages |
| `categories` | `{}` | Per-category enable/disable |

## Duplicate Engines

The proactive system has two parallel implementations:

### New: Application Layer (`proactive/` + `application/proactive/`)

- `ProactiveTutorOrchestrator` (`proactive/proactive-tutor-orchestrator.ts:11`) — Full pipeline with trigger registry, generator registry, cooldown, quiet hours, dedup, scoring
- `generateProactiveMessages` (`application/proactive/generate-proactive-messages.ts`) — Orchestrator wrapper used by `AITutorEngineImpl.evaluateProactiveSupport`
- `CachedProactiveEvaluator` (`proactive/cached-proactive-evaluator.ts`) — Cached evaluation wrapper

Used by: `AITutorEngineImpl` (`engine-impl.ts:105-126`), `handleLearningEvent` (`engine-impl.ts:164-217`)

### Legacy: `services/` directory

- `services/proactiveMessageEngine.ts` — Legacy engine with `ProactiveEngineInput` types, delegates to new orchestrator but has its own input format and mapping layer
- `services/proactiveEventBus.ts` — Event-driven dispatching for proactive messages
- `services/messageStorage.ts` — UI-driven proactive message storage

Used by: Older web app hooks (re-exported from `index.ts:119-122`)

Both paths ultimately call the same application-layer `generateProactiveMessages`, but through different interfaces and mapping layers.

## Current Delivery

The web app delivers proactive messages through the **`NotificationCenter`** component. It:

1. Queries `getAITutorEngine()?.evaluateProactiveSupport()` (or uses legacy `proactiveEventBus`)
2. Displays selected messages in the notification drawer
3. Tracks dismissal/read status via `localStorage` or `DatabaseService`

Quiet hours are checked both server-side (in the orchestrator) and client-side (in the delivery component).

## Quiet Hours Integration

Quiet hours are enforced at two levels:

1. **Engine level** — `ProactiveTutorOrchestrator.evaluate()` (`proactive-tutor-orchestrator.ts:33`) returns empty result during quiet hours
2. **Delivery level** — `NotificationCenter` checks `isInQuietHours` before showing messages

The `AITutorEngineImpl.handleLearningEvent` also checks settings before generating proactive responses to learning events (`engine-impl.ts:184-204`).
