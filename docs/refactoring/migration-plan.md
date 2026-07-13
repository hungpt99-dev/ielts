# Migration Plan

Incremental phases. No big-bang rewrites. Each phase is independently verifiable.

---

## Phase 1: Document and Audit

**Goal**: Establish baseline of all duplicate code and data paths.

| Item | Detail |
|---|---|
| Prerequisites | None |
| Files affected | Documentation only |
| Compatibility | No code changes |
| Tests required | None |
| Completion criteria | All 17 refactoring documents written and accurate |
| Rollback | No code changes — just revert doc changes |

---

## Phase 2: Consolidate Shared Types

**Goal**: Single `ExerciseQuestion` model in `@ielts/shared`. Storage schema maps to typed model.

| Item | Detail |
|---|---|
| Prerequisites | Phase 1 complete |
| Files affected | `packages/shared/src/exercise-question.ts`, `packages/storage/src/schema.ts`, `packages/storage/src/repositories/ContentRepository.ts`, `packages/learning-engine/src/domain/entities/exercise-question.ts` |
| Compatibility | Add storage adapter that converts between flat schema and typed union. Existing storage queries continue to work. |
| Tests required | Storage adapter round-trip test (typed → flat → typed). All existing tests must pass. |
| Completion criteria | `exerciseEntrySchema` stores questions as typed JSON; `ContentRepository` returns typed `ExerciseQuestion[]` |
| Rollback | Revert storage adapter; old flat JSON keeps working |

---

## Phase 3: Adopt Learning Engine in One Feature

**Goal**: One web feature component uses `LearningEngine.generateActivity()` instead of hardcoded logic.

| Item | Detail |
|---|---|
| Prerequisites | Phase 2 complete |
| Files affected | One web feature component (e.g., vocabulary), engine wiring in `engineBootstrap.ts` |
| Compatibility | Feature component gets activity from engine when available, falls back to hardcoded logic (legacy path removed in Phase 6) |
| Tests required | Feature component + engine integration test |
| Completion criteria | Feature generates identical or richer exercises via engine |
| Rollback | Revert component to use hardcoded logic |

---

## Phase 4: Adopt AI Tutor Engine Fully

**Goal**: Writing/Speaking AI evaluation uses `AITutorEngine`'s skill tutor modules. All AI paths through `@ielts/ai`.

| Item | Detail |
|---|---|
| Prerequisites | Phase 2 complete |
| Files affected | `apps/web/src/services/engineBootstrap.ts`, writing/speaking feature components, `@ielts/ai` client exports |
| Compatibility | Replace inline `createAIClient` in `engineBootstrap.ts` with `@ielts/ai`'s `createAIClient`. Add `TutorIntelligencePort` adapters. |
| Tests required | AI evaluation integration test with mocked `callAI` responses |
| Completion criteria | Writing/Speaking evaluation triggers AI call; no direct `callAI` calls from app code |
| Rollback | Restore inline AI client |

---

## Phase 5: Consolidate Storage

**Goal**: Extension uses `@ielts/storage` instead of its own IndexedDB + engine adapters.

| Item | Detail |
|---|---|
| Prerequisites | Phase 3 complete |
| Files affected | `apps/extension/src/storage/engine-adapters/*`, `apps/extension/src/storage/*` |
| Compatibility | Extension adapters become thin wrappers calling `@ielts/storage` repositories. Data migrated or read-compatible. |
| Tests required | Extension repository integration tests with `fake-indexeddb` |
| Completion criteria | Extension persistence flows through `@ielts/storage` |
| Rollback | Keep extension adapters as fallback |

---

## Phase 6: Remove Legacy Code

**Goal**: Remove all identified duplicate/modules, deprecated interfaces, legacy services.

| Item | Detail |
|---|---|
| Prerequisites | Phases 2-5 complete, all consumers migrated |
| Files affected | Deprecated `@ielts/ai-tutor-engine/src/services/*`, legacy `proactiveMessageEngine`, extension adapters after consolidation, hardcoded exercise generation in web features |
| Compatibility | Remove legacy code after verifying zero internal consumers. Add deprecation warnings one release before removal. |
| Tests required | All existing tests pass after removal |
| Completion criteria | No duplicate models, no duplicate AI clients, no hardcoded exercise generation, all storage through `@ielts/storage` |
| Rollback | Revert removal commits (legacy code is deleted, not modified) |
