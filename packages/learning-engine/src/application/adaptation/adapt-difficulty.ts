import type { ExerciseDifficulty } from '../../domain/value-objects'
import { determineDifficulty } from '../../domain/policies/difficulty-policy'

export interface AdaptDifficultyRequest {
  skill: string
  currentBand?: number
  targetBand?: number
  recentAccuracy?: number
  consecutiveCorrect: number
  consecutiveMistakes: number
  totalAttempts: number
}

export interface AdaptDifficultyResult {
  level: ExerciseDifficulty
  reasons: string[]
  confidence: number
}

export function adaptDifficulty(request: AdaptDifficultyRequest): AdaptDifficultyResult {
  const decision = determineDifficulty({
    currentBand: request.currentBand,
    targetBand: request.targetBand,
    recentAccuracy: request.recentAccuracy,
    consecutiveCorrect: request.consecutiveCorrect,
    consecutiveMistakes: request.consecutiveMistakes,
    totalAttempts: request.totalAttempts,
    timeSpentMs: 0,
    hintsUsed: 0,
  })

  return {
    level: decision.level,
    reasons: decision.reasons,
    confidence: decision.confidence,
  }
}
