import { describe, it, expect, beforeEach } from 'vitest'
import { AIProgressReviewService } from '../AIProgressReviewService'

function makeTask(overrides: Record<string, unknown> = {}) {
  return {
    id: 'task-1',
    title: 'Practice reading',
    description: '',
    category: 'Reading' as const,
    date: '2024-06-15T10:00:00.000Z',
    isDone: true,
    isRecurring: false,
    recurringDays: [],
    notes: '',
    timeMinutes: 30,
    createdAt: '2024-06-15T10:00:00.000Z',
    updatedAt: '2024-06-15T10:00:00.000Z',
    completedAt: '2024-06-15T10:30:00.000Z',
    ...overrides,
  }
}

function makeReadingPractice(overrides: Record<string, unknown> = {}) {
  return {
    id: 'rp-1',
    passageId: 'passage-1',
    title: 'Reading Practice 1',
    topic: 'Science',
    passageText: '',
    questions: [],
    answers: {},
    score: 8,
    totalQuestions: 10,
    accuracy: 80,
    timeSpentSeconds: 600,
    mistakes: [],
    createdAt: '2024-06-15T10:00:00.000Z',
    ...overrides,
  }
}

function makeListeningPractice(overrides: Record<string, unknown> = {}) {
  return {
    id: 'lp-1',
    exerciseId: 'ex-1',
    title: 'Listening Practice 1',
    topic: 'Education',
    transcript: '',
    audioUrl: '',
    questions: [],
    answers: {},
    score: 6,
    totalQuestions: 10,
    accuracy: 60,
    timeSpentSeconds: 500,
    notes: '',
    mistakes: [],
    createdAt: '2024-06-15T10:00:00.000Z',
    ...overrides,
  }
}

function makeWritingSession(overrides: Record<string, unknown> = {}) {
  return {
    id: 'ws-1',
    taskType: 'task2' as const,
    question: 'Some question',
    essay: 'Some essay',
    topic: 'Education',
    wordCount: 250,
    timeSpentMinutes: 40,
    estimatedBand: 6.5,
    feedback: '',
    grammarMistakes: '',
    vocabularyMistakes: '',
    coherenceNotes: '',
    improvedSentences: '',
    betterVersion: '',
    personalReflection: '',
    createdAt: '2024-06-15T10:00:00.000Z',
    ...overrides,
  }
}

function makeSpeakingSession(overrides: Record<string, unknown> = {}) {
  return {
    id: 'ss-1',
    part: 2 as const,
    question: 'Describe a book',
    answerNotes: '',
    topic: 'Books',
    durationSeconds: 120,
    selfRating: 7,
    fluencyNotes: '',
    vocabularyNotes: '',
    grammarMistakes: '',
    pronunciationNotes: '',
    betterExpressions: '',
    improvedAnswer: '',
    createdAt: '2024-06-15T10:00:00.000Z',
    ...overrides,
  }
}

function makeVocabulary(overrides: Record<string, unknown> = {}) {
  return {
    id: 'vocab-1',
    word: 'beneficial',
    meaning: 'having a good effect',
    meaningVi: '',
    pronunciation: '',
    partOfSpeech: 'adjective',
    topic: 'Education',
    exampleSentence: '',
    collocations: [],
    synonyms: [],
    antonyms: [],
    wordFamily: [],
    personalNote: '',
    difficulty: 'medium' as const,
    status: 'learning' as const,
    tags: [],
    createdAt: '2024-06-15T10:00:00.000Z',
    updatedAt: '2024-06-15T10:00:00.000Z',
    ...overrides,
  }
}

function makeVocabReview(overrides: Record<string, unknown> = {}) {
  return {
    id: 'vr-1',
    vocabularyId: 'vocab-1',
    interval: 1,
    easeFactor: 2.5,
    repetitions: 1,
    nextReviewDate: '2024-06-16T10:00:00.000Z',
    lastReviewDate: '2024-06-15T10:00:00.000Z',
    history: [],
    ...overrides,
  }
}

function makeMistake(overrides: Record<string, unknown> = {}) {
  return {
    id: 'mistake-1',
    mistake: 'Incorrect tense usage',
    correction: 'Use past perfect',
    explanation: '',
    source: 'writing',
    date: '2024-06-15T10:00:00.000Z',
    skill: 'grammar' as const,
    status: 'new' as const,
    repetitionCount: 0,
    createdAt: '2024-06-15T10:00:00.000Z',
    updatedAt: '2024-06-15T10:00:00.000Z',
    ...overrides,
  }
}

