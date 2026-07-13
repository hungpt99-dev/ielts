import type { ProgressContext, SkillState, MistakeSummary, VocabularySummary, ActivitySummary } from '../domain/entities/learner-context'
import type { IELTSSection } from '../domain/value-objects'

export interface LearnerProgressRepository {
  getProgress(): Promise<ProgressContext>
  getSkillStates(): Promise<Partial<Record<IELTSSection, Partial<SkillState>>>>
  getMistakes(): Promise<Partial<MistakeSummary>>
  getVocabulary(): Promise<Partial<VocabularySummary>>
  getActivity(): Promise<Partial<ActivitySummary>>
}
