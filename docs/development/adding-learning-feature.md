# Adding a Learning Feature

End-to-end guide for adding a new learning activity type (e.g., "Vocabulary Matching Quiz").

## Steps

### 1. Define the objective type

Identify what the feature teaches. Add a new `objectiveId` constant in the relevant engine or app code. If it represents a new domain concept (e.g. "pronunciation"), define it in `@ielts/shared` first.

### 2. Choose or add a skill module

If the feature belongs to an existing IELTS skill (`reading`, `listening`, `writing`, `speaking`, `vocabulary`, `grammar`), use the corresponding `LearningSkillModule`. If it's a new skill entirely, follow [Adding a Skill Module](./adding-skill-module.md).

### 3. Add domain types in `@ielts/shared` (if cross-engine)

Types shared across engines live in `@ielts/shared/src/`. Add new types here when:
- The type is used by >1 engine (e.g., `ExerciseQuestion` is in both `@ielts/learning-engine` and `@ielts/ai-tutor-engine`).
- The type needs validation schemas (Zod) consumed by `@ielts/storage`.

### 4. Add/update use case in relevant engine

Add the business logic to the appropriate engine:
- **Learning Engine**: Add methods to `LearningEngine` facade, implement in `LearningEngineImpl`.
- **AI Tutor Engine**: Add skill tutor methods (e.g. `explainTranscript`, `reviewWriting`).

### 5. Add persistence adapter if new storage needed

If the feature stores new data:
- Add a Zod schema in `@ielts/storage/src/schema.ts`.
- Create a repository extending `BaseRepository` in `@ielts/storage/src/repositories/`.
- Register the table in `tableSchemas` for migration support.

### 6. Add events

For features that affect learner progress or trigger proactive tutoring:
- Define a `SharedLearningEventType` in `@ielts/shared`.
- Emit events from the engine via the event port.
- Wire event handlers in `engineBootstrap.ts` for cross-engine effects.

### 7. Add UI page/component in `apps/web`

- Create feature component in `apps/web/src/features/<feature-name>/`.
- Use engine wrappers from `engineBootstrap.ts` (`getLearningEngine()` / `getAITutorEngine()`).
- Handle loading, error, and offline states.
- Use `@ielts/ui` components for consistency.

### 8. Add tests

- **Engine tests**: in `packages/<engine>/src/__tests__/` or adjacent `__tests__/` dir.
- **Storage tests**: use `fake-indexeddb`, test CRUD operations.
- **Component tests**: Vitest + jsdom + `@testing-library/react`.
- **Integration**: wire engine + storage + component in a single test.

### 9. Wire through engineBootstrap if needed

If the feature requires a new engine dependency, port, or adapter:
- Add wiring in `apps/web/src/services/engineBootstrap.ts`.
- Follow the existing pattern: factory function → dependency injection → singleton accessor.
- Handle the `null` engine case (no API key configured).

### 10. Verify offline and AI-assisted paths

- **Offline**: ensure the feature degrades gracefully — template-based exercises when AI is unavailable, cached data when IndexedDB is reachable.
- **AI-assisted**: if the feature uses AI, verify both paths: AI available (rich content) and AI unavailable (fallback content).
- Check service worker cache coverage for static assets.
