## Summary
Implements the 9 vocabulary value objects (Collocation, Synonym, Antonym, WordFamilyMember, CommonMistake, UsageExample, Inflection, WordConnection, TopicCluster) under `packages/vocabulary-engine/src/domain/value-objects/`, each with a complete TypeScript interface and a `createX` factory function, exported from `src/domain/index.ts`.

## Changes
- `packages/vocabulary-engine/src/domain/value-objects/Collocation.ts` — Collocation interface with `Register` union type, `createCollocation` factory
- `packages/vocabulary-engine/src/domain/value-objects/Synonym.ts` — Synonym interface, `createSynonym` factory
- `packages/vocabulary-engine/src/domain/value-objects/Antonym.ts` — Antonym interface with `AntonymType` union, `createAntonym` factory
- `packages/vocabulary-engine/src/domain/value-objects/WordFamilyMember.ts` — WordFamilyMember interface with `PartOfSpeech` and `VerbConjugation` types, `createWordFamilyMember` factory
- `packages/vocabulary-engine/src/domain/value-objects/CommonMistake.ts` — CommonMistake interface with `CommonMistakeType` union, `createCommonMistake` factory
- `packages/vocabulary-engine/src/domain/value-objects/UsageExample.ts` — UsageExample interface with `UsageExampleSource` union, reuses `Register`, `createUsageExample` factory
- `packages/vocabulary-engine/src/domain/value-objects/Inflection.ts` — Inflection interface with `InflectionType` union, `createInflection` factory
- `packages/vocabulary-engine/src/domain/value-objects/WordConnection.ts` — WordConnection interface with `Record<string, unknown>` metadata, `createWordConnection` factory
- `packages/vocabulary-engine/src/domain/value-objects/TopicCluster.ts` — TopicCluster interface, `createTopicCluster` factory
- `packages/vocabulary-engine/src/domain/value-objects/index.ts` — named re-exports of all interfaces, union types and factories
- `packages/vocabulary-engine/src/domain/index.ts` — re-exports the value-objects module

## Testing
- `pnpm --filter @ielts/vocabulary-engine exec tsc --noEmit` — passes with no errors (strict mode)
- Verified all 9 interfaces match the issue spec and are exported from `src/domain/index.ts`

## Risks
- `Register` lives in `Collocation.ts` and is imported by `UsageExample.ts`; no circular dependency, but it becomes a shared enum surface once Task 2 (domain entities / shared enums) lands and may be relocated there.
