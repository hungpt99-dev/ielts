import type { Exercise } from '../types'
import type { ExerciseAttempt } from '../types'
import type { ExerciseBlueprint } from '../blueprints'

export interface ExerciseRepository {
  getById(id: string): Promise<Exercise | null>
  save(exercise: Exercise): Promise<void>
  delete(id: string): Promise<void>
  findByModule(module: string): Promise<Exercise[]>
}

export interface ExerciseAttemptRepository {
  getById(id: string): Promise<ExerciseAttempt | null>
  save(attempt: ExerciseAttempt): Promise<void>
  findByExerciseId(exerciseId: string): Promise<ExerciseAttempt[]>
  findActiveByExerciseId(exerciseId: string): Promise<ExerciseAttempt | null>
}

export interface ExerciseBlueprintRepository {
  getById(id: string): Promise<ExerciseBlueprint | null>
  save(blueprint: ExerciseBlueprint): Promise<void>
  findByModuleAndMode(module: string, mode: string): Promise<ExerciseBlueprint[]>
}

export interface ExerciseGeneratorPort {
  generate(
    blueprint: ExerciseBlueprint,
    context: ExerciseGenerationContext,
  ): Promise<Exercise>
}

export interface ExerciseEvaluatorPort {
  evaluate(
    exercise: Exercise,
    attempt: ExerciseAttempt,
  ): Promise<import('../types').ExerciseResult>
}

export interface ExerciseGenerationContext {
  learnerId: string
  targetBand?: number
  currentBand?: number
  learningObjectives: string[]
  recentMistakes?: import('../types').MistakeEvidence[]
  constraints?: {
    maxDurationSeconds?: number
    offlineOnly?: boolean
    allowedQuestionTypes?: string[]
  }
}

export interface GenerationRepairResult {
  exercise: Exercise | null
  repaired: boolean
  attemptCount: number
  errors: string[]
}
