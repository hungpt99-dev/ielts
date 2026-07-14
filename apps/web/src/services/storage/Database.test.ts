import 'fake-indexeddb/auto'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  DatabaseService,
  ValidationError,
  destroyDb,
  getDb,
} from './Database'
import { isDbOpen } from '@ielts/storage'
import { STORAGE_KEYS } from '@ielts/config'
import type { TopicProgress } from '../../models'

function makeTopicProgress(overrides: Partial<TopicProgress> = {}): TopicProgress {
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  return {
    id,
    topicId: id,
    topic: 'Education',
    progressPercent: 50,
    vocabularyCount: 5,
    readingCount: 3,
    listeningCount: 2,
    writingCount: 1,
    speakingCount: 0,
    weakPoints: [],
    lastReviewedAt: now,
    updatedAt: now,
    ...overrides,
  }
}

function asRecord(item: TopicProgress): Record<string, unknown> {
  return item as unknown as Record<string, unknown>
}

beforeEach(async () => {
  destroyDb()
  localStorage.removeItem(STORAGE_KEYS.localStorage.appSettings)
  const { getDb } = await import('./Database')
  const db = getDb()
  await db.open()
  await db.topicsProgress.clear()
  destroyDb()
})

afterEach(() => {
  destroyDb()
  localStorage.removeItem(STORAGE_KEYS.localStorage.appSettings)
})

describe('TopicProgress data model validation', () => {
  it('rejects topicsProgress with missing topicId', async () => {
    const item = asRecord(makeTopicProgress())
    delete item.topicId
    await expect(
      DatabaseService.safeAdd('topicsProgress', item),
    ).rejects.toThrow(ValidationError)
  })

  it('rejects topicsProgress with missing topic', async () => {
    const item = asRecord(makeTopicProgress())
    delete item.topic
    await expect(
      DatabaseService.safeAdd('topicsProgress', item),
    ).rejects.toThrow(ValidationError)
  })

  it('rejects topicsProgress with missing progressPercent', async () => {
    const item = asRecord(makeTopicProgress())
    delete item.progressPercent
    await expect(
      DatabaseService.safeAdd('topicsProgress', item),
    ).rejects.toThrow(ValidationError)
  })

  it('rejects topicsProgress with non-numeric progressPercent', async () => {
    const item = asRecord(makeTopicProgress({ progressPercent: 'abc' as never}))
    await expect(
      DatabaseService.safeAdd('topicsProgress', item),
    ).rejects.toThrow(ValidationError)
  })

  it('auto-generates id when missing', async () => {
    const bad = asRecord(makeTopicProgress())
    delete bad.id
    const id = await DatabaseService.safeAdd('topicsProgress', bad)
    expect(id).toBeTruthy()
    expect(typeof id).toBe('string')
  })

  it('accepts valid topicsProgress item', async () => {
    const item = asRecord(makeTopicProgress())
    const id = await DatabaseService.safeAdd('topicsProgress', item)
    expect(id).toBe(item.id)
  })
})

