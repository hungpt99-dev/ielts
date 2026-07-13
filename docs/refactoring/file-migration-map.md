# File Migration Map

> `Action` column: Keep | Split | Convert | Migrate | Deprecate | Remove after migration | Needs verification

| Current file | Current role | Target role | Action |
|---|---|---|---|
| `packages/shared/src/exercise-question.ts` | Canonical `ExerciseQuestion` typed union | Keep as single source of truth | **Keep** |
| `packages/learning-engine/src/domain/entities/exercise-question.ts` | Re-exports from `@ielts/shared` | Remove after learning engine imports directly | **Remove after migration** |
| `packages/storage/src/schema.ts:603` (`exerciseEntrySchema`) | Flat Zod schema (questions as string) | Schema with typed questions field | **Migrate** |
| `packages/storage/src/repositories/ContentRepository.ts` | CRUD for exercise entries | Adapter layer between typed domain and flat storage | **Migrate** |
| `packages/ai/src/client/index.ts` (`createAIClient`, `callAI`) | Canonical AI client | Keep as single AI entry point | **Keep** |
| `packages/ai/src/adapters/openai.ts` | OpenAI provider implementation | Keep, add more adapters alongside | **Keep** |
| `packages/ai/src/errors/types.ts` | AI error types | Keep | **Keep** |
| `apps/web/src/services/engineBootstrap.ts:19` (inline `createAIClient`) | Wraps `callAI` directly | Use `@ielts/ai`'s `createAIClient` | **Migrate** |
| `apps/extension/src/services/aiEnrichmentService.ts` | Extension-specific AI wrapper | Use `@ielts/ai`'s `callAI` | **Convert** |
| `packages/learning-engine/src/skills/*/` | 6 skill modules | Keep, enrich with AI evaluation | **Keep** |
| `apps/web/src/features/reading/*` | Hardcoded reading exercises | Use `LearningEngine.generateActivity()` | **Convert** |
| `apps/web/src/features/listening/*` | Hardcoded listening exercises | Use `LearningEngine.generateActivity()` | **Convert** |
| `apps/web/src/features/writing/*` | Hardcoded writing prompts | Use `LearningEngine.generateActivity()` | **Convert** |
| `apps/web/src/features/speaking/*` | Hardcoded speaking prompts | Use `LearningEngine.generateActivity()` | **Convert** |
| `apps/web/src/features/grammar/*` | Hardcoded grammar exercises | Use `LearningEngine.generateActivity()` | **Convert** |
| `apps/web/src/features/vocabulary/*` | Hardcoded vocabulary exercises | Use `LearningEngine.generateActivity()` | **Convert** |
| `packages/ai-tutor-engine/src/ports/` | Hexagonal ports (new) | Keep, expand | **Keep** |
| `packages/ai-tutor-engine/src/services/` | Legacy services | Deprecate, then remove | **Deprecate → Remove after migration** |
| `packages/ai-tutor-engine/src/proactive/proactive-tutor-orchestrator.ts` | New proactive implementation | Keep as canonical | **Keep** |
| `packages/ai-tutor-engine/src/proactive/legacy/` (proactiveMessageEngine) | Legacy proactive implementation | Deprecate, then remove | **Deprecate → Remove after migration** |
| `apps/extension/src/storage/engine-adapters/` | Extension-specific persistence layer | Remove after extension uses `@ielts/storage` | **Remove after migration** |
| `apps/extension/src/storage/` | Extension IndexedDB setup | Remove after extension uses `@ielts/storage` | **Remove after migration** |
| `packages/storage/src/schema.ts` | All table schemas | Keep, add extension tables if missing | **Keep** |
| `packages/storage/src/repositories/` | Repository implementations | Keep, expand for extension needs | **Keep** |
| `packages/learning-engine/src/daily-plan/` | `DailyPlanEngine` (planning) | Could become separate `@ielts/study-plan-engine` | **Needs verification** |
