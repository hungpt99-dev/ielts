import { describe, it, expect } from 'vitest'
import {
  MultipleChoiceScoring,
  GapFillScoring,
  TrueFalseScoring,
  ErrorCorrectionScoring,
  MatchingScoring,
  ShortAnswerScoring,
  RewriteScoring,
  ScoringEngine,
  createDefaultScoringEngine,
} from '../scoringStrategies'
import type { ExerciseQuestion } from '../models'
import type { MatchingPair } from '../types'

function makeQuestion(overrides: Partial<ExerciseQuestion>): ExerciseQuestion {
  return {
    id: 'q1',
    type: 'multiple-choice',
    question: 'Test question',
    correctAnswer: 'A',
    explanation: { correctAnswer: 'A', explanation: 'Test explanation' },
    points: 1,
    ...overrides,
  }
}

describe('MultipleChoiceScoring', () => {
  const strategy = new MultipleChoiceScoring()

  it('scores correct answer as 1/1', () => {
    const q = makeQuestion({ correctAnswer: 'B' })
    expect(strategy.evaluate(q, 'B')).toEqual({ isCorrect: true, score: 1, maxScore: 1 })
  })

  it('scores incorrect answer as 0/1', () => {
    const q = makeQuestion({ correctAnswer: 'B' })
    expect(strategy.evaluate(q, 'A')).toEqual({ isCorrect: false, score: 0, maxScore: 1 })
  })

  it('is case insensitive', () => {
    const q = makeQuestion({ correctAnswer: 'B' })
    expect(strategy.evaluate(q, 'b')).toEqual({ isCorrect: true, score: 1, maxScore: 1 })
  })

  it('handles empty answer as incorrect', () => {
    const q = makeQuestion({ correctAnswer: 'A' })
    const result = strategy.evaluate(q, '')
    expect(result.isCorrect).toBe(false)
    expect(result.score).toBe(0)
  })

  it('respects custom points', () => {
    const q = makeQuestion({ correctAnswer: 'C', points: 3 })
    expect(strategy.evaluate(q, 'C')).toEqual({ isCorrect: true, score: 3, maxScore: 3 })
  })
})

describe('GapFillScoring', () => {
  const strategy = new GapFillScoring()

  it('scores exact match as correct', () => {
    const q = makeQuestion({ type: 'gap-fill', correctAnswer: 'architecture' })
    expect(strategy.evaluate(q, 'architecture')).toEqual({ isCorrect: true, score: 1, maxScore: 1 })
  })

  it('is case insensitive', () => {
    const q = makeQuestion({ type: 'gap-fill', correctAnswer: 'Architecture' })
    expect(strategy.evaluate(q, 'architecture')).toEqual({ isCorrect: true, score: 1, maxScore: 1 })
  })

  it('trims whitespace', () => {
    const q = makeQuestion({ type: 'gap-fill', correctAnswer: 'architecture' })
    expect(strategy.evaluate(q, '  architecture  ')).toEqual({ isCorrect: true, score: 1, maxScore: 1 })
  })

  it('accepts acceptable answers from blanks', () => {
    const q = makeQuestion({
      type: 'gap-fill',
      correctAnswer: 'begin',
      blanks: [{ position: 0, correctAnswer: 'begin', acceptableAnswers: ['start', 'commence'] }],
    })
    expect(strategy.evaluate(q, 'start')).toEqual({ isCorrect: true, score: 1, maxScore: 1 })
    expect(strategy.evaluate(q, 'commence')).toEqual({ isCorrect: true, score: 1, maxScore: 1 })
    expect(strategy.evaluate(q, 'stop')).toEqual({ isCorrect: false, score: 0, maxScore: 1 })
  })

  it('handles array correctAnswer', () => {
    const q = makeQuestion({ type: 'gap-fill', correctAnswer: ['begin', 'start', 'commence'] })
    expect(strategy.evaluate(q, 'begin')).toEqual({ isCorrect: true, score: 1, maxScore: 1 })
    expect(strategy.evaluate(q, 'start')).toEqual({ isCorrect: true, score: 1, maxScore: 1 })
  })
})

