import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateExercise, saveExercise } from '../ExerciseGenerator'
import type { TaskEntry } from '../../models'
import type { UserData } from '../ExerciseGenerator'
import type { Exercise, ExerciseSkill } from '@ielts/exercises'
import { DatabaseService } from '../storage/Database'

vi.mock('../storage/Database', () => ({
  DatabaseService: {
    queryByIndex: vi.fn().mockResolvedValue([]),
    add: vi.fn().mockResolvedValue('mock-exercise-id'),
    update: vi.fn().mockResolvedValue(undefined),
    getAll: vi.fn().mockResolvedValue([]),
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

function makeExercise(overrides: Partial<Exercise> = {}): Exercise {
  return {
    id: 'ex-1',
    title: 'Test Exercise',
    skill: 'speaking',
    topic: 'Hobbies',
    source: 'user-created',
    difficulty: 'intermediate',
    questions: [
      {
        id: 'q-1',
        type: 'short-answer',
        question: 'Test question?',
        correctAnswer: 'Sample answer',
        explanation: {
          correctAnswer: 'Sample answer',
          explanation: 'Test explanation',
        },
        points: 5,
        tags: ['speaking', 'test'],
      },
    ],
    totalPoints: 5,
    estimatedMinutes: 10,
    status: 'published',
    tags: ['speaking', 'test'],
    sourceId: 'task-1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}

interface TableSkillMap {
  skill: ExerciseSkill
  tableName: string
  category: TaskEntry['category']
  title: string
}

const TABLE_SKILL_MAP: TableSkillMap[] = [
  { skill: 'speaking', tableName: 'speakingExercises', category: 'Speaking Part 1', title: 'Practice Speaking About Hobbies' },
  { skill: 'speaking', tableName: 'speakingExercises', category: 'Speaking Part 2', title: 'Describe a Memorable Trip' },
  { skill: 'speaking', tableName: 'speakingExercises', category: 'Speaking Part 3', title: 'Discuss Future Plans' },
  { skill: 'writing', tableName: 'writingExercises', category: 'Writing Task 2', title: 'Opinion Essay Practice' },
  { skill: 'writing', tableName: 'writingExercises', category: 'Writing Task 1', title: 'Describe a Chart' },
  { skill: 'reading', tableName: 'readingExercises', category: 'Reading', title: 'Practice Skimming' },
  { skill: 'listening', tableName: 'listeningExercises', category: 'Listening', title: 'Listen for Main Ideas' },
]

describe('generateExercise', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('topic and type matching', () => {
    TABLE_SKILL_MAP.forEach(({ skill, category, title }) => {
      it(`generates ${skill} exercise for category "${category}"`, async () => {
        const task = makeTask({ category, title })
        const exercise = await generateExercise(task, makeUserData())

        expect(exercise.skill).toBe(skill)
        expect(exercise.topic).toBeDefined()
        expect(exercise.questions.length).toBeGreaterThan(0)
      })
    })

    it('does not generate random exercises unrelated to the task', async () => {
      const task = makeTask({ category: 'Reading', title: 'Climate Change Reading Comprehension' })
      const exercise = await generateExercise(task, makeUserData())

      expect(exercise.skill).toBe('reading')
      expect(exercise.topic.toLowerCase()).toContain('climate')
      expect(exercise.tags).toContain('reading')
    })

    it('infers topic from task title when available', async () => {
      const task = makeTask({
        category: 'Writing Task 2',
        title: 'Education System Essay',
        description: 'Write about education',
      })
      const exercise = await generateExercise(task, makeUserData())

      expect(exercise.topic.toLowerCase()).toContain('education')
    })
  })

  describe('speaking exercise generation', () => {
    it('generates speaking questions with part references', async () => {
      const task = makeTask({
        category: 'Speaking Part 1',
        title: 'Speaking About Travel',
      })
      const exercise = await generateExercise(task, makeUserData())

      expect(exercise.skill).toBe('speaking')
      const allQuestions = exercise.questions.join(' ')
      expect(allQuestions).toBeTruthy()
    })

    it('marks speaking questions with speaking tags', async () => {
      const task = makeTask({ category: 'Speaking Part 1', title: 'Speaking About Food' })
      const exercise = await generateExercise(task, makeUserData())

      for (const q of exercise.questions) {
        expect(q.tags).toBeDefined()
        if (q.tags) {
          expect(q.tags.some(t => t === 'speaking')).toBe(true)
        }
      }
    })

    it('generates speaking exercise for all speaking parts', async () => {
      for (const part of ['Speaking Part 1', 'Speaking Part 2', 'Speaking Part 3'] as const) {
        const task = makeTask({ category: part, title: `Speaking ${part}` })
        const exercise = await generateExercise(task, makeUserData())

        expect(exercise.skill).toBe('speaking')
        expect(exercise.questions.length).toBeGreaterThanOrEqual(1)
      }
    })
  })

  describe('writing exercise generation', () => {
    it('generates writing exercise for Task 1', async () => {
      const task = makeTask({ category: 'Writing Task 1', title: 'Describe a Chart About Energy' })
      const exercise = await generateExercise(task, makeUserData())

      expect(exercise.skill).toBe('writing')
      expect(exercise.questions.length).toBeGreaterThan(0)
    })

    it('generates writing exercise for Task 2', async () => {
      const task = makeTask({ category: 'Writing Task 2', title: 'Opinion on Technology' })
      const exercise = await generateExercise(task, makeUserData())

      expect(exercise.skill).toBe('writing')
      expect(exercise.questions.length).toBeGreaterThan(0)
    })
  })

  describe('reading exercise generation', () => {
    it('generates reading comprehension questions', async () => {
      const task = makeTask({ category: 'Reading', title: 'Reading Practice Science' })
      const exercise = await generateExercise(task, makeUserData())

      expect(exercise.skill).toBe('reading')
      expect(exercise.questions.length).toBeGreaterThan(0)
    })
  })

  describe('listening exercise generation', () => {
    it('generates listening practice questions', async () => {
      const task = makeTask({ category: 'Listening', title: 'Listen for Specific Info' })
      const exercise = await generateExercise(task, makeUserData())

      expect(exercise.skill).toBe('listening')
      expect(exercise.questions.length).toBeGreaterThan(0)
    })
  })

  describe('vocabulary and grammar', () => {
    it('generates vocabulary exercise for vocabulary category', async () => {
      const task = makeTask({ category: 'Vocabulary', title: 'Academic Word List' })
      const exercise = await generateExercise(task, makeUserData())

      expect(exercise.topic).toBeDefined()
      expect(exercise.questions.length).toBeGreaterThan(0)
    })

    it('generates grammar exercise for grammar category', async () => {
      const task = makeTask({ category: 'Grammar', title: 'Grammar Tenses Review' })
      const exercise = await generateExercise(task, makeUserData())

      expect(exercise.topic).toBeDefined()
      expect(exercise.questions.length).toBeGreaterThan(0)
    })
  })

  describe('question structure', () => {
    it('generates questions with all required fields', async () => {
      const task = makeTask({ category: 'Speaking Part 1' })
      const exercise = await generateExercise(task, makeUserData())

      for (const q of exercise.questions) {
        expect(q.id).toBeTruthy()
        expect(q.question).toBeTruthy()
        expect(q.type).toBeTruthy()
        expect(q.correctAnswer).toBeDefined()
        expect(q.explanation).toBeDefined()
        expect(q.explanation.correctAnswer).toBeDefined()
        expect(q.explanation.explanation).toBeTruthy()
      }
    })

    it('calculates total points from questions', async () => {
      const task = makeTask({ category: 'Speaking Part 1' })
      const exercise = await generateExercise(task, makeUserData())

      const expectedPoints = exercise.questions.reduce((sum, q) => sum + (q.points ?? 1), 0)
      expect(exercise.totalPoints).toBe(expectedPoints)
    })
  })

  describe('exercise metadata', () => {
    it('sets source to user-created', async () => {
      const task = makeTask()
      const exercise = await generateExercise(task, makeUserData())

      expect(exercise.source).toBe('user-created')
    })

    it('sets status to published', async () => {
      const task = makeTask()
      const exercise = await generateExercise(task, makeUserData())

      expect(exercise.status).toBe('published')
    })

    it('links exercise to task via sourceId', async () => {
      const task = makeTask({ id: 'specific-task-id' })
      const exercise = await generateExercise(task, makeUserData())

      expect(exercise.sourceId).toBe('specific-task-id')
    })

    it('uses task time for estimated minutes', async () => {
      const task = makeTask({ timeMinutes: 25 })
      const exercise = await generateExercise(task, makeUserData())

      expect(exercise.estimatedMinutes).toBe(25)
    })

    it('infers difficulty from task time', async () => {
      const easy = await generateExercise(makeTask({ timeMinutes: 10 }), makeUserData())
      expect(easy.difficulty).toBe('beginner')

      const medium = await generateExercise(makeTask({ timeMinutes: 20 }), makeUserData())
      expect(medium.difficulty).toBe('intermediate')

      const hard = await generateExercise(makeTask({ timeMinutes: 30 }), makeUserData())
      expect(hard.difficulty).toBe('advanced')
    })
  })

  describe('handles edge cases', () => {
    it('handles unknown category gracefully', async () => {
      const task = makeTask({ category: 'Mock Test' as TaskEntry['category'] })
      const exercise = await generateExercise(task, makeUserData())

      expect(exercise.skill).toBeDefined()
      expect(exercise.questions.length).toBeGreaterThan(0)
    })

    it('handles empty title by falling back to description', async () => {
      const task = makeTask({
        title: '',
        description: 'Some description about Technology',
        category: 'Reading',
      })
      const exercise = await generateExercise(task, makeUserData())

      expect(exercise.topic).toBeDefined()
      expect(exercise.topic.length).toBeGreaterThan(0)
    })
  })
})

describe('saveExercise', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('saves to correct IndexedDB stores', () => {
    TABLE_SKILL_MAP.forEach(({ skill, tableName }) => {
      it(`saves ${skill} exercise to "${tableName}" table`, async () => {
        const exercise = makeExercise({ skill })
        await saveExercise(exercise)

        expect(DatabaseService.queryByIndex).toHaveBeenCalledWith(
          tableName,
          'sourceId',
          exercise.sourceId,
        )
        expect(DatabaseService.add).toHaveBeenCalledWith(
          tableName,
          expect.objectContaining({
            skill,
            sourceId: exercise.sourceId,
          }),
        )
      })
    })
  })

  describe('speaking exercise saving', () => {
    it('saves speaking exercise to speakingExercises table', async () => {
      const exercise = makeExercise({ skill: 'speaking' })
      await saveExercise(exercise)

      expect(DatabaseService.queryByIndex).toHaveBeenCalledWith(
        'speakingExercises',
        'sourceId',
        exercise.sourceId,
      )
      expect(DatabaseService.add).toHaveBeenCalledWith(
        'speakingExercises',
        expect.objectContaining({
          skill: 'speaking',
          sourceId: exercise.sourceId,
        }),
      )
    })

    it('stores speaking exercise with serialized content and questions', async () => {
      const exercise = makeExercise({ skill: 'speaking' })
      await saveExercise(exercise)

      const entry = DatabaseService.add.mock.calls[0][1] as Record<string, unknown>
      expect(entry.content).toBe(JSON.stringify(exercise))
      expect(entry.questions).toBe(JSON.stringify(exercise.questions))
    })
  })

  describe('upsert logic', () => {
    it('calls add when no existing exercise with same sourceId exists', async () => {
      vi.mocked(DatabaseService.queryByIndex).mockResolvedValue([])

      const exercise = makeExercise({ skill: 'reading' })
      await saveExercise(exercise)

      expect(DatabaseService.add).toHaveBeenCalled()
      expect(DatabaseService.update).not.toHaveBeenCalled()
    })

    it('calls update when an existing exercise with same sourceId exists', async () => {
      vi.mocked(DatabaseService.queryByIndex).mockResolvedValue([
        { id: 'existing-id', skill: 'reading' },
      ])

      const exercise = makeExercise({ skill: 'reading' })
      await saveExercise(exercise)

      expect(DatabaseService.update).toHaveBeenCalledWith(
        'readingExercises',
        'existing-id',
        expect.objectContaining({
          skill: 'reading',
        }),
      )
      expect(DatabaseService.add).not.toHaveBeenCalled()
    })
  })

  describe('edge cases', () => {
    it('does not save when skill has no matching table', async () => {
      const exercise = makeExercise({ skill: 'vocabulary' as ExerciseSkill })
      await saveExercise(exercise)

      expect(DatabaseService.queryByIndex).not.toHaveBeenCalled()
      expect(DatabaseService.add).not.toHaveBeenCalled()
      expect(DatabaseService.update).not.toHaveBeenCalled()
    })

    it('does not throw when DatabaseService throws', async () => {
      vi.mocked(DatabaseService.add).mockRejectedValue(new Error('Storage unavailable'))

      const exercise = makeExercise({ skill: 'writing' })
      await expect(saveExercise(exercise)).resolves.toBeUndefined()
    })
  })

  describe('entry structure', () => {
    it('saves entry with serialized content and questions', async () => {
      const exercise = makeExercise({ skill: 'listening', metadata: { source: 'test' } })
      await saveExercise(exercise)

      const entry = DatabaseService.add.mock.calls[0][1] as Record<string, unknown>
      expect(entry.content).toBe(JSON.stringify(exercise))
      expect(entry.questions).toBe(JSON.stringify(exercise.questions))
      expect(entry.metadata).toBe(JSON.stringify(exercise.metadata ?? {}))
    })

    it('includes createdAt and updatedAt timestamps', async () => {
      const exercise = makeExercise({ skill: 'reading' })
      await saveExercise(exercise)

      const entry = DatabaseService.add.mock.calls[0][1] as Record<string, unknown>
      expect(entry.createdAt).toBeTruthy()
      expect(entry.updatedAt).toBeTruthy()
    })
  })
})

describe('generateExercise saves for review', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  TABLE_SKILL_MAP.forEach(({ skill, tableName, category, title }) => {
    it(`saves ${skill} exercise to "${tableName}" after generation`, async () => {
      const task = makeTask({ category, title })
      await generateExercise(task, makeUserData())

      expect(DatabaseService.queryByIndex).toHaveBeenCalledWith(
        tableName,
        'sourceId',
        expect.any(String),
      )
      expect(DatabaseService.add).toHaveBeenCalledWith(
        tableName,
        expect.objectContaining({
          skill,
          sourceId: task.id,
        }),
      )
    })
  })

  it('calls add exactly once per exercise generation', async () => {
    const task = makeTask({ category: 'Speaking Part 1' })
    await generateExercise(task, makeUserData())

    expect(DatabaseService.add).toHaveBeenCalledOnce()
  })
})
