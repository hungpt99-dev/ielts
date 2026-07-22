import { describe, it, expect } from 'vitest'
import type { ReadingQuestion } from '../../../models'

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
    return (
      userAnswer.length === correctAnswer.length &&
      userAnswer.every((v, i) => v.toLowerCase().trim() === (correctAnswer[i] as string).toLowerCase().trim())
    )
  }
  return String(userAnswer).toLowerCase().trim() === String(correctAnswer).toLowerCase().trim()
}

function checkAnswer(question: ReadingQuestion, answer: unknown): boolean {
  if (question.type === 'matching-headings') {
    const correctMatches = question.correctMatches || {}
    const userMatches = (answer as Record<string, number>) || {}
    const keys = Object.keys(correctMatches)
    if (keys.length === 0) return false
    return keys.every((k) => userMatches[k] === correctMatches[k])
  }
  if (question.type === 'gap-fill') {
    const blanks = question.blanks || []
    const userBlanks = (answer as string[]) || []
    if (blanks.length === 0) return false
    return blanks.every((b, i) => userBlanks[i]?.toLowerCase().trim() === b.toLowerCase().trim())
  }
  return normalizeAnswer(answer, question.correctAnswer)
}

describe('ReadingEvaluation — normalizeAnswer', () => {
  it('compares strings case-insensitively after trim', () => {
    expect(normalizeAnswer('  Hello  ', 'hello')).toBe(true)
    expect(normalizeAnswer('HELLO', 'hello')).toBe(true)
    expect(normalizeAnswer('hello', 'world')).toBe(false)
  })

  it('handles undefined/null as false', () => {
    expect(normalizeAnswer(undefined, 'hello')).toBe(false)
    expect(normalizeAnswer(null, 'hello')).toBe(false)
  })

  it('compares numbers directly', () => {
    expect(normalizeAnswer(42, 42)).toBe(true)
    expect(normalizeAnswer(42, 43)).toBe(false)
  })

  it('compares arrays element-by-element case-insensitively', () => {
    expect(normalizeAnswer(['A', 'B'], ['a', 'b'])).toBe(true)
    expect(normalizeAnswer(['A', 'B'], ['a', 'c'])).toBe(false)
    expect(normalizeAnswer(['A', 'B'], ['a'])).toBe(false)
  })

  it('falls back to string coercion for mismatched types', () => {
    expect(normalizeAnswer(42, '42')).toBe(true)
    expect(normalizeAnswer('true', true)).toBe(true)
  })
})

describe('ReadingEvaluation — checkAnswer', () => {
  it('evaluates multiple-choice by correctAnswer index', () => {
    const q: ReadingQuestion = {
      id: 'q1',
      type: 'multiple-choice',
      question: 'What is 2+2?',
      options: ['3', '4', '5'],
      correctAnswer: 1,
      explanation: '2+2=4',
    }
    expect(checkAnswer(q, 1)).toBe(true)
    expect(checkAnswer(q, 0)).toBe(false)
  })

  it('evaluates true-false-not-given by string match', () => {
    const q: ReadingQuestion = {
      id: 'q2',
      type: 'true-false-not-given',
      question: 'Is the sky blue?',
      correctAnswer: 'true',
      explanation: '',
    }
    expect(checkAnswer(q, 'true')).toBe(true)
    expect(checkAnswer(q, 'True')).toBe(true)
    expect(checkAnswer(q, 'false')).toBe(false)
  })

  it('evaluates matching-headings by correctMatches key-value pairs', () => {
    const q: ReadingQuestion = {
      id: 'q3',
      type: 'matching-headings',
      question: 'Match headings to paragraphs',
      correctMatches: { A: 0, B: 1, C: 2 },
      explanation: '',
      correctAnswer: '',
    }
    expect(checkAnswer(q, { A: 0, B: 1, C: 2 })).toBe(true)
    expect(checkAnswer(q, { A: 0, B: 2, C: 1 })).toBe(false)
    expect(checkAnswer(q, {})).toBe(false)
  })

  it('evaluates gap-fill by blanks array comparison', () => {
    const q: ReadingQuestion = {
      id: 'q4',
      type: 'gap-fill',
      question: 'Fill in the blanks',
      blanks: ['photosynthesis', 'chlorophyll'],
      correctAnswer: '',
      explanation: '',
    }
    expect(checkAnswer(q, ['photosynthesis', 'chlorophyll'])).toBe(true)
    expect(checkAnswer(q, ['Photosynthesis', 'CHLOROPHYLL'])).toBe(true)
    expect(checkAnswer(q, ['photosynthesis', 'water'])).toBe(false)
    expect(checkAnswer(q, [])).toBe(false)
  })

  it('returns false for empty matching-headings', () => {
    const q: ReadingQuestion = {
      id: 'q5',
      type: 'matching-headings',
      question: 'Match',
      correctMatches: {},
      correctAnswer: '',
      explanation: '',
    }
    expect(checkAnswer(q, { A: 0 })).toBe(false)
  })

  it('returns false for empty gap-fill blanks', () => {
    const q: ReadingQuestion = {
      id: 'q6',
      type: 'gap-fill',
      question: 'Fill',
      blanks: [],
      correctAnswer: '',
      explanation: '',
    }
    expect(checkAnswer(q, ['a'])).toBe(false)
  })
})

describe('ReadingEvaluation — computeAccuracy', () => {
  it('returns 0 for zero total', () => {
    expect(computeAccuracy(5, 0)).toBe(0)
  })

  it('computes percentage rounded to nearest integer', () => {
    expect(computeAccuracy(3, 4)).toBe(75)
    expect(computeAccuracy(1, 3)).toBe(33)
    expect(computeAccuracy(10, 10)).toBe(100)
    expect(computeAccuracy(0, 10)).toBe(0)
  })
})
