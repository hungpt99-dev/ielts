export type ISOString = string

export type ExerciseSkill = 'grammar' | 'vocabulary' | 'reading' | 'listening' | 'writing' | 'speaking'

export type ExerciseSource =
  | 'built-in'
  | 'user-created'
  | 'ai-generated'
  | 'web-content'
  | 'mistake-review'
  | 'vocabulary-practice'

export type ExerciseDifficulty = 'beginner' | 'intermediate' | 'advanced'

export type QuestionType =
  | 'multiple-choice'
  | 'gap-fill'
  | 'true-false'
  | 'error-correction'
  | 'matching'
  | 'short-answer'
  | 'rewrite'

export type ExerciseStatus = 'draft' | 'published' | 'archived'

export type AttemptStatus = 'in-progress' | 'completed' | 'abandoned'

export type ReviewRating = 'again' | 'hard' | 'good' | 'easy'

export interface MatchingPair {
  left: string
  right: string
}

export interface FillInBlank {
  position: number
  correctAnswer: string
  acceptableAnswers?: string[]
  hint?: string
}
