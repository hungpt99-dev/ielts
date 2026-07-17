# Gap Analysis

| Area | Current State | Target State | Gap | Priority |
|---|---|---|---|---|
| **Exercise model** | 3 models: `@ielts/shared` (typed union), `@ielts/learning-engine` (re-export), `@ielts/storage` (flat Zod) | Single `ExerciseQuestion` in `@ielts/shared`, storage adapts via schema | Storage schema is flat and loses type structure | **High** |
| **AI client** | `@ielts/ai` (canonical), `engineBootstrap.ts` (inline wrapper), extension (`aiEnrichmentService.ts`), engine wrappers | All AI through `@ielts/ai` `createAIClient` / `callAI` | 4+ paths bypass canonical client | **High** |
| **Exercise generation** | 6 `SkillModule.generateActivity` in engine + hardcoded in web feature components | All feature components use `LearningEngine.generateActivity()` | Web components duplicate engine logic | **High** |
| **Writing/Speaking evaluation** | Heuristic-only (word count), `evaluationPolicy: 'ai-assisted'` not wired | AI-powered evaluation via `AITutorEngine` | No AI integration; flag exists but unused | **High** |
| **Persistence** | `@ielts/storage` (canonical) + extension's own IndexedDB + engine adapters | All persistence through `@ielts/storage` only | Extension maintains separate DB layer | **High** |
| **Settings** | `localStorage` (legacy), `@ielts/settings`, `chrome.storage` (extension) | Single settings flow through `@ielts/storage` | 3 storage locations, partial migration | **Medium** |
| **Learner context** | `engineBootstrap.ts` builds partial context; `LearnerContextBuilder` exists but not fully wired | Full `LearnerStateSnapshot` from all sources | Context sources missing/incomplete | **High** |
| **Proactive tutor** | 2 implementations: `ProactiveTutorOrchestrator` + legacy `proactiveMessageEngine` | Single `ProactiveTutorOrchestrator` as the authoritative implementation | Legacy code already removed; only ProactiveTutorOrchestrator remains | **Completed** |
| **AI Tutor Engine architecture** | Both `ports/` (hexagonal new) and `services/` (legacy) directories coexist | Fully hexagonal, no legacy services | Legacy services/ already removed; empty directories cleaned up | **Completed** |
| **Study Plan placement** | `DailyPlanEngine` in `@ielts/learning-engine` | Separate `StudyPlanEngine` concept | Conceptually distinct but code is in learning engine package | **Low** |
| **Test coverage (web)** | Limited — evaluation tests exist but no AI integration | All feature components covered | Written features lack component tests | **Medium** |
| **Test coverage (AI Tutor Engine)** | No test files found | Engine has test coverage | Complete gap | **High** |
| **Test coverage (extension)** | No test files found | Extension has test coverage | Complete gap | **Low** |
| **Direct AI calls** | `engineBootstrap.ts` calls `callAI` directly instead of `createAIClient` | All calls through `@ielts/ai`'s official client | Bypasses provider adapter layer | **Medium** |

## Priority Legend

- **High**: blocks correctness, causes data duplication, introduces regressions.
- **Medium**: architectural debt, maintainability issue, partial feature gap.
- **Low**: nice-to-have, cosmetic, or could be addressed post-migration.