describe('TrueFalseScoring', () => {
  const strategy = new TrueFalseScoring()

  it('scores correct true as correct', () => {
    const q = makeQuestion({ type: 'true-false', correctAnswer: 'True' })
    expect(strategy.evaluate(q, 'True')).toEqual({ isCorrect: true, score: 1, maxScore: 1 })
  })

  it('accepts single letter', () => {
    const q = makeQuestion({ type: 'true-false', correctAnswer: 'True' })
    expect(strategy.evaluate(q, 'T')).toEqual({ isCorrect: true, score: 1, maxScore: 1 })
  })

  it('scores wrong answer as incorrect', () => {
    const q = makeQuestion({ type: 'true-false', correctAnswer: 'True' })
    expect(strategy.evaluate(q, 'False')).toEqual({ isCorrect: false, score: 0, maxScore: 1 })
  })

  it('is case insensitive', () => {
    const q = makeQuestion({ type: 'true-false', correctAnswer: 'True' })
    expect(strategy.evaluate(q, 'true')).toEqual({ isCorrect: true, score: 1, maxScore: 1 })
  })
})

describe('ErrorCorrectionScoring', () => {
  const strategy = new ErrorCorrectionScoring()

  it('scores exact match as correct', () => {
    const q = makeQuestion({ type: 'error-correction', correctAnswer: 'She goes to school every day.' })
    const result = strategy.evaluate(q, 'She goes to school every day.')
    expect(result.isCorrect).toBe(true)
    expect(result.score).toBe(1)
  })

  it('scores with punctuation differences as correct', () => {
    const q = makeQuestion({ type: 'error-correction', correctAnswer: 'She goes to school every day.' })
    const result = strategy.evaluate(q, 'She goes to school every day')
    expect(result.isCorrect).toBe(true)
  })

  it('scores high word overlap as correct', () => {
    const q = makeQuestion({ type: 'error-correction', correctAnswer: 'The cat sat on the mat quietly.' })
    const result = strategy.evaluate(q, 'The cat sat on mat quietly')
    expect(result.isCorrect).toBe(true)
  })

  it('scores unrelated answer as incorrect', () => {
    const q = makeQuestion({ type: 'error-correction', correctAnswer: 'She goes to school every day.' })
    const result = strategy.evaluate(q, 'I like apples.')
    expect(result.isCorrect).toBe(false)
    expect(result.score).toBe(0)
  })

  it('gives partial credit for 50-80% word overlap', () => {
    const q = makeQuestion({ type: 'error-correction', correctAnswer: 'She goes to school every day.', points: 2 })
    const result = strategy.evaluate(q, 'She goes school every day')
    expect(result.score).toBeGreaterThan(0)
    expect(result.score).toBeLessThan(2)
  })
})

describe('MatchingScoring', () => {
  const strategy = new MatchingScoring()

  it('scores all correct pairs as full marks', () => {
    const pairs: MatchingPair[] = [
      { left: 'Word1', right: 'Definition1' },
      { left: 'Word2', right: 'Definition2' },
    ]
    const q = makeQuestion({ type: 'matching', correctAnswer: pairs, matchingPairs: pairs })
    const result = strategy.evaluate(q, [
      { left: 'Word1', right: 'Definition1' },
      { left: 'Word2', right: 'Definition2' },
    ])
    expect(result.isCorrect).toBe(true)
    expect(result.score).toBe(2)
    expect(result.maxScore).toBe(2)
  })

  it('scores partial matches', () => {
    const pairs: MatchingPair[] = [
      { left: 'Word1', right: 'Definition1' },
      { left: 'Word2', right: 'Definition2' },
    ]
    const q = makeQuestion({ type: 'matching', correctAnswer: pairs, matchingPairs: pairs })
    const result = strategy.evaluate(q, [
      { left: 'Word1', right: 'Definition1' },
      { left: 'Word2', right: 'Wrong' },
    ])
    expect(result.isCorrect).toBe(false)
    expect(result.score).toBe(1)
  })

  it('handles empty answer', () => {
    const q = makeQuestion({ type: 'matching', correctAnswer: [], matchingPairs: [] })
    const result = strategy.evaluate(q, [])
    expect(result.isCorrect).toBe(true)
    expect(result.score).toBe(0)
  })
})

