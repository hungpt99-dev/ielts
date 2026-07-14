import type { ExerciseQuestion, ExerciseQuestionType } from './exercise-question'
import type {
  MultipleChoiceQuestion,
  GapFillQuestion,
  TrueFalseNotGivenQuestion,
  ShortAnswerQuestion,
  MatchingQuestion,
  ErrorCorrectionQuestion,
  EssayQuestion,
  SpeakingResponseQuestion,
} from './exercise-question'

export function serializeExerciseQuestions(questions: ExerciseQuestion[]): string {
  return JSON.stringify(questions)
}

export function deserializeExerciseQuestions(json: string): ExerciseQuestion[] {
  if (!json || json === '[]') return []
  try {
    const parsed = JSON.parse(json)
    if (!Array.isArray(parsed)) return []
    return parsed.map((item: Record<string, unknown>) => normalizeExerciseQuestion(item))
  } catch (error) {
    console.error('packages/shared/src/exercise-serializer.ts error:', error);
    return []
  }
}

function normalizeExerciseQuestion(item: Record<string, unknown>): ExerciseQuestion {
  const type = item.type as ExerciseQuestionType
  switch (type) {
    case 'multiple-choice':
      return item as unknown as MultipleChoiceQuestion
    case 'gap-fill':
      return item as unknown as GapFillQuestion
    case 'true-false-not-given':
    case 'yes-no-not-given':
      return item as unknown as TrueFalseNotGivenQuestion
    case 'short-answer':
      return item as unknown as ShortAnswerQuestion
    case 'matching':
    case 'matching-headings':
      return item as unknown as MatchingQuestion
    case 'error-correction':
      return item as unknown as ErrorCorrectionQuestion
    case 'essay':
      return item as unknown as EssayQuestion
    case 'speaking-response':
      return item as unknown as SpeakingResponseQuestion
    default:
      return item as unknown as ExerciseQuestion
  }
}
