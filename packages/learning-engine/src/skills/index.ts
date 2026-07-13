import { SkillRegistry } from './skill-registry'
import { WritingSkillModule } from './writing/writing-module'
import { SpeakingSkillModule } from './speaking/speaking-module'
import { ReadingSkillModule } from './reading/reading-module'
import { ListeningSkillModule } from './listening/listening-module'
import { VocabularySkillModule } from './vocabulary/vocabulary-module'
import { GrammarSkillModule } from './grammar/grammar-module'

export { SkillRegistry }
export { WritingSkillModule, SpeakingSkillModule, ReadingSkillModule, ListeningSkillModule, VocabularySkillModule, GrammarSkillModule }
export type { LearningSkillModule, SkillActivityGenerationRequest, SkillActivityGenerationResult, SkillEvaluationRequest, SkillEvaluationResult, SkillReviewRequest, SkillReviewResult } from './skill-module'

export function createDefaultSkillRegistry(): SkillRegistry {
  const registry = new SkillRegistry()
  registry.register(new WritingSkillModule())
  registry.register(new SpeakingSkillModule())
  registry.register(new ReadingSkillModule())
  registry.register(new ListeningSkillModule())
  registry.register(new VocabularySkillModule())
  registry.register(new GrammarSkillModule())
  return registry
}
