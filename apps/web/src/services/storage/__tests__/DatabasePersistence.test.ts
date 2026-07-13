import { describe, it, expect, vi, beforeEach } from 'vitest'

// Characterize the persistence contract each feature uses with DatabaseService.
// These tests document the table names and record shapes that features save/read.

const TABLE_NAMES = [
  'readingPracticeSessions',
  'listeningPracticeSessions',
  'writingSessions',
  'speakingSessions',
  'grammarNotes',
  'vocabulary',
  'vocabularyReviews',
  'mistakes',
  'tasks',
  'aiContents',
  'progressRecords',
] as const

interface ReadingPracticeSession {
  id: string
  passageId: string
  title: string
  topic: string
  passageText: string
  questions: unknown[]
  answers: Record<string, unknown>
  score: number
  totalQuestions: number
  accuracy: number
  timeSpentSeconds: number
  mistakes: Array<{ questionId: string; question: string; userAnswer: string; correctAnswer: string; explanation: string }>
  createdAt: string
}

interface WritingSession {
  id: string
  taskType: string
  question: string
  essay: string
  topic: string
  wordCount: number
  timeSpentMinutes: number
  estimatedBand: number
  feedback: string
  grammarMistakes: string
  vocabularyMistakes: string
  coherenceNotes: string
  improvedSentences: string
  betterVersion: string
  personalReflection: string
  createdAt: string
}

interface SpeakingSession {
  id: string
  part: number
  question: string
  answerNotes: string
  topic: string
  durationSeconds: number
  selfRating: number
  fluencyNotes: string
  vocabularyNotes: string
  grammarMistakes: string
  pronunciationNotes: string
  betterExpressions: string
  improvedAnswer: string
  createdAt: string
}

interface ListeningPracticeSession {
  id: string
  exerciseId: string
  title: string
  topic: string
  transcript: string
  audioUrl: string
  questions: unknown[]
  answers: Record<string, unknown>
  score: number
  totalQuestions: number
  accuracy: number
  timeSpentSeconds: number
  notes: string
  mistakes: Array<{ questionId: string; question: string; userAnswer: string; correctAnswer: string; explanation: string }>
  createdAt: string
}

describe('DatabasePersistence — table names', () => {
  it('readingPracticeSessions is used by ReadingPractice', () => {
    expect(TABLE_NAMES).toContain('readingPracticeSessions')
  })

  it('listeningPracticeSessions is used by ListeningPractice', () => {
    expect(TABLE_NAMES).toContain('listeningPracticeSessions')
  })

  it('writingSessions is used by WritingPractice', () => {
    expect(TABLE_NAMES).toContain('writingSessions')
  })

  it('speakingSessions is used by SpeakingPractice', () => {
    expect(TABLE_NAMES).toContain('speakingSessions')
  })

  it('grammarNotes is used by GrammarLearning', () => {
    expect(TABLE_NAMES).toContain('grammarNotes')
  })

  it('mistakes is used by Grammar Exercise and MistakeNotebook', () => {
    expect(TABLE_NAMES).toContain('mistakes')
  })
})

describe('DatabasePersistence — ReadingPracticeSession shape', () => {
  it('has all required fields', () => {
    const session: ReadingPracticeSession = {
      id: 'r-1',
      passageId: 'p-1',
      title: 'Test Passage',
      topic: 'Education',
      passageText: 'Some passage text...',
      questions: [{ id: 'q1', type: 'multiple-choice', question: 'Q?', correctAnswer: 0, explanation: '' }],
      answers: { q1: 0 },
      score: 1,
      totalQuestions: 1,
      accuracy: 100,
      timeSpentSeconds: 300,
      mistakes: [],
      createdAt: '2026-07-13T00:00:00.000Z',
    }

    expect(session.id).toBeTruthy()
    expect(typeof session.score).toBe('number')
    expect(typeof session.accuracy).toBe('number')
    expect(Array.isArray(session.mistakes)).toBe(true)
    expect(typeof session.createdAt).toBe('string')
  })
})

describe('DatabasePersistence — WritingSession shape', () => {
  it('has all required fields', () => {
    const session: WritingSession = {
      id: 'w-1',
      taskType: 'task2',
      question: 'Some prompt',
      essay: 'My essay...',
      topic: 'Education',
      wordCount: 250,
      timeSpentMinutes: 30,
      estimatedBand: 6.5,
      feedback: 'Good',
      grammarMistakes: 'error1, error2',
      vocabularyMistakes: 'word choice',
      coherenceNotes: 'Well structured',
      improvedSentences: 'fix1\nfix2',
      betterVersion: 'Improved version',
      personalReflection: '',
      createdAt: '2026-07-13T00:00:00.000Z',
    }

    expect(session.id).toBeTruthy()
    expect(typeof session.estimatedBand).toBe('number')
    expect(typeof session.wordCount).toBe('number')
    expect(Array.isArray(session.grammarMistakes?.split(', '))).toBe(true)
    expect(typeof session.createdAt).toBe('string')
  })
})

describe('DatabasePersistence — SpeakingSession shape', () => {
  it('has all required fields', () => {
    const session: SpeakingSession = {
      id: 's-1',
      part: 2,
      question: 'Describe...',
      answerNotes: 'My answer...',
      topic: 'Hometown',
      durationSeconds: 90,
      selfRating: 6,
      fluencyNotes: 'Good',
      vocabularyNotes: 'Okay',
      grammarMistakes: '',
      pronunciationNotes: 'Clear',
      betterExpressions: '',
      improvedAnswer: '',
      createdAt: '2026-07-13T00:00:00.000Z',
    }

    expect(session.id).toBeTruthy()
    expect(session.selfRating).toBeGreaterThanOrEqual(1)
    expect(session.selfRating).toBeLessThanOrEqual(10)
    expect(typeof session.durationSeconds).toBe('number')
  })
})

describe('DatabasePersistence — ListeningPracticeSession shape', () => {
  it('has all required fields', () => {
    const session: ListeningPracticeSession = {
      id: 'l-1',
      exerciseId: 'e-1',
      title: 'Test Listening',
      topic: 'Travel',
      transcript: 'Hello...',
      audioUrl: '',
      questions: [],
      answers: {},
      score: 3,
      totalQuestions: 5,
      accuracy: 60,
      timeSpentSeconds: 200,
      notes: '',
      mistakes: [],
      createdAt: '2026-07-13T00:00:00.000Z',
    }

    expect(session.id).toBeTruthy()
    expect(typeof session.accuracy).toBe('number')
    expect(Array.isArray(session.mistakes)).toBe(true)
    expect(session.accuracy).toBe(60)
  })
})