describe('TopicProgress typed CRUD methods', () => {
  it('addTopicProgress creates and returns a TopicProgress', async () => {
    const result = await DatabaseService.addTopicProgress({
      topicId: 't1',
      topic: 'Education',
      progressPercent: 75,
      vocabularyCount: 10,
      readingCount: 5,
      listeningCount: 3,
      writingCount: 2,
      speakingCount: 1,
      weakPoints: ['Grammar'],
    })
    expect(result.id).toBeDefined()
    expect(result.topic).toBe('Education')
    expect(result.progressPercent).toBe(75)
    expect(result.vocabularyCount).toBe(10)
    expect(result.weakPoints).toEqual(['Grammar'])
    expect(result.lastReviewedAt).toBeDefined()
    expect(result.updatedAt).toBeDefined()
  })

  it('addTopicProgress preserves custom id and lastReviewedAt', async () => {
    const customId = crypto.randomUUID()
    const customDate = '2025-06-01T00:00:00.000Z'
    const result = await DatabaseService.addTopicProgress({
      id: customId,
      topicId: 't1',
      topic: 'Environment',
      progressPercent: 30,
      vocabularyCount: 0,
      readingCount: 0,
      listeningCount: 0,
      writingCount: 0,
      speakingCount: 0,
      weakPoints: [],
      lastReviewedAt: customDate,
    })
    expect(result.id).toBe(customId)
    expect(result.lastReviewedAt).toBe(customDate)
  })

  it('addTopicProgress defaults lastReviewedAt to now', async () => {
    const before = new Date().toISOString()
    const result = await DatabaseService.addTopicProgress({
      topicId: 't1',
      topic: 'Health',
      progressPercent: 0,
      vocabularyCount: 0,
      readingCount: 0,
      listeningCount: 0,
      writingCount: 0,
      speakingCount: 0,
      weakPoints: [],
    })
    expect(result.lastReviewedAt >= before).toBe(true)
  })

  it('updateTopicProgress updates fields and timestamps', async () => {
    const created = await DatabaseService.addTopicProgress({
      topicId: 't1',
      topic: 'Technology',
      progressPercent: 20,
      vocabularyCount: 0,
      readingCount: 0,
      listeningCount: 0,
      writingCount: 0,
      speakingCount: 0,
      weakPoints: [],
    })
    await DatabaseService.updateTopicProgress(created.id, {
      progressPercent: 90,
      vocabularyCount: 15,
    })
    const updated = await DatabaseService.safeGetById<TopicProgress>('topicsProgress', created.id)
    expect(updated).toBeDefined()
    expect(updated!.progressPercent).toBe(90)
    expect(updated!.vocabularyCount).toBe(15)
    expect(updated!.lastReviewedAt > created.lastReviewedAt).toBe(true)
    expect(updated!.updatedAt > created.updatedAt).toBe(true)
  })

  it('getAll retrieves all topic progress entries', async () => {
    await DatabaseService.addTopicProgress({ topicId: 't1', topic: 'A', progressPercent: 10, vocabularyCount: 0, readingCount: 0, listeningCount: 0, writingCount: 0, speakingCount: 0, weakPoints: [] })
    await DatabaseService.addTopicProgress({ topicId: 't2', topic: 'B', progressPercent: 20, vocabularyCount: 0, readingCount: 0, listeningCount: 0, writingCount: 0, speakingCount: 0, weakPoints: [] })
    const all = await DatabaseService.getAll<TopicProgress>('topicsProgress')
    expect(all).toHaveLength(2)
  })

  it('safeGetById returns the correct item', async () => {
    const created = await DatabaseService.addTopicProgress({ topicId: 't1', topic: 'Science', progressPercent: 60, vocabularyCount: 0, readingCount: 0, listeningCount: 0, writingCount: 0, speakingCount: 0, weakPoints: [] })
    const fetched = await DatabaseService.safeGetById<TopicProgress>('topicsProgress', created.id)
    expect(fetched).toBeDefined()
    expect(fetched!.topic).toBe('Science')
    expect(fetched!.progressPercent).toBe(60)
  })

  it('safeGetById returns undefined for non-existent id', async () => {
    const fetched = await DatabaseService.safeGetById<TopicProgress>('topicsProgress', 'nonexistent')
    expect(fetched).toBeUndefined()
  })
})

describe('TopicProgress query and filter', () => {
  it('queryByIndex works on topic field', async () => {
    await DatabaseService.addTopicProgress({ topicId: 't1', topic: 'Education', progressPercent: 50, vocabularyCount: 0, readingCount: 0, listeningCount: 0, writingCount: 0, speakingCount: 0, weakPoints: [] })
    await DatabaseService.addTopicProgress({ topicId: 't2', topic: 'Environment', progressPercent: 30, vocabularyCount: 0, readingCount: 0, listeningCount: 0, writingCount: 0, speakingCount: 0, weakPoints: [] })
    const results = await DatabaseService.queryByIndex<TopicProgress>('topicsProgress', 'topic', 'Education')
    expect(results).toHaveLength(1)
    expect(results[0].topic).toBe('Education')
  })

  it('returns empty array for unmatched query', async () => {
    const results = await DatabaseService.queryByIndex<TopicProgress>('topicsProgress', 'topic', 'NonExistent')
    expect(results).toEqual([])
  })
})

describe('TopicProgress data persistence', () => {
  it('persists data across db close and reopen', async () => {
    await DatabaseService.addTopicProgress({ topicId: 't1', topic: 'Persistence', progressPercent: 100, vocabularyCount: 0, readingCount: 0, listeningCount: 0, writingCount: 0, speakingCount: 0, weakPoints: [] })
    destroyDb()
    const all = await DatabaseService.getAll<TopicProgress>('topicsProgress')
    expect(all).toHaveLength(1)
    expect(all[0].topic).toBe('Persistence')
    expect(all[0].progressPercent).toBe(100)
  })
})

describe('TopicProgress bulk operations', () => {
  it('safeBulkAdd accepts multiple valid topic progress items', async () => {
    const items = [
      asRecord(makeTopicProgress({ topic: 'Topic A', progressPercent: 20 })),
      asRecord(makeTopicProgress({ topic: 'Topic B', progressPercent: 50 })),
      asRecord(makeTopicProgress({ topic: 'Topic C', progressPercent: 80 })),
    ]
    await DatabaseService.safeBulkAdd('topicsProgress', items)
    const count = await DatabaseService.safeCount('topicsProgress')
    expect(count).toBe(3)
  })

  it('safeBulkAdd rejects if any item is invalid', async () => {
    const valid = asRecord(makeTopicProgress())
    const invalid = asRecord(makeTopicProgress())
    delete invalid.progressPercent
    await expect(
      DatabaseService.safeBulkAdd('topicsProgress', [valid, invalid]),
    ).rejects.toThrow(ValidationError)
  })
})

