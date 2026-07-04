import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateExercise, getSavedExercisesForReview, parseExerciseFromAiContent } from './ExerciseGenerator'
import type { TaskEntry } from '../models'
import type { UserData } from './ExerciseGenerator'
import { DatabaseService } from './storage/Database'

vi.mock('./storage/Database', () => ({
  DatabaseService: {
    addAiContent: vi.fn().mockResolvedValue({ id: 'mock-id' }),
    getAll: vi.fn().mockResolvedValue([]),
    queryByIndex: vi.fn().mockResolvedValue([]),
    add: vi.fn().mockResolvedValue('mock-exercise-id'),
    update: vi.fn().mockResolvedValue(undefined),
  },
}))

function makeTask(overrides: Partial<TaskEntry> = {}): TaskEntry {
  const now = new Date().toISOString()
  return {
    id: 'task-1',
    title: 'Practice Speaking About Hobbies',
    description: 'Practice speaking fluently about your hobbies for IELTS Speaking Part 1 and 2',
    category: 'Speaking Part 1',
    date: now,
    isDone: false,
    isRecurring: false,
    recurringDays: [],
    notes: '',
    timeMinutes: 20,
    createdAt: now,
    updatedAt: now,
    completedAt: null,
    ...overrides,
  }
}

function makeUserData(overrides: Partial<UserData> = {}): UserData {
  return {
    weakSkills: ['Speaking'],
    currentBand: 5.5,
    targetBand: 7.0,
    vocabularyWords: [],
    recentMistakes: [],
    ...overrides,
  }
}

describe('generateExercise', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns an exercise object matching the task topic and type', async () => {
    const task = makeTask({ category: 'Speaking Part 1', title: 'Practice Speaking About Hobbies' })
    const userData = makeUserData()

    const exercise = await generateExercise(task, userData)

    expect(exercise).toBeDefined()
    expect(exercise.skill).toBe('speaking')
    expect(exercise.topic).toContain('Hobbies')
    expect(exercise.questions.length).toBeGreaterThan(0)
    expect(exercise.source).toBe('user-created')
    expect(exercise.status).toBe('published')
  })

  it('does not generate random unrelated exercises', async () => {
    const task = makeTask({ category: 'Reading', title: 'Practice Skimming with Climate Change' })
    const userData = makeUserData()

    const exercise = await generateExercise(task, userData)

    expect(exercise.skill).toBe('reading')
    expect(exercise.topic.toLowerCase()).toContain('climate')
  })

  it('supports speaking exercise type', async () => {
    const task = makeTask({ category: 'Speaking Part 2', title: 'Describe a Memorable Trip' })
    const exercise = await generateExercise(task, makeUserData())

    expect(exercise.skill).toBe('speaking')
    expect(exercise.questions.length).toBeGreaterThanOrEqual(1)
  })

  it('supports writing exercise type', async () => {
    const task = makeTask({ category: 'Writing Task 2', title: 'Opinion Essay Practice' })
    const exercise = await generateExercise(task, makeUserData())

    expect(exercise.skill).toBe('writing')
    expect(exercise.questions.length).toBeGreaterThan(0)
  })

  it('supports reading exercise type', async () => {
    const task = makeTask({ category: 'Reading', title: 'Scanning Practice with Cambridge' })
    const exercise = await generateExercise(task, makeUserData())

    expect(exercise.skill).toBe('reading')
    expect(exercise.questions.length).toBeGreaterThan(0)
  })

  it('supports listening exercise type', async () => {
    const task = makeTask({ category: 'Listening', title: 'Listen for Main Ideas' })
    const exercise = await generateExercise(task, makeUserData())

    expect(exercise.skill).toBe('listening')
    expect(exercise.questions.length).toBeGreaterThan(0)
  })

  it('saves exercise for review', async () => {
    const task = makeTask({ category: 'Speaking Part 1' })
    const userData = makeUserData()

    const exercise = await generateExercise(task, userData)

    expect(DatabaseService.queryByIndex).toHaveBeenCalled()
    expect(DatabaseService.add).toHaveBeenCalledOnce()
    const tableName = DatabaseService.add.mock.calls[0][0]
    expect(tableName).toBe('speakingExercises')
    const savedEntry = DatabaseService.add.mock.calls[0][1] as Record<string, unknown>
    expect(savedEntry.skill).toBe('speaking')
    expect(savedEntry.sourceId).toBe(task.id)
  })

  it('handles reading category correctly', async () => {
    const task = makeTask({ category: 'Reading', title: 'Practice Skimming' })
    const exercise = await generateExercise(task, makeUserData())

    expect(exercise.skill).toBe('reading')
  })

  it('handles listening category correctly', async () => {
    const task = makeTask({ category: 'Listening', title: 'Listen for Details' })
    const exercise = await generateExercise(task, makeUserData())

    expect(exercise.skill).toBe('listening')
  })

  it('handles writing categories correctly', async () => {
    const task1 = makeTask({ category: 'Writing Task 1', title: 'Describe a Chart' })
    const task2 = makeTask({ category: 'Writing Task 2', title: 'Opinion Essay' })

    const [ex1, ex2] = await Promise.all([
      generateExercise(task1, makeUserData()),
      generateExercise(task2, makeUserData()),
    ])

    expect(ex1.skill).toBe('writing')
    expect(ex2.skill).toBe('writing')
  })

  it('handles unknown category gracefully', async () => {
    const task = makeTask({ category: 'Mock Test' as TaskEntry['category'] })
    const exercise = await generateExercise(task, makeUserData())

    expect(exercise.skill).toBeDefined()
    expect(exercise.questions.length).toBeGreaterThan(0)
  })

  it('generates questions with proper structure', async () => {
    const task = makeTask({ category: 'Speaking Part 1' })
    const exercise = await generateExercise(task, makeUserData())

    for (const q of exercise.questions) {
      expect(q.id).toBeDefined()
      expect(q.question).toBeDefined()
      expect(q.type).toBeDefined()
      expect(q.correctAnswer).toBeDefined()
      expect(q.explanation).toBeDefined()
    }
  })

  it('includes task id as sourceId', async () => {
    const task = makeTask({ id: 'specific-task-id' })
    const exercise = await generateExercise(task, makeUserData())

    expect(exercise.sourceId).toBe('specific-task-id')
  })

  it('has estimated minutes based on task time', async () => {
    const task = makeTask({ timeMinutes: 30 })
    const exercise = await generateExercise(task, makeUserData())

    expect(exercise.estimatedMinutes).toBe(30)
  })
})

