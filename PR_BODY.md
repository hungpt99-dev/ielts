## Summary

Implement the 6 aggregate root entities for the vocabulary domain model (`Word`, `VocabularyState`, `SpacedRepetitionInfo`, `MasteryProfile`, `Interaction`, `ReviewRecord`) as pure TypeScript interfaces with factory functions, per the M1 domain-model milestone.

## Changes

- `packages/vocabulary-engine/src/domain/entities/Word.ts` — `Word` interface (lemma, inflections, language, ipa, pronunciation, partOfSpeech, cefr, ieltsFrequency, awlLevel, topic, difficulty, definitions, etc.) + `createWord`, plus `PartOfSpeech`/`CefrLevel` unions.
- `packages/vocabulary-engine/src/domain/entities/VocabularyState.ts` — `VocabularyState` interface (lifecycle, mastery/confidence scores, interactions, discovery/source/personal notes, bookmarks, tags) + `createVocabularyState`, plus `VocabularyLifecycle` union.
- `packages/vocabulary-engine/src/domain/entities/SpacedRepetitionInfo.ts` — `SpacedRepetitionInfo` interface (interval, easeFactor, repetitions, stability, recallProbability, reviewHistory, etc.) + `createSpacedRepetitionInfo`.
- `packages/vocabulary-engine/src/domain/entities/MasteryProfile.ts` — `MasteryProfile` + `SkillMastery` interfaces with per-skill factories `createSkillMastery`/`createMasteryProfile`.
- `packages/vocabulary-engine/src/domain/entities/Interaction.ts` — `Interaction` interface (type, timestamp, context) + `createInteraction`, plus `InteractionType` union.
- `packages/vocabulary-engine/src/domain/entities/ReviewRecord.ts` — `ReviewRecord` interface (rating, responseTimeMs, confidenceScore, reviewMode, context, mistakes) + `createReviewRecord`, plus `ReviewRating`/`ReviewContext`/`ReviewMode` unions.
- `packages/vocabulary-engine/src/domain/entities/common.ts` — small shared helpers `createId`/`nowIso` used by the factories.
- `packages/vocabulary-engine/src/domain/index.ts` — re-exports all entities.
- `packages/vocabulary-engine/src/index.ts` — re-exports the domain layer.

## Testing

- `pnpm --filter @ielts/vocabulary-engine exec tsc --noEmit` — passed (strict mode, no `any`/`@ts-ignore`).
- `pnpm --filter @ielts/vocabulary-engine test` — passed (no tests yet; `--passWithNoTests`).

## Risks

- `SpacedRepetitionInfo.lastReviewedAt` defaults to `''` to represent a never-reviewed card; a follow-up M2 scheduling task may prefer `null` or `undefined`.
- Numeric `ReviewRating` (0–5) chosen for FSRS-style algorithms; if the scheduling backend uses the SM-2 four-button scale this union may need adjusting.
- Factories use `crypto.randomUUID()` with a timestamp-based fallback; no runtime dependencies added.
