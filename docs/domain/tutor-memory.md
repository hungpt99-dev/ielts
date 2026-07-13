# Tutor Memory

## Purpose

Enable the AI tutor to retain context across chat sessions. Memory captures the learner's weak points, mistake patterns, preferences, goals, and recommendation history so the tutor can personalise interactions over time.

## Canonical Model

**TutorMemory** (`@ielts/ai-tutor-engine`):

| Field | Type | Description |
|---|---|---|
| `learnerId` | string | Unique learner identifier |
| `goals` | `TutorGoalMemory[]` | Active learning goals |
| `preferences` | `TutorPreferenceMemory[]` | Observed or explicitly set preferences |
| `weakPoints` | `TutorWeakPointMemory[]` | Skill-specific weaknesses with frequency |
| `mistakePatterns` | `TutorMistakeMemory[]` | Recurring mistake patterns with examples |
| `successfulStrategies` | `TutorStrategyMemory[]` | Techniques that worked well |
| `openLearningLoops` | `TutorOpenLoopMemory[]` | Unresolved topics or exercises |
| `recommendationHistory` | `TutorRecommendationMemory[]` | Past recommendations and their outcomes |
| `updatedAt` | string | ISO timestamp |
| `version` | number | Monotonically incrementing version |

**Sub-entities:**

| Entity | Key fields |
|---|---|
| `TutorWeakPointMemory` | `skill`, `description`, `frequency`, `lastObservedAt`, `evidenceCount` |
| `TutorMistakeMemory` | `pattern`, `skill`, `examples[]`, `frequency` |
| `TutorPreferenceMemory` | `key`, `value`, `source` (`'user-setting' \| 'observed'`), `confidence` |
| `TutorGoalMemory` | `title`, `targetDate`, `isAchieved` |

## Lifecycle

1. **Initialisation**: empty memory created on first tutor interaction.
2. **Update**: `updateTutorMemory()` accepts partial updates for weak points, mistakes, preferences, goals, and open learning loops. Deduplication prevents duplicates. Compaction removes entries older than 30 days.
3. **Compaction** (`MemoryCompactor`):
   - Weak points >30 days stale are removed; top 20 kept.
   - Mistake patterns >30 days stale removed; top 15 kept.
   - Open learning loops inactive >7 days marked `'stale'`.
4. **Versioning**: every update increments `version`.

## Persistence

- **Web app**: `localStorage` under key `'tutor-memory-{learnerId}'`.
- Implemented via `TutorMemoryRepository` port (`get`, `save`, `delete`).
- The web app's `engineBootstrap.ts` provides a localStorage-backed implementation.
- Chat messages are stored separately in `localStorage` under `'ai-tutor-chat-memory'` (via `LocalStorageMessageRepository`).

## Ownership

Owned by `@ielts/ai-tutor-engine`. The `TutorMemoryManager` class orchestrates reads, writes, deduplication, and compaction.

## Events

- `'tutor_memory_updated'` (TutorEvent): fired after each memory update, carrying `updatedFields[]`.
- `'tutor_memory_updated'` also flows through the engine's `handleLearningEvent()`.

## Invariants

- `learnerId` is immutable once set.
- `version` is strictly increasing — never reset.
- Memory is local-only; no server sync.
- Chat message memory is separate from tutor memory (different storage key and schema).

## Migration Considerations

- Memory is ephemeral — clearing localStorage resets it.
- No migration needed between schema versions (JSON schema with optional fields tolerates additions).
- Future: may move to IndexedDB for larger capacity and persistent structured storage.
