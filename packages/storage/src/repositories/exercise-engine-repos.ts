import type { ExerciseAttempt } from '@ielts/learning-engine'

const EXERCISE_PREFIX = 'exercise-engine:exercise:'
const ATTEMPT_PREFIX = 'exercise-engine:attempt:'

function readStore<T>(prefix: string): Map<string, T> {
  const map = new Map<string, T>()
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith(prefix)) {
      try {
        const raw = localStorage.getItem(key)
        if (raw) {
          map.set(key.slice(prefix.length), JSON.parse(raw) as T)
        }
      } catch {
        // skip corrupt entries
      }
    }
  }
  return map
}

function writeEntry<T>(prefix: string, id: string, value: T): void {
  localStorage.setItem(`${prefix}${id}`, JSON.stringify(value))
}

function removeEntry(prefix: string, id: string): void {
  localStorage.removeItem(`${prefix}${id}`)
}

export class DexieExerciseRepository {
  async getById(id: string) {
    const store = readStore<{ id: string; module: string; [key: string]: unknown }>(EXERCISE_PREFIX)
    return store.get(id) ?? null
  }

  async save(exercise: { id: string; [key: string]: unknown }): Promise<void> {
    writeEntry(EXERCISE_PREFIX, exercise.id, exercise)
  }

  async delete(id: string): Promise<void> {
    removeEntry(EXERCISE_PREFIX, id)
  }

  async findByModule(module: string) {
    const store = readStore<{ id: string; module: string; [key: string]: unknown }>(EXERCISE_PREFIX)
    return [...store.values()].filter(e => e.module === module)
  }
}

export class DexieExerciseAttemptRepository {
  async getById(id: string): Promise<ExerciseAttempt | null> {
    const store = readStore<ExerciseAttempt>(ATTEMPT_PREFIX)
    return store.get(id) ?? null
  }

  async save(attempt: ExerciseAttempt): Promise<void> {
    writeEntry(ATTEMPT_PREFIX, attempt.id, attempt)
  }

  async findByExerciseId(exerciseId: string): Promise<ExerciseAttempt[]> {
    const store = readStore<ExerciseAttempt>(ATTEMPT_PREFIX)
    return [...store.values()].filter(a => a.exerciseId === exerciseId)
  }

  async findActiveByExerciseId(exerciseId: string): Promise<ExerciseAttempt | null> {
    const store = readStore<ExerciseAttempt>(ATTEMPT_PREFIX)
    return [...store.values()].find(
      a => a.exerciseId === exerciseId && (a.status === 'in_progress' || a.status === 'paused'),
    ) ?? null
  }
}
