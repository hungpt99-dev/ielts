import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import 'fake-indexeddb/auto'
import { z } from 'zod'
import { initDb, destroyDb, getDb } from '../db'
import { APP_SCHEMA } from '../migrations'
import { BaseRepository } from '../repositories/BaseRepository'
import { EntityNotFoundError, ValidationError } from '../errors'

const testSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().default(''),
  isDone: z.boolean().default(false),
  category: z.string().default('general'),
  timeMinutes: z.number().default(0),
  date: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  completedAt: z.string().nullable().default(null),
})

type TestItem = z.infer<typeof testSchema>

class TestRepository extends BaseRepository<TestItem> {
  constructor() {
    super('tasks', testSchema)
  }
}

function setupDb() {
  destroyDb()
  initDb(APP_SCHEMA)
}

async function clearData() {
  const db = getDb()
  await db.table('tasks').clear()
}

function makeItem(overrides: Partial<TestItem> = {}): Omit<TestItem, 'id'> {
  const now = new Date().toISOString()
  return {
    title: 'Test Task',
    description: '',
    isDone: false,
    category: 'Vocabulary',
    timeMinutes: 30,
    date: now,
    createdAt: now,
    updatedAt: now,
    completedAt: null,
    ...overrides,
  } as Omit<TestItem, 'id'>
}

