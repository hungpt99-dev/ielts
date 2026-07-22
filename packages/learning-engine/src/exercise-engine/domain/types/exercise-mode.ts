export type ExerciseMode =
  | 'full_test'
  | 'full_section'
  | 'full_part'
  | 'focused_practice'
  | 'adaptive_practice'
  | 'review'
  | 'diagnostic'

export const EXERCISE_MODES = [
  'full_test',
  'full_section',
  'full_part',
  'focused_practice',
  'adaptive_practice',
  'review',
  'diagnostic',
] as const

export function isExerciseMode(value: string): value is ExerciseMode {
  return (EXERCISE_MODES as readonly string[]).includes(value)
}
