## Summary

Consolidate the web app's duplicated SM-2 spaced-repetition algorithm onto the canonical `@ielts/vocabulary-engine` policy so the engine becomes the single source of truth for vocabulary review scheduling across the platform. This is the next step in the Vocabulary Learning Engine platform refactor umbrella (ENGINEE-16), following the engine package creation (ENGINEE-163) and platform bootstrap — eliminating the third copy of the review algorithm and declaring the previously-missing dependency.

## Changes

- **apps/web/src/utils/spaced-repetition.ts** — replaced the web-local copy of `getInitialReviewEntry`, `calculateNextReview`, and `getDailyReviewQueue` (a byte-identical duplicate of the engine's SM-2 policy) with re-exports from `@ielts/vocabulary-engine`. All existing consumers (`vocabularyService.ts`, `reviewService.ts`, `ReviewMode.tsx`, and the `spaced-repetition.test.ts` suite) keep the same API surface and behavior.
- **apps/web/package.json** — declared `@ielts/vocabulary-engine` as a workspace dependency (previously imported via tsconfig/vitest path aliases only).
- **apps/web/vite.config.ts** — added the `@ielts/vocabulary-engine` resolve alias, mirroring the extension's vite config, so the app build resolves the engine source.
- **pnpm-lock.yaml** — updated the `apps/web` importer with the new workspace link.

## Testing

- `pnpm --filter @ielts/vocabulary-engine test` — 4 files, 31 tests, all pass.
- `pnpm --filter @ielts/web exec vitest run src/utils/spaced-repetition.test.ts src/services/__tests__/vocabularyEngineBootstrap.test.ts` — 15 tests pass (covers the re-exported engine policy and the engine bootstrap wiring).
- `pnpm --filter @ielts/web typecheck` — passes.
- `pnpm --filter @ielts/web build` — passes (landing bundle unchanged).
- `pnpm --filter @ielts/extension build` — passes; extension bundles the web-app source that now consumes the engine policy.
- `pnpm test:extension` — 14 files, 196 tests, all pass.
- Full web suite compared against pre-change baseline: failing-file set is identical (no new failures); the only differences are two flaky tests that pass in this run. `VocabularyReview.test.tsx` fails solely because `@testing-library/user-event` is not declared in `apps/web` devDependencies (pre-existing, unrelated).

## Risks

- `@ielts/vocabulary-engine`'s `getInitialReviewEntry` generates ids via the engine's own `generateId` (crypto.randomUUID with fallback) — functionally identical to the web's previous local implementation.
- The engine policy is still used by the legacy review flow through the re-export; migrating the review components themselves onto the `ReviewEngine`/`getVocabularyEngine()` facade is follow-up work (ENGINEE-171/172).
- Extension typecheck errors in `youtube-learning/` are unchanged from baseline (pre-existing).
