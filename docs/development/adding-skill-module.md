# Adding a Skill Module

Each IELTS skill (reading, listening, writing, speaking, vocabulary, grammar) is implemented as a `LearningSkillModule` in `@ielts/learning-engine`.

## Interface

All skill modules implement this interface (`packages/learning-engine/src/skills/skill-module.ts`):

```typescript
interface LearningSkillModule {
  readonly skill: IELTSSection
  supports(request: GenerateExerciseRequest): boolean
  generateActivity(request: SkillActivityGenerationRequest): Promise<SkillActivityGenerationResult>
  evaluate(request: SkillEvaluationRequest): Promise<SkillEvaluationResult>
  createReview(request: SkillReviewRequest): Promise<SkillReviewResult>
}
```

## Steps

### 1. Create the module file

Location: `packages/learning-engine/src/skills/<skill-name>/<skill-name>-module.ts`

Example: `packages/learning-engine/src/skills/writing/writing-module.ts`

### 2. Implement `LearningSkillModule`

```typescript
import type { LearningSkillModule, SkillActivityGenerationRequest, … } from '../skill-module'

export class MySkillModule implements LearningSkillModule {
  readonly skill: IELTSSection = 'my-skill'

  supports(request: GenerateExerciseRequest): boolean {
    return request.skill === this.skill
  }
  // … generateActivity, evaluate, createReview
}
```

### 3. Add generation logic

Two approaches (can combine):

- **Template-based** (deterministic): Define hardcoded prompts, passages, or question sets. Used by `ReadingSkillModule`, `ListeningSkillModule`, `GrammarSkillModule`, `VocabularySkillModule`, `WritingSkillModule`, `SpeakingSkillModule`.
- **AI-assisted**: Call `callAI` from `@ielts/ai` to generate dynamic content. Available through the engine's `TutorIntelligencePort`.

### 4. Add evaluation logic

- **Deterministic grading**: Use `gradeAnswer` from `packages/learning-engine/src/domain/policies` for objective question types (multiple-choice, gap-fill, true/false/not-given).
- **AI-assisted evaluation**: For subjective skills (writing, speaking), the `evaluationPolicy` should be `'ai-assisted'`. Implement heuristic pre-checks (word count, response length) before AI evaluation.

### 5. Add review/feedback

`createReview` generates remedial exercises from `MistakeEvidence[]`. Focus on the specific mistake category. See `ReadingSkillModule.createReview` for error-review patterns, `WritingSkillModule.createReview` for correction-based review.

### 6. Add evidence production

Both `evaluate` and `createReview` should produce:
- `MistakeEvidence[]` — for tracking error patterns.
- `SkillEvidence[]` — for progress tracking and learner context.

### 7. Register in SkillRegistry

In `packages/learning-engine/src/skills/index.ts`:

```typescript
import { MySkillModule } from './my-skill/my-skill-module'

export function createDefaultSkillRegistry(): SkillRegistry {
  const registry = new SkillRegistry()
  registry.register(new WritingSkillModule())
  // … other modules …
  registry.register(new MySkillModule())
  return registry
}
```

### 8. Add tests

Location: `packages/learning-engine/src/skills/__tests__/<skill-name>-module.test.ts`

Test patterns:
- `generateActivity` returns correct exercise structure for given request parameters.
- `evaluate` produces correct `AnswerEvaluation` for known answers.
- `createReview` generates exercises targeting specific mistakes.
- Offline/fallback behavior when AI is unavailable.

### 9. Create offline fallback

Ensure template-based generation works without AI. Each skill module should produce valid exercises from its built-in templates even when `callAI` is unavailable.