describe('getSavedExercisesForReview', () => {
  it('returns empty array when no saved exercises', async () => {
    const results = await getSavedExercisesForReview()
    expect(results).toEqual([])
  })
})

describe('parseExerciseFromAiContent', () => {
  it('parses a valid AiContent back to an Exercise', () => {
    const exercise = {
      id: 'ex-1',
      title: 'Test',
      skill: 'speaking',
      topic: 'Hobbies',
      source: 'user-created',
      difficulty: 'beginner',
      questions: [{ id: 'q-1', type: 'short-answer', question: 'Test?', correctAnswer: 'Answer', explanation: { correctAnswer: 'Answer', explanation: 'Exp' } }],
      totalPoints: 1,
      estimatedMinutes: 10,
      status: 'published',
      tags: ['test'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const aiContent = {
      id: 'ac-1',
      type: 'speaking' as const,
      prompt: 'test',
      content: JSON.stringify(exercise),
      title: 'Test',
      topic: 'Hobbies',
      model: 'exercise-generator',
      tokens: 0,
      tags: [],
      isFavorite: false,
      createdAt: new Date().toISOString(),
    }

    const parsed = parseExerciseFromAiContent(aiContent)
    expect(parsed).toEqual(exercise)
  })

  it('returns null for invalid content', () => {
    const aiContent = {
      id: 'ac-1',
      type: 'speaking' as const,
      prompt: 'test',
      content: 'invalid json{{{',
      title: 'Test',
      topic: 'Hobbies',
      model: 'exercise-generator',
      tokens: 0,
      tags: [],
      isFavorite: false,
      createdAt: new Date().toISOString(),
    }

    const parsed = parseExerciseFromAiContent(aiContent)
    expect(parsed).toBeNull()
  })
})
