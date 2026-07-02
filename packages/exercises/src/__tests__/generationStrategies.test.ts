import { describe, it, expect } from 'vitest'
import {
  BuiltInGenerationStrategy,
  MistakeReviewGenerationStrategy,
  VocabularyPracticeGenerationStrategy,
  WebContentGenerationStrategy,
  GenerationEngine,
  createDefaultGenerationEngine,
} from '../generationStrategies'
import type { Exercise } from '../models'
import type { ExerciseDifficulty } from '../types'

function makeBuiltInExercise(overrides?: Partial<Exercise>): Exercise {
  const now = new Date().toISOString()
  return {
    id: 'builtin-1',
    title: 'Grammar Basics',
    skill: 'grammar',
    topic: 'Present Simple',
    source: 'built-in',
    difficulty: 'beginner',
    questions: [
      {
        id: 'q1',
        type: 'multiple-choice',
        question: 'She ___ to school every day.',
        correctAnswer: 'goes',
        explanation: { correctAnswer: 'goes', explanation: 'Third person singular' },
        points: 1,
      },
    ],
    totalPoints: 1,
    estimatedMinutes: 5,
    status: 'published',
    tags: ['grammar', 'present-simple'],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

describe('BuiltInGenerationStrategy', () => {
  it('generates exercises from registered built-in content', async () => {
    const strategy = new BuiltInGenerationStrategy([makeBuiltInExercise()])
    const result = await strategy.generate({ skill: 'grammar', topic: 'Present Simple', difficulty: 'beginner', count: 5, source: 'built-in' })
    expect(result.exercises.length).toBe(1)
    expect(result.errors).toHaveLength(0)
  })

  it('filters by skill', async () => {
    const strategy = new BuiltInGenerationStrategy([
      makeBuiltInExercise({ skill: 'grammar', id: 'g1' }),
      makeBuiltInExercise({ skill: 'vocabulary', id: 'v1' }),
    ])
    const result = await strategy.generate({ skill: 'vocabulary', topic: '', difficulty: 'beginner', count: 5, source: 'built-in' })
    expect(result.exercises.length).toBe(1)
    expect(result.exercises[0].id).toBe('v1')
  })

  it('returns empty when no exercises match', async () => {
    const strategy = new BuiltInGenerationStrategy()
    const result = await strategy.generate({ skill: 'reading', topic: 'Unknown', difficulty: 'beginner', count: 5, source: 'built-in' })
    expect(result.exercises).toHaveLength(0)
  })

  it('canGenerate returns true when matching exercises exist', () => {
    const strategy = new BuiltInGenerationStrategy([makeBuiltInExercise()])
    expect(strategy.canGenerate({ skill: 'grammar', topic: 'Present Simple', difficulty: 'beginner', count: 1, source: 'built-in' })).toBe(true)
    expect(strategy.canGenerate({ skill: 'reading', topic: 'Unknown', difficulty: 'beginner', count: 1, source: 'built-in' })).toBe(false)
  })
})

describe('MistakeReviewGenerationStrategy', () => {
  const strategy = new MistakeReviewGenerationStrategy()

  it('generates error-correction exercises from mistakes', async () => {
    const mistakes = [
      { mistake: 'He go to school', correction: 'He goes to school', explanation: 'Third person singular', skill: 'grammar' as const },
      { mistake: 'She don\'t like it', correction: 'She doesn\'t like it', explanation: 'Negative form', skill: 'grammar' as const },
    ]
    const result = await strategy.generate({
      skill: 'grammar',
      topic: 'Grammar Mistakes',
      difficulty: 'beginner' as ExerciseDifficulty,
      count: 5,
      source: 'mistake-review',
      sourceData: mistakes,
    })
    expect(result.exercises).toHaveLength(1)
    expect(result.errors).toHaveLength(0)
    expect(result.exercises[0].source).toBe('mistake-review')
    expect(result.exercises[0].questions).toHaveLength(2)
    expect(result.exercises[0].questions[0].type).toBe('error-correction')
  })

  it('returns error when no mistakes provided', async () => {
    const result = await strategy.generate({
      skill: 'grammar',
      topic: 'Test',
      difficulty: 'beginner',
      count: 5,
      source: 'mistake-review',
      sourceData: [],
    })
    expect(result.exercises).toHaveLength(0)
    expect(result.errors).toHaveLength(1)
  })

  it('canGenerate only for mistake-review source with array data', () => {
    expect(strategy.canGenerate({ skill: 'grammar', topic: '', difficulty: 'beginner', count: 1, source: 'mistake-review', sourceData: [{ mistake: 'test', correction: 'fix', explanation: '', skill: 'grammar' }] })).toBe(true)
    expect(strategy.canGenerate({ skill: 'grammar', topic: '', difficulty: 'beginner', count: 1, source: 'ai-generated' })).toBe(false)
    expect(strategy.canGenerate({ skill: 'grammar', topic: '', difficulty: 'beginner', count: 1, source: 'built-in' })).toBe(false)
  })
})

describe('VocabularyPracticeGenerationStrategy', () => {
  const strategy = new VocabularyPracticeGenerationStrategy()

  it('generates vocabulary exercises from word list', async () => {
    const vocab = [
      { word: 'abandon', meaning: 'to leave behind', exampleSentence: 'They had to abandon the project.' },
      { word: 'beneficial', meaning: 'helpful or useful', exampleSentence: 'Exercise is beneficial to health.' },
    ]
    const result = await strategy.generate({
      skill: 'vocabulary',
      topic: 'Word List',
      difficulty: 'intermediate',
      count: 10,
      source: 'vocabulary-practice',
      sourceData: vocab,
    })
    expect(result.exercises).toHaveLength(1)
    expect(result.errors).toHaveLength(0)
    expect(result.exercises[0].source).toBe('vocabulary-practice')
    expect(result.exercises[0].questions.length).toBeGreaterThanOrEqual(4)
    const types = result.exercises[0].questions.map(q => q.type)
    expect(types).toContain('gap-fill')
    expect(types).toContain('multiple-choice')
  })

  it('returns error when no vocab provided', async () => {
    const result = await strategy.generate({
      skill: 'vocabulary',
      topic: 'Test',
      difficulty: 'beginner',
      count: 5,
      source: 'vocabulary-practice',
      sourceData: [],
    })
    expect(result.exercises).toHaveLength(0)
    expect(result.errors).toHaveLength(1)
  })
})

describe('WebContentGenerationStrategy', () => {
  it('generates gap-fill exercises from text content', async () => {
    const strategy = new WebContentGenerationStrategy()
    const result = await strategy.generate({
      skill: 'reading',
      topic: 'Climate Change',
      difficulty: 'intermediate',
      count: 5,
      source: 'web-content',
      sourceData: 'Climate change is one of the most pressing issues of our time. Rising temperatures are causing glaciers to melt. Sea levels are increasing rapidly.',
    })
    expect(result.exercises).toHaveLength(1)
    expect(result.exercises[0].source).toBe('web-content')
    expect(result.exercises[0].questions.length).toBeGreaterThan(0)
    expect(result.exercises[0].questions[0].type).toBe('gap-fill')
  })

  it('returns error when no source data provided', async () => {
    const strategy = new WebContentGenerationStrategy()
    const result = await strategy.generate({
      skill: 'reading',
      topic: 'Test',
      difficulty: 'beginner',
      count: 5,
      source: 'web-content',
    })
    expect(result.exercises).toHaveLength(0)
    expect(result.errors).toContain('No source data provided for web content generation')
  })

  it('canGenerate only for web-content source with data', () => {
    const strategy = new WebContentGenerationStrategy()
    expect(strategy.canGenerate({ skill: 'reading', topic: '', difficulty: 'beginner', count: 1, source: 'web-content', sourceData: 'Some text' })).toBe(true)
    expect(strategy.canGenerate({ skill: 'reading', topic: '', difficulty: 'beginner', count: 1, source: 'web-content' })).toBe(false)
  })
})

describe('GenerationEngine', () => {
  it('orchestrates strategies by source', async () => {
    const engine = createDefaultGenerationEngine([makeBuiltInExercise()])

    const result = await engine.generate({
      skill: 'grammar',
      topic: 'Present Simple',
      difficulty: 'beginner',
      count: 5,
      source: 'built-in',
    })
    expect(result.exercises).toHaveLength(1)
  })

  it('returns error for unregistered source', async () => {
    const engine = new GenerationEngine()
    const result = await engine.generate({
      skill: 'grammar',
      topic: 'Test',
      difficulty: 'beginner',
      count: 1,
      source: 'built-in',
    })
    expect(result.exercises).toHaveLength(0)
    expect(result.errors).toHaveLength(1)
  })

  it('generateFromBestSource prefers built-in then AI', async () => {
    const engine = createDefaultGenerationEngine([makeBuiltInExercise()])

    const result = await engine.generateFromBestSource({
      skill: 'grammar',
      topic: 'Present Simple',
      difficulty: 'beginner',
      count: 5,
      source: 'built-in',
    })
    expect(result.exercises).toHaveLength(1)
  })

  it('generateFromBestSource returns error when no strategy works', async () => {
    const engine = new GenerationEngine()
    const result = await engine.generateFromBestSource({
      skill: 'grammar',
      topic: 'Unknown',
      difficulty: 'beginner',
      count: 1,
      source: 'built-in',
    })
    expect(result.exercises).toHaveLength(0)
    expect(result.errors).toHaveLength(1)
  })
})
