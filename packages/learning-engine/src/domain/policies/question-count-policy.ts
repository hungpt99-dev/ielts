import type { ExerciseQuestionType } from '../entities/exercise-question'

const QUESTION_TIME_ESTIMATES: Record<string, number> = {
  'multiple-choice': 1,
  'multiple-select': 1.5,
  'true-false-not-given': 1.5,
  'yes-no-not-given': 1.5,
  'gap-fill': 1.5,
  'short-answer': 2,
  'matching': 3,
  'matching-headings': 3,
  'sentence-completion': 2,
  'error-correction': 2,
  'ordering': 2,
  'free-response': 5,
  'essay': 30,
  'speaking-response': 3,
  'shadowing': 3,
  'reflection': 2,
}

export function estimateQuestionCount(
  availableMinutes: number,
  questionTypes: ExerciseQuestionType[],
  readingTimeMinutes: number = 0,
): number {
  const exerciseTime = availableMinutes - readingTimeMinutes
  if (exerciseTime <= 0) return 1

  const avgTime = questionTypes.reduce((sum, t) => sum + (QUESTION_TIME_ESTIMATES[t] ?? 2), 0) / questionTypes.length

  return Math.max(1, Math.floor(exerciseTime / avgTime))
}

export function selectQuestionTypes(
  _skill: string,
  exerciseType: string,
): ExerciseQuestionType[] {
  switch (exerciseType) {
    case 'comprehension':
      return ['multiple-choice', 'short-answer', 'true-false-not-given']
    case 'error-correction':
      return ['error-correction', 'gap-fill']
    case 'matching':
      return ['matching', 'matching-headings']
    case 'quiz':
      return ['multiple-choice', 'gap-fill', 'short-answer']
    default:
      return ['multiple-choice', 'gap-fill', 'short-answer']
  }
}
