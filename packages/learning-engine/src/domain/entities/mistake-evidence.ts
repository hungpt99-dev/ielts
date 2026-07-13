import type { IELTSSection } from '../value-objects'

export type MistakeSeverity = 'minor' | 'moderate' | 'severe' | 'critical'
export type MistakeReviewStatus = 'unreviewed' | 'reviewed' | 'mastered'

export interface MistakeEvidence {
  id: string
  skill: IELTSSection
  category: string
  subcategory?: string
  originalResponse: string
  correctedResponse: string
  explanation: string
  sourceExerciseId: string
  sourceQuestionId: string
  occurredAt: string
  recurrenceCount: number
  severity: MistakeSeverity
  confidence: number
  reviewStatus: MistakeReviewStatus
  relatedGrammarItem?: string
  relatedVocabularyItem?: string
}
