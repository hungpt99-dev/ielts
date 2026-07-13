import type { ExerciseQuestionType } from '../entities/exercise-question'
import type { EvaluationMethod } from '../entities/evaluation'

const DETERMINISTIC_TYPES: ExerciseQuestionType[] = [
  'multiple-choice',
  'multiple-select',
  'true-false-not-given',
  'yes-no-not-given',
  'gap-fill',
  'matching',
  'matching-headings',
  'ordering',
]

export function selectEvaluationMethod(
  questionType: ExerciseQuestionType,
  aiAvailable: boolean,
): EvaluationMethod {
  if (DETERMINISTIC_TYPES.includes(questionType)) return 'deterministic'
  if (questionType === 'essay' || questionType === 'speaking-response') {
    return aiAvailable ? 'ai-only' : 'self-evaluated'
  }
  if (questionType === 'short-answer' || questionType === 'free-response') {
    return aiAvailable ? 'ai-assisted' : 'deterministic'
  }
  return 'deterministic'
}

export function isDeterministicallyGradable(type: ExerciseQuestionType): boolean {
  return DETERMINISTIC_TYPES.includes(type)
}

export function normalizeScore(raw: number, maximum: number): number {
  if (maximum <= 0) return 0
  return Math.max(0, Math.min(raw, maximum))
}
