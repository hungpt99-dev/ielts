# Adding a Proactive Trigger

The proactive tutor system in `@ielts/ai-tutor-engine` uses triggers to decide when to reach out to the learner.

## Interface

All triggers implement (`packages/ai-tutor-engine/src/proactive/trigger-registry.ts`):

```typescript
interface TriggerHandler {
  triggerType: ProactiveTriggerType    // add new type to the union
  evaluate(params: TriggerEvaluationParams): TriggerPolicyResult
}
```

`ProactiveTriggerType` is defined in `packages/ai-tutor-engine/src/domain/entities/proactive-message.ts` (~50 trigger types exist).

## Steps

### 1. Define the trigger type

Add a new entry to the `ProactiveTriggerType` union in `packages/ai-tutor-engine/src/domain/entities/proactive-message.ts`. Follow the naming convention: `snake_case` describing the event (e.g., `'exam_countdown_milestone'`).

### 2. Create the handler

Location: `packages/ai-tutor-engine/src/proactive/triggers/<trigger-name>.ts`

```typescript
import type { TriggerHandler } from '../trigger-registry'
import type { TriggerEvaluationParams, TriggerPolicyResult } from '../../domain/policies/proactive-trigger-policy'

export class ExamCountdownMilestoneHandler implements TriggerHandler {
  readonly triggerType = 'exam_countdown_milestone' as const

  evaluate(params: TriggerEvaluationParams): TriggerPolicyResult {
    const daysUntilExam = params.learnerState.exam.daysUntilExam
    if (daysUntilExam === null) {
      return { shouldTrigger: false, score: 0, reason: 'No exam date set' }
    }
    // Score higher as exam approaches
    const score = Math.max(0, 100 - daysUntilExam * 2)
    return { shouldTrigger: score > 20, score, reason: `Exam in ${daysUntilExam} days` }
  }
}
```

### 3. Scoring guidelines

Return a `TriggerPolicyResult` with:

- `shouldTrigger: boolean` — whether this trigger fires.
- `score: number` — used for sorting; higher = more urgent.
- `reason: string` — logged for debugging.

### 4. Register in TriggerRegistry

In `packages/ai-tutor-engine/src/proactive/index.ts` (or equivalent wiring):

```typescript
registry.register(new ExamCountdownMilestoneHandler())
```

### 5. Add candidate generation

Define how the proactive message is built from the trigger. This typically happens in `generateProactiveMessages` which receives triggered candidates and produces `ProactiveInterventionCandidate` objects.

### 6. Add constraints

Built-in constraints automatically applied:
- **Quiet hours**: `isInQuietHours()` — no messages during configured quiet period.
- **Cooldown**: minimum interval between messages of same trigger type.
- **Daily limit**: `maxMessagesPerDay` from settings.
- **Deduplication**: `deduplicationKey` prevents identical messages.

### 7. Add tests

Test patterns:
- Trigger fires when condition is met.
- Trigger does not fire when condition is absent.
- Score calculation is correct for edge cases (0 days, null values).
- After registering, the trigger appears in `registry.getAll()` and `registry.evaluateAll()`.

```typescript
test('fires when exam is approaching', () => {
  const handler = new ExamCountdownMilestoneHandler()
  const result = handler.evaluate(mockParams({ daysUntilExam: 30 }))
  expect(result.shouldTrigger).toBe(true)
  expect(result.score).toBeGreaterThan(0)
})
```
