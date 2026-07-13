import { describe, it, expect } from 'vitest'
import { gradeAnswer } from '../deterministic-grader'
import type { ExerciseQuestion } from '../../entities/exercise-question'

describe('deterministic-grader — gradeAnswer', () => {
  describe('multiple-choice', () => {
    const question: ExerciseQuestion = {
      type: 'multiple-choice',
      question: 'What is 2+2?',
      options: ['3', '4', '5'],
      correctIndex: 1,
      explanation: '2+2 equals 4',
    }

    it('returns correct for matching answer', () => {
      const result = gradeAnswer(question, 1)
      expect(result.status).toBe('correct')
      expect(result.score).toBe(1)
      expect(result.mistakes).toHaveLength(0)
    })

    it('returns incorrect for wrong answer with mistake evidence', () => {
      const result = gradeAnswer(question, 0)
      expect(result.status).toBe('incorrect')
      expect(result.score).toBe(0)
      expect(result.mistakes).toHaveLength(1)
      expect(result.mistakes[0].category).toBe('multiple-choice')
      expect(result.mistakes[0].originalResponse).toBe('0')
    })

    it('uses deterministic evaluation method', () => {
      const result = gradeAnswer(question, 1)
      expect(result.evaluatedBy).toBe('deterministic')
      expect(result.confidence).toBe(1)
    })
  })

  describe('true-false-not-given', () => {
    const question: ExerciseQuestion = {
      type: 'true-false-not-given',
      question: 'The sky is blue?',
      answer: 'true',
      explanation: 'The sky appears blue due to Rayleigh scattering',
    }

    it('returns correct for matching case-insensitive answer', () => {
      expect(gradeAnswer(question, 'true').status).toBe('correct')
      expect(gradeAnswer(question, 'True').status).toBe('correct')
      expect(gradeAnswer(question, 'TRUE').status).toBe('correct')
    })

    it('returns incorrect for wrong answer', () => {
      const result = gradeAnswer(question, 'false')
      expect(result.status).toBe('incorrect')
      expect(result.mistakes).toHaveLength(1)
    })
  })

  describe('gap-fill', () => {
    const question: ExerciseQuestion = {
      type: 'gap-fill',
      text: 'Photosynthesis requires ___ and ___.',
      answers: ['sunlight', 'water'],
      acceptableAlternatives: [['light'], ['h2o']],
      explanation: 'Plants need sunlight and water for photosynthesis',
    }

    it('returns correct for all exact answers', () => {
      const result = gradeAnswer(question, ['sunlight', 'water'])
      expect(result.status).toBe('correct')
      expect(result.score).toBe(2)
      expect(result.mistakes).toHaveLength(0)
    })

    it('returns partially-correct for some correct', () => {
      const result = gradeAnswer(question, ['sunlight', 'wrong'])
      expect(result.status).toBe('partially-correct')
      expect(result.score).toBe(1)
    })

    it('returns incorrect for none correct', () => {
      const result = gradeAnswer(question, ['wrong1', 'wrong2'])
      expect(result.status).toBe('incorrect')
      expect(result.score).toBe(0)
    })

    it('accepts alternative answers', () => {
      const result = gradeAnswer(question, ['light', 'h2o'])
      expect(result.status).toBe('correct')
      expect(result.score).toBe(2)
    })
  })

  describe('short-answer', () => {
    const question: ExerciseQuestion = {
      type: 'short-answer',
      question: 'What is the capital of France?',
      answer: 'Paris',
      acceptableAlternatives: ['paris'],
      explanation: 'Paris is the capital',
    }

    it('returns correct for exact match', () => {
      expect(gradeAnswer(question, 'Paris').status).toBe('correct')
    })

    it('returns correct for case-insensitive match', () => {
      expect(gradeAnswer(question, 'paris').status).toBe('correct')
    })

    it('returns correct for alternative', () => {
      expect(gradeAnswer(question, 'PARIS').status).toBe('correct')
    })

    it('returns incorrect for wrong answer', () => {
      const result = gradeAnswer(question, 'London')
      expect(result.status).toBe('incorrect')
      expect(result.mistakes).toHaveLength(1)
    })
  })

  describe('unsupported type', () => {
    it('returns not-evaluable for essay type', () => {
      const question: ExerciseQuestion = {
        type: 'essay',
        prompt: 'Write an essay',
        rubric: [],
      }
      const result = gradeAnswer(question, 'My essay')
      expect(result.status).toBe('not-evaluable')
      expect(result.confidence).toBe(0)
    })
  })
})
