# Current State Analysis

## Duplicate Exercise Models

Three separate exercise models exist:

| Location | Type | Path |
|---|---|---|
| `@ielts/shared` | `ExerciseQuestion` (discriminated union) | `packages/shared/src/exercise-question.ts` |
| `@ielts/learning-engine` | Re-exports from `@ielts/shared` | `packages/learning-engine/src/domain/entities/exercise-question.ts` |
| `@ielts/storage` | `exerciseEntrySchema` (flat Zod object) | `packages/storage/src/schema.ts:603` |

**Impact**: The storage schema's `exerciseEntrySchema` stores questions as a JSON string (`content: string`, `questions: string`), losing the typed structure from `@ielts/shared`. The learning engine uses the canonical `ExerciseQuestion` union type.

## Duplicate AI Clients/Services

| Location | Role | Path |
|---|---|---|
| `@ielts/ai` | `AIAdapter` + `callAI` + service functions (explain, vocabulary, video, article, dictionary) | `packages/ai/src/` |
| `apps/web` | `engineBootstrap.ts` has inline `createAIClient()` wrapping `callAI` | `apps/web/src/services/engineBootstrap.ts:19` |
| `apps/web` | AIService.ts (referenced in verified facts, exact path TBD) | — |
| `apps/extension` | `aiEnrichmentService.ts` (extension-specific) | — |
| `@ielts/learning-engine` | `TutorIntelligencePort` wrapping `callAI` | — |
| `@ielts/ai-tutor-engine` | `services/` directory (legacy) alongside `ports/` (hexagonal) | `packages/ai-tutor-engine/src/services/` |

**Impact**: Multiple wrappers around the same `callAI` function. Inconsistent error handling. Extension bypasses `@ielts/ai` in some paths.

## Duplicate Exercise Generation

The `@ielts/learning-engine` has all 6 `SkillModule` implementations (reading, listening, writing, speaking, vocabulary, grammar) with `generateActivity` methods, but feature components in `apps/web` still have hardcoded exercise generation logic. The learning engine's skill modules are registered in `SkillRegistry` but are not yet consumed by web feature components.

## Missing AI Evaluation Integration

Writing and speaking feature components in `apps/web` have `__tests__` directories that reference evaluation scenarios, but no actual AI evaluation integration exists. The `WritingSkillModule.evaluate` and `SpeakingSkillModule.evaluate` are currently heuristic-only (word count, response length), with `evaluationPolicy: 'ai-assisted'` as a flag but no AI call.

## Profile-Awareness Gaps

- `engineBootstrap.ts` builds a partial `LearnerContext` from localStorage settings.
- Target is a full `LearnerStateSnapshot` from all sources (profile, progress, mistakes, vocabulary, activity).
- The `LearnerContextBuilder` exists in `@ielts/ai-tutor-engine` but is not fully wired.

## Empty Skill Module Structures

All 6 skill modules have the `LearningSkillModule` shape (`supports`/`generateActivity`/`evaluate`/`createReview`), but several have template-only generation and heuristic-only evaluation:

| Module | Generation | Evaluation |
|---|---|---|
| Reading | Template passages + questions | Deterministic (`gradeAnswer`) |
| Listening | Template transcripts + questions | Deterministic (`gradeAnswer`) |
| Writing | Template prompts | Heuristic (word count) |
| Speaking | Template prompts | Heuristic (word count) |
| Vocabulary | Hardcoded question bank | Deterministic (`gradeAnswer`) |
| Grammar | Hardcoded question bank | Deterministic (`gradeAnswer`) |

## Test Coverage Gaps

| Area | Coverage |
|---|---|
| `@ielts/ai` | Good — 7 test files covering client, services, errors, adapters |
| `@ielts/learning-engine` | Moderate — 4 domain tests + 2 skill module tests |
| `@ielts/ai-tutor-engine` | **None** — no `__tests__` directories found |
| `@ielts/storage` | Partial — youtube-repositories.test.ts |
| `apps/web` features | **Limited** — evaluation tests exist but no AI integration |
| `apps/extension` | **None** |

## Direct AI Calls

The `engineBootstrap.ts` inline `createAIClient()` calls `callAI` directly rather than using `@ielts/ai`'s `createAIClient` factory, bypassing the provider adapter layer.

## Extension Storage Duplication

The extension has its own IndexedDB adapter with engine adapters (`apps/extension/src/storage/engine-adapters/`) separate from `@ielts/storage`. This means the extension maintains its own database tables and migration logic.

## Settings Fragmentation

Settings are stored in three places:
- `localStorage['ielts-settings']` — legacy
- `@ielts/settings` package — current (basic/advanced configuration)
- `chrome.storage` — extension-specific
