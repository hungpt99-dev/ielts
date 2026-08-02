import type { LifecyclePhase } from '../constants'
import type { SpacedRepetitionInfo } from '../policies'

export interface VocabularyState {
  wordId: string
  lifecyclePhase: LifecyclePhase
  masteryScore: number
  spacedRepetitionInfo: SpacedRepetitionInfo
  interactionCount: number
  correctProductionCount: number
  consecutiveAgainRatings: number
  lastInteractionAt?: Date
  lastStudyAt?: Date
  createdAt: Date
  updatedAt: Date
}
