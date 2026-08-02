## Summary

Adds a Zod validation layer for every domain entity and value object in
`@ielts/vocabulary-engine` so data entering/leaving the engine (AI enrichment,
storage, search) can be validated with runtime guarantees and exact TypeScript
types. Schemas are re-exported from the package public API, and the existing
`vocabularyDetailsSchema` in `@ielts/ai` now constrains `cefrLevel` /
`ieltsRelevance` to the same value sets used by the domain.

## Changes

- `packages/vocabulary-engine/package.json` — added `zod@^4.4.3` dependency.
- `packages/vocabulary-engine/src/schemas/word.schema.ts` — `WordSchema`
  (non-empty lemma, valid `PartOfSpeech`/`CefrLevel`/`IeltsRelevance`), plus
  nested schemas for `WordFamilyMember`, `VerbConjugation`, `CommonMistake`,
  `UsageExample`, `Inflection`. Enums are derived from the existing
  `CEFR_LEVELS` constant so they cannot drift from the domain.
- `packages/vocabulary-engine/src/schemas/collocation.schema.ts` /
  `synonym.schema.ts` / `antonym.schema.ts` — relationship value-object
  schemas (frequency ≥ 0, similarityScore 0–1, enum-constrained types).
- `packages/vocabulary-engine/src/schemas/spaced-repetition.schema.ts` —
  `SpacedRepetitionInfoSchema` (interval > 0, easeFactor ≥ 1.3) and
  `ReviewHistoryEntrySchema` (valid rating, responseTimeMs ≥ 0, confidence 0–1).
- `packages/vocabulary-engine/src/schemas/review-record.schema.ts` —
  `ReviewRecordSchema` matching the mastery `ReviewRecord` entity
  (`skill`/`date`/`correct`) exactly.
- `packages/vocabulary-engine/src/schemas/vocabulary-state.schema.ts` —
  `VocabularyStateSchema` (valid lifecycle phase, masteryScore 0–100).
- `packages/vocabulary-engine/src/schemas/mastery-profile.schema.ts` —
  `MasteryProfileSchema` + `SkillMasteryStateSchema` (per-skill scores 0–100,
  `lastInteractionDate` nullable).
- `packages/vocabulary-engine/src/schemas/search.schema.ts` —
  `SearchInputSchema`, `SearchResultSchema`, `SearchIndexStatsSchema`.
- `packages/vocabulary-engine/src/schemas/index.ts` — barrel re-export; added
  `export * from './schemas'` to the package `src/index.ts` for consumers.
- `packages/ai/src/schemas/vocabulary.ts` — `cefrLevel` now accepts
  `A1|A2|B1|B2|C1|C2` (or `''`) and `ieltsRelevance` `low|medium|high` (or
  `''`), matching the domain enums; empty-string defaults preserved so existing
  AI flows keep working.
- `packages/vocabulary-engine/src/schemas/__tests__/schemas.test.ts` — compile
  time exact-type equality assertions (`Equal<DomainType, z.infer<Schema>>`)
  for every entity, plus runtime edge-case tests (empty lemma, invalid CEFR,
  negative interval, easeFactor < 1.3, negative responseTimeMs, out-of-range
  scores, invalid phases/ratings/skills).

## Testing

- `pnpm --filter @ielts/vocabulary-engine exec tsc --noEmit` — clean (strict,
  includes the type-equality assertions).
- `pnpm --filter @ielts/vocabulary-engine test` — 99 passed
  (28 new schema tests + 71 existing domain tests).
- `pnpm --filter @ielts/ai exec tsc --noEmit` — clean.
- `pnpm --filter @ielts/ai test` — 185 passed.
- `pnpm --filter web exec tsc --noEmit` — clean.
- Note: `packages/learning-engine` and `apps/extension` typechecks fail with
  pre-existing errors unrelated to this change (verified identical before/after
  this change via git stash; the 27 extension errors and learning-engine unused
  locals are untouched).

## Risks

- `interval` is validated as strictly positive per the issue, but
  `calculateNextReview` can produce interval `0` for a fresh entry — validating
  initial state with `SpacedRepetitionInfoSchema` would reject it. Follow-up may
  need to special-case the initial state.
- `review-record.schema.ts` matches the domain `ReviewRecord`
  (`skill`/`date`/`correct`); the rating/responseTimeMs validation requested in
  the issue lives on `ReviewHistoryEntrySchema` in `spaced-repetition.schema.ts`
  because the domain `ReviewRecord` has no such fields.
- The issue mentioned an `IeltsFrequency` value object; the codebase models this
  as `ieltsRelevance` (`low|medium|high`), so validation targets that field.
- `vocabularyDetailsSchema` is stricter on `cefrLevel`/`ieltsRelevance`; AI
  output outside the allowed sets now fails validation instead of passing as an
  arbitrary string. The generation prompts already constrain these values.
