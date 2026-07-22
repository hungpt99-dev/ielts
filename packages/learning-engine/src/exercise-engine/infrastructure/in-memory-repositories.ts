import type { Exercise } from '../domain/types/exercise'
import type { ExerciseAttempt } from '../domain/types/attempt'
import type { ExerciseBlueprint } from '../domain/blueprints/blueprint'
import type { ExerciseRepository, ExerciseAttemptRepository, ExerciseBlueprintRepository } from '../domain/ports/ports'

export class InMemoryExerciseRepository implements ExerciseRepository {
  private readonly store = new Map<string, Exercise>()

  async getById(id: string): Promise<Exercise | null> {
    return this.store.get(id) ?? null
  }

  async save(exercise: Exercise): Promise<void> {
    this.store.set(exercise.id, exercise)
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id)
  }

  async findByModule(module: string): Promise<Exercise[]> {
    return [...this.store.values()].filter(e => e.module === module)
  }
}

export class InMemoryExerciseAttemptRepository implements ExerciseAttemptRepository {
  private readonly store = new Map<string, ExerciseAttempt>()

  async getById(id: string): Promise<ExerciseAttempt | null> {
    return this.store.get(id) ?? null
  }

  async save(attempt: ExerciseAttempt): Promise<void> {
    this.store.set(attempt.id, attempt)
  }

  async findByExerciseId(exerciseId: string): Promise<ExerciseAttempt[]> {
    return [...this.store.values()].filter(a => a.exerciseId === exerciseId)
  }

  async findActiveByExerciseId(exerciseId: string): Promise<ExerciseAttempt | null> {
    return [...this.store.values()].find(
      a => a.exerciseId === exerciseId && (a.status === 'in_progress' || a.status === 'paused'),
    ) ?? null
  }
}

export class InMemoryExerciseBlueprintRepository implements ExerciseBlueprintRepository {
  private readonly store = new Map<string, ExerciseBlueprint>()

  async getById(id: string): Promise<ExerciseBlueprint | null> {
    return this.store.get(id) ?? null
  }

  async save(blueprint: ExerciseBlueprint): Promise<void> {
    this.store.set(blueprint.id, blueprint)
  }

  async findByModuleAndMode(module: string, mode: string): Promise<ExerciseBlueprint[]> {
    return [...this.store.values()].filter(b => b.module === module && b.mode === mode)
  }
}
