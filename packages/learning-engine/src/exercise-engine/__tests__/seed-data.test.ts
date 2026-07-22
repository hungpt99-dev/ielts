import { describe, it, expect } from 'vitest'
import { validateExercise } from '../domain/validators'
import {
  getAllSeedExercises,
  createSeedFullReadingTest,
  createSeedFullWritingTest,
  createSeedFullSpeakingSimulation,
} from '../infrastructure/seed-data'

describe('Seed Data', () => {
  it('all seed exercises pass validation', () => {
    const exercises = getAllSeedExercises()
    for (const exercise of exercises) {
      const result = validateExercise(exercise)
      expect(result.valid, `${exercise.id} (${exercise.module}): ${result.errors.join(', ')}`).toBe(true)
    }
  })

  it('covers all major exercise families', () => {
    const exercises = getAllSeedExercises()
    const families = new Set(exercises.map(e => e.family))

    expect(families.has('objective_questions')).toBe(true)
    expect(families.has('interactive_listening')).toBe(true)
    expect(families.has('writing_task')).toBe(true)
    expect(families.has('speaking_session')).toBe(true)
    expect(families.has('grammar_activity')).toBe(true)
    expect(families.has('vocabulary_activity')).toBe(true)
    expect(families.has('content_comprehension')).toBe(true)
    expect(families.has('review_activity')).toBe(true)
  })

  it('covers all major modules', () => {
    const exercises = getAllSeedExercises()
    const modules = new Set(exercises.map(e => e.module))

    expect(modules.has('reading')).toBe(true)
    expect(modules.has('listening')).toBe(true)
    expect(modules.has('writing')).toBe(true)
    expect(modules.has('speaking')).toBe(true)
    expect(modules.has('grammar')).toBe(true)
    expect(modules.has('vocabulary')).toBe(true)
    expect(modules.has('saved_content')).toBe(true)
    expect(modules.has('mistake_review')).toBe(true)
  })

  it('all exercises have schema version', () => {
    const exercises = getAllSeedExercises()
    for (const exercise of exercises) {
      expect(exercise.schemaVersion).toBeGreaterThanOrEqual(1)
    }
  })

  it('all exercises have blueprint version', () => {
    const exercises = getAllSeedExercises()
    for (const exercise of exercises) {
      expect(exercise.blueprintVersion).toBeTruthy()
    }
  })

  it('all exercises have explicit mode', () => {
    const exercises = getAllSeedExercises()
    for (const exercise of exercises) {
      expect(exercise.mode).toBeTruthy()
    }
  })

  it('all exercises have unique IDs', () => {
    const exercises = getAllSeedExercises()
    const ids = exercises.map(e => e.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('includes full test exercises', () => {
    const exercises = getAllSeedExercises()
    const fullTests = exercises.filter(e => e.mode === 'full_test')
    expect(fullTests.length).toBeGreaterThanOrEqual(4)
  })

  it('includes focused practice exercises', () => {
    const exercises = getAllSeedExercises()
    const focused = exercises.filter(e => e.mode === 'focused_practice')
    expect(focused.length).toBeGreaterThanOrEqual(2)
  })

  it('includes review exercises', () => {
    const exercises = getAllSeedExercises()
    const reviews = exercises.filter(e => e.mode === 'review')
    expect(reviews.length).toBeGreaterThanOrEqual(1)
  })

  it('seed reading test has unique question IDs', () => {
    const exercise = createSeedFullReadingTest()
    const allIds = new Set<string>()
    for (const passage of exercise.passages) {
      for (const group of passage.questionGroups) {
        for (const question of group.questions) {
          expect(allIds.has(question.id)).toBe(false)
          allIds.add(question.id)
        }
      }
    }
  })

  it('seed writing test has no questionCount', () => {
    const exercise = createSeedFullWritingTest()
    expect((exercise as any).questionCount).toBeUndefined()
  })

  it('seed speaking test has no questionCount', () => {
    const exercise = createSeedFullSpeakingSimulation()
    expect((exercise as any).questionCount).toBeUndefined()
  })
})
