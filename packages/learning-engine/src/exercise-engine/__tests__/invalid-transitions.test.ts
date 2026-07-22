import { describe, it, expect, beforeEach } from 'vitest'
import { ExerciseEngine } from '../application/exercise-engine'
import type { ExerciseEngineDependencies } from '../application/exercise-engine'
import { InMemoryExerciseRepository, InMemoryExerciseAttemptRepository, InMemoryExerciseBlueprintRepository } from '../infrastructure/in-memory-repositories'
import type { ExerciseEngineEvent } from '../domain/events'
import type { Exercise } from '../domain/types'
import type { ExerciseBlueprint } from '../domain/blueprints'
import { createSeedFullReadingTest } from '../infrastructure/seed-data'
import { InvalidAttemptStateTransitionError } from '../domain/errors'
import type { ExerciseAttempt } from '../domain/types'

function createTestDependencies(): {
  deps: ExerciseEngineDependencies
  events: ExerciseEngineEvent[]
} {
  const events: ExerciseEngineEvent[] = []

  const deps: ExerciseEngineDependencies = {
    exerciseRepository: new InMemoryExerciseRepository(),
    attemptRepository: new InMemoryExerciseAttemptRepository(),
    blueprintRepository: new InMemoryExerciseBlueprintRepository(),
    generator: {
      async generate(_blueprint: ExerciseBlueprint): Promise<Exercise> {
        return createSeedFullReadingTest()
      },
    },
    eventPublisher: {
      async publish(event: ExerciseEngineEvent): Promise<void> {
        events.push(event)
      },
    },
    generateId: () => `id-${Math.random().toString(36).slice(2, 8)}`,
    getCurrentTime: () => new Date().toISOString(),
  }

  return { deps, events }
}

describe('Invalid State Transitions', () => {
  let engine: ExerciseEngine
  let deps: ExerciseEngineDependencies

  beforeEach(() => {
    const test = createTestDependencies()
    engine = new ExerciseEngine(test.deps)
    deps = test.deps
  })

  it('should throw when pausing a NOT_STARTED attempt', async () => {
    const exercise = createSeedFullReadingTest()
    await deps.exerciseRepository.save(exercise)

    const attempt: ExerciseAttempt = {
      id: 'attempt-1',
      exerciseId: exercise.id,
      exerciseSnapshotVersion: `${exercise.schemaVersion}:${exercise.updatedAt}`,
      status: 'not_started',
      responses: {},
      elapsedSeconds: 0,
    }
    await deps.attemptRepository.save(attempt)

    await expect(
      engine.pauseAttempt({ attemptId: attempt.id }),
    ).rejects.toThrow(InvalidAttemptStateTransitionError)
  })

  it('should throw when submitting a PAUSED attempt', async () => {
    const exercise = createSeedFullReadingTest()
    await deps.exerciseRepository.save(exercise)

    const attempt = await engine.startAttempt({ exerciseId: exercise.id })
    await engine.pauseAttempt({ attemptId: attempt.id })

    await expect(
      engine.submitAttempt({ attemptId: attempt.id }),
    ).rejects.toThrow(InvalidAttemptStateTransitionError)
  })

  it('should throw when submitting an already SUBMITTED attempt', async () => {
    const exercise = createSeedFullReadingTest()
    await deps.exerciseRepository.save(exercise)

    const attempt = await engine.startAttempt({ exerciseId: exercise.id })
    await engine.submitAttempt({ attemptId: attempt.id })

    await expect(
      engine.submitAttempt({ attemptId: attempt.id }),
    ).rejects.toThrow(InvalidAttemptStateTransitionError)
  })

  it('should throw when evaluating an IN_PROGRESS attempt', async () => {
    const exercise = createSeedFullReadingTest()
    await deps.exerciseRepository.save(exercise)

    const attempt = await engine.startAttempt({ exerciseId: exercise.id })

    await expect(
      engine.evaluateAttempt({ attemptId: attempt.id }),
    ).rejects.toThrow(InvalidAttemptStateTransitionError)
  })

  it('should throw when evaluating an already COMPLETED attempt', async () => {
    const exercise = createSeedFullReadingTest()
    await deps.exerciseRepository.save(exercise)

    const attempt = await engine.startAttempt({ exerciseId: exercise.id })
    await engine.submitAttempt({ attemptId: attempt.id })
    await engine.evaluateAttempt({ attemptId: attempt.id })

    await expect(
      engine.evaluateAttempt({ attemptId: attempt.id }),
    ).rejects.toThrow(InvalidAttemptStateTransitionError)
  })

  it('should throw when saving a response to a PAUSED attempt', async () => {
    const exercise = createSeedFullReadingTest()
    await deps.exerciseRepository.save(exercise)

    const attempt = await engine.startAttempt({ exerciseId: exercise.id })
    await engine.pauseAttempt({ attemptId: attempt.id })

    await expect(
      engine.saveResponse({
        attemptId: attempt.id,
        questionId: 'q-rt-p1-1',
        response: { type: 'text', value: 'true' },
      }),
    ).rejects.toThrow(InvalidAttemptStateTransitionError)
  })

  it('should throw when saving a response to a SUBMITTED attempt', async () => {
    const exercise = createSeedFullReadingTest()
    await deps.exerciseRepository.save(exercise)

    const attempt = await engine.startAttempt({ exerciseId: exercise.id })
    await engine.submitAttempt({ attemptId: attempt.id })

    await expect(
      engine.saveResponse({
        attemptId: attempt.id,
        questionId: 'q-rt-p1-1',
        response: { type: 'text', value: 'true' },
      }),
    ).rejects.toThrow(InvalidAttemptStateTransitionError)
  })

  it('should throw when saving a response to a COMPLETED attempt', async () => {
    const exercise = createSeedFullReadingTest()
    await deps.exerciseRepository.save(exercise)

    const attempt = await engine.startAttempt({ exerciseId: exercise.id })
    await engine.submitAttempt({ attemptId: attempt.id })
    await engine.evaluateAttempt({ attemptId: attempt.id })

    await expect(
      engine.saveResponse({
        attemptId: attempt.id,
        questionId: 'q-rt-p1-1',
        response: { type: 'text', value: 'true' },
      }),
    ).rejects.toThrow(InvalidAttemptStateTransitionError)
  })

  it('should throw when pausing an already PAUSED attempt', async () => {
    const exercise = createSeedFullReadingTest()
    await deps.exerciseRepository.save(exercise)

    const attempt = await engine.startAttempt({ exerciseId: exercise.id })
    await engine.pauseAttempt({ attemptId: attempt.id })

    await expect(
      engine.pauseAttempt({ attemptId: attempt.id }),
    ).rejects.toThrow(InvalidAttemptStateTransitionError)
  })

  it('should throw when resuming an IN_PROGRESS attempt', async () => {
    const exercise = createSeedFullReadingTest()
    await deps.exerciseRepository.save(exercise)

    const attempt = await engine.startAttempt({ exerciseId: exercise.id })

    await expect(
      engine.resumeAttempt({ attemptId: attempt.id }),
    ).rejects.toThrow(InvalidAttemptStateTransitionError)
  })
})
