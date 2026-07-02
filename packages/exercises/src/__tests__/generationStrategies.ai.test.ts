import { describe, it, expect, vi } from 'vitest'
import type { ExerciseSkill, ExerciseDifficulty } from '../types'
import { AiGenerationStrategy, GenerationEngine, createDefaultGenerationEngine, WebContentGenerationStrategy } from '../generationStrategies'

describe('AiGenerationStrategy', () => {
  it('generates exercises from AI-generated questions', async () => {
    const generateFn = vi.fn().mockResolvedValue({
      questions: [
        { type: 'multiple-choice' as const, question: 'What is IELTS?', options: ['A', 'B', 'C', 'D'], correctAnswer: 0, explanation: 'IELTS is...', points: 2 },
        { type: 'gap-fill' as const, question: 'IELTS stands for ________ English Language Testing System.', correctAnswer: 'International', explanation: 'IELTS = International...', points: 1 },
      ],
    })
    const strategy = new AiGenerationStrategy(generateFn)
    const result = await strategy.generate({
      skill: 'reading' as ExerciseSkill,
      topic: 'IELTS Overview',
      difficulty: 'medium' as ExerciseDifficulty,
      count: 2,
      source: 'ai-generated' as const,
    })
    expect(result.exercises).toHaveLength(1)
    expect(result.errors).toHaveLength(0)
    const exercise = result.exercises[0]
    expect(exercise.questions).toHaveLength(2)
    expect(exercise.skill).toBe('reading')
    expect(exercise.source).toBe('ai-generated')
  })

  it('returns error when generate function throws', async () => {
    const generateFn = vi.fn().mockRejectedValue(new Error('AI API failure'))
    const strategy = new AiGenerationStrategy(generateFn)
    const result = await strategy.generate({
      skill: 'reading' as ExerciseSkill,
      topic: 'Test',
      difficulty: 'easy' as ExerciseDifficulty,
      count: 1,
      source: 'ai-generated' as const,
    })
    expect(result.exercises).toHaveLength(0)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toContain('AI API failure')
  })

  it('canGenerate returns true when generateFn is defined', () => {
    const strategy = new AiGenerationStrategy(vi.fn())
    expect(strategy.canGenerate({} as any)).toBe(true)
  })
})

describe('WebContentGenerationStrategy', () => {
  it('falls back to AI generation when aiGenerateFn is provided', async () => {
    const aiGenerateFn = vi.fn().mockResolvedValue({
      questions: [{ type: 'multiple-choice' as const, question: 'Test?', options: ['A', 'B'], correctAnswer: 0, explanation: 'Simple' }],
    })
    const strategy = new WebContentGenerationStrategy(aiGenerateFn)
    const result = await strategy.generate({
      skill: 'reading' as ExerciseSkill,
      topic: 'Web',
      difficulty: 'easy' as ExerciseDifficulty,
      count: 1,
      source: 'web-content' as const,
      sourceData: { text: 'Some article content here' },
    })
    expect(result.exercises).toHaveLength(1)
    expect(aiGenerateFn).toHaveBeenCalled()
  })

  it('generates gap-fill exercises from plain text source data', async () => {
    const strategy = new WebContentGenerationStrategy()
    const result = await strategy.generate({
      skill: 'reading' as ExerciseSkill,
      topic: 'Nature',
      difficulty: 'easy' as ExerciseDifficulty,
      count: 3,
      source: 'web-content' as const,
      sourceData: 'The quick brown fox jumps. The lazy dog sleeps near the river bank. The cat runs fast.',
    })
    expect(result.exercises).toHaveLength(1)
    expect(result.exercises[0].questions.length).toBeGreaterThan(0)
    expect(result.exercises[0].questions[0].type).toBe('gap-fill')
  })

  it('returns error when no source data provided', async () => {
    const strategy = new WebContentGenerationStrategy()
    const result = await strategy.generate({
      skill: 'reading' as ExerciseSkill,
      topic: 'Test',
      difficulty: 'easy' as ExerciseDifficulty,
      count: 1,
      source: 'web-content' as const,
    })
    expect(result.exercises).toHaveLength(0)
    expect(result.errors).toHaveLength(1)
  })
})

describe('GenerationEngine with AI strategy', () => {
  it('createDefaultGenerationEngine creates engine with all strategies', () => {
    const aiFn = vi.fn()
    const engine = createDefaultGenerationEngine([], aiFn)
    expect(engine).toBeInstanceOf(GenerationEngine)
  })

  it('generateFromBestSource prefers built-in over AI', async () => {
    const aiFn = vi.fn().mockResolvedValue({ questions: [] })
    const builtInExercises = [{
      id: 'builtin-1',
      title: 'Built-in Reading',
      skill: 'reading' as ExerciseSkill,
      topic: 'Science',
      source: 'built-in' as const,
      difficulty: 'easy' as ExerciseDifficulty,
      questions: [],
      totalPoints: 0,
      estimatedMinutes: 5,
      status: 'published' as const,
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }]
    const engine = createDefaultGenerationEngine(builtInExercises, aiFn)
    const result = await engine.generateFromBestSource({
      skill: 'reading' as ExerciseSkill,
      topic: 'Science',
      difficulty: 'easy' as ExerciseDifficulty,
      count: 1,
      source: 'built-in' as const,
    })
    expect(result.exercises).toHaveLength(1)
    expect(result.exercises[0].id).toBe('builtin-1')
  })
})
