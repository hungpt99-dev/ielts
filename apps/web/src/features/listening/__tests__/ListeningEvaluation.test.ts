import { describe, it, expect } from 'vitest'
import type { ListeningQuestion } from '../../../models'

function computeAccuracy(correct: number, total: number): number {
  if (total <= 0) return 0
  return Math.round((correct / total) * 100)
}

function normalizeAnswer(userAnswer: unknown, correctAnswer: string | number | string[]): boolean {
  if (userAnswer === undefined || userAnswer === null) return false
  if (typeof userAnswer === 'string' && typeof correctAnswer === 'string') {
    return userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim()
  }
  if (typeof userAnswer === 'number' && typeof correctAnswer === 'number') {
    return userAnswer === correctAnswer
  }
  if (Array.isArray(userAnswer) && Array.isArray(correctAnswer)) {
    return userAnswer.some((v: string) =>
      correctAnswer.some((c: string) => v.toLowerCase().trim() === c.toLowerCase().trim())
    )
  }
  return String(userAnswer).toLowerCase().trim() === String(correctAnswer).toLowerCase().trim()
}

function checkAnswer(question: ListeningQuestion, answer: unknown): boolean {
  if (question.type === 'gap-fill') {
    const blanks = question.blanks || []
    const userBlanks = (answer as string[]) || []
    if (blanks.length === 0) return false
    return blanks.every((b, i) => {
      const userVal = userBlanks[i]?.toLowerCase().trim() || ''
      return b.toLowerCase().trim() === userVal
    })
  }
  return normalizeAnswer(answer, question.correctAnswer)
}

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
