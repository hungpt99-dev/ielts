import { describe, it, expect } from 'vitest'
import {
  normalizeAnswer,
  checkAnswer,
  computeAccuracy,
} from '../ListeningPractice'
import type { ListeningQuestion } from '../../../models'

describe('ListeningEvaluation — normalizeAnswer', () => {
  it('compares strings case-insensitively after trim', () => {
    expect(normalizeAnswer('  Answer  ', 'answer')).toBe(true)
    expect(normalizeAnswer('ANSWER', 'answer')).toBe(true)
    expect(normalizeAnswer('wrong', 'right')).toBe(false)
  })

  it('handles undefined/null as false', () => {
    expect(normalizeAnswer(undefined, 'test')).toBe(false)
    expect(normalizeAnswer(null, 'test')).toBe(false)
  })

  it('compares numbers directly', () => {
    expect(normalizeAnswer(3, 3)).toBe(true)
    expect(normalizeAnswer(3, 4)).toBe(false)
  })

  it('uses SOME match for arrays (any element matches)', () => {
    expect(normalizeAnswer(['A', 'B'], ['a', 'b'])).toBe(true)
    expect(normalizeAnswer(['A', 'B'], ['x', 'y'])).toBe(false)
  })

  it('falls back to string coercion for mismatched types', () => {
    expect(normalizeAnswer(42, '42')).toBe(true)
  })
})

describe('ListeningEvaluation — checkAnswer', () => {
  it('evaluates gap-fill by blanks comparison', () => {
    const q: ListeningQuestion = {
      id: 'q1',
      type: 'gap-fill',
      question: 'Fill the gaps',
      blanks: ['photosynthesis', 'energy'],
      correctAnswer: '',
      explanation: '',
    }
    expect(checkAnswer(q, ['photosynthesis', 'energy'])).toBe(true)
    expect(checkAnswer(q, ['Photosynthesis', 'ENERGY'])).toBe(true)
    expect(checkAnswer(q, ['photosynthesis', 'water'])).toBe(false)
    expect(checkAnswer(q, [])).toBe(false)
  })

  it('evaluates multiple-choice by normalizeAnswer on correctAnswer', () => {
    const q: ListeningQuestion = {
      id: 'q2',
      type: 'multiple-choice',
      question: 'What is the capital?',
      options: ['Paris', 'London', 'Berlin'],
      correctAnswer: 1,
      explanation: '',
    }
    expect(checkAnswer(q, 1)).toBe(true)
    expect(checkAnswer(q, 0)).toBe(false)
  })
})

describe('ListeningEvaluation — computeAccuracy', () => {
  it('returns 0 for zero total', () => {
    expect(computeAccuracy(3, 0)).toBe(0)
  })

  it('computes percentage rounded to nearest integer', () => {
    expect(computeAccuracy(2, 4)).toBe(50)
    expect(computeAccuracy(7, 10)).toBe(70)
    expect(computeAccuracy(0, 5)).toBe(0)
  })
})
