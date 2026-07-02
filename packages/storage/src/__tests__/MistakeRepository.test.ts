import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import 'fake-indexeddb/auto'
import { initDb, destroyDb, getDb } from '../db'
import { APP_SCHEMA } from '../migrations'
import { MistakeRepository } from '../repositories'
import type { MistakeEntry } from '../repositories/MistakeRepository'

function setupDb() {
  destroyDb()
  initDb(APP_SCHEMA)
}

async function clearData() {
  const db = getDb()
  await db.table('mistakes').clear()
}

function makeMistake(overrides: Partial<MistakeEntry> = {}): Omit<MistakeEntry, 'id'> {
  const now = new Date().toISOString()
  return {
    mistake: 'I go to school yesterday.',
    correction: 'I went to school yesterday.',
    explanation: 'Past tense required for past time reference.',
    source: 'writing',
    date: now,
    skill: 'grammar',
    status: 'new',
    repetitionCount: 0,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  } as Omit<MistakeEntry, 'id'>
}

describe('MistakeRepository', () => {
  let repo: MistakeRepository

  beforeEach(async () => {
    setupDb()
    await clearData()
    repo = new MistakeRepository()
  })

  afterEach(() => {
    destroyDb()
  })

  describe('findBySkill', () => {
    it('filters by skill', async () => {
      await repo.create(makeMistake({ mistake: 'grammar error', skill: 'grammar' }))
      await repo.create(makeMistake({ mistake: 'vocab error', skill: 'vocabulary' }))
      const results = await repo.findBySkill('grammar')
      expect(results).toHaveLength(1)
      expect(results[0].mistake).toBe('grammar error')
    })
  })

  describe('findByStatus', () => {
    it('filters by status', async () => {
      await repo.create(makeMistake({ mistake: 'new error', status: 'new' }))
      await repo.create(makeMistake({ mistake: 'resolved error', status: 'resolved' }))
      const results = await repo.findByStatus('resolved')
      expect(results).toHaveLength(1)
    })
  })

  describe('search', () => {
    it('searches across text fields', async () => {
      await repo.create(makeMistake({ mistake: 'incorrect verb tense' }))
      await repo.create(makeMistake({ mistake: 'wrong preposition' }))
      const results = await repo.search('verb')
      expect(results).toHaveLength(1)
    })

    it('returns empty for no matches', async () => {
      const results = await repo.search('nonexistent')
      expect(results).toEqual([])
    })
  })

  describe('getStats', () => {
    it('returns correct stats for mixed statuses', async () => {
      await repo.create(makeMistake({ mistake: 'm1', status: 'new', skill: 'grammar' }))
      await repo.create(makeMistake({ mistake: 'm2', status: 'reviewed', skill: 'grammar' }))
      await repo.create(makeMistake({ mistake: 'm3', status: 'resolved', skill: 'vocabulary' }))
      const stats = await repo.getStats()
      expect(stats.total).toBe(3)
      expect(stats.newCount).toBe(1)
      expect(stats.reviewingCount).toBe(1)
      expect(stats.fixedCount).toBe(1)
      expect(stats.bySkill.grammar).toBe(2)
      expect(stats.bySkill.vocabulary).toBe(1)
      expect(stats.dueForReview).toBeGreaterThanOrEqual(1)
    })

    it('returns zeros for empty table', async () => {
      const stats = await repo.getStats()
      expect(stats.total).toBe(0)
      expect(stats.newCount).toBe(0)
      expect(stats.reviewingCount).toBe(0)
      expect(stats.fixedCount).toBe(0)
      expect(stats.bySkill).toEqual({})
      expect(stats.dueForReview).toBe(0)
    })
  })
})
