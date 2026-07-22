import { describe, it, expect } from 'vitest'
import {
  validateExercise,
  validateExerciseBlueprint,
  validateExerciseAgainstBlueprint,
  validateResponse,
} from '../domain/validators'
import { createFullListeningBlueprint, createFullReadingBlueprint } from '../domain/blueprints'
import { createDefaultDifficultyProfile } from '../domain/types'
import type { ReadingExercise, WritingExercise } from '../domain/types'

describe('Exercise Validators', () => {
  describe('validateExerciseBlueprint', () => {
    it('validates a correct blueprint', () => {
      const blueprint = createFullListeningBlueprint('test')
      const result = validateExerciseBlueprint(blueprint)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('rejects blueprint without id', () => {
      const blueprint = { ...createFullListeningBlueprint('test'), id: '' }
      const result = validateExerciseBlueprint(blueprint)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Blueprint must have an id')
    })

    it('rejects blueprint with non-positive duration', () => {
      const blueprint = createFullListeningBlueprint('test')
      blueprint.timing.estimatedDurationSeconds = 0
      const result = validateExerciseBlueprint(blueprint)
      expect(result.valid).toBe(false)
    })
  })

  describe('validateExercise', () => {
    it('validates a correct reading exercise', () => {
      const exercise: ReadingExercise = {
        id: 'test-reading',
        schemaVersion: 1,
        blueprintVersion: '1.0.0',
        module: 'reading',
        mode: 'focused_practice',
        family: 'objective_questions',
        title: 'Test Reading',
        instructions: ['Read and answer.'],
        source: 'built_in',
        status: 'active',
        estimatedDurationSeconds: 1200,
        difficulty: createDefaultDifficultyProfile(),
        learningObjectives: [],
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        passages: [{
          id: 'p1',
          title: 'Passage 1',
          content: 'Test content',
          wordCount: 500,
          questionGroups: [{
            id: 'g1',
            type: 'multiple_choice',
            instructions: ['Choose the correct answer.'],
            questions: [{
              id: 'q1',
              type: 'multiple_choice',
              prompt: 'What is 2+2?',
              options: ['3', '4', '5', '6'],
              correctIndex: 1,
              points: 1,
              difficulty: { difficulty: 0.5 },
              learningObjectiveIds: [],
            }],
          }],
        }],
        totalQuestionCount: 1,
      }

      const result = validateExercise(exercise)
      expect(result.valid).toBe(true)
    })

    it('rejects reading exercise without passages', () => {
      const exercise: ReadingExercise = {
        id: 'test-reading',
        schemaVersion: 1,
        blueprintVersion: '1.0.0',
        module: 'reading',
        mode: 'focused_practice',
        family: 'objective_questions',
        title: 'Test Reading',
        instructions: [],
        source: 'built_in',
        status: 'active',
        estimatedDurationSeconds: 1200,
        difficulty: createDefaultDifficultyProfile(),
        learningObjectives: [],
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        passages: [],
        totalQuestionCount: 0,
      }

      const result = validateExercise(exercise)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Reading exercise must have at least one passage')
    })

    it('detects duplicate question IDs', () => {
      const exercise: ReadingExercise = {
        id: 'test-reading',
        schemaVersion: 1,
        blueprintVersion: '1.0.0',
        module: 'reading',
        mode: 'focused_practice',
        family: 'objective_questions',
        title: 'Test Reading',
        instructions: [],
        source: 'built_in',
        status: 'active',
        estimatedDurationSeconds: 1200,
        difficulty: createDefaultDifficultyProfile(),
        learningObjectives: [],
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        passages: [{
          id: 'p1',
          title: 'Passage',
          content: 'Content',
          wordCount: 100,
          questionGroups: [
            {
              id: 'g1',
              type: 'mc',
              instructions: [],
              questions: [{
                id: 'dup-id',
                type: 'multiple_choice',
                prompt: 'Q1',
                options: ['a', 'b'],
                correctIndex: 0,
                points: 1,
                difficulty: { difficulty: 0.5 },
                learningObjectiveIds: [],
              }],
            },
            {
              id: 'g2',
              type: 'mc',
              instructions: [],
              questions: [{
                id: 'dup-id',
                type: 'multiple_choice',
                prompt: 'Q2',
                options: ['a', 'b'],
                correctIndex: 0,
                points: 1,
                difficulty: { difficulty: 0.5 },
                learningObjectiveIds: [],
              }],
            },
          ],
        }],
        totalQuestionCount: 2,
      }

      const result = validateExercise(exercise)
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('Duplicate question id'))).toBe(true)
    })

    it('validates writing exercise requires tasks', () => {
      const exercise: WritingExercise = {
        id: 'test-writing',
        schemaVersion: 1,
        blueprintVersion: '1.0.0',
        module: 'writing',
        mode: 'full_test',
        family: 'writing_task',
        title: 'Test',
        instructions: [],
        source: 'built_in',
        status: 'active',
        estimatedDurationSeconds: 3600,
        difficulty: createDefaultDifficultyProfile(),
        learningObjectives: [],
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tasks: [],
      }

      const result = validateExercise(exercise)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Writing exercise must have at least one task')
    })
  })

  describe('validateExerciseAgainstBlueprint', () => {
    it('validates matching module/mode/family', () => {
      const blueprint = createFullReadingBlueprint('test')
      const exercise: ReadingExercise = {
        id: 'test',
        schemaVersion: 1,
        blueprintVersion: '1.0.0',
        module: 'reading',
        mode: 'full_test',
        family: 'objective_questions',
        title: 'Test',
        instructions: [],
        source: 'built_in',
        status: 'active',
        estimatedDurationSeconds: 3600,
        difficulty: createDefaultDifficultyProfile(),
        learningObjectives: [],
        tags: [],
        ieltsVariant: 'academic',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        passages: Array.from({ length: 3 }, (_, i) => ({
          id: `p${i}`,
          title: `Passage ${i}`,
          content: 'Content',
          wordCount: 900,
          questionGroups: [{
            id: `g${i}`,
            type: 'mc',
            instructions: [],
            questions: Array.from({ length: i === 0 ? 13 : i === 1 ? 13 : 14 }, (_, j) => ({
              id: `q${i}-${j}`,
              type: 'multiple_choice' as const,
              prompt: `Q${j}`,
              options: ['a', 'b', 'c', 'd'],
              correctIndex: 0,
              points: 1,
              difficulty: { difficulty: 0.5 },
              learningObjectiveIds: [],
            })),
          }],
        })),
        totalQuestionCount: 40,
      }

      const result = validateExerciseAgainstBlueprint(exercise, blueprint)
      expect(result.valid).toBe(true)
    })

    it('detects module mismatch', () => {
      const blueprint = createFullListeningBlueprint('test')
      const exercise: ReadingExercise = {
        id: 'test',
        schemaVersion: 1,
        blueprintVersion: '1.0.0',
        module: 'reading',
        mode: 'full_test',
        family: 'interactive_listening',
        title: 'Test',
        instructions: [],
        source: 'built_in',
        status: 'active',
        estimatedDurationSeconds: 3600,
        difficulty: createDefaultDifficultyProfile(),
        learningObjectives: [],
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        passages: [],
        totalQuestionCount: 0,
      }

      const result = validateExerciseAgainstBlueprint(exercise, blueprint)
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('Module mismatch'))).toBe(true)
    })
  })

  describe('validateResponse', () => {
    it('validates choice response for multiple choice', () => {
      const question = {
        id: 'q1',
        type: 'multiple_choice' as const,
        prompt: 'Test',
        options: ['a', 'b'],
        correctIndex: 0,
        points: 1,
        difficulty: { difficulty: 0.5 },
        learningObjectiveIds: [],
      }

      const result = validateResponse(question, { type: 'choice', selectedIndex: 0 })
      expect(result.valid).toBe(true)
    })

    it('rejects wrong response type', () => {
      const question = {
        id: 'q1',
        type: 'multiple_choice' as const,
        prompt: 'Test',
        options: ['a', 'b'],
        correctIndex: 0,
        points: 1,
        difficulty: { difficulty: 0.5 },
        learningObjectiveIds: [],
      }

      const result = validateResponse(question, { type: 'text', value: 'hello' })
      expect(result.valid).toBe(false)
    })
  })
})