describe('BaseRepository', () => {
  let repo: TestRepository

  beforeEach(async () => {
    setupDb()
    await clearData()
    repo = new TestRepository()
  })

  afterEach(() => {
    destroyDb()
  })

  describe('findAll', () => {
    it('returns empty array when no items exist', async () => {
      const items = await repo.findAll()
      expect(items).toEqual([])
    })

    it('returns all items', async () => {
      await repo.create(makeItem({ title: 'Item 1', timeMinutes: 10 }))
      await repo.create(makeItem({ title: 'Item 2', timeMinutes: 20 }))
      const items = await repo.findAll()
      expect(items).toHaveLength(2)
    })
  })

  describe('findById', () => {
    it('returns undefined for non-existent id', async () => {
      const item = await repo.findById('nonexistent')
      expect(item).toBeUndefined()
    })

    it('returns item by id', async () => {
      const created = await repo.create(makeItem({ title: 'Test' }))
      const found = await repo.findById(created.id)
      expect(found).toBeDefined()
      expect(found!.title).toBe('Test')
    })
  })

  describe('findByIdOrThrow', () => {
    it('throws EntityNotFoundError for non-existent id', async () => {
      await expect(repo.findByIdOrThrow('nonexistent')).rejects.toThrow(EntityNotFoundError)
    })

    it('returns item when found', async () => {
      const created = await repo.create(makeItem({ title: 'Found' }))
      const found = await repo.findByIdOrThrow(created.id)
      expect(found.title).toBe('Found')
    })
  })

  describe('create', () => {
    it('auto-generates id when not provided', async () => {
      const item = await repo.create(makeItem({ title: 'Auto ID' }))
      expect(item.id).toBeTruthy()
    })

    it('uses provided id when given', async () => {
      const item = await repo.create({ ...makeItem({ title: 'Custom' }), id: 'custom-id' })
      expect(item.id).toBe('custom-id')
    })

    it('sets createdAt and updatedAt timestamps', async () => {
      const item = await repo.create(makeItem({ title: 'Timestamps' }))
      expect(item.createdAt).toBeTruthy()
      expect(item.updatedAt).toBeTruthy()
    })

    it('throws ValidationError for invalid data', async () => {
      await expect(repo.create({ invalid: true } as unknown as Omit<TestItem, 'id'>)).rejects.toThrow(ValidationError)
    })
  })

  describe('createReturningId', () => {
    it('returns the id of the created item', async () => {
      const id = await repo.createReturningId(makeItem({ title: 'Return ID' }))
      expect(id).toBeTruthy()
      const item = await repo.findById(id)
      expect(item).toBeDefined()
    })
  })

  describe('update', () => {
    it('updates item fields', async () => {
      const created = await repo.create(makeItem({ title: 'Original', timeMinutes: 1 }))
      await repo.update(created.id, { title: 'Updated', timeMinutes: 2 } as Partial<TestItem>)
      const updated = await repo.findByIdOrThrow(created.id)
      expect(updated.title).toBe('Updated')
      expect(updated.timeMinutes).toBe(2)
    })

    it('throws EntityNotFoundError for non-existent item', async () => {
      await expect(repo.update('nonexistent', { title: 'Nope' } as Partial<TestItem>)).rejects.toThrow(EntityNotFoundError)
    })

    it('updates updatedAt timestamp', async () => {
      const created = await repo.create(makeItem({ title: 'Time Test' }))
      await new Promise(r => setTimeout(r, 10))
      await repo.update(created.id, { title: 'Updated Time' } as Partial<TestItem>)
      const updated = await repo.findByIdOrThrow(created.id)
      expect(new Date(updated.updatedAt).getTime()).toBeGreaterThan(new Date(created.updatedAt).getTime())
    })
  })

  describe('patch', () => {
    it('updates and returns updated item', async () => {
      const created = await repo.create(makeItem({ title: 'Patch Test', isDone: false }))
      const updated = await repo.patch(created.id, { isDone: true } as Partial<TestItem>)
      expect(updated).toBeDefined()
      expect(updated!.isDone).toBe(true)
      expect(updated!.title).toBe('Patch Test')
    })

    it('returns undefined for non-existent item', async () => {
      const result = await repo.patch('nonexistent', { title: 'Nope' } as Partial<TestItem>)
      expect(result).toBeUndefined()
    })
  })

  describe('delete', () => {
    it('deletes existing item', async () => {
      const created = await repo.create(makeItem({ title: 'Delete Me' }))
      await repo.delete(created.id)
      const found = await repo.findById(created.id)
      expect(found).toBeUndefined()
    })

    it('does not throw when deleting non-existent item', async () => {
      await expect(repo.delete('nonexistent')).resolves.toBeUndefined()
    })
  })

  describe('count', () => {
    it('returns 0 for empty table', async () => {
      expect(await repo.count()).toBe(0)
    })

    it('returns correct count', async () => {
      await repo.create(makeItem({ title: 'A' }))
      await repo.create(makeItem({ title: 'B' }))
      await repo.create(makeItem({ title: 'C' }))
      expect(await repo.count()).toBe(3)
    })
  })

  describe('exists', () => {
    it('returns false for non-existent item', async () => {
      expect(await repo.exists('nonexistent')).toBe(false)
    })

    it('returns true for existing item', async () => {
      const created = await repo.create(makeItem({ title: 'Exists' }))
      expect(await repo.exists(created.id)).toBe(true)
    })
  })

  describe('bulkCreate', () => {
    it('creates multiple items', async () => {
      const now = new Date().toISOString()
      const items: TestItem[] = [
        { id: 'b1', title: 'Bulk 1', description: '', isDone: false, category: 'Vocabulary', timeMinutes: 10, date: now, createdAt: now, updatedAt: now, completedAt: null },
        { id: 'b2', title: 'Bulk 2', description: '', isDone: false, category: 'Vocabulary', timeMinutes: 20, date: now, createdAt: now, updatedAt: now, completedAt: null },
      ]
      const count = await repo.bulkCreate(items)
      expect(count).toBe(2)
      expect(await repo.count()).toBe(2)
    })

    it('rejects items with validation errors', async () => {
      const now = new Date().toISOString()
      const items: TestItem[] = [
        { id: 'v1', title: 'Valid', description: '', isDone: false, category: 'Vocabulary', timeMinutes: 1, date: now, createdAt: now, updatedAt: now, completedAt: null },
        { id: 'v2', title: '', description: '', isDone: false, category: 'Vocabulary', timeMinutes: 2, date: now, createdAt: now, updatedAt: now, completedAt: null },
      ]
      await expect(repo.bulkCreate(items)).rejects.toThrow()
    })
  })

  describe('bulkUpsert', () => {
    it('creates items via upsert', async () => {
      const now = new Date().toISOString()
      const items: TestItem[] = [
        { id: 'u1', title: 'Upsert 1', description: '', isDone: false, category: 'Vocabulary', timeMinutes: 5, date: now, createdAt: now, updatedAt: now, completedAt: null },
      ]
      const count = await repo.bulkUpsert(items)
      expect(count).toBe(1)
    })
  })

  describe('clear', () => {
    it('removes all items', async () => {
      await repo.create(makeItem({ title: 'A' }))
      await repo.create(makeItem({ title: 'B' }))
      await repo.clear()
      expect(await repo.count()).toBe(0)
    })
  })

  describe('queryByIndex', () => {
    it('filters by indexed field category', async () => {
      await repo.create(makeItem({ title: 'Vocab Task', isDone: false, category: 'Vocabulary' }))
      await repo.create(makeItem({ title: 'Reading Task', isDone: false, category: 'Reading' }))
      const results = await repo.queryByIndex('category', 'Reading' as never)
      expect(results).toHaveLength(1)
      expect(results[0].title).toBe('Reading Task')
    })

    it('returns empty array for no matches', async () => {
      const results = await repo.queryByIndex('category', 'Nonexistent' as never)
      expect(results).toEqual([])
    })
  })

  describe('findByDateRange', () => {
    it('filters by date range', async () => {
      await repo.create(makeItem({ title: 'Date Test' }))
      const results = await repo.findByDateRange('createdAt', '2020-01-01', '2099-12-31')
      expect(results.length).toBeGreaterThanOrEqual(1)
    })

    it('returns empty for no matches', async () => {
      const results = await repo.findByDateRange('createdAt', '2010-01-01', '2010-12-31')
      expect(results).toEqual([])
    })
  })

  describe('searchByText', () => {
    it('finds items matching query in specified fields', async () => {
      await repo.create(makeItem({ title: 'Apple Pie' }))
      await repo.create(makeItem({ title: 'Banana Split' }))
      const results = await repo.searchByText('apple', ['title'])
      expect(results).toHaveLength(1)
      expect(results[0].title).toBe('Apple Pie')
    })

    it('returns empty for no matches', async () => {
      const results = await repo.searchByText('nonexistent', ['title'])
      expect(results).toEqual([])
    })

    it('is case insensitive', async () => {
      await repo.create(makeItem({ title: 'Hello World' }))
      const results = await repo.searchByText('hello', ['title'])
      expect(results).toHaveLength(1)
    })
  })
})