describe('ShortAnswerScoring', () => {
  const strategy = new ShortAnswerScoring()

  it('scores exact match as correct', () => {
    const q = makeQuestion({ type: 'short-answer', correctAnswer: 'Paris' })
    expect(strategy.evaluate(q, 'Paris')).toEqual({ isCorrect: true, score: 1, maxScore: 1 })
  })

  it('is case insensitive', () => {
    const q = makeQuestion({ type: 'short-answer', correctAnswer: 'Paris' })
    expect(strategy.evaluate(q, 'paris')).toEqual({ isCorrect: true, score: 1, maxScore: 1 })
  })

  it('accepts contained answer', () => {
    const q = makeQuestion({ type: 'short-answer', correctAnswer: 'The capital of France is Paris' })
    const result = strategy.evaluate(q, 'Paris')
    expect(result.isCorrect).toBe(true)
  })
})

describe('RewriteScoring', () => {
  const strategy = new RewriteScoring()

  it('scores exact match as full marks', () => {
    const q = makeQuestion({ type: 'rewrite', correctAnswer: 'The meeting was postponed by the manager.', points: 2 })
    const result = strategy.evaluate(q, 'The meeting was postponed by the manager.')
    expect(result.isCorrect).toBe(true)
    expect(result.score).toBe(2)
  })

  it('scores high overlap as correct with feedback', () => {
    const q = makeQuestion({ type: 'rewrite', correctAnswer: 'The meeting was postponed by the manager', points: 2 })
    const result = strategy.evaluate(q, 'The meeting was postponed by manager')
    expect(result.isCorrect).toBe(true)
    expect(result.score).toBeGreaterThanOrEqual(1)
    expect(result.feedback).toBeTruthy()
  })

  it('gives partial credit for moderate overlap', () => {
    const q = makeQuestion({ type: 'rewrite', correctAnswer: 'The meeting was postponed by the manager because of the holiday.', points: 2 })
    const result = strategy.evaluate(q, 'The meeting was postponed')
    expect(result.score).toBe(1)
    expect(result.isCorrect).toBe(false)
  })

  it('scores unrelated answer as zero', () => {
    const q = makeQuestion({ type: 'rewrite', correctAnswer: 'The meeting was postponed by the manager.', points: 2 })
    const result = strategy.evaluate(q, 'I like ice cream.')
    expect(result.isCorrect).toBe(false)
    expect(result.score).toBe(0)
  })
})

describe('ScoringEngine', () => {
  it('uses default strategies out of the box', () => {
    const engine = createDefaultScoringEngine()
    const q = makeQuestion({ correctAnswer: 'A' })
    expect(engine.evaluate(q, 'A').isCorrect).toBe(true)
  })

  it('scores multiple questions', () => {
    const engine = createDefaultScoringEngine()
    const questions = [
      makeQuestion({ id: 'q1', type: 'multiple-choice', correctAnswer: 'A', points: 1 }),
      makeQuestion({ id: 'q2', type: 'true-false', correctAnswer: 'True', points: 1 }),
      makeQuestion({ id: 'q3', type: 'multiple-choice', correctAnswer: 'C', points: 2 }),
    ]
    const answers = new Map<string, unknown>([
      ['q1', 'A'],
      ['q2', 'True'],
      ['q3', 'B'],
    ])
    const result = engine.scoreExercise(questions, answers)
    expect(result.totalScore).toBe(2)
    expect(result.maxScore).toBe(4)
    expect(result.accuracy).toBe(50)
  })

  it('allows registering custom strategy', () => {
    const engine = new ScoringEngine()
    engine.registerStrategy(new MultipleChoiceScoring())
    const q = makeQuestion({ correctAnswer: 'A' })
    expect(engine.evaluate(q, 'A').isCorrect).toBe(true)
  })

  it('returns incorrect for unregistered question type', () => {
    const engine = new ScoringEngine()
    const q = makeQuestion({ type: 'error-correction', correctAnswer: 'test' })
    const result = engine.evaluate(q, 'test')
    expect(result.isCorrect).toBe(false)
    expect(result.score).toBe(0)
  })
})