describe('TopicProgress edge cases', () => {
  it('handles topics with zero progress', async () => {
    const item = asRecord(makeTopicProgress({ topic: 'New Topic', progressPercent: 0 }))
    await DatabaseService.safeAdd('topicsProgress', item)
    const fetched = await DatabaseService.safeGetById<TopicProgress>('topicsProgress', item.id as string)
    expect(fetched!.progressPercent).toBe(0)
  })

  it('handles topics with 100 percent progress', async () => {
    const item = asRecord(makeTopicProgress({ topic: 'Completed', progressPercent: 100 }))
    await DatabaseService.safeAdd('topicsProgress', item)
    const fetched = await DatabaseService.safeGetById<TopicProgress>('topicsProgress', item.id as string)
    expect(fetched!.progressPercent).toBe(100)
  })

  it('handles topics with many weak points', async () => {
    const weakPoints = Array.from({ length: 20 }, (_, i) => `Weak point ${i + 1}`)
    const item = asRecord(makeTopicProgress({ topic: 'Hard Topic', progressPercent: 10, weakPoints }))
    await DatabaseService.safeAdd('topicsProgress', item)
    const fetched = await DatabaseService.safeGetById<TopicProgress>('topicsProgress', item.id as string)
    expect(fetched!.weakPoints).toHaveLength(20)
  })

  it('handles removal of topic progress entry', async () => {
    const item = asRecord(makeTopicProgress())
    await DatabaseService.safeAdd('topicsProgress', item)
    await DatabaseService.safeRemove('topicsProgress', item.id as string)
    const fetched = await DatabaseService.safeGetById<TopicProgress>('topicsProgress', item.id as string)
    expect(fetched).toBeUndefined()
  })

  it('handles count of topic progress entries', async () => {
    await DatabaseService.safeAdd('topicsProgress', asRecord(makeTopicProgress()))
    await DatabaseService.safeAdd('topicsProgress', asRecord(makeTopicProgress()))
    const count = await DatabaseService.safeCount('topicsProgress')
    expect(count).toBe(2)
  })
})

describe('TopicProgress export and import', () => {
  it('exports topicsProgress as part of full export', async () => {
    await DatabaseService.addTopicProgress({ topicId: 't1', topic: 'Export Test', progressPercent: 70, vocabularyCount: 0, readingCount: 0, listeningCount: 0, writingCount: 0, speakingCount: 0, weakPoints: [] })
    const exported = await DatabaseService.exportAll()
    expect(exported.topicsProgress).toHaveLength(1)
    expect(exported.topicsProgress[0].topic).toBe('Export Test')
    expect(exported.topicsProgress[0].progressPercent).toBe(70)
  })

  it('imports topicsProgress correctly in replace mode', async () => {
    const exported = await DatabaseService.exportAll()
    const tp = asRecord(makeTopicProgress())
    exported.topicsProgress = [tp as never]
    await DatabaseService.importAll(exported, 'replace')
    const all = await DatabaseService.getAll<TopicProgress>('topicsProgress')
    expect(all).toHaveLength(1)
    expect(all[0].id).toBe(tp.id as string)
  })
})

describe('Database connection lifecycle', () => {
  it('getDb() returns a usable connection after destroyDb()', async () => {
    expect(isDbOpen()).toBe(false)
    const db = getDb()
    expect(db).toBeDefined()
    expect(isDbOpen()).toBe(true)
    await db.open()
    expect(db.isOpen()).toBe(true)
  })

  it('isDbOpen tracks open/close state correctly', async () => {
    expect(isDbOpen()).toBe(false)
    const db = getDb()
    expect(isDbOpen()).toBe(true)
    destroyDb()
    expect(isDbOpen()).toBe(false)
    getDb()
    expect(isDbOpen()).toBe(true)
    destroyDb()
    expect(isDbOpen()).toBe(false)
  })

  it('DatabaseService operations auto-reopen when DB is closed (no "Database is closed" error)', async () => {
    const item = asRecord(makeTopicProgress({ topic: 'Auto Reopen' }))
    const id = await DatabaseService.safeAdd('topicsProgress', item)
    expect(id).toBeTruthy()
    const fetched = await DatabaseService.safeGetById<TopicProgress>('topicsProgress', id)
    expect(fetched).toBeDefined()
    expect(fetched!.topic).toBe('Auto Reopen')
  })

  it('survives multiple close/reopen cycles without errors', async () => {
    for (let i = 0; i < 3; i++) {
      const item = asRecord(makeTopicProgress({ topic: `Cycle ${i}` }))
      const id = await DatabaseService.safeAdd('topicsProgress', item)
      expect(id).toBeTruthy()
      const fetched = await DatabaseService.safeGetById<TopicProgress>('topicsProgress', id)
      expect(fetched).toBeDefined()
      expect(fetched!.topic).toBe(`Cycle ${i}`)
      destroyDb()
    }
    const item = asRecord(makeTopicProgress({ topic: 'Final Cycle' }))
    const id = await DatabaseService.safeAdd('topicsProgress', item)
    expect(id).toBeTruthy()
  })

  it('reuses the same DB instance on repeated getDb() calls', async () => {
    const db1 = getDb()
    const db2 = getDb()
    expect(db1).toBe(db2)
  })
})
