# Testing

## Commands

| Command | Scope | Description |
|---|---|---|
| `pnpm ai` | Workspace | Runs ALL tests across every package and app (verbose reporter, 2 workers) |
| `pnpm --filter <package> test` | Single package | Runs tests in the specified package |
| `pnpm --filter <package> test -- --watch` | Watch mode | Vitest watch mode for TDD |
| `pnpm --filter <package> test -- --coverage` | Coverage | Run with coverage report |

The `pnpm ai` command is defined in the root `package.json`:

```
"ai": "VITEST_MAX_WORKERS=2 pnpm -r exec -- vitest run --passWithNoTests --reporter verbose"
```

## Test Layers

| Layer | Framework | Location | Purpose |
|---|---|---|---|
| Unit (engine) | Vitest | `packages/<engine>/src/__tests__/` or `src/**/__tests__/` | Test business logic, domain rules |
| Integration (storage) | Vitest + fake-indexeddb | `packages/storage/src/__tests__/` | Test persistence, migrations, queries |
| Component (React) | Vitest + jsdom + testing-library | `apps/web/src/**/__tests__/` | Test React component rendering, user interactions |
| E2E | None configured | — | No E2E framework configured yet |

## Key Test Files

### AI package (`@ielts/ai`)
- `packages/ai/src/__tests__/client.test.ts` — `createAIClient` and `callAI`
- `packages/ai/src/__tests__/services.test.ts` — explain, vocabulary, video, article, dictionary services
- `packages/ai/src/__tests__/adapters.test.ts` — `OpenAIAdapter`
- `packages/ai/src/__tests__/errors.test.ts` — AI error types
- `packages/ai/src/__tests__/utils.test.ts` — utility functions
- `packages/ai/src/__tests__/prompts.test.ts` — prompt templates

### Learning Engine (`@ielts/learning-engine`)
- `packages/learning-engine/src/skills/__tests__/reading-module.test.ts`
- `packages/learning-engine/src/skills/__tests__/vocabulary-module.test.ts`
- `packages/learning-engine/src/domain/policies/__tests__/difficulty-policy.test.ts`
- `packages/learning-engine/src/domain/policies/__tests__/deterministic-grader.test.ts`
- `packages/learning-engine/src/domain/policies/__tests__/evaluation-policy.test.ts`
- `packages/learning-engine/src/domain/services/__tests__/progress-evidence-builder.test.ts`
- `packages/learning-engine/src/domain/services/__tests__/mistake-evidence-builder.test.ts`
- `packages/learning-engine/src/domain/services/__tests__/skill-evidence-builder.test.ts`

### Study Plan (`@ielts/learning-engine` — daily-plan/)
- `packages/learning-engine/src/daily-plan/DailyPlanEngine.test.ts`
- `packages/learning-engine/src/daily-plan/AiPlanOrchestrator.test.ts`
- `packages/learning-engine/src/daily-plan/PlanRegenerator.test.ts`
- `packages/learning-engine/src/daily-plan/PlanEngineIntegration.test.ts`

### Storage (`@ielts/storage`)
- `packages/storage/src/__tests__/youtube-repositories.test.ts` — indexed on Exercise export

### AI Tutor Engine (`@ielts/ai-tutor-engine`)
- No `__tests__` directories found — coverage gap.

## Common Pitfalls

- **fake-indexeddb not clearing between tests**: Call `resetMocks()` or recreate the database in `beforeEach`.
- **jsdom limitations**: `recharts` requires canvas (not available). Mock chart components or test around them.
- **ESLint**: Flat config format used in `apps/web/eslint.config.js`. No per-package ESLint configs.
