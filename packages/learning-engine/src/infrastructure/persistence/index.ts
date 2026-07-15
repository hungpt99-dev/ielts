import type { LearningSession } from '../../domain/entities/learning-session'
import type { LearningSessionRepository, ExerciseRepository, LearningAttemptRepository, LearningOutcomeRepository } from '../../ports/session-repository'
import type { Exercise } from '../../domain/entities/exercise'
import type { LearningAttempt } from '../../domain/entities/learning-attempt'
import type { LearningOutcome } from '../../domain/entities/learning-outcome'

export class InMemorySessionRepository implements LearningSessionRepository {
  private sessions = new Map<string, LearningSession>()

  async getById(id: string): Promise<LearningSession | null> {
    return this.sessions.get(id) ?? null
  }

  async save(session: LearningSession): Promise<void> {
    this.sessions.set(session.id, session)
  }

  async findActive(): Promise<LearningSession[]> {
    return Array.from(this.sessions.values()).filter(s => s.status === 'in-progress' || s.status === 'prepared')
  }
}

export class InMemoryExerciseRepository implements ExerciseRepository {
  private exercises = new Map<string, Exercise>()

  async getById(id: string): Promise<Exercise | null> {
    return this.exercises.get(id) ?? null
  }

  async save(exercise: Exercise): Promise<void> {
    this.exercises.set(exercise.id, exercise)
  }

  async delete(id: string): Promise<void> {
    this.exercises.delete(id)
  }

  async findAll(skill?: string): Promise<Exercise[]> {
    const all = Array.from(this.exercises.values())
    return skill ? all.filter(e => e.skill === skill) : all
  }
}

export class InMemoryAttemptRepository implements LearningAttemptRepository {
  private attempts = new Map<string, LearningAttempt>()

  async getById(id: string): Promise<LearningAttempt | null> {
    return this.attempts.get(id) ?? null
  }

  async save(attempt: LearningAttempt): Promise<void> {
    this.attempts.set(attempt.id, attempt)
  }

  async findBySession(sessionId: string): Promise<LearningAttempt[]> {
    return Array.from(this.attempts.values()).filter(a => a.sessionId === sessionId)
  }
}

export class InMemoryOutcomeRepository implements LearningOutcomeRepository {
  private outcomes: LearningOutcome[] = []

  async save(outcome: LearningOutcome): Promise<void> {
    this.outcomes.push(outcome)
  }

  async findRecent(query: { skill?: string; limit?: number }): Promise<LearningOutcome[]> {
    let filtered = this.outcomes
    if (query.skill) {
      filtered = filtered.filter(o => o.skill === query.skill)
    }
    filtered.sort((a, b) => b.completedAt.localeCompare(a.completedAt))
    return query.limit ? filtered.slice(0, query.limit) : filtered
  }
}
