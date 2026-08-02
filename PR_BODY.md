## Summary
Implements the M2 milestone for the new normalized IndexedDB storage schema in `@ielts/storage`: 16 new vocabulary tables (words, vocabularyStates, interactions, spacedRepetitionInfo, reviewRecords, masteryProfiles, collocations, synonyms, antonyms, wordFamily, commonMistakes, usageExamples, inflections, wordConnections, topicClusters, searchIndex) with correct primary keys and indexes, mirrored from the Task 9 vocabulary-engine domain schemas.

## Changes
- `packages/storage/src/schema-vocabulary.ts` (new): Zod row schemas + inferred TS types for all 16 tables, shared enums, `vocabularyTableSchemas` record, and `VOCABULARY_STORES` Dexie store-string definitions with `VOCABULARY_SCHEMA_VERSION = 2`.
- `packages/storage/src/migrations.ts`: bumped `APP_SCHEMA.currentVersion` to 2 and added a new Dexie version registering only the 16 new tables (existing tables untouched, no data migration).
- `packages/storage/src/db.ts`: added the 16 new tables to the `IDatabase` interface, `AppDatabase` class, and `TABLE_NAMES`.
- `packages/storage/src/index.ts`: exported the new schemas, store definitions, and row types.
- `packages/storage/src/__tests__/schema-vocabulary.test.ts` (new): verifies version bump, store definitions per table, row-schema presence, that existing `vocabulary`/`vocabularyReviews` tables are unaffected, and that every new table can be opened, written to, and read back.

## Testing
- `pnpm --filter @ielts/storage test`: 131 tests pass (10 files), including the 4 new schema-vocabulary tests.
- `pnpm --filter @ielts/storage exec tsc --noEmit`: no errors in `@ielts/storage`; the only reported errors are pre-existing unused-local errors in `@ielts/learning-engine` (confirmed present on the clean tree via `git stash`).

## Risks
- Rows are modeled on the vocabulary-engine domain (uppercase lifecycle/review enum values); any consumer writing these tables must follow the Zod schemas.
- New tables are registered but not yet wired into backup/export or repositories — that is follow-up work.
- none known beyond the above.
