import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { generateExercise } from '../../src/services/ExerciseGenerator'
import type { TaskEntry } from '../../src/models'
import type { UserData } from '../../src/services/ExerciseGenerator'
import { DatabaseService, destroyDb } from '../../src/services/storage/Database'

let idCounter = 0
const UUID_PREFIX = '00000000-0000-4000-a000-0000000000'
vi.stubGlobal('crypto', {
  randomUUID: () => `${UUID_PREFIX}${String(++idCounter).padStart(2, '0')}`,
})

function makeTask(overrides: Partial<TaskEntry> = {}): TaskEntry {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
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

beforeEach(() => {
  destroyDb()
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-07-03T10:00:00Z'))
})

afterEach(() => {
  destroyDb()
  vi.useRealTimers()
})

describe('task exercise generation e2e', () => {
  const testCases = [
    { category: 'Speaking Part 1' as const, title: 'Practice Speaking About Hobbies', skill: 'speaking', table: 'speakingExercises' as const },
    { category: 'Writing Task 2' as const, title: 'Opinion Essay Practice', skill: 'writing', table: 'writingExercises' as const },
    { category: 'Reading' as const, title: 'Practice Skimming with a Short Reading Passage', skill: 'reading', table: 'readingExercises' as const },
    { category: 'Listening' as const, title: 'Listen for Main Ideas: Short Lecture Practice', skill: 'listening', table: 'listeningExercises' as const },
  ]

  testCases.forEach(({ category, title, skill, table }) => {
    it(`generates and saves ${skill} exercise to ${table} after task completion`, async () => {
      const task = makeTask({ category, title })
      const userData = makeUserData()

      const exercise = await generateExercise(task, userData)

      expect(exercise.skill).toBe(skill)
      expect(exercise.sourceId).toBe(task.id)

      const saved = await DatabaseService.queryByIndex<Record<string, unknown>>(table, 'sourceId', task.id)
      expect(saved).toHaveLength(1)
      expect(saved[0].skill).toBe(skill)
      expect(saved[0].title).toBe(exercise.title)
      expect(saved[0].sourceId).toBe(task.id)
      expect(saved[0].content).toBe(JSON.stringify(exercise))
      expect(saved[0].questions).toBe(JSON.stringify(exercise.questions))
    })
  })

  describe('speaking topic', () => {
    const speakingParts = [
      { category: 'Speaking Part 1' as const, title: 'Practice Speaking About Travel' },
      { category: 'Speaking Part 2' as const, title: 'Describe a Memorable Trip' },
      { category: 'Speaking Part 3' as const, title: 'Discuss Future Plans' },
    ]

    speakingParts.forEach(({ category, title }) => {
      it(`generates and saves speaking exercise for ${category}`, async () => {
        const task = makeTask({ category, title })
        const exercise = await generateExercise(task, makeUserData())

        expect(exercise.skill).toBe('speaking')
        expect(exercise.sourceId).toBe(task.id)

        const saved = await DatabaseService.queryByIndex('speakingExercises', 'sourceId', task.id)
        expect(saved).toHaveLength(1)
        expect(saved[0].skill).toBe('speaking')

        const parsed = JSON.parse(saved[0].content as string)
        expect(parsed.skill).toBe('speaking')
        expect(parsed.questions.length).toBeGreaterThan(0)
      })
    })

    it('persists speaking exercise with correct content structure', async () => {
      const task = makeTask({
        category: 'Speaking Part 1',
        title: 'Speaking About Technology',
      })
      await generateExercise(task, makeUserData())

      const saved = await DatabaseService.queryByIndex('speakingExercises', 'sourceId', task.id)
      expect(saved).toHaveLength(1)

      const entry = saved[0]
      expect(entry.sourceId).toBe(task.id)
      expect(entry.difficulty).toBe('intermediate')
      expect(entry.status).toBe('published')

      const questions = JSON.parse(entry.questions as string)
      expect(Array.isArray(questions)).toBe(true)
      expect(questions.length).toBeGreaterThan(0)

      const content = JSON.parse(entry.content as string)
      expect(content.skill).toBe('speaking')
      expect(content.source).toBe('user-created')
      expect(content.tags).toContain('speaking')
    })

    it('stores speaking exercise serialized content and questions', async () => {
      const task = makeTask({
        category: 'Speaking Part 1',
        title: 'Practice Speaking About Hobbies',
      })
      const exercise = await generateExercise(task, makeUserData())

      const saved = await DatabaseService.queryByIndex('speakingExercises', 'sourceId', task.id)
      expect(saved).toHaveLength(1)

      const entry = saved[0]
      expect(entry.content).toBe(JSON.stringify(exercise))
      expect(entry.questions).toBe(JSON.stringify(exercise.questions))
      expect(typeof entry.content).toBe('string')
      expect(typeof entry.questions).toBe('string')
    })
  })

  describe('non-speaking topics', () => {
    it('generates and saves writing exercise', async () => {
      const task = makeTask({
        category: 'Writing Task 2',
        title: 'Education System Essay',
      })
      const exercise = await generateExercise(task, makeUserData())

      expect(exercise.skill).toBe('writing')

      const saved = await DatabaseService.queryByIndex('writingExercises', 'sourceId', task.id)
      expect(saved).toHaveLength(1)
      expect(saved[0].skill).toBe('writing')
      expect(saved[0].sourceId).toBe(task.id)
    })

    it('generates and saves reading exercise', async () => {
      const task = makeTask({
        category: 'Reading',
        title: 'Reading Practice About Climate Change',
      })
      const exercise = await generateExercise(task, makeUserData())

      expect(exercise.skill).toBe('reading')

      const saved = await DatabaseService.queryByIndex('readingExercises', 'sourceId', task.id)
      expect(saved).toHaveLength(1)
      expect(saved[0].skill).toBe('reading')
    })

    it('generates and saves listening exercise', async () => {
      const task = makeTask({
        category: 'Listening',
        title: 'Listen for Specific Details: Booking a Hotel',
      })
      const exercise = await generateExercise(task, makeUserData())

      expect(exercise.skill).toBe('listening')

      const saved = await DatabaseService.queryByIndex('listeningExercises', 'sourceId', task.id)
      expect(saved).toHaveLength(1)
      expect(saved[0].skill).toBe('listening')
    })
  })

  describe('exercise persistence across database lifecycle', () => {
    it('persists exercises across db close and reopen', async () => {
      const task = makeTask({
        category: 'Speaking Part 1',
        title: 'Practice Speaking About Hobbies',
      })
      await generateExercise(task, makeUserData())

      destroyDb()

      const saved = await DatabaseService.queryByIndex('speakingExercises', 'sourceId', task.id)
      expect(saved).toHaveLength(1)
      expect(saved[0].skill).toBe('speaking')
    })

    it('saves unique exercise per task with different skills', async () => {
      const speakingTask = makeTask({
        category: 'Speaking Part 1',
        title: 'Practice Speaking About Hobbies',
      })
      const writingTask = makeTask({
        id: crypto.randomUUID(),
        category: 'Writing Task 2',
        title: 'Opinion on Education',
      })

      const speakingExercise = await generateExercise(speakingTask, makeUserData())
      const writingExercise = await generateExercise(writingTask, makeUserData())

      expect(speakingExercise.skill).toBe('speaking')
      expect(writingExercise.skill).toBe('writing')

      const speakingSaved = await DatabaseService.queryByIndex('speakingExercises', 'sourceId', speakingTask.id)
      const writingSaved = await DatabaseService.queryByIndex('writingExercises', 'sourceId', writingTask.id)

      expect(speakingSaved).toHaveLength(1)
      expect(writingSaved).toHaveLength(1)
      expect(speakingSaved[0].skill).toBe('speaking')
      expect(writingSaved[0].skill).toBe('writing')
    })
  })

  describe('generates exercises based on task content', () => {
    it('infers topic from task title and uses it in exercise', async () => {
      const task = makeTask({
        category: 'Speaking Part 1',
        title: 'Speaking About Environmental Protection',
      })
      const exercise = await generateExercise(task, makeUserData())

      expect(exercise.topic.toLowerCase()).toContain('environmental')
      expect(exercise.skill).toBe('speaking')

      const saved = await DatabaseService.queryByIndex('speakingExercises', 'sourceId', task.id)
      expect(saved).toHaveLength(1)
      expect((saved[0].topic as string).toLowerCase()).toContain('environmental')
    })

    it('uses task category for topic when title is short', async () => {
      const task = makeTask({
        title: 'Hi',
        category: 'Reading',
        description: '',
      })
      const exercise = await generateExercise(task, makeUserData())

      expect(exercise.topic).toBe('Reading')
      expect(exercise.skill).toBe('reading')

      const saved = await DatabaseService.queryByIndex('readingExercises', 'sourceId', task.id)
      expect(saved).toHaveLength(1)
    })

    it('maps difficulty from task time minutes', async () => {
      const easy = await generateExercise(makeTask({ timeMinutes: 10 }), makeUserData())
      expect(easy.difficulty).toBe('beginner')

      const saved = await DatabaseService.queryByIndex(
        getTableForSkill(easy.skill),
        'sourceId',
        easy.sourceId ?? '',
      )
      expect(saved).toHaveLength(1)
      expect(saved[0].difficulty).toBe('beginner')
    })
  })
})

function getTableForSkill(skill: string): 'speakingExercises' | 'writingExercises' | 'readingExercises' | 'listeningExercises' {
  switch (skill) {
    case 'speaking': return 'speakingExercises'
    case 'writing': return 'writingExercises'
    case 'reading': return 'readingExercises'
    case 'listening': return 'listeningExercises'
    default: throw new Error(`Unknown skill: ${skill}`)
  }
}
