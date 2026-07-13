import type { ExerciseType, ExerciseSourceType } from '../entities/exercise'
import type { ExerciseDifficulty } from '../value-objects'

export interface ExerciseSelectionInput {
  skill: string
  availableMinutes: number
  difficulty: string
  currentBand?: number
  targetBand?: number
  recentAccuracy?: number
  isReview: boolean
  preferredTypes?: ExerciseType[]
  avoidRepeatedIds: string[]
}

export interface SelectedExerciseConfig {
  type: ExerciseType
  sourceType: ExerciseSourceType
  estimatedMinutes: number
  questionCount: number
  difficulty: ExerciseDifficulty
}

export function selectExerciseConfig(input: ExerciseSelectionInput): SelectedExerciseConfig {
  const type = selectType(input)
  const difficulty = selectDifficulty(input)
  const sourceType = input.isReview ? 'user-mistakes' : 'built-in'
  const estimatedMinutes = Math.min(input.availableMinutes, 60)
  const questionCount = estimateQuestionCountForType(type, estimatedMinutes)

  return { type, sourceType, estimatedMinutes, questionCount, difficulty }
}

function selectType(input: ExerciseSelectionInput): ExerciseType {
  if (input.isReview) return 'error-correction'
  if (input.preferredTypes && input.preferredTypes.length > 0) {
    return input.preferredTypes[0]
  }
  switch (input.skill) {
    case 'writing': return 'essay'
    case 'speaking': return 'speaking'
    case 'reading': return 'comprehension'
    case 'listening': return 'comprehension'
    default: return 'quiz'
  }
}

function selectDifficulty(input: ExerciseSelectionInput): ExerciseDifficulty {
  if (input.recentAccuracy !== undefined) {
    if (input.recentAccuracy < 40) return 'easy'
    if (input.recentAccuracy > 80) return 'hard'
  }
  return (input.difficulty as ExerciseDifficulty) || 'medium'
}

function estimateQuestionCountForType(type: ExerciseType, minutes: number): number {
  switch (type) {
    case 'essay': return 1
    case 'speaking': return Math.max(1, Math.floor(minutes / 5))
    case 'comprehension': return Math.max(2, Math.floor(minutes / 4))
    case 'quiz': return Math.max(3, Math.floor(minutes / 2))
    case 'error-correction': return Math.max(2, Math.floor(minutes / 3))
    default: return Math.max(1, Math.floor(minutes / 3))
  }
}
