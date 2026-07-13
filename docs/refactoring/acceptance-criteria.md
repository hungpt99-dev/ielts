# Acceptance Criteria

Measurable completion criteria for the refactoring effort.

## Core Criteria (all must pass)

| # | Criterion | Verification |
|---|---|---|
| 1 | All 6 skill modules (reading, listening, writing, speaking, vocabulary, grammar) are adopted by `apps/web` feature components. No feature component generates exercises outside the engine. | `grep -r "generateActivity\|generateExercise" apps/web/src/features/` returns hits only in engine wrapper calls. |
| 2 | Single exercise model in `@ielts/shared`. Both `@ielts/learning-engine` and `@ielts/storage` use the canonical `ExerciseQuestion` type. | `packages/learning-engine/src/domain/entities/exercise-question.ts` removed (imports directly from shared). `exerciseEntrySchema` stores typed questions. |
| 3 | Single AI service path through `@ielts/ai`. No app or extension code calls `callAI` directly or creates its own AI client. | `grep -r "callAI" apps/` only hits in `engineBootstrap.ts` (legacy) and engine packages that depend on `@ielts/ai` legitimately. |
| 4 | `LearningEngine` used by all practice features in `apps/web`. | Every practice component (`Reading`, `Listening`, `Writing`, `Speaking`, `Grammar`, `Vocabulary`) calls `getLearningEngine()?.generateActivity()`. |
| 5 | `AITutorEngine` used by all tutor features (writing review, speaking evaluation, explain, etc.). | Feature components call `getAITutorEngine()` for AI evaluation/explanation flows. |
| 6 | `@ielts/storage` is the sole persistence layer. Extension does not maintain its own IndexedDB. | `apps/extension/src/storage/engine-adapters/` directory removed or converted to `@ielts/storage` wrappers. |
| 7 | No duplicate AI clients exist. Inline `createAIClient` in `engineBootstrap.ts` replaced with `@ielts/ai`'s factory. | Search for "function createAIClient" in `apps/` returns zero results. |
| 8 | All existing tests pass. | `pnpm ai` exits with code 0. |
| 9 | No regressions in offline mode. | Offline test: load app, disconnect network, complete a practice session, reconnect, verify data synced. |
| 10 | No regressions in AI-assisted features. | AI evaluation returns same or better quality feedback compared to pre-migration heuristic + AI hybrid. |

## Quality Criteria

| # | Criterion | Measurement |
|---|---|---|
| 11 | LRU cache hit rate for AI-generated exercises > 60% | Cache metrics logged in `@ielts/ai` |
| 12 | Learner context completeness > 80% (all 9 sources populated) | `ContextQuality.status` should be `'complete'` or `'partial'` for most users |
| 13 | Extension and web produce consistent learner state | Compare `LearnerStateSnapshot` from both after same activity |
| 14 | Zero `any` types in new/modified code | ESLint `@typescript-eslint/no-explicit-any`: no warnings |
| 15 | AI evaluation tests cover both success and failure paths | Test coverage > 80% for evaluation branches |
