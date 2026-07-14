import { describe, it, expect } from 'vitest'
import type { Exercise, ExerciseDifficulty, ExerciseSourceType } from '@ielts/learning-engine'
import { exerciseToEntry } from '../exercise-to-entry'

function makeExercise(overrides?: Partial<Exercise>): Exercise {
  return {
    id: 'ex-1',
    sessionId: 'sess-1',
    skill: 'reading',
    exerciseType: 'quiz',
    objectiveId: 'obj-1',
    title: 'Reading Test',
    instructions: 'Read and answer',
    content: { passage: 'Some text' },
    questions: [{ id: 'q1', type: 'multiple-choice', text: 'What?', options: ['A', 'B'], answer: 0 }] as any,
    difficulty: 'medium' as ExerciseDifficulty,
    estimatedMinutes: 15,
    sourceType: 'ai-generated' as ExerciseSourceType,
    sourceIds: ['src-1'],
    explanationPolicy: 'after-attempt',
    evaluationPolicy: 'deterministic',
    metadata: { focusAreas: ['main-idea'], contextSnapshotHash: 'abc', schemaVersion: '1' },
    ...overrides,
  }
}

describe('exerciseToEntry', () => {
  it('maps a complete exercise to storage entry', () => {
    const result = exerciseToEntry(makeExercise())
    expect(result.id).toBe('ex-1')
    expect(result.title).toBe('Reading Test')
    expect(result.description).toBe('Read and answer')
    expect(result.skill).toBe('reading')
    expect(result.source).toBe('ai-generated')
    expect(result.difficulty).toBe('intermediate')
    expect(typeof result.content).toBe('string')
    expect(typeof result.questions).toBe('string')
    expect(typeof result.metadata).toBe('string')
    expect(result.createdAt).toBeTruthy()
    expect(result.updatedAt).toBeTruthy()
  })

  it('normalizes difficulty: easy → beginner', () => {
    const result = exerciseToEntry(makeExercise({ difficulty: 'easy' as ExerciseDifficulty }))
    expect(result.difficulty).toBe('beginner')
  })

  it('normalizes difficulty: hard → advanced', () => {
    const result = exerciseToEntry(makeExercise({ difficulty: 'hard' as ExerciseDifficulty }))
    expect(result.difficulty).toBe('advanced')
  })

  it('normalizes difficulty: adaptive → intermediate', () => {
    const result = exerciseToEntry(makeExercise({ difficulty: 'adaptive' as ExerciseDifficulty }))
    expect(result.difficulty).toBe('intermediate')
  })

  it('normalizes sourceType: saved-content → web-content', () => {
    const result = exerciseToEntry(makeExercise({ sourceType: 'saved-content' as ExerciseSourceType }))
    expect(result.source).toBe('web-content')
  })

  it('normalizes sourceType: unknown → ai-generated', () => {
    const result = exerciseToEntry(makeExercise({ sourceType: 'unknown' as ExerciseSourceType }))
    expect(result.source).toBe('ai-generated')
  })

  it('serializes object content to JSON string', () => {
    const result = exerciseToEntry(makeExercise())
    expect(() => JSON.parse(result.content)).not.toThrow()
    const parsed = JSON.parse(result.content)
    expect(parsed.passage).toBe('Some text')
  })

  it('serializes array questions to JSON string', () => {
    const result = exerciseToEntry(makeExercise())
    expect(() => JSON.parse(result.questions)).not.toThrow()
    const parsed = JSON.parse(result.questions)
    expect(Array.isArray(parsed)).toBe(true)
  })

  it('passes through string content unchanged', () => {
    const result = exerciseToEntry(makeExercise({ content: { passage: 'hello' } } as any))
    // content comes as object, must serialize
    expect(typeof result.content).toBe('string')
    expect(JSON.parse(result.content).passage).toBe('hello')
  })

  it('handles missing fields with defaults', () => {
    const minimal = makeExercise({ title: undefined as any, instructions: undefined as any, skill: undefined as any })
    const result = exerciseToEntry(minimal)
    expect(result.title).toBe('Exercise')
    expect(result.description).toBe('')
    expect(result.skill).toBe('reading')
  })

  it('normalizes skill: vocab → vocabulary', () => {
    const result = exerciseToEntry(makeExercise({ skill: 'vocab' as any }))
    expect(result.skill).toBe('vocabulary')
  })

  it('normalizes invalid skill → reading', () => {
    const result = exerciseToEntry(makeExercise({ skill: 'invalid-skill' as any }))
    expect(result.skill).toBe('reading')
  })

  it('uses consistent timestamps for createdAt and updatedAt', () => {
    const result = exerciseToEntry(makeExercise())
    expect(result.createdAt).toBe(result.updatedAt)
  })

  it('passes exerciseEntrySchema validation', () => {
    const result = exerciseToEntry(makeExercise())
    expect(result).toBeDefined()
  })
})
