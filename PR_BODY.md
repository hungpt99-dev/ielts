## Summary

Implement the enhanced SM-2+ spaced repetition algorithm as a pure policy module in the vocabulary engine, replacing the legacy `apps/web/src/utils/spaced-repetition.ts` behaviour with a domain policy that also tracks response time, self-reported confidence, per-word difficulty, memory stability, contextual production boosts, and recall probability prediction.

## Changes

- `packages/vocabulary-engine/src/domain/policies/SpacedRepetitionPolicy.ts` (new)
  - `calculateNextReview(currentSR, rating, responseTimeMs?, confidenceScore?, context?, now?)` — preserves the legacy SM-2 core (AGAIN/HARD/GOOD/EASY intervals and ease-factor rules) while layering on:
    - Response time modulation: fast recall lengthens the interval and lowers difficulty, slow recall does the opposite.
    - Confidence weighting: self-reported score in `[0, 1]` scales both the interval growth and the ease-factor delta.
    - `stability` metric (novelty-based memory strength, scales with interval) and per-word `difficulty` in `[0, 1]`.
    - Contextual production boost: `WRITING`/`SPEAKING` reviews multiply the interval by 1.5x (AGAIN resets are exempt).
    - Guaranteed monotonic interval growth for consistent GOOD ratings; ease factor clamped to `[1.3, ∞)`; intervals capped at 36500 days.
  - `getDueReviewQueue(srInfos, limit?)` — returns items due by start of today, sorted oldest-first, honouring an optional limit.
  - `predictRecallProbability(srInfo, targetDate)` — exponential forgetting-curve retention prediction from `stability`.
  - `REVIEW_RATING` / `REVIEW_CONTEXT` enum-style consts and `ReviewRating` / `ReviewContext` / `SpacedRepetitionInfo` / `ReviewHistoryEntry` types.
  - With default params (neutral response time 2500ms, neutral confidence 0.5, `FLASHCARD` context) the legacy SM-2 results are reproduced exactly.
- `packages/vocabulary-engine/src/domain/policies/index.ts`, `.../domain/index.ts`, `.../src/index.ts` — re-export the new policy, types and enums.
- `packages/vocabulary-engine/src/domain/__tests__/SpacedRepetitionPolicy.test.ts` (new) — 34 tests covering legacy reproduction, response time, confidence, production boost, monotonic intervals, first-review / >365-day edge cases, the due queue, and recall prediction.

## Testing

- `pnpm --filter @ielts/vocabulary-engine exec tsc --noEmit` — passed.
- `pnpm --filter @ielts/vocabulary-engine test` — 60/60 tests passed (34 new + 26 existing lifecycle).
- Legacy behaviour verified against the numeric expectations in `apps/web/src/utils/spaced-repetition.test.ts` (1/4/6/15-day intervals, 2.3/2.35/2.5/2.65 ease factors).

## Risks

- The legacy `apps/web/src/utils/spaced-repetition.ts` is intentionally untouched (this issue only introduces the replacement module); migration of the web app to this policy is a follow-up.
- `SpacedRepetitionInfo` and `ReviewRating` are defined locally pending Tasks 2 (entities) and 4 (enums); they should be re-homed there when those land. Dates use `Date` objects rather than ISO strings, so persistence adapters must map when wiring to the storage schema.
- Difficulty/stability constants (response 0.8–1.2 modulation, stability scale 10) are reasonable defaults and may need calibration against real learner data.
