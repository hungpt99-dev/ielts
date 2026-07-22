import type { Exercise, ExerciseQuestion } from '../types'

export function countAllQuestions(exercise: Exercise): number {
  switch (exercise.module) {
    case 'reading':
      return exercise.passages.reduce(
        (sum, p) => sum + p.questionGroups.reduce((s, g) => s + g.questions.length, 0),
        0,
      )
    case 'listening':
      return exercise.parts.reduce(
        (sum, p) => sum + p.questionGroups.reduce((s, g) => s + g.questions.length, 0),
        0,
      )
    case 'writing':
      return exercise.tasks.length
    case 'speaking':
      return exercise.parts.length
    case 'grammar':
      return exercise.items.length
    case 'vocabulary':
      return exercise.terms.length
    case 'saved_content':
      return exercise.activities.reduce((s, g) => s + g.questions.length, 0)
    case 'mistake_review':
      return exercise.reviewActivities.reduce((s, g) => s + g.questions.length, 0)
    default:
      return 0
  }
}

export function collectAllQuestions(exercise: Exercise): ExerciseQuestion[] {
  const questions: ExerciseQuestion[] = []

  switch (exercise.module) {
    case 'reading':
      for (const passage of exercise.passages) {
        for (const group of passage.questionGroups) {
          questions.push(...group.questions)
        }
      }
      break
    case 'listening':
      for (const part of exercise.parts) {
        for (const group of part.questionGroups) {
          questions.push(...group.questions)
        }
      }
      break
    case 'saved_content':
      for (const group of exercise.activities) {
        questions.push(...group.questions)
      }
      break
    case 'mistake_review':
      for (const group of exercise.reviewActivities) {
        questions.push(...group.questions)
      }
      break
    case 'grammar':
      for (const item of exercise.items) {
        questions.push(item.question)
      }
      break
    case 'vocabulary':
      for (const group of exercise.activities) {
        questions.push(...group.questions)
      }
      break
  }

  return questions
}
