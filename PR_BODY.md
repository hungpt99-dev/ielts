## Summary
Implement the vocabulary lifecycle state machine as a pure policy module in `@ielts/vocabulary-engine`. `determineNextLifecycle` computes the next `LifecyclePhase` from a trigger and transition context with no side effects or I/O.

## Changes
- `src/domain/constants/lifecycle-phase.ts` — `LIFECYCLE_PHASE` const map and `LifecyclePhase` union type (`DISCOVERED | LEARNING | PRACTICING | REVIEWING | USING | MASTERED`).
- `src/domain/constants/index.ts` — re-exports lifecycle phase constants.
- `src/domain/policies/LifecyclePolicy.ts` — `determineNextLifecycle(currentPhase, trigger, context)` returning a discriminated `LifecycleTransitionResult` (`transitioned` | `no-op` | `invalid`); implements all 8 transition rules:
  - `DISCOVERED → LEARNING`, `LEARNING → PRACTICING`, `PRACTICING → REVIEWING`, `REVIEWING → USING`
  - `USING → MASTERED` (mastery ≥ 90 AND 3+ correct productions)
  - any `→ LEARNING` (3 consecutive `again` ratings)
  - `MASTERED → REVIEWING` (30+ days), any `→ DISCOVERED` (90+ days)
- `src/domain/policies/index.ts` — policy re-exports (`LifecycleTrigger`, `TransitionContext`, `LifecycleTransitionResult`).
- `src/domain/index.ts`, `src/index.ts` — public API exports for the policy and phase constants.
- `src/domain/__tests__/LifecyclePolicy.test.ts` — 26 unit tests covering all transition rules, regression path from every state, forgotten/maintenance inactivity, and edge cases (no-op when already at target, invalid transitions, purity).

## Testing
- `pnpm --filter @ielts/vocabulary-engine exec tsc --noEmit` — passes (strict mode).
- `pnpm --filter @ielts/vocabulary-engine test` — 1 file, 26 tests passed.

## Risks
- `LifecyclePhase` is defined here (in `domain/constants`) as Task 4 (enums) is not yet merged; Task 4 may need to reconcile/own this definition.
- `CORRECT_USAGE`/forward triggers from phases they don't apply to return `invalid`; callers must route events through the state machine rather than applying triggers blindly.
- None known otherwise.
