import { describe, it, expect, beforeEach } from 'vitest'
import { ExerciseEngine } from '../application/exercise-engine'
import type { ExerciseEngineDependencies } from '../application/exercise-engine'
import { InMemoryExerciseRepository, InMemoryExerciseAttemptRepository, InMemoryExerciseBlueprintRepository } from '../infrastructure/in-memory-repositories'
import type { ExerciseEngineEvent } from '../domain/events'
import type { Exercise } from '../domain/types'
import type { ExerciseBlueprint } from '../domain/blueprints'
import { createFullReadingBlueprint } from '../domain/blueprints'
import { createSeedFullReadingTest } from '../infrastructure/seed-data'

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

describe('Exercise Engine Application', () => {
  let engine: ExerciseEngine
  let deps: ExerciseEngineDependencies
  let events: ExerciseEngineEvent[]

  beforeEach(() => {
    const test = createTestDependencies()
    engine = new ExerciseEngine(test.deps)
    deps = test.deps
    events = test.events
  })

  describe('generateExercise', () => {
    it('generates and persists an exercise', async () => {
      const blueprint = createFullReadingBlueprint('test-bp')
      await deps.blueprintRepository.save(blueprint)

      const exercise = await engine.generateExercise({
        blueprintId: 'test-bp',
        context: { learnerId: 'learner-1', learningObjectives: [] },
      })

      expect(exercise).toBeDefined()
      expect(exercise.module).toBe('reading')

      const persisted = await deps.exerciseRepository.getById(exercise.id)
      expect(persisted).not.toBeNull()
    })

    it('publishes exercise_generated event', async () => {
      const blueprint = createFullReadingBlueprint('test-bp')
      await deps.blueprintRepository.save(blueprint)

      await engine.generateExercise({
        blueprintId: 'test-bp',
        context: { learnerId: 'learner-1', learningObjectives: [] },
      })

      const genEvent = events.find(e => e.type === 'exercise_generated')
      expect(genEvent).toBeDefined()
    })

    it('throws when blueprint not found', async () => {
      await expect(
        engine.generateExercise({
          blueprintId: 'nonexistent',
          context: { learnerId: 'learner-1', learningObjectives: [] },
        }),
      ).rejects.toThrow('Blueprint not found')
    })
  })

  describe('startAttempt', () => {
    it('creates an in_progress attempt', async () => {
      const exercise = createSeedFullReadingTest()
      await deps.exerciseRepository.save(exercise)

      const attempt = await engine.startAttempt({ exerciseId: exercise.id })

      expect(attempt.status).toBe('in_progress')
      expect(attempt.exerciseId).toBe(exercise.id)
      expect(attempt.startedAt).toBeDefined()
      expect(attempt.responses).toEqual({})
    })

    it('publishes exercise_started event', async () => {
      const exercise = createSeedFullReadingTest()
      await deps.exerciseRepository.save(exercise)

      await engine.startAttempt({ exerciseId: exercise.id })

      const startEvent = events.find(e => e.type === 'exercise_started')
      expect(startEvent).toBeDefined()
    })

    it('throws when exercise not found', async () => {
      await expect(
        engine.startAttempt({ exerciseId: 'nonexistent' }),
      ).rejects.toThrow('Exercise not found')
    })
  })

  describe('saveResponse', () => {
    it('saves a response to the attempt', async () => {
      const exercise = createSeedFullReadingTest()
      await deps.exerciseRepository.save(exercise)
      const attempt = await engine.startAttempt({ exerciseId: exercise.id })

      const updated = await engine.saveResponse({
        attemptId: attempt.id,
        questionId: 'q-rt-p1-1',
        response: { type: 'text', value: 'true' },
      })

      expect(updated.responses['q-rt-p1-1']).toEqual({ type: 'text', value: 'true' })
    })

    it('throws when attempt not found', async () => {
      await expect(
        engine.saveResponse({
          attemptId: 'nonexistent',
          questionId: 'q1',
          response: { type: 'text', value: 'test' },
        }),
      ).rejects.toThrow('Attempt not found')
    })
  })

  describe('pauseAttempt', () => {
    it('pauses an in_progress attempt', async () => {
      const exercise = createSeedFullReadingTest()
      await deps.exerciseRepository.save(exercise)
      const attempt = await engine.startAttempt({ exerciseId: exercise.id })

      const paused = await engine.pauseAttempt({ attemptId: attempt.id })
      expect(paused.status).toBe('paused')
      expect(paused.pausedAt).toBeDefined()
    })

    it('publishes exercise_paused event', async () => {
      const exercise = createSeedFullReadingTest()
      await deps.exerciseRepository.save(exercise)
      const attempt = await engine.startAttempt({ exerciseId: exercise.id })

      await engine.pauseAttempt({ attemptId: attempt.id })

      const pauseEvent = events.find(e => e.type === 'exercise_paused')
      expect(pauseEvent).toBeDefined()
    })
  })

  describe('resumeAttempt', () => {
    it('resumes a paused attempt', async () => {
      const exercise = createSeedFullReadingTest()
      await deps.exerciseRepository.save(exercise)
      const attempt = await engine.startAttempt({ exerciseId: exercise.id })
      await engine.pauseAttempt({ attemptId: attempt.id })

      const resumed = await engine.resumeAttempt({ attemptId: attempt.id })
      expect(resumed.status).toBe('in_progress')
    })
  })

  describe('submitAttempt', () => {
    it('submits an in_progress attempt', async () => {
      const exercise = createSeedFullReadingTest()
      await deps.exerciseRepository.save(exercise)
      const attempt = await engine.startAttempt({ exerciseId: exercise.id })

      const submitted = await engine.submitAttempt({ attemptId: attempt.id })
      expect(submitted.status).toBe('submitted')
      expect(submitted.submittedAt).toBeDefined()
    })

    it('publishes exercise_submitted event', async () => {
      const exercise = createSeedFullReadingTest()
      await deps.exerciseRepository.save(exercise)
      const attempt = await engine.startAttempt({ exerciseId: exercise.id })

      await engine.submitAttempt({ attemptId: attempt.id })

      const submitEvent = events.find(e => e.type === 'exercise_submitted')
      expect(submitEvent).toBeDefined()
    })
  })

  describe('evaluateAttempt', () => {
    it('evaluates and completes a submitted attempt', async () => {
      const exercise = createSeedFullReadingTest()
      await deps.exerciseRepository.save(exercise)
      const attempt = await engine.startAttempt({ exerciseId: exercise.id })
      await engine.submitAttempt({ attemptId: attempt.id })

      const evaluated = await engine.evaluateAttempt({ attemptId: attempt.id })
      expect(evaluated.status).toBe('completed')
      expect(evaluated.result).toBeDefined()
      expect(evaluated.completedAt).toBeDefined()
    })

    it('publishes exercise_evaluated and exercise_completed events', async () => {
      const exercise = createSeedFullReadingTest()
      await deps.exerciseRepository.save(exercise)
      const attempt = await engine.startAttempt({ exerciseId: exercise.id })
      await engine.submitAttempt({ attemptId: attempt.id })

      await engine.evaluateAttempt({ attemptId: attempt.id })

      expect(events.some(e => e.type === 'exercise_evaluated')).toBe(true)
      expect(events.some(e => e.type === 'exercise_completed')).toBe(true)
    })
  })

  describe('abandonAttempt', () => {
    it('abandons an in_progress attempt', async () => {
      const exercise = createSeedFullReadingTest()
      await deps.exerciseRepository.save(exercise)
      const attempt = await engine.startAttempt({ exerciseId: exercise.id })

      const abandoned = await engine.abandonAttempt(attempt.id, 'User left')
      expect(abandoned.status).toBe('abandoned')
    })

    it('publishes exercise_abandoned event', async () => {
      const exercise = createSeedFullReadingTest()
      await deps.exerciseRepository.save(exercise)
      const attempt = await engine.startAttempt({ exerciseId: exercise.id })

      await engine.abandonAttempt(attempt.id)

      const abandonEvent = events.find(e => e.type === 'exercise_abandoned')
      expect(abandonEvent).toBeDefined()
    })
  })

  describe('Full lifecycle', () => {
    it('completes a full exercise lifecycle', async () => {
      const exercise = createSeedFullReadingTest()
      await deps.exerciseRepository.save(exercise)

      const attempt = await engine.startAttempt({ exerciseId: exercise.id })
      expect(attempt.status).toBe('in_progress')

      await engine.saveResponse({
        attemptId: attempt.id,
        questionId: 'q-rt-p1-1',
        response: { type: 'text', value: 'true' },
      })

      await engine.pauseAttempt({ attemptId: attempt.id })
      await engine.resumeAttempt({ attemptId: attempt.id })

      await engine.submitAttempt({ attemptId: attempt.id })
      const completed = await engine.evaluateAttempt({ attemptId: attempt.id })

      expect(completed.status).toBe('completed')
      expect(completed.result).toBeDefined()

      const eventTypes = events.map(e => e.type)
      expect(eventTypes).toContain('exercise_started')
      expect(eventTypes).toContain('exercise_paused')
      expect(eventTypes).toContain('exercise_resumed')
      expect(eventTypes).toContain('exercise_submitted')
      expect(eventTypes).toContain('exercise_evaluated')
      expect(eventTypes).toContain('exercise_completed')
    })
  })
})
