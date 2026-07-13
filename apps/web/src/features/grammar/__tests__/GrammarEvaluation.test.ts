import { describe, it, expect } from 'vitest'

interface GrammarExerciseItem {
  id: string
  topic: string
  type: 'multiple-choice' | 'gap-fill' | 'true-false' | 'error-correction'
  question: string
  options?: string[]
  correctAnswer: string
  explanation: string
}

interface MistakeEntry {
  id: string
  mistake: string
  correction: string
  explanation: string
  source: string
  date: string
  skill: string
  status: string
  repetitionCount: number
  createdAt: string
  updatedAt: string
}

function checkAnswer(userAnswer: string, correctAnswer: string): boolean {
  return userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase()
}

function createMistakeFromIncorrect(params: {
  exercise: GrammarExerciseItem
  topic: string
  now: string
}): MistakeEntry {
  return {
    id: expect.any(String) as unknown as string,
    mistake: params.exercise.question,
    correction: params.exercise.correctAnswer,
    explanation: params.exercise.explanation,
    source: `Grammar - ${params.topic}`,
    date: params.now.slice(0, 10),
    skill: 'grammar',
    status: 'new',
    repetitionCount: 0,
    createdAt: params.now,
    updatedAt: params.now,
  }
}

function computeResults(
  exercises: GrammarExerciseItem[],
  userAnswers: Record<string, string>,
): { total: number; correct: number; mistakes: MistakeEntry[] } {
  const now = new Date().toISOString()
  const mistakes: MistakeEntry[] = []

  for (const ex of exercises) {
    const userAns = (userAnswers[ex.id] || '').trim().toLowerCase()
    const correct = ex.correctAnswer.trim().toLowerCase()
    const isCorrect = userAns === correct

    if (!isCorrect) {
      mistakes.push(createMistakeFromIncorrect({ exercise: ex, topic: 'Tenses', now }))
    }
  }

  return {
    total: exercises.length,
    correct: exercises.length - mistakes.length,
    mistakes,
  }
}

describe('GrammarEvaluation — checkAnswer', () => {
  it('compares strings case-insensitively after trim', () => {
    expect(checkAnswer('  was  ', 'was')).toBe(true)
    expect(checkAnswer('WAS', 'was')).toBe(true)
    expect(checkAnswer('were', 'was')).toBe(false)
  })

  it('matches exact multiple-choice letter', () => {
    expect(checkAnswer('B', 'B')).toBe(true)
    expect(checkAnswer('b', 'B')).toBe(true)
    expect(checkAnswer('C', 'B')).toBe(false)
  })

  it('matches gap-fill words', () => {
    expect(checkAnswer('photosynthesis', 'photosynthesis')).toBe(true)
    expect(checkAnswer('photo', 'photosynthesis')).toBe(false)
  })
})

describe('GrammarEvaluation — mistake creation from incorrect answers', () => {
  const exercises: GrammarExerciseItem[] = [
    {
      id: 'g1',
      topic: 'Tenses',
      type: 'multiple-choice',
      question: 'She ___ to school yesterday.',
      options: ['go', 'went', 'gone'],
      correctAnswer: 'went',
      explanation: 'Past tense of go is went',
    },
    {
      id: 'g2',
      topic: 'Tenses',
      type: 'gap-fill',
      question: 'I have ___ (eat) lunch.',
      correctAnswer: 'eaten',
      explanation: 'Past participle of eat',
    },
  ]

  it('creates mistakes only for incorrect answers', () => {
    const userAnswers = { g1: 'went', g2: 'eated' }
    const result = computeResults(exercises, userAnswers)

    expect(result.total).toBe(2)
    expect(result.correct).toBe(1)
    expect(result.mistakes).toHaveLength(1)
    expect(result.mistakes[0].mistake).toBe('I have ___ (eat) lunch.')
    expect(result.mistakes[0].correction).toBe('eaten')
    expect(result.mistakes[0].skill).toBe('grammar')
    expect(result.mistakes[0].status).toBe('new')
    expect(result.mistakes[0].repetitionCount).toBe(0)
  })

  it('creates mistakes for all wrong answers', () => {
    const userAnswers = { g1: 'go', g2: 'eat' }
    const result = computeResults(exercises, userAnswers)

    expect(result.total).toBe(2)
    expect(result.correct).toBe(0)
    expect(result.mistakes).toHaveLength(2)
  })
})
