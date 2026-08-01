## Summary

Wire the new `@ielts/vocabulary-engine` package into the platform bootstrap so the canonical vocabulary engine (word CRUD, SM-2 review, search, analytics, knowledge graph, word detail, practice) becomes the central vocabulary service available to every learning experience, instead of an isolated word-list page. This is the platform-integration step of the Vocabulary Learning Engine refactor umbrella (ENGINEE-16) after the engine package was created in ENGINEE-163.

## Changes

- **apps/web/src/services/engineBootstrap.ts** — added `initializeVocabularyEngine()` and `getVocabularyEngine()`, constructing the engine with the `@ielts/vocabulary-engine` Dexie adapters (`DexieVocabularyRepository`, `DexieVocabReviewRepository`) over `@ielts/storage` and the shared `SystemClock`. Follows the existing `initializeAITutorEngine`/`initializeLearningEngine` singleton pattern.
- **apps/extension/src/app/ExtensionApp.tsx** — bootstraps the vocabulary engine alongside the AI tutor and learning engines on app start.
- **apps/extension/src/types/web-app.d.ts** — declared the two new `@ielts/web-app/services/engineBootstrap` exports (`initializeVocabularyEngine`, `getVocabularyEngine`).
- **apps/web/tsconfig.app.json** — added `@ielts/vocabulary-engine` path alias so web typechecking resolves the package source.
- **apps/web/vitest.config.ts** — added the `@ielts/vocabulary-engine` resolve alias for tests.
- **apps/extension/vite.config.ts** — added the `@ielts/vocabulary-engine` resolve alias for bundling.
- **apps/extension/tsconfig.json** — added the `@ielts/vocabulary-engine` path alias.
- **apps/extension/package.json** / **pnpm-lock.yaml** — added `@ielts/vocabulary-engine` as a workspace dependency of the extension.
- **apps/web/src/services/__tests__/vocabularyEngineBootstrap.test.ts** — new unit test covering engine creation with Dexie adapters, singleton reuse, and the failure path.

## Testing

- `pnpm --filter @ielts/vocabulary-engine test` — 4 files, 31 tests, all pass.
- `pnpm --filter @ielts/web typecheck` — passes.
- `pnpm --filter @ielts/web build` — passes.
- `pnpm --filter @ielts/web exec vitest run src/services/__tests__ src/utils` — 15 tests pass (includes the new bootstrap test, verified 3 consecutive combined runs).
- `pnpm --filter @ielts/extension build` — passes; verified the vocabulary-engine module is bundled into the extension `app.js`.
- Full web test suite: failing-file set is identical to baseline (pre-existing failures only; no new failures introduced). Extension typecheck errors are identical to baseline (pre-existing, in `youtube-learning/`).

## Risks

- The engine is exposed but feature components still read vocabulary via the legacy `vocabularyService.ts`; migrating consumers to `getVocabularyEngine()` is follow-up work (ENGINEE-165/170/175 and the remaining sub-issues).
- Bootstrap is only invoked from the extension-hosted app; the standalone web landing build is unaffected.
- `@ielts/storage` shares one IndexedDB instance, so the Dexie adapters read/write the same `vocabulary`/`vocabularyReviews` tables as the legacy service — no data duplication, but concurrent mutation paths must converge on the engine in later milestones.
