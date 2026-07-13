import type { IELTSSection } from '../value-objects'
import type { ExerciseDifficulty } from '../value-objects'
import type { LearningObjective } from './learning-objective'

export type RecommendationAction =
  | 'start-roadmap-task'
  | 'continue-session'
  | 'review-mistakes'
  | 'review-vocabulary'
  | 'practice-skill'
  | 'complete-assessment'
  | 'use-saved-content'
  | 'rest'

export interface LearningRecommendation {
  action: RecommendationAction
  skill?: IELTSSection
  objective?: LearningObjective
  estimatedMinutes: number
  difficulty?: ExerciseDifficulty
  reason: string
  sourceIds: string[]
  priority: number
}

export interface LearningRecommendationRequest {
  skill?: IELTSSection
  availableMinutes: number
  excludeSessionIds: string[]
}

export interface LearningRecommendationResult {
  recommendations: LearningRecommendation[]
}
