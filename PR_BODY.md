## Summary

Scaffolds the new `@ielts/vocabulary-engine` workspace package with complete tooling configuration (package.json, TypeScript, Vitest + coverage thresholds) and a barrel entry point, ready for vocabulary domain work in follow-up issues.

## Changes

- `packages/vocabulary-engine/package.json` — new private workspace package with `@ielts/storage`, `@ielts/ai`, `@ielts/config`, `@ielts/shared` workspace dependencies; typescript, vitest, and `@vitest/coverage-v8` devDependencies (coverage-v8 pinned to match vitest 3.2.6)
- `packages/vocabulary-engine/tsconfig.json` — extends `tsconfig.base.json`, strict mode preserved, `rootDir` overridden to the package's `src`, `noEmit` typecheck config
- `packages/vocabulary-engine/vitest.config.ts` — jsdom environment, globals, coverage via v8 provider with thresholds (90% lines, 85% branches)
- `packages/vocabulary-engine/src/` — directory skeleton (`domain/`, `application/`, `ports/`, `infrastructure/`, `schemas/`) with `.gitkeep` placeholders
- `packages/vocabulary-engine/__tests__/` — root test directory (`.gitkeep`)
- `packages/vocabulary-engine/src/index.ts` — barrel entry point; public API to be exported as layers are implemented
- `apps/web/tsconfig.app.json` — added `@ielts/vocabulary-engine` and `@ielts/vocabulary-engine/*` path mappings
- `vitest.config.ts` — registered `packages/vocabulary-engine/vitest.config.ts` as a vitest project
- `pnpm-lock.yaml` — regenerated to include the new workspace package and `@vitest/coverage-v8`

## Testing

- `pnpm install` — succeeded, workspace linked
- `pnpm --filter @ielts/vocabulary-engine exec tsc --noEmit` — passed
- `pnpm --filter @ielts/vocabulary-engine test` — passed (no tests yet, exits 0 with `--passWithNoTests`)
- `pnpm exec vitest run --project '@ielts/vocabulary-engine'` — project registered and runs
- `pnpm --filter @ielts/web typecheck` — passed (no app behavior changed)
- `pnpm --filter @ielts/vocabulary-engine exec vitest run --coverage` — exits 1 by design (0% coverage on empty suite fails the 90%/85% thresholds); coverage enforcement will engage once tests exist

## Risks

- Coverage thresholds will fail CI runs that pass `--coverage` until the package gains source and tests; the default `test` script does not enable coverage
- `@vitest/coverage-v8` pinned to 3.2.6 to match the workspace vitest resolution; keep in lockstep on future upgrades
- No existing app behavior touched — only additive path mappings and a new vitest project
