## Summary

Define the 7 hexagonal port interfaces that the vocabulary domain engine depends on, keeping all contracts pure TypeScript interfaces over domain types with zero infrastructure imports. Since the entity/enum dependencies (Tasks 2/4) had not landed, the minimal `Word`, `VocabularyState` and `CefrLevel` domain types those ports require were added to the domain layer.

## Changes

- `packages/vocabulary-engine/src/domain/constants/cefr-level.ts` — new `CEFR_LEVELS` constant + `CefrLevel` union type (exported via `constants/index.ts`).
- `packages/vocabulary-engine/src/domain/entities/Word.ts`, `VocabularyState.ts`, `index.ts` — new minimal domain entities referenced by the ports.
- `packages/vocabulary-engine/src/domain/index.ts` — re-export entities and `CefrLevel`.
- `packages/vocabulary-engine/src/ports/VocabularyRepository.ts` — CRUD for `Word` + `VocabularyState`, bulk ops, counts by topic/CEFR/lifecycle.
- `packages/vocabulary-engine/src/ports/ReviewRepository.ts` — `SpacedRepetitionInfo` CRUD, due-word query, `ReviewRecord` CRUD + `ReviewStats` (uses the domain `ReviewRecord` from `MasteryCalculationPolicy`).
- `packages/vocabulary-engine/src/ports/GraphRepository.ts` — `WordConnection` CRUD, collocation/synonym/antonym/word-family queries, path finding, topic clusters.
- `packages/vocabulary-engine/src/ports/SearchIndexRepository.ts` — index/deindex/reindex, `search` with `SearchOptions` (filters + pagination), `IndexStats`.
- `packages/vocabulary-engine/src/ports/AIServicePort.ts` — enrich (single/batch), simplified meaning, collocations, practice exercises, coaching, academic alternatives, quiz, usage examples, translation, text analysis.
- `packages/vocabulary-engine/src/ports/AudioServicePort.ts` — `getAudioUrl`, `play`, `getAvailableVoices`.
- `packages/vocabulary-engine/src/ports/EventBusPort.ts` — `publish` / `subscribe` / `unsubscribe` over a typed `VocabularyEvent`.
- `packages/vocabulary-engine/src/ports/index.ts` — barrel exporting all ports + their DTO types.
- `packages/vocabulary-engine/src/index.ts` — re-export the new ports and domain types from the package entry.

## Testing

- `pnpm --filter @ielts/vocabulary-engine exec tsc --noEmit` — passes (exit 0).
- `pnpm --filter @ielts/vocabulary-engine test` — 60 existing domain tests pass.

## Risks

- `Word` / `VocabularyState` / `CefrLevel` are minimal domain definitions added ahead of Tasks 2/4; when those tasks land they should be reconciled to the full entity/enum shapes (signatures in the ports are intentionally only as broad as these types allow).
- No implementation code or adapters are included yet — these are contracts only; adapters are expected to implement them in later tasks.
