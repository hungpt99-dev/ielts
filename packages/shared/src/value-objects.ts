export type BandScore = number

export type ExerciseDifficulty = 'easy' | 'medium' | 'hard' | 'adaptive'

export type ExerciseDifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert'

export type ProgressTrend = 'improving' | 'stable' | 'declining' | 'unknown'

export type LocalDate = string

export type DayOfWeek =
  | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'

export interface SkillBandScores {
  listening: BandScore
  reading: BandScore
  writing: BandScore
  speaking: BandScore
}
