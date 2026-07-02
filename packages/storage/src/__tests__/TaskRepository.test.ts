import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import 'fake-indexeddb/auto'
import { initDb, destroyDb, getDb } from '../db'
import { APP_SCHEMA } from '../migrations'
import { TaskRepository } from '../repositories'
import type { TaskEntry } from '../repositories/TaskRepository'

function setupDb() {
  destroyDb()
  initDb(APP_SCHEMA)
}

async function clearData() {
  const db = getDb()
  await db.table('tasks').clear()
}

function makeTask(overrides: Partial<TaskEntry> = {}): Omit<TaskEntry, 'id'> {
  const now = new Date().toISOString()
  return {
    title: 'Study vocabulary',
    description: 'Review 20 new words',
    category: 'Vocabulary',
    date: now,
    isDone: false,
    isRecurring: false,
    recurringDays: [],
    notes: '',
    timeMinutes: 30,
    createdAt: now,
    updatedAt: now,
    completedAt: null,
    ...overrides,
  } as Omit<TaskEntry, 'id'>
}

describe('TaskRepository', () => {
  let repo: TaskRepository

  beforeEach(async () => {
    setupDb()
    await clearData()
    repo = new TaskRepository()
  })

  afterEach(() => {
    destroyDb()
  })

  describe('findByDate', () => {
    it('finds tasks by date (ignores time)', async () => {
      const today = new Date().toISOString().slice(0, 10)
      await repo.create(makeTask({ title: 'Today task', date: `${today}T10:00:00.000Z` }))
      await repo.create(makeTask({ title: 'Tomorrow task', date: `${today}T00:00:00.000Z` }))
      const results = await repo.findByDate(today)
      expect(results.length).toBeGreaterThanOrEqual(2)
    })

    it('returns empty for no tasks on date', async () => {
      const results = await repo.findByDate('2099-01-01')
      expect(results).toEqual([])
    })
  })

  describe('findByCategory', () => {
    it('filters by category', async () => {
      await repo.create(makeTask({ title: 'Reading', category: 'Reading' }))
      await repo.create(makeTask({ title: 'Writing', category: 'Writing Task 1' }))
      const results = await repo.findByCategory('Reading')
      expect(results).toHaveLength(1)
    })
  })

  describe('findPending', () => {
    it('returns only incomplete tasks', async () => {
      await repo.create(makeTask({ title: 'Todo', isDone: false }))
      await repo.create(makeTask({ title: 'Done', isDone: true }))
      const pending = await repo.findPending()
      expect(pending).toHaveLength(1)
      expect(pending[0].title).toBe('Todo')
    })
  })

  describe('markAsDone', () => {
    it('marks task as done and sets completedAt', async () => {
      const task = await repo.create(makeTask({ title: 'Finish it' }))
      await repo.markAsDone(task.id)
      const updated = await repo.findByIdOrThrow(task.id)
      expect(updated.isDone).toBe(true)
      expect(updated.completedAt).toBeTruthy()
    })
  })

  describe('markAsNotDone', () => {
    it('marks task as not done and clears completedAt', async () => {
      const task = await repo.create(makeTask({ title: 'Unfinish', isDone: true, completedAt: new Date().toISOString() }))
      await repo.markAsNotDone(task.id)
      const updated = await repo.findByIdOrThrow(task.id)
      expect(updated.isDone).toBe(false)
      expect(updated.completedAt).toBeNull()
    })
  })

  describe('getStats', () => {
    it('returns task statistics', async () => {
      await repo.create(makeTask({ title: 'A', isDone: true }))
      await repo.create(makeTask({ title: 'B', isDone: false }))
      await repo.create(makeTask({ title: 'C', isDone: true }))
      const stats = await repo.getStats()
      expect(stats.total).toBe(3)
      expect(stats.done).toBe(2)
      expect(stats.pending).toBe(1)
    })
  })
})
