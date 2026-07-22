import { describe, it, expect } from 'vitest'
import { scoreObjectiveQuestion, estimateBandFromRawScore } from '../scoring/scoring-strategies'
import {
  ObjectiveScoringStrategy,
  ReadingScoringStrategy,
  ListeningScoringStrategy,
  WritingScoringStrategy,
  GrammarScoringStrategy,
  getScoringStrategy,
} from '../scoring'
import type { ExerciseAttempt } from '../domain/types'
import { createSeedFullWritingTest, createSeedGrammarExercise } from '../infrastructure/seed-data'

describe('Scoring Engine', () => {
  describe('scoreObjectiveQuestion', () => {
    it('scores correct multiple choice', () => {
      const question = {
        id: 'q1',
        type: 'multiple_choice' as const,
        prompt: 'Test',
        options: ['a', 'b', 'c', 'd'],
        correctIndex: 2,
        points: 1,
        difficulty: { difficulty: 0.5 },
        learningObjectiveIds: [],
      }

      const result = scoreObjectiveQuestion(question, { type: 'choice', selectedIndex: 2 })
      expect(result.correct).toBe(true)
      expect(result.score).toBe(1)
      expect(result.maxScore).toBe(1)
    })

    it('scores incorrect multiple choice', () => {
      const question = {
        id: 'q1',
        type: 'multiple_choice' as const,
        prompt: 'Test',
        options: ['a', 'b', 'c', 'd'],
        correctIndex: 2,
        points: 1,
        difficulty: { difficulty: 0.5 },
        learningObjectiveIds: [],
      }

      const result = scoreObjectiveQuestion(question, { type: 'choice', selectedIndex: 0 })
      expect(result.correct).toBe(false)
      expect(result.score).toBe(0)
    })

    it('scores true/false/not given', () => {
      const question = {
        id: 'q1',
        type: 'true_false_not_given' as const,
        prompt: 'Statement',
        statement: 'Statement',
        correctAnswer: 'not_given' as const,
        points: 1,
        difficulty: { difficulty: 0.5 },
        learningObjectiveIds: [],
      }

      const correct = scoreObjectiveQuestion(question, { type: 'text', value: 'not given' })
      expect(correct.correct).toBe(true)

      const incorrect = scoreObjectiveQuestion(question, { type: 'text', value: 'true' })
      expect(incorrect.correct).toBe(false)
    })

    it('scores short answer with alternatives', () => {
      const question = {
        id: 'q1',
        type: 'short_answer' as const,
        prompt: 'What is the capital of UK?',
        correctAnswer: 'London',
        acceptableAlternatives: ['london', 'Greater London'],
        caseSensitive: false,
        points: 1,
        difficulty: { difficulty: 0.5 },
        learningObjectiveIds: [],
      }

      const result1 = scoreObjectiveQuestion(question, { type: 'text', value: 'London' })
      expect(result1.correct).toBe(true)

      const result2 = scoreObjectiveQuestion(question, { type: 'text', value: 'greater london' })
      expect(result2.correct).toBe(true)

      const result3 = scoreObjectiveQuestion(question, { type: 'text', value: 'Paris' })
      expect(result3.correct).toBe(false)
    })

    it('scores matching with partial credit', () => {
      const question = {
        id: 'q1',
        type: 'matching' as const,
        subtype: 'general_matching' as const,
        prompt: 'Match items',
        leftItems: [{ id: 'l1', content: 'A' }, { id: 'l2', content: 'B' }],
        rightItems: [{ id: 'r1', content: '1' }, { id: 'r2', content: '2' }],
        correctMatches: { l1: 'r1', l2: 'r2' },
        points: 2,
        difficulty: { difficulty: 0.5 },
        learningObjectiveIds: [],
      }

      const halfCorrect = scoreObjectiveQuestion(question, {
        type: 'matching',
        matches: { l1: 'r1', l2: 'r1' },
      })
      expect(halfCorrect.partialCredit).toBe(0.5)
      expect(halfCorrect.score).toBe(1)

      const allCorrect = scoreObjectiveQuestion(question, {
        type: 'matching',
        matches: { l1: 'r1', l2: 'r2' },
      })
      expect(allCorrect.correct).toBe(true)
      expect(allCorrect.score).toBe(2)
    })

    it('returns zero for wrong response type', () => {
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

      const result = scoreObjectiveQuestion(question, { type: 'text', value: 'wrong' })
      expect(result.correct).toBe(false)
      expect(result.score).toBe(0)
    })
  })

  describe('estimateBandFromRawScore', () => {
    it('estimates listening band correctly', () => {
      expect(estimateBandFromRawScore(39, 40, 'listening').band).toBe(9)
      expect(estimateBandFromRawScore(35, 40, 'listening').band).toBe(8)
      expect(estimateBandFromRawScore(30, 40, 'listening').band).toBe(7)
      expect(estimateBandFromRawScore(23, 40, 'listening').band).toBe(6)
    })

    it('estimates academic reading band correctly', () => {
      expect(estimateBandFromRawScore(39, 40, 'reading_academic').band).toBe(9)
      expect(estimateBandFromRawScore(35, 40, 'reading_academic').band).toBe(8)
      expect(estimateBandFromRawScore(30, 40, 'reading_academic').band).toBe(7)
    })

    it('estimates general training reading band differently', () => {
      const academic = estimateBandFromRawScore(34, 40, 'reading_academic')
      const general = estimateBandFromRawScore(34, 40, 'reading_general_training')
      expect(academic.band).toBe(7.5)
      expect(general.band).toBe(7)
    })

    it('returns low confidence for small samples', () => {
      const result = estimateBandFromRawScore(5, 10, 'listening')
      expect(result.confidence).toBeLessThan(0.5)
    })

    it('returns high confidence for full tests', () => {
      const result = estimateBandFromRawScore(30, 40, 'listening')
      expect(result.confidence).toBeGreaterThanOrEqual(0.8)
    })
  })

  describe('Scoring Strategies', () => {
    it('gets correct strategy for each module', () => {
      expect(getScoringStrategy('reading')).toBeInstanceOf(ReadingScoringStrategy)
      expect(getScoringStrategy('listening')).toBeInstanceOf(ListeningScoringStrategy)
      expect(getScoringStrategy('writing')).toBeInstanceOf(WritingScoringStrategy)
      expect(getScoringStrategy('grammar')).toBeInstanceOf(GrammarScoringStrategy)
      expect(getScoringStrategy('unknown')).toBeInstanceOf(ObjectiveScoringStrategy)
    })

    it('writing scoring requires AI evaluation', async () => {
      const exercise = createSeedFullWritingTest()
      const attempt: ExerciseAttempt = {
        id: 'attempt-1',
        exerciseId: exercise.id,
        exerciseSnapshotVersion: '1',
        status: 'submitted',
        responses: {
          'writing-task-1': { type: 'writing', content: 'My essay about the chart...', wordCount: 180 },
          'writing-task-2': { type: 'writing', content: 'My essay about technology...', wordCount: 280 },
        },
        submittedAt: new Date().toISOString(),
        elapsedSeconds: 3600,
      }

      const strategy = new WritingScoringStrategy()
      const result = await strategy.score(exercise, attempt)
      expect(result.requiresAiEvaluation).toBe(true)
    })

    it('grammar scoring handles auto-scoring-reliable flag', async () => {
      const exercise = createSeedGrammarExercise()
      const attempt: ExerciseAttempt = {
        id: 'attempt-1',
        exerciseId: exercise.id,
        exerciseSnapshotVersion: '1',
        status: 'submitted',
        responses: {
          'grammar-item-1': { type: 'choice', selectedIndex: 0 },
          'grammar-item-2': { type: 'choice', selectedIndex: 1 },
          'grammar-item-3': { type: 'choice', selectedIndex: 1 },
        },
        submittedAt: new Date().toISOString(),
        elapsedSeconds: 300,
      }

      const strategy = new GrammarScoringStrategy()
      const result = await strategy.score(exercise, attempt)
      expect(result.rawScore).toBe(3)
      expect(result.maximumScore).toBe(3)
      expect(result.accuracy).toBe(1)
    })
  })
})
