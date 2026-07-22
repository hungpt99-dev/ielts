export type ExerciseFamily =
  | 'objective_questions'
  | 'completion_questions'
  | 'matching_questions'
  | 'classification_questions'
  | 'ordering_questions'
  | 'writing_task'
  | 'speaking_session'
  | 'interactive_listening'
  | 'vocabulary_activity'
  | 'grammar_activity'
  | 'content_comprehension'
  | 'review_activity'

export const EXERCISE_FAMILIES = [
  'objective_questions',
  'completion_questions',
  'matching_questions',
  'classification_questions',
  'ordering_questions',
  'writing_task',
  'speaking_session',
  'interactive_listening',
  'vocabulary_activity',
  'grammar_activity',
  'content_comprehension',
  'review_activity',
] as const

export function isExerciseFamily(value: string): value is ExerciseFamily {
  return (EXERCISE_FAMILIES as readonly string[]).includes(value)
}
