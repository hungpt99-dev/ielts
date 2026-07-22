import { describe, it, expect } from 'vitest'
import { validateExerciseAgainstBlueprint } from '../domain/validators'
import { createFullListeningBlueprint, createFullReadingBlueprint, createFullWritingBlueprint, createFullSpeakingBlueprint } from '../domain/blueprints'
import { createSeedFullReadingTest, createSeedFullListeningTest, createSeedFullWritingTest, createSeedFullSpeakingSimulation } from '../infrastructure/seed-data'

describe('IELTS Invariants', () => {
  describe('Full Listening Test', () => {
    it('has exactly 4 parts', () => {
      const exercise = createSeedFullListeningTest()
      expect(exercise.parts).toHaveLength(4)
    })

    it('has exactly 10 questions per part', () => {
      const exercise = createSeedFullListeningTest()
      for (const part of exercise.parts) {
        const qCount = part.questionGroups.reduce((sum, g) => sum + g.questions.length, 0)
        expect(qCount).toBe(10)
      }
    })

    it('has exactly 40 total questions', () => {
      const exercise = createSeedFullListeningTest()
      expect(exercise.totalQuestionCount).toBe(40)
    })

    it('passes blueprint validation', () => {
      const exercise = createSeedFullListeningTest()
      const blueprint = createFullListeningBlueprint('test')
      const result = validateExerciseAgainstBlueprint(exercise, blueprint)
      expect(result.valid).toBe(true)
    })
  })

  describe('Full Reading Test', () => {
    it('has exactly 3 passages', () => {
      const exercise = createSeedFullReadingTest()
      expect(exercise.passages).toHaveLength(3)
    })

    it('has exactly 40 total questions', () => {
      const exercise = createSeedFullReadingTest()
      expect(exercise.totalQuestionCount).toBe(40)
    })

    it('passes blueprint validation', () => {
      const exercise = createSeedFullReadingTest()
      const blueprint = createFullReadingBlueprint('test')
      const result = validateExerciseAgainstBlueprint(exercise, blueprint)
      expect(result.valid).toBe(true)
    })

    it('does not assume equal question allocation', () => {
      const exercise = createSeedFullReadingTest()
      const questionCounts = exercise.passages.map(p =>
        p.questionGroups.reduce((sum, g) => sum + g.questions.length, 0),
      )
      expect(questionCounts).toEqual([13, 13, 14])
    })
  })

  describe('Full Writing Test', () => {
    it('has exactly 2 tasks', () => {
      const exercise = createSeedFullWritingTest()
      expect(exercise.tasks).toHaveLength(2)
    })

    it('has Task 1 and Task 2', () => {
      const exercise = createSeedFullWritingTest()
      const task1 = exercise.tasks.find(t => t.taskType === 'task_1')
      const task2 = exercise.tasks.find(t => t.taskType === 'task_2')
      expect(task1).toBeDefined()
      expect(task2).toBeDefined()
    })

    it('has Task 2 weighted twice as Task 1', () => {
      const exercise = createSeedFullWritingTest()
      const task1 = exercise.tasks.find(t => t.taskType === 'task_1')!
      const task2 = exercise.tasks.find(t => t.taskType === 'task_2')!
      expect(task2.weight).toBe(task1.weight * 2)
    })

    it('has 60 minutes total duration', () => {
      const exercise = createSeedFullWritingTest()
      expect(exercise.estimatedDurationSeconds).toBe(3600)
    })

    it('passes blueprint validation', () => {
      const exercise = createSeedFullWritingTest()
      const blueprint = createFullWritingBlueprint('test')
      const result = validateExerciseAgainstBlueprint(exercise, blueprint)
      expect(result.valid).toBe(true)
    })
  })

  describe('Full Speaking Simulation', () => {
    it('has exactly 3 parts', () => {
      const exercise = createSeedFullSpeakingSimulation()
      expect(exercise.parts).toHaveLength(3)
    })

    it('has Part 2 with 60 seconds preparation', () => {
      const exercise = createSeedFullSpeakingSimulation()
      const part2 = exercise.parts.find(p => p.partNumber === 2)!
      expect(part2.preparationSeconds).toBe(60)
    })

    it('has Part 2 with 120 seconds response', () => {
      const exercise = createSeedFullSpeakingSimulation()
      const part2 = exercise.parts.find(p => p.partNumber === 2)!
      expect(part2.responseSeconds).toBe(120)
    })

    it('has approximately 11-14 minutes total', () => {
      const exercise = createSeedFullSpeakingSimulation()
      expect(exercise.totalDurationSeconds).toBeGreaterThanOrEqual(660)
      expect(exercise.totalDurationSeconds).toBeLessThanOrEqual(840)
    })

    it('passes blueprint validation', () => {
      const exercise = createSeedFullSpeakingSimulation()
      const blueprint = createFullSpeakingBlueprint('test')
      const result = validateExerciseAgainstBlueprint(exercise, blueprint)
      expect(result.valid).toBe(true)
    })
  })

  describe('Academic vs General Training', () => {
    it('reading exercises specify variant', () => {
      const exercise = createSeedFullReadingTest()
      expect(exercise.ieltsVariant).toBe('academic')
    })

    it('writing exercises specify variant', () => {
      const exercise = createSeedFullWritingTest()
      expect(exercise.ieltsVariant).toBe('academic')
    })
  })

  describe('Focused exercises are not labelled as full tests', () => {
    it('focused practice has correct mode', () => {
      const exercise = createSeedFullReadingTest()
      exercise.mode = 'focused_practice'
      expect(exercise.mode).not.toBe('full_test')
    })
  })
})
