import type { ExerciseDifficulty } from '../value-objects'
import type { LearningObjective } from './learning-objective'
import type { ExerciseQuestion } from '@ielts/shared'

export interface LearningExample {
  title: string
  content: string
  explanation: string
}

export interface LearningLesson {
  id: string
  objective: LearningObjective
  title: string
  explanation: string
  keyPoints: string[]
  examples: LearningExample[]
  checkingQuestions: ExerciseQuestion[]
  followUpExerciseIds: string[]
  estimatedMinutes: number
  difficulty: ExerciseDifficulty
}