function makeMockTest(overrides: Record<string, unknown> = {}) {
  return {
    id: 'mt-1',
    date: '2024-06-15T10:00:00.000Z',
    listeningScore: 6.5,
    readingScore: 7,
    writingBand: 6,
    speakingBand: 6.5,
    overallBand: 6.5,
    notes: '',
    weakAreas: [],
    improvementPlan: '',
    createdAt: '2024-06-15T10:00:00.000Z',
    ...overrides,
  }
}

function makeProgressRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 'pr-1',
    date: '2024-06-15T10:00:00.000Z',
    skill: 'reading' as const,
    metric: 'accuracy',
    value: 0.8,
    unit: 'percent',
    notes: '',
    tags: [],
    createdAt: '2024-06-15T10:00:00.000Z',
    ...overrides,
  }
}

describe('AIProgressReviewService', () => {
  let service: AIProgressReviewService

  beforeEach(() => {
    service = new AIProgressReviewService()
  })

  describe('generateReview', () => {
    it('returns a complete review with all required fields', () => {
      const startDate = '2024-06-01T00:00:00.000Z'
      const endDate = '2024-06-30T23:59:59.000Z'

      const result = service.generateReview(
        {
          tasks: [makeTask()],
          readingPractices: [makeReadingPractice()],
          listeningPractices: [makeListeningPractice()],
          writingSessions: [makeWritingSession()],
          speakingSessions: [makeSpeakingSession()],
          vocabulary: [makeVocabulary()],
          vocabReviews: [makeVocabReview()],
          mistakes: [makeMistake()],
          mockTests: [makeMockTest()],
          progressRecords: [makeProgressRecord()],
        },
        startDate,
        endDate,
      )

      expect(result.dateRange).toEqual({ start: startDate, end: endDate })
      expect(result.summary).toBeDefined()
      expect(result.skillProgress).toHaveLength(6)
      expect(result.weaknessReport).toBeDefined()
      expect(result.weaknessReport.weakSkills).toHaveLength(6)
      expect(result.vocabularyStatus).toBeDefined()
      expect(result.progressTrend).toBeDefined()
      expect(result.recommendations).toBeInstanceOf(Array)
      expect(result.tutorFeedback).toBeTruthy()
    })

    it('returns empty data when no activities in date range', () => {
      const startDate = '2024-01-01T00:00:00.000Z'
      const endDate = '2024-01-31T23:59:59.000Z'

      const result = service.generateReview(
        {
          tasks: [makeTask()],
          readingPractices: [],
          listeningPractices: [],
          writingSessions: [],
          speakingSessions: [],
          vocabulary: [],
          vocabReviews: [],
          mistakes: [],
          mockTests: [],
          progressRecords: [],
        },
        startDate,
        endDate,
      )

      expect(result.summary.totalStudyMinutes).toBe(0)
      expect(result.summary.totalTasksCompleted).toBe(0)
      expect(result.summary.totalSessions).toBe(0)
      expect(result.summary.daysActive).toBe(0)
      expect(result.progressTrend).toBe('insufficient_data')
    })

    it('filters data correctly to the given date range', () => {
      const startDate = '2024-06-10T00:00:00.000Z'
      const endDate = '2024-06-20T23:59:59.000Z'

      const result = service.generateReview(
        {
          tasks: [
            makeTask({ id: 't1', completedAt: '2024-06-15T10:00:00.000Z' }),
            makeTask({ id: 't2', completedAt: '2024-07-01T10:00:00.000Z' }),
          ],
          readingPractices: [
            makeReadingPractice({ id: 'rp1', createdAt: '2024-06-15T10:00:00.000Z' }),
            makeReadingPractice({ id: 'rp2', createdAt: '2024-07-01T10:00:00.000Z' }),
          ],
          listeningPractices: [],
          writingSessions: [],
          speakingSessions: [],
          vocabulary: [
            makeVocabulary({ id: 'v1', createdAt: '2024-06-15T10:00:00.000Z' }),
            makeVocabulary({ id: 'v2', createdAt: '2024-07-01T10:00:00.000Z' }),
          ],
          vocabReviews: [],
          mistakes: [
            makeMistake({ id: 'm1', date: '2024-06-15T10:00:00.000Z' }),
            makeMistake({ id: 'm2', date: '2024-07-01T10:00:00.000Z' }),
          ],
          mockTests: [],
          progressRecords: [],
        },
        startDate,
        endDate,
      )

      expect(result.summary.totalTasksCompleted).toBe(1)
      expect(result.skillProgress.find(s => s.skill === 'reading')!.sessions).toBe(1)
      expect(result.summary.totalVocabularySaved).toBe(1)
      expect(result.summary.totalMistakes).toBe(1)
    })

    it('computes vocabulary status correctly', () => {
      const startDate = '2024-06-01T00:00:00.000Z'
      const endDate = '2024-06-30T23:59:59.000Z'

      const result = service.generateReview(
        {
          tasks: [],
          readingPractices: [],
          listeningPractices: [],
          writingSessions: [],
          speakingSessions: [],
          vocabulary: [
            makeVocabulary({ id: 'v1', status: 'new' }),
            makeVocabulary({ id: 'v2', status: 'learning' }),
            makeVocabulary({ id: 'v3', status: 'reviewing' }),
            makeVocabulary({ id: 'v4', status: 'mastered' }),
          ],
          vocabReviews: [],
          mistakes: [],
          mockTests: [],
          progressRecords: [],
        },
        startDate,
        endDate,
      )

      expect(result.vocabularyStatus.total).toBe(4)
      expect(result.vocabularyStatus.new).toBe(1)
      expect(result.vocabularyStatus.learning).toBe(1)
      expect(result.vocabularyStatus.reviewing).toBe(1)
      expect(result.vocabularyStatus.mastered).toBe(1)
    })

    it('computes study summary with correct totals', () => {
      const startDate = '2024-06-01T00:00:00.000Z'
      const endDate = '2024-06-30T23:59:59.000Z'

      const result = service.generateReview(
        {
          tasks: [
            makeTask({ timeMinutes: 30 }),
            makeTask({ id: 't2', timeMinutes: 45 }),
          ],
          readingPractices: [makeReadingPractice({ timeSpentSeconds: 600 })],
          listeningPractices: [makeListeningPractice({ timeSpentSeconds: 500 })],
          writingSessions: [makeWritingSession({ timeSpentMinutes: 40 })],
          speakingSessions: [makeSpeakingSession({ durationSeconds: 120 })],
          vocabulary: [],
          vocabReviews: [],
          mistakes: [],
          mockTests: [],
          progressRecords: [],
        },
        startDate,
        endDate,
      )

      expect(result.summary.totalTasksCompleted).toBe(2)
      expect(result.summary.totalSessions).toBe(4)
      expect(result.summary.totalStudyMinutes).toBeGreaterThan(0)
    })

    it('generates tutor feedback text', () => {
      const startDate = '2024-06-01T00:00:00.000Z'
      const endDate = '2024-06-30T23:59:59.000Z'

      const result = service.generateReview(
        {
          tasks: [makeTask()],
          readingPractices: [makeReadingPractice()],
          listeningPractices: [],
          writingSessions: [],
          speakingSessions: [],
          vocabulary: [makeVocabulary()],
          vocabReviews: [],
          mistakes: [makeMistake()],
          mockTests: [],
          progressRecords: [makeProgressRecord()],
        },
        startDate,
        endDate,
      )

      expect(result.tutorFeedback.length).toBeGreaterThan(0)
      expect(result.tutorFeedback).toContain('IELTS')
    })

    it('generates recommendations based on weakness data', () => {
      const startDate = '2024-06-01T00:00:00.000Z'
      const endDate = '2024-06-30T23:59:59.000Z'

      const result = service.generateReview(
        {
          tasks: [],
          readingPractices: [makeReadingPractice({ score: 2, totalQuestions: 10 })],
          listeningPractices: [makeListeningPractice({ score: 3, totalQuestions: 10 })],
          writingSessions: [],
          speakingSessions: [],
          vocabulary: [],
          vocabReviews: [],
          mistakes: [makeMistake({ skill: 'grammar', status: 'new' })],
          mockTests: [],
          progressRecords: [makeProgressRecord({ value: 0.3 })],
        },
        startDate,
        endDate,
      )

      expect(result.recommendations.length).toBeGreaterThan(0)
    })
  })
})
