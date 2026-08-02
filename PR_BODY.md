## Summary
Implements per-skill mastery calculation as a pure policy module for the vocabulary engine. Because the dependent types from ENGINEE tasks 2 (MasteryProfile, Interaction, ReviewRecord) and 4 (enums) are not yet in the codebase, they are defined alongside the policy in this module.

## Changes
- `packages/vocabulary-engine/src/domain/policies/MasteryCalculationPolicy.ts`: new pure policy module with:
  - `SKILL` / `MASTERY_SKILLS` / `INTERACTION_TYPE` enums and the `SkillType` / `InteractionType` types
  - `MasteryProfile`, `SkillMasteryState`, `Interaction`, `ReviewRecord` types
  - `calculateMastery(profile, interactions, reviewRecords[, now])` — per-skill scoring with reading/listening based on exposure + review accuracy (audio-based recognition double-counted toward listening), writing/speaking based on usage count + correct-usage ratio, multi-skill usage bonus, 5%-per-30-days inactivity decay, and clamping to [0, 100]
  - `calculateOverallMastery(profile, confidenceScore)` — weighted overall `(reading × 0.20) + (listening × 0.20) + (writing × 0.30) + (speaking × 0.30)` with confidence-score modulation, clamped to [0, 100]
- `packages/vocabulary-engine/src/domain/policies/index.ts`, `src/domain/index.ts`, `src/index.ts`: exported the new policy, enums, and types
- `packages/vocabulary-engine/src/domain/__tests__/MasteryCalculationPolicy.test.ts`: tests covering every acceptance criterion (never-interacted = 0, perfectly acquired = 100, production-weighted scoring, review accuracy, decay, multi-skill bonus, 0-usageCount handling, clamping, overall weights)

## Testing
- `pnpm --filter @ielts/vocabulary-engine exec tsc --noEmit` — passes (strict mode)
- `pnpm --filter @ielts/vocabulary-engine exec vitest run` — 71 tests pass (11 new + 60 existing)

## Risks
- Decay and multi-skill bonus thresholds (20 exposures, 15 usages, 5 pts/skill capped at 10) are heuristics that may need tuning as real usage data arrives.
- The dependent types are defined in this module; if ENGINEE-23 tasks 2/4 land later, they should be re-exported or re-aligned with those canonical definitions to avoid duplication.
- `confidenceScore` modulates the overall by up to ±5%; neutral (0.5) reproduces the plain weighted formula.
