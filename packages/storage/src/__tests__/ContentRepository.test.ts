import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import 'fake-indexeddb/auto'
import { initDb, destroyDb, getDb } from '../db'
import { APP_SCHEMA } from '../migrations'
import { ContentMetaRepository, UserContentEditRepository } from '../repositories'
import type { ContentMeta, UserContentEdit } from '../repositories/ContentRepository'

function setupDb() {
  destroyDb()
  initDb(APP_SCHEMA)
}

async function clearData() {
  const db = getDb()
  await db.table('contentMeta').clear()
  await db.table('userContentEdits').clear()
}

function makeMeta(overrides: Partial<ContentMeta> = {}): Omit<ContentMeta, 'id'> {
  const now = new Date().toISOString()
  return {
    packId: 'reading-passages-v1',
    packName: 'Reading Passages',
    packVersion: 1,
    contentCount: 10,
    seededAt: now,
    updatedAt: now,
    ...overrides,
  } as Omit<ContentMeta, 'id'>
}

function makeEdit(overrides: Partial<UserContentEdit> = {}): Omit<UserContentEdit, 'id'> {
  const now = new Date().toISOString()
  return {
    originalId: 'orig-1',
    userItemId: 'user-1',
    contentType: 'readingPassage',
    tableName: 'readingPassages',
    editedAt: now,
    createdAt: now,
    ...overrides,
  } as Omit<UserContentEdit, 'id'>
}

describe('ContentMetaRepository', () => {
  let repo: ContentMetaRepository

  beforeEach(async () => {
    setupDb()
    await clearData()
    repo = new ContentMetaRepository()
  })

  afterEach(() => {
    destroyDb()
  })

  describe('findByPackId', () => {
    it('finds content meta by pack id', async () => {
      await repo.create(makeMeta({ packId: 'pack-1', packName: 'Pack 1' }))
      const found = await repo.findByPackId('pack-1')
      expect(found).toBeDefined()
      expect(found!.packName).toBe('Pack 1')
    })

    it('returns undefined for unknown pack', async () => {
      const found = await repo.findByPackId('unknown')
      expect(found).toBeUndefined()
    })
  })

  describe('findSeededPacks', () => {
    it('returns all seeded packs', async () => {
      await repo.create(makeMeta({ packId: 'a' }))
      await repo.create(makeMeta({ packId: 'b' }))
      const packs = await repo.findSeededPacks()
      expect(packs).toHaveLength(2)
    })
  })

  describe('isPackSeeded', () => {
    it('returns true if pack version is >= minimum', async () => {
      await repo.create(makeMeta({ packId: 'p1', packVersion: 2 }))
      expect(await repo.isPackSeeded('p1', 1)).toBe(true)
      expect(await repo.isPackSeeded('p1', 2)).toBe(true)
    })

    it('returns false if pack version is below minimum', async () => {
      await repo.create(makeMeta({ packId: 'p1', packVersion: 1 }))
      expect(await repo.isPackSeeded('p1', 2)).toBe(false)
    })

    it('returns false if pack not seeded', async () => {
      expect(await repo.isPackSeeded('nonexistent', 1)).toBe(false)
    })
  })

  describe('markPackSeeded', () => {
    it('creates new meta entry', async () => {
      const meta = await repo.markPackSeeded('new-pack', 'New Pack', 1, 5)
      expect(meta.packId).toBe('new-pack')
      expect(meta.contentCount).toBe(5)
    })

    it('updates existing meta entry', async () => {
      await repo.create(makeMeta({ packId: 'existing', packVersion: 1, contentCount: 5 }))
      const updated = await repo.markPackSeeded('existing', 'Existing', 2, 10)
      expect(updated.packVersion).toBe(2)
      expect(updated.contentCount).toBe(10)
    })
  })
})

describe('UserContentEditRepository', () => {
  let repo: UserContentEditRepository

  beforeEach(async () => {
    setupDb()
    await clearData()
    repo = new UserContentEditRepository()
  })

  afterEach(() => {
    destroyDb()
  })

  describe('findByOriginalId', () => {
    it('finds edit by original id', async () => {
      await repo.create(makeEdit({ originalId: 'orig-a' }))
      const found = await repo.findByOriginalId('orig-a')
      expect(found).toBeDefined()
    })

    it('returns undefined when not edited', async () => {
      const found = await repo.findByOriginalId('never-edited')
      expect(found).toBeUndefined()
    })
  })

  describe('findByContentType', () => {
    it('filters by content type', async () => {
      await repo.create(makeEdit({ contentType: 'readingPassage' }))
      await repo.create(makeEdit({ contentType: 'vocabulary' }))
      const results = await repo.findByContentType('readingPassage')
      expect(results).toHaveLength(1)
    })
  })

  describe('hasUserEdit', () => {
    it('returns true if edit exists', async () => {
      await repo.create(makeEdit({ originalId: 'editable' }))
      expect(await repo.hasUserEdit('editable')).toBe(true)
    })

    it('returns false if no edit', async () => {
      expect(await repo.hasUserEdit('nonexistent')).toBe(false)
    })
  })

  describe('findUserEditsByTable', () => {
    it('filters by table name', async () => {
      await repo.create(makeEdit({ tableName: 'readingPassages' }))
      await repo.create(makeEdit({ tableName: 'vocabulary' }))
      const results = await repo.findUserEditsByTable('readingPassages')
      expect(results).toHaveLength(1)
    })
  })
})
