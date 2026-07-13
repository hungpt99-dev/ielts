import type { ExerciseDifficulty } from '../value-objects'

export interface DifficultyDecision {
  level: ExerciseDifficulty
  reasons: string[]
  confidence: number
  alternatives?: ExerciseDifficulty[]
}

export interface DifficultyInput {
  currentBand?: number
  targetBand?: number
  recentAccuracy?: number
  consecutiveCorrect: number
  consecutiveMistakes: number
  totalAttempts: number
  timeSpentMs: number
  hintsUsed: number
  userConfidence?: number
  examDaysRemaining?: number | null
}

export function determineDifficulty(input: DifficultyInput): DifficultyDecision {
  const reasons: string[] = []

  if (input.currentBand && input.targetBand) {
    const gap = input.targetBand - input.currentBand
    if (gap >= 2) {
      reasons.push('Large band gap — easier exercises to build foundation')
    }
  }

  if (input.consecutiveCorrect >= 3) {
    reasons.push(`${input.consecutiveCorrect} consecutive correct answers`)
  }

  if (input.consecutiveMistakes >= 2) {
    reasons.push(`${input.consecutiveMistakes} consecutive mistakes — easier difficulty`)
  }

  if (input.examDaysRemaining !== null && input.examDaysRemaining !== undefined && input.examDaysRemaining <= 14) {
    reasons.push('Exam approaching — maintain current difficulty')
  }

  const level = selectDifficulty(input)
  const confidence = calculateConfidence(input)

  return { level, reasons, confidence }
}

function selectDifficulty(input: DifficultyInput): ExerciseDifficulty {
  if (input.examDaysRemaining !== null && input.examDaysRemaining !== undefined && input.examDaysRemaining <= 7) {
    return 'medium'
  }

  if (input.consecutiveMistakes >= 2) return 'easy'
  if (input.consecutiveCorrect >= 5) return 'hard'
  if (input.consecutiveCorrect >= 3) return 'medium'

  if (input.recentAccuracy !== undefined) {
    if (input.recentAccuracy < 40) return 'easy'
    if (input.recentAccuracy > 80) return 'hard'
  }

  return 'medium'
}

function calculateConfidence(input: DifficultyInput): number {
  let confidence = 0.5
  if (input.totalAttempts > 10) confidence += 0.2
  if (input.recentAccuracy !== undefined) confidence += 0.1
  return Math.min(confidence, 1)
}
