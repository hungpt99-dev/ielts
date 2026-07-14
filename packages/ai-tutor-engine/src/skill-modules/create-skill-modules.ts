import type { TutorAIClient } from '../ai/tutor-ai-client'
import { WritingTutorModuleImpl } from './writing/writing-tutor-impl'
import { SpeakingTutorModuleImpl } from './speaking/speaking-tutor-impl'
import { ReadingTutorModuleImpl } from './reading/reading-tutor-impl'
import { ListeningTutorModuleImpl } from './listening/listening-tutor-impl'
import { VocabularyTutorModuleImpl } from './vocabulary/vocabulary-coach-impl'
import { GrammarTutorModuleImpl } from './grammar/grammar-tutor-impl'
import type { WritingTutorModule } from './writing/writing-tutor'
import type { SpeakingTutorModule } from './speaking/speaking-tutor'
import type { ReadingTutorModule } from './reading/reading-tutor'
import type { ListeningTutorModule } from './listening/listening-tutor'
import type { VocabularyTutorModule } from './vocabulary/vocabulary-coach'
import type { GrammarTutorModule } from './grammar/grammar-tutor'

export interface TutorSkillModules {
  writing: WritingTutorModule
  speaking: SpeakingTutorModule
  reading: ReadingTutorModule
  listening: ListeningTutorModule
  vocabulary: VocabularyTutorModule
  grammar: GrammarTutorModule
}

export function createDefaultTutorSkillModules(aiClient?: TutorAIClient): TutorSkillModules {
  return {
    writing: new WritingTutorModuleImpl(aiClient),
    speaking: new SpeakingTutorModuleImpl(aiClient),
    reading: new ReadingTutorModuleImpl(aiClient),
    listening: new ListeningTutorModuleImpl(aiClient),
    vocabulary: new VocabularyTutorModuleImpl(aiClient),
    grammar: new GrammarTutorModuleImpl(aiClient),
  }
}
