import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const mockSafeGetAll = vi.hoisted(() => vi.fn())
const mockCallAI = vi.hoisted(() => vi.fn())

vi.mock('../../../../services/storage/Database', () => ({
  DatabaseService: {
    safeGetAll: mockSafeGetAll,
    getAll: mockSafeGetAll,
    getById: vi.fn().mockResolvedValue(undefined),
    safeGetById: vi.fn().mockResolvedValue(undefined),
    add: vi.fn().mockResolvedValue('mock-id'),
    put: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
    remove: vi.fn().mockResolvedValue(undefined),
    count: vi.fn().mockResolvedValue(0),
    bulkAdd: vi.fn().mockResolvedValue(undefined),
    exportAll: vi.fn().mockResolvedValue({}),
    importAll: vi.fn().mockResolvedValue(undefined),
    resetAll: vi.fn().mockResolvedValue(undefined),
    clearAll: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock('@ielts/ai', () => ({
  callAI: mockCallAI,
  createAIClient: vi.fn().mockReturnValue({
    complete: vi.fn().mockResolvedValue({ content: '{}', error: null }),
  }),
}))

import { generateProgressReview } from '../progressReviewService'

function mockSettings() {
  // settings are read from localStorage by the module under test
}

function mockSettingsWithAI() {
  // settings are read from localStorage by the module under test
}

function defaultMockData() {
  mockSafeGetAll.mockImplementation(async (table: string) => {
    switch (table) {
      case 'tasks':
        return [
          { id: 't1', title: 'Task 1', category: 'reading', date: '2026-07-03', isDone: true, timeMinutes: 30, completedAt: '2026-07-03T11:00:00Z', createdAt: '2026-07-03', updatedAt: '2026-07-03' },
          { id: 't2', title: 'Task 2', category: 'writing', date: '2026-07-04', isDone: true, timeMinutes: 20, completedAt: '2026-07-04T11:00:00Z', createdAt: '2026-07-04', updatedAt: '2026-07-04' },
          { id: 't3', title: 'Task 3', category: 'vocabulary', date: '2026-07-05', isDone: false, timeMinutes: 15, completedAt: null, createdAt: '2026-07-05', updatedAt: '2026-07-05' },
        ]
      case 'readingPracticeSessions':
        return [
          { id: 'r1', passageId: 'p1', title: 'Reading Test', topic: 'science', passageText: '', questions: [], answers: {}, score: 8, totalQuestions: 10, accuracy: 80, timeSpentSeconds: 1200, mistakes: [], createdAt: '2026-07-03T10:00:00Z' },
          { id: 'r2', passageId: 'p2', title: 'Reading Test 2', topic: 'education', passageText: '', questions: [], answers: {}, score: 5, totalQuestions: 10, accuracy: 50, timeSpentSeconds: 900, mistakes: [], createdAt: '2026-07-04T10:00:00Z' },
        ]
      case 'listeningPracticeSessions':
        return [
          { id: 'l1', exerciseId: 'e1', title: 'Listening Test', topic: 'education', transcript: '', audioUrl: '', questions: [], answers: {}, score: 7, totalQuestions: 10, accuracy: 70, timeSpentSeconds: 900, notes: '', mistakes: [], createdAt: '2026-07-04T10:00:00Z' },
        ]
      case 'writingSessions':
        return [
          { id: 'w1', taskType: 'essay', question: '', essay: '', topic: 'technology', wordCount: 250, timeSpentMinutes: 45, estimatedBand: 6.5, feedback: '', grammarMistakes: '', vocabularyMistakes: '', coherenceNotes: '', improvedSentences: '', betterVersion: '', personalReflection: '', createdAt: '2026-07-02T10:00:00Z' },
        ]
      case 'speakingSessions':
        return [
          { id: 's1', part: 1, question: '', answerNotes: '', topic: 'hometown', durationSeconds: 120, selfRating: 3, fluencyNotes: '', vocabularyNotes: '', grammarMistakes: '', pronunciationNotes: '', betterExpressions: '', improvedAnswer: '', createdAt: '2026-07-05T10:00:00Z' },
        ]
      case 'vocabulary':
        return [
          { id: 'v1', word: 'sustainable', meaning: '', meaningVi: '', pronunciation: '', partOfSpeech: 'adj', topic: 'environment', exampleSentence: '', collocations: [], synonyms: [], antonyms: [], wordFamily: [], personalNote: '', difficulty: 'medium', status: 'mastered', tags: [], createdAt: '2026-07-01T10:00:00Z', updatedAt: '2026-07-05T10:00:00Z' },
          { id: 'v2', word: 'biodiversity', meaning: '', meaningVi: '', pronunciation: '', partOfSpeech: 'n', topic: 'environment', exampleSentence: '', collocations: [], synonyms: [], antonyms: [], wordFamily: [], personalNote: '', difficulty: 'medium', status: 'learning', tags: [], createdAt: '2026-07-01T10:00:00Z', updatedAt: '2026-07-05T10:00:00Z' },
          { id: 'v3', word: 'curriculum', meaning: '', meaningVi: '', pronunciation: '', partOfSpeech: 'n', topic: 'education', exampleSentence: '', collocations: [], synonyms: [], antonyms: [], wordFamily: [], personalNote: '', difficulty: 'hard', status: 'reviewing', tags: [], createdAt: '2026-07-02T10:00:00Z', updatedAt: '2026-07-05T10:00:00Z' },
        ]
      case 'vocabularyReviews':
        return [
          { id: 'vr1', vocabularyId: 'v1', interval: 25, easeFactor: 2.5, repetitions: 6, nextReviewDate: '2026-07-10T00:00:00Z', lastReviewDate: '2026-07-05T00:00:00Z', history: [] },
          { id: 'vr2', vocabularyId: 'v2', interval: 3, easeFactor: 2.5, repetitions: 1, nextReviewDate: '2026-07-06T00:00:00Z', lastReviewDate: '2026-07-03T00:00:00Z', history: [] },
        ]
      case 'mistakes':
        return [
          { id: 'm1', mistake: 'Incorrect verb tense', correction: '', explanation: 'Focus on present perfect', source: 'writing', date: '2026-07-03T10:00:00Z', skill: 'grammar', status: 'unresolved', repetitionCount: 3, createdAt: '2026-07-03T10:00:00Z', updatedAt: '2026-07-03T10:00:00Z' },
          { id: 'm2', mistake: 'Wrong word choice', correction: '', explanation: '', source: 'vocabulary', date: '2026-07-04T10:00:00Z', skill: 'vocabulary', status: 'unresolved', repetitionCount: 1, createdAt: '2026-07-04T10:00:00Z', updatedAt: '2026-07-04T10:00:00Z' },
          { id: 'm3', mistake: 'Article usage', correction: '', explanation: '', source: 'grammar', date: '2026-07-02T10:00:00Z', skill: 'grammar', status: 'resolved', repetitionCount: 2, createdAt: '2026-07-02T10:00:00Z', updatedAt: '2026-07-03T10:00:00Z' },
        ]
      case 'progressRecords':
        return [
          { id: 'pr1', date: '2026-07-01T00:00:00Z', skill: 'reading', metric: 'accuracy', value: 65, unit: '%', notes: '', tags: [], createdAt: '2026-07-01T00:00:00Z' },
          { id: 'pr2', date: '2026-07-04T00:00:00Z', skill: 'reading', metric: 'accuracy', value: 80, unit: '%', notes: '', tags: [], createdAt: '2026-07-04T00:00:00Z' },
          { id: 'pr3', date: '2026-07-01T00:00:00Z', skill: 'writing', metric: 'band', value: 5.5, unit: 'band', notes: '', tags: [], createdAt: '2026-07-01T00:00:00Z' },
          { id: 'pr4', date: '2026-07-02T00:00:00Z', skill: 'writing', metric: 'band', value: 6.0, unit: 'band', notes: '', tags: [], createdAt: '2026-07-02T00:00:00Z' },
        ]
      default:
        return []
    }
  })
}

const SIXTY_DAYS = 60 * 24 * 60 * 60 * 1000

describe('generateProgressReview', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-05T12:00:00Z'))
    vi.clearAllMocks()
    defaultMockData()
    mockSettings()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns a fallback report with all required fields when no AI key is set', async () => {
    const range = { start: '2026-07-01', end: '2026-07-05' }
    const result = await generateProgressReview(range)

    expect(result.report).not.toBeNull()
    expect(result.error).toBeNull()
    expect(result.report!.overallSummary).toBeTruthy()
    expect(result.report!.improvements).toBeInstanceOf(Array)
    expect(result.report!.struggles).toBeInstanceOf(Array)
    expect(result.report!.repeatedMistakes).toBeInstanceOf(Array)
    expect(result.report!.vocabularyReviewStatus).toBeTruthy()
    expect(result.report!.vocabularyReviewStatus.totalSaved).toBeGreaterThan(0)
    expect(result.report!.skillProgress).toBeInstanceOf(Array)
    expect(result.report!.studyPlanAdherence).toBeTruthy()
    expect(result.report!.recommendedFocus).toBeInstanceOf(Array)
    expect(result.report!.tutorFeedback).toBeTruthy()
  })

  it('computes overall summary correctly from study data', async () => {
    const range = { start: '2026-07-01', end: '2026-07-05' }
    const result = await generateProgressReview(range)

    expect(result.report!.overallSummary).toContain('minutes')
    expect(result.report!.overallSummary).toContain('sessions')
    expect(result.report!.overallSummary).toContain('active days')
  })

  it('computes skill-by-skill progress with accuracy and trends', async () => {
    const range = { start: '2026-07-01', end: '2026-07-05' }
    const result = await generateProgressReview(range)

    const reading = result.report!.skillProgress.find(s => s.skill === 'Reading')
    expect(reading).toBeTruthy()
    expect(reading!.sessions).toBe(2)
    expect(reading!.accuracy).toBeGreaterThan(0)
    expect(['improving', 'declining', 'stable']).toContain(reading!.trend)

    const writing = result.report!.skillProgress.find(s => s.skill === 'Writing')
    expect(writing).toBeTruthy()
    expect(writing!.sessions).toBe(1)
  })

  it('includes repeated mistakes in the report', async () => {
    const range = { start: '2026-07-01', end: '2026-07-05' }
    const result = await generateProgressReview(range)

    expect(result.report!.repeatedMistakes.length).toBeGreaterThan(0)
    const mistake = result.report!.repeatedMistakes[0]
    expect(mistake.pattern).toBeTruthy()
    expect(mistake.skill).toBeTruthy()
    expect(mistake.frequency).toBeGreaterThan(0)
  })

  it('excludes resolved mistakes from repeated mistakes', async () => {
    const range = { start: '2026-07-01', end: '2026-07-05' }
    const result = await generateProgressReview(range)

    const resolvedMistakes = result.report!.repeatedMistakes.filter(m => m.pattern.includes('Article'))
    expect(resolvedMistakes.length).toBe(0)
  })

  it('includes vocabulary review status with mastered and learning counts', async () => {
    const range = { start: '2026-07-01', end: '2026-07-05' }
    const result = await generateProgressReview(range)

    expect(result.report!.vocabularyReviewStatus.totalSaved).toBe(3)
    expect(result.report!.vocabularyReviewStatus.recommendation).toBeTruthy()
  })

  it('includes study plan adherence with streak and consistency', async () => {
    const range = { start: '2026-07-01', end: '2026-07-05' }
    const result = await generateProgressReview(range)

    expect(result.report!.studyPlanAdherence).toContain('active days')
    expect(result.report!.studyPlanAdherence).toContain('consistency')
    expect(result.report!.studyPlanAdherence).toContain('streak')
  })

  it('includes tutor feedback that is encouraging and non-empty', async () => {
    const range = { start: '2026-07-01', end: '2026-07-05' }
    const result = await generateProgressReview(range)

    expect(result.report!.tutorFeedback.length).toBeGreaterThan(20)
    expect(result.report!.tutorFeedback).toContain('IELTS')
  })

  it('returns AI-generated report when AI is configured and responds correctly', async () => {
    mockSettingsWithAI()
    mockCallAI.mockResolvedValue({
      content: JSON.stringify({
        overallSummary: 'AI summary: You studied well.',
        improvements: ['Reading improved by 15%', 'Vocabulary expanded'],
        struggles: ['Writing needs more practice'],
        repeatedMistakes: [{ pattern: 'Verb tense', skill: 'grammar', frequency: 3, analysis: 'Practice present perfect.' }],
        vocabularyReviewStatus: { summary: '30 words saved', totalSaved: 30, mastered: 10, stillLearning: 20, recommendation: 'Keep reviewing daily.' },
        skillProgress: [{ skill: 'Reading', status: 'improving', sessions: 5, accuracy: 80, trend: 'improving', analysis: 'Reading is improving.' }],
        studyPlanAdherence: 'You studied 10/14 days.',
        recommendedFocus: ['Focus on Writing'],
        tutorFeedback: 'Great progress! Keep studying.',
      }),
      error: null,
    })

    const range = { start: '2026-07-01', end: '2026-07-05' }
    const result = await generateProgressReview(range)

    expect(result.report).not.toBeNull()
    expect(result.report!.overallSummary).toBe('AI summary: You studied well.')
    expect(result.error).toBeNull()
    expect(mockCallAI).toHaveBeenCalledOnce()
  })

  it('falls back to data-driven report when AI returns error', async () => {
    mockSettingsWithAI()
    mockCallAI.mockResolvedValue({
      content: null,
      error: 'API rate limit exceeded',
    })

    const range = { start: '2026-07-01', end: '2026-07-05' }
    const result = await generateProgressReview(range)

    expect(result.report).not.toBeNull()
    expect(result.error).toContain('API rate limit')
    expect(mockCallAI).toHaveBeenCalledOnce()
  })

  it('falls back when AI returns unparseable JSON', async () => {
    mockSettingsWithAI()
    mockCallAI.mockResolvedValue({
      content: 'Some random text without valid JSON',
      error: null,
    })

    const range = { start: '2026-07-01', end: '2026-07-05' }
    const result = await generateProgressReview(range)

    expect(result.report).not.toBeNull()
    expect(result.error).toContain('could not be parsed')
    expect(mockCallAI).toHaveBeenCalledOnce()
  })

  it('returns fallback report without AI call when no API key', async () => {
    mockSettings()
    const range = { start: '2026-07-01', end: '2026-07-05' }
    const result = await generateProgressReview(range)

    expect(result.report).not.toBeNull()
    expect(result.error).toBeNull()
    expect(mockCallAI).not.toHaveBeenCalled()
  })

  it('filters data by date range', async () => {
    const range = { start: '2026-07-04', end: '2026-07-05' }
    const result = await generateProgressReview(range)

    const writingSessions = result.report!.skillProgress.find(s => s.skill === 'Writing')
    expect(writingSessions).toBeUndefined()
  })

  it('handles empty data gracefully', async () => {
    mockSafeGetAll.mockResolvedValue([])
    const range = { start: '2026-07-01', end: '2026-07-05' }
    const result = await generateProgressReview(range)

    expect(result.report).not.toBeNull()
    expect(result.report!.overallSummary).toContain('0 minutes')
    expect(result.report!.skillProgress).toHaveLength(0)
    expect(result.report!.vocabularyReviewStatus.totalSaved).toBe(0)
    expect(result.report!.improvements.length).toBeGreaterThan(0)
    expect(result.report!.tutorFeedback.length).toBeGreaterThan(20)
  })

  it('handles database errors gracefully', async () => {
    mockSafeGetAll.mockRejectedValue(new Error('Database connection failed'))
    const range = { start: '2026-07-01', end: '2026-07-05' }
    const result = await generateProgressReview(range)

    expect(result.report).toBeNull()
    expect(result.error).toContain('Database')
  })

  it('includes accuracy in skill progress when data is available', async () => {
    const range = { start: '2026-07-01', end: '2026-07-05' }
    const result = await generateProgressReview(range)

    const listening = result.report!.skillProgress.find(s => s.skill === 'Listening')
    expect(listening).toBeTruthy()
    expect(listening!.accuracy).toBe(70)
  })

  it('includes recommendations for struggling skills and consistency', async () => {
    const range = { start: '2026-07-01', end: '2026-07-05' }
    const result = await generateProgressReview(range)

    expect(result.report!.recommendedFocus.length).toBeGreaterThan(0)
  })

  it('returns encouraging recommendation when no issues detected', async () => {
    mockSafeGetAll.mockImplementation(async (table: string) => {
      if (table === 'tasks') {
        return [
          { id: 't1', title: 'Task 1', category: 'reading', date: '2026-07-01', isDone: true, timeMinutes: 30, completedAt: '2026-07-01T11:00:00Z', createdAt: '2026-07-01', updatedAt: '2026-07-01' },
          { id: 't2', title: 'Task 2', category: 'reading', date: '2026-07-02', isDone: true, timeMinutes: 30, completedAt: '2026-07-02T11:00:00Z', createdAt: '2026-07-02', updatedAt: '2026-07-02' },
          { id: 't3', title: 'Task 3', category: 'reading', date: '2026-07-03', isDone: true, timeMinutes: 30, completedAt: '2026-07-03T11:00:00Z', createdAt: '2026-07-03', updatedAt: '2026-07-03' },
          { id: 't4', title: 'Task 4', category: 'reading', date: '2026-07-04', isDone: true, timeMinutes: 30, completedAt: '2026-07-04T11:00:00Z', createdAt: '2026-07-04', updatedAt: '2026-07-04' },
          { id: 't5', title: 'Task 5', category: 'reading', date: '2026-07-05', isDone: true, timeMinutes: 30, completedAt: '2026-07-05T11:00:00Z', createdAt: '2026-07-05', updatedAt: '2026-07-05' },
        ]
      }
      return []
    })

    const range = { start: '2026-07-01', end: '2026-07-05' }
    const result = await generateProgressReview(range)

    expect(result.report!.recommendedFocus[0]).toContain('Keep up')
  })
})
