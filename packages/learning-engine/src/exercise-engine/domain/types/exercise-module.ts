export type ExerciseModule =
  | 'reading'
  | 'listening'
  | 'writing'
  | 'speaking'
  | 'grammar'
  | 'vocabulary'
  | 'saved_content'
  | 'mistake_review'

export const EXERCISE_MODULES = [
  'reading',
  'listening',
  'writing',
  'speaking',
  'grammar',
  'vocabulary',
  'saved_content',
  'mistake_review',
] as const

export function isExerciseModule(value: string): value is ExerciseModule {
  return (EXERCISE_MODULES as readonly string[]).includes(value)
}
