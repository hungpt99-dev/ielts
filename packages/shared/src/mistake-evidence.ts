import type { IELTSSection } from './ielts-section'
import type { ProgressTrend } from './value-objects'

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

export type SkillEvidenceType = 'strength' | 'weakness' | 'improvement' | 'plateau'

export interface SkillEvidence {
  skill: IELTSSection
  type: SkillEvidenceType
  description: string
  score: number
  maximumScore: number
  accuracy: number
  sourceExerciseId: string
  sourceSessionId: string
  occurredAt: string
  confidence: number
}

export interface SkillProgress {
  currentBand?: number
  targetBand?: number
  recentAccuracy?: number
  exercisesCompleted: number
  trend: ProgressTrend
  lastPracticedAt?: string
}

export interface VocabularyEvidence {
  wordId: string
  word: string
  correct: boolean
  context: string
}
