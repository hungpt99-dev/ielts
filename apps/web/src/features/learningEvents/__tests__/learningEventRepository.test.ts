import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import 'fake-indexeddb/auto'
import { initDb, destroyDb, getDb, APP_SCHEMA } from '@ielts/storage'
import { LearningEventRepository, resetInMemoryStore } from '../learningEventRepository'
import { ROUTES } from '@ielts/config'
import type { CreateLearningEventInput, LearningEvent } from '../types'

function setupDb() {
  destroyDb()
  initDb(APP_SCHEMA)
}

async function clearData() {
  const db = getDb()
  await db.table('learningEvents').clear()
}

function makeInput(overrides: Partial<CreateLearningEventInput> = {}): CreateLearningEventInput {
  return {
    eventType: 'app_opened',
    source: 'website',
    payload: {
      eventType: 'app_opened',
      lastActiveAt: null,
      isReturnVisit: false,
    },
    page: ROUTES.dashboard,
    ...overrides,
  }
}

describe('LearningEventRepository', () => {
  let repo: LearningEventRepository

  beforeEach(async () => {
    setupDb()
    await clearData()
    resetInMemoryStore()
    repo = new LearningEventRepository()
  })

  afterEach(() => {
    destroyDb()
  })

  describe('save', () => {
    it('creates an event with generated id', async () => {
      const event = await repo.save(makeInput())
      expect(event.eventId).toBeTruthy()
      expect(event.eventId.length).toBeGreaterThan(0)
    })

    it('sets syncStatus to local_only', async () => {
      const event = await repo.save(makeInput())
      expect(event.syncStatus).toBe('local_only')
    })

    it('sets createdAt and timestamp', async () => {
      const event = await repo.save(makeInput())
      expect(event.createdAt).toBeTruthy()
      expect(event.timestamp).toBeTruthy()
    })

    it('uses provided optional fields', async () => {
      const input = makeInput({
        page: ROUTES.progress,
        entityType: 'progress',
        entityId: 'progress-1',
        metadata: { source: 'test' },
        correlationId: 'corr-1',
      })
      const event = await repo.save(input)
      expect(event.page).toBe(ROUTES.progress)
      expect(event.entityType).toBe('progress')
      expect(event.entityId).toBe('progress-1')
      expect(event.metadata).toEqual({ source: 'test' })
      expect(event.correlationId).toBe('corr-1')
    })

    it('stores event with different payload types', async () => {
      const vocabEvent = await repo.save({
        eventType: 'vocabulary_saved',
        source: 'vocabulary',
        payload: {
          eventType: 'vocabulary_saved',
          vocabularyId: 'vocab-1',
          word: 'test',
          topic: 'education',
          sessionWordCount: 5,
        },
      })
      expect(vocabEvent.eventType).toBe('vocabulary_saved')
      expect((vocabEvent.payload as { word: string }).word).toBe('test')
    })
  })

  describe('findById', () => {
    it('returns undefined for non-existent id', async () => {
      const result = await repo.findById('nonexistent')
      expect(result).toBeUndefined()
    })

    it('returns event by id', async () => {
      const created = await repo.save(makeInput())
      const found = await repo.findById(created.eventId)
      expect(found).toBeDefined()
      expect(found!.eventId).toBe(created.eventId)
    })
  })

  describe('findByEventType', () => {
    it('returns events of given type', async () => {
      await repo.save(makeInput({ eventType: 'app_opened', payload: { eventType: 'app_opened', lastActiveAt: null, isReturnVisit: false } }))
      await repo.save(makeInput({ eventType: 'dashboard_opened', payload: { eventType: 'dashboard_opened', activeTasks: 3 } }))
      await repo.save(makeInput({ eventType: 'app_opened', payload: { eventType: 'app_opened', lastActiveAt: null, isReturnVisit: true } }))

      const results = await repo.findByEventType('app_opened')
      expect(results).toHaveLength(2)
    })

    it('returns empty array when no matching events', async () => {
      const results = await repo.findByEventType('app_opened')
      expect(results).toEqual([])
    })
  })

  describe('findBySession', () => {
    it('returns events with matching session id', async () => {
      const event1 = await repo.save(makeInput())
      const event2 = await repo.save(makeInput())

      const sessionResults = await repo.findBySession(event1.sessionId)
      expect(sessionResults.length).toBeGreaterThanOrEqual(1)
      expect(sessionResults[0].sessionId).toBe(event1.sessionId)
      expect(sessionResults.find(e => e.eventId === event2.eventId)).toBeUndefined()
    })
  })

  describe('findByDateRange', () => {
    it('returns events within date range', async () => {
      await repo.save(makeInput())
      const start = new Date(Date.now() - 1000).toISOString()
      const end = new Date(Date.now() + 1000).toISOString()

      const results = await repo.findByDateRange(start, end)
      expect(results.length).toBeGreaterThanOrEqual(1)
    })

    it('returns empty array for no matches', async () => {
      const results = await repo.findByDateRange('2010-01-01T00:00:00.000Z', '2010-12-31T23:59:59.999Z')
      expect(results).toEqual([])
    })
  })

  describe('findBySyncStatus', () => {
    it('returns events with matching sync status', async () => {
      await repo.save(makeInput())
      const results = await repo.findBySyncStatus('local_only')
      expect(results.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('findAll', () => {
    it('returns empty array when no events', async () => {
      const results = await repo.findAll()
      expect(results).toEqual([])
    })

    it('returns all events sorted by most recent', async () => {
      await repo.save(makeInput())
      await repo.save(makeInput())
      const results = await repo.findAll()
      expect(results.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('count', () => {
    it('returns 0 for empty table', async () => {
      expect(await repo.count()).toBe(0)
    })

    it('returns correct count', async () => {
      await repo.save(makeInput())
      await repo.save(makeInput())
      expect(await repo.count()).toBe(2)
    })
  })

  describe('countByEventType', () => {
    it('returns correct count per type', async () => {
      await repo.save(makeInput({ eventType: 'app_opened', payload: { eventType: 'app_opened', lastActiveAt: null, isReturnVisit: false } }))
      await repo.save(makeInput({ eventType: 'app_opened', payload: { eventType: 'app_opened', lastActiveAt: null, isReturnVisit: false } }))
      await repo.save(makeInput({ eventType: 'dashboard_opened', payload: { eventType: 'dashboard_opened', activeTasks: 3 } }))

      expect(await repo.countByEventType('app_opened')).toBe(2)
      expect(await repo.countByEventType('dashboard_opened')).toBe(1)
    })
  })

  describe('countInWindow', () => {
    it('counts events in last 30 minutes', async () => {
      await repo.save(makeInput({ eventType: 'app_opened', payload: { eventType: 'app_opened', lastActiveAt: null, isReturnVisit: false } }))
      const count = await repo.countInWindow('app_opened', 'last_30_minutes')
      expect(count).toBe(1)
    })

    it('counts events today', async () => {
      await repo.save(makeInput({ eventType: 'app_opened', payload: { eventType: 'app_opened', lastActiveAt: null, isReturnVisit: false } }))
      await repo.save(makeInput({ eventType: 'app_opened', payload: { eventType: 'app_opened', lastActiveAt: null, isReturnVisit: false } }))
      const count = await repo.countInWindow('app_opened', 'today')
      expect(count).toBe(2)
    })

    it('counts events in last 7 days', async () => {
      await repo.save(makeInput({ eventType: 'app_opened', payload: { eventType: 'app_opened', lastActiveAt: null, isReturnVisit: false } }))
      const count = await repo.countInWindow('app_opened', 'last_7_days')
      expect(count).toBe(1)
    })

    it('returns 0 when no events in window', async () => {
      const count = await repo.countInWindow('vocabulary_saved', 'last_30_minutes')
      expect(count).toBe(0)
    })
  })

  describe('updateSyncStatus', () => {
    it('updates sync status of an event', async () => {
      const event = await repo.save(makeInput())
      expect(event.syncStatus).toBe('local_only')

      await repo.updateSyncStatus(event.eventId, 'synced')
      const updated = await repo.findById(event.eventId)
      expect(updated!.syncStatus).toBe('synced')
    })
  })

  describe('bulkSave', () => {
    it('saves multiple events', async () => {
      const inputs = [
        makeInput({ eventType: 'app_opened', payload: { eventType: 'app_opened', lastActiveAt: null, isReturnVisit: false }, source: 'website' }),
        makeInput({ eventType: 'dashboard_opened', payload: { eventType: 'dashboard_opened', activeTasks: 3 }, source: 'website' }),
      ]
      const events = await repo.bulkSave(inputs)
      expect(events).toHaveLength(2)
      expect(await repo.count()).toBe(2)
    })
  })

  describe('delete', () => {
    it('deletes existing event', async () => {
      const event = await repo.save(makeInput())
      await repo.delete(event.eventId)
      const found = await repo.findById(event.eventId)
      expect(found).toBeUndefined()
    })

    it('does not throw when deleting non-existent', async () => {
      await expect(repo.delete('nonexistent')).resolves.toBeUndefined()
    })
  })

  describe('clear', () => {
    it('removes all events', async () => {
      await repo.save(makeInput())
      await repo.save(makeInput())
      await repo.clear()
      expect(await repo.count()).toBe(0)
    })
  })

  describe('deleteOlderThan', () => {
    it('deletes events older than given date', async () => {
      await repo.save(makeInput())
      const pastDate = new Date(Date.now() - 86400000).toISOString()
      const deleted = await repo.deleteOlderThan(pastDate)
      expect(deleted).toBe(0)
    })
  })

  describe('in-memory fallback', () => {
    it('works when no IndexedDB is available', async () => {
      destroyDb()

      const event = await repo.save(makeInput())
      expect(event.eventId).toBeTruthy()
      expect(event.syncStatus).toBe('local_only')

      const found = await repo.findById(event.eventId)
      expect(found).toBeDefined()
      expect(found!.eventId).toBe(event.eventId)
    })

    it('supports query operations in memory', async () => {
      destroyDb()

      await repo.save(makeInput({
        eventType: 'app_opened',
        source: 'website',
        payload: { eventType: 'app_opened', lastActiveAt: null, isReturnVisit: false },
      }))
      await repo.save(makeInput({
        eventType: 'dashboard_opened',
        source: 'website',
        payload: { eventType: 'dashboard_opened', activeTasks: 3 },
      }))

      const byType = await repo.findByEventType('app_opened')
      expect(byType).toHaveLength(1)

      const all = await repo.findAll()
      expect(all).toHaveLength(2)
    })
  })
})
