import { describe, it, expect, beforeEach } from 'vitest'

function makeTask(overrides: Record<string, unknown> = {}) {
  return {
    id: 'task-1',
    title: 'Practice reading',
    description: '',
    category: 'Reading' as const,
    date: '2024-06-17T10:00:00.000Z',
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

import { ProgressService } from '../progress/ProgressService'

describe('ProgressService', () => {
  let service: ProgressService

  beforeEach(() => {
    service = new ProgressService()
  })

  describe('getWeeklyProgress', () => {
    it('returns correct weekly progress for a given date', () => {
      const now = new Date('2024-06-19T12:00:00.000Z')
      const tasks = [
        makeTask({ date: '2024-06-19T10:00:00.000Z', isDone: true, timeMinutes: 30 }),
        makeTask({ date: '2024-06-18T10:00:00.000Z', isDone: true, timeMinutes: 45 }),
      ]
      const sessionDates = ['2024-06-19T10:00:00.000Z', '2024-06-18T10:00:00.000Z']
      const progress = service.getWeeklyProgress(tasks, sessionDates, now)
      expect(progress.totalMinutes).toBeGreaterThan(0)
      expect(progress.tasksCompleted).toBe(2)
      expect(progress.daysActive).toBe(2)
      expect(progress.weekStart).toBeTruthy()
      expect(progress.weekEnd).toBeTruthy()
      expect(progress.dailyBreakdown.length).toBe(7)
    })

    it('returns zero progress when no activities', () => {
      const now = new Date('2024-06-17T12:00:00.000Z')
      const progress = service.getWeeklyProgress([], [], now)
      expect(progress.totalMinutes).toBe(0)
      expect(progress.tasksCompleted).toBe(0)
      expect(progress.daysActive).toBe(0)
    })
  })

  describe('getSkillProgress', () => {
    it('returns progress for all 6 skills', () => {
      const readingPractices = [makeReadingPractice() as any]
      const listeningPractices = [makeListeningPractice() as any]
      const writingSessions = [makeWritingSession() as any]
      const speakingSessions = [makeSpeakingSession() as any]
      const progressRecords = [makeProgressRecord() as any]
      const skills = service.getSkillProgress(readingPractices, listeningPractices, writingSessions, speakingSessions, progressRecords)
      expect(skills).toHaveLength(6)
      const reading = skills.find(s => s.skill === 'reading')
      expect(reading).toBeDefined()
      expect(reading!.sessions).toBe(1)
    })

    it('returns zero values when no data', () => {
      const skills = service.getSkillProgress([], [], [], [], [])
      expect(skills).toHaveLength(6)
      for (const skill of skills) {
        expect(skill.sessions).toBe(0)
        expect(skill.accuracy).toBe(0)
      }
    })

    it('calculates accuracy correctly for reading', () => {
      const practices = [
        makeReadingPractice({ score: 8, totalQuestions: 10 }) as any,
        makeReadingPractice({ score: 5, totalQuestions: 10 }) as any,
      ]
      const skills = service.getSkillProgress(practices, [], [], [], [])
      const reading = skills.find(s => s.skill === 'reading')!
      expect(reading.accuracy).toBe(65)
    })
  })

  describe('getExerciseAccuracy', () => {
    it('calculates accuracy for all skills', () => {
      const reading = [makeReadingPractice({ score: 8, totalQuestions: 10 }) as any]
      const listening = [makeListeningPractice({ score: 6, totalQuestions: 10 }) as any]
      const writing = [makeWritingSession({ estimatedBand: 6.5 }) as any]
      const speaking = [makeSpeakingSession({ selfRating: 7 }) as any]
      const results = service.getExerciseAccuracy(reading, listening, writing, speaking)
      expect(results).toHaveLength(4)
      const r = results.find(r => r.skill === 'reading')!
      expect(r.accuracyPercent).toBe(80)
      const l = results.find(r => r.skill === 'listening')!
      expect(l.accuracyPercent).toBe(60)
    })

    it('returns zero accuracy for empty data', () => {
      const results = service.getExerciseAccuracy([], [], [], [])
      for (const r of results) {
        expect(r.accuracyPercent).toBe(0)
      }
    })
  })
})

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

function makeProgressRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 'pr-1',
    date: '2024-06-15T10:00:00.000Z',
    skill: 'reading',
    metric: 'accuracy',
    value: 0.8,
    unit: 'percent',
    notes: '',
    tags: [],
    createdAt: '2024-06-15T10:00:00.000Z',
    ...overrides,
  }
}
