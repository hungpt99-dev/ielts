import type { LearningSession } from '../domain/entities/learning-session'
import type { Exercise } from '../domain/entities/exercise'
import type { LearningAttempt } from '../domain/entities/learning-attempt'
import type { LearningOutcome } from '../domain/entities/learning-outcome'

export interface LearningSessionRepository {
  getById(id: string): Promise<LearningSession | null>
  save(session: LearningSession): Promise<void>
  findActive(): Promise<LearningSession[]>
}

export interface ExerciseRepository {
  getById(id: string): Promise<Exercise | null>
  save(exercise: Exercise): Promise<void>
}

export interface LearningAttemptRepository {
  getById(id: string): Promise<LearningAttempt | null>
  save(attempt: LearningAttempt): Promise<void>
  findBySession(sessionId: string): Promise<LearningAttempt[]>
}

export interface LearningOutcomeRepository {
  save(outcome: LearningOutcome): Promise<void>
  findRecent(query: { skill?: string; limit?: number }): Promise<LearningOutcome[]>
}
