import type { IELTSSection } from '../value-objects'
import type { ProgressTrend } from '../value-objects'

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

export interface SkillEvidenceBuilderInput {
  skill: IELTSSection
  score: number
  maximumScore: number
  previousAccuracy?: number
  sourceExerciseId: string
  sourceSessionId: string
}
