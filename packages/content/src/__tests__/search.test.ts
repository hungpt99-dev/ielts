import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import 'fake-indexeddb/auto'
import { initDb, destroyDb, getDb, APP_SCHEMA } from '@ielts/storage'
import { ContentSeedingService } from '../seeding'
import { ContentSearchService } from '../search'

function setupDb() {
  destroyDb()
  initDb(APP_SCHEMA)
}

async function clearAllData() {
  const db = getDb()
  const tables = await db.tables
  for (const table of tables) {
    await table.clear()
  }
}

describe('ContentSearchService', () => {
  beforeEach(async () => {
    setupDb()
    await clearAllData()
    const seeding = new ContentSeedingService()
    await seeding.seedAll()
  })

  afterEach(() => {
    destroyDb()
  })

  it('searches reading passages by query', async () => {
    const search = new ContentSearchService()
    const result = await search.search('readingPassages', { query: 'education' })

    expect(result.total).toBeGreaterThan(0)
    expect(result.items.length).toBeGreaterThan(0)
    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(20)
    expect(result.totalPages).toBeGreaterThanOrEqual(1)
  })

  it('filters by topic', async () => {
    const search = new ContentSearchService()
    const result = await search.search('readingPassages', { topic: 'Environment' })

    expect(result.items.length).toBeGreaterThan(0)
    for (const item of result.items) {
      expect(item.topic?.toLowerCase()).toBe('environment')
    }
  })

  it('filters by difficulty', async () => {
    const search = new ContentSearchService()
    const result = await search.search('readingPassages', { difficulty: 'easy' })

    for (const item of result.items) {
      expect(item.difficulty).toBe('easy')
    }
  })

  it('filters by tags', async () => {
    const search = new ContentSearchService()
    const result = await search.search('readingPassages', { tags: ['environment'] })

    for (const item of result.items) {
      expect(item.tags).toBeDefined()
      expect(item.tags!.some(t => t === 'environment')).toBe(true)
    }
  })

  it('filters by isBuiltIn', async () => {
    const search = new ContentSearchService()
    const result = await search.search('readingPassages', { isBuiltIn: true })

    for (const item of result.items) {
      expect(item.id).toMatch(/^built-in-/)
    }
  })

  it('searches across all content types', async () => {
    const search = new ContentSearchService()
    const results = await search.searchAll({ query: 'education' })

    const keys = Object.keys(results)
    expect(keys.length).toBeGreaterThan(0)

    const totalResults = Object.values(results).reduce((sum, r) => sum + r.total, 0)
    expect(totalResults).toBeGreaterThan(0)
  })

  it('searches writing prompts by query', async () => {
    const search = new ContentSearchService()
    const result = await search.search('writingPrompts', { query: 'transport' })

    expect(result.items.length).toBeGreaterThan(0)
  })

  it('searches speaking questions by part via tags', async () => {
    const search = new ContentSearchService()
    const result = await search.search('speakingQuestions', { tags: ['travel'] })

    expect(result.items.length).toBeGreaterThan(0)
  })

  it('searches grammar notes by query', async () => {
    const search = new ContentSearchService()
    const result = await search.search('grammarNotes', { query: 'Conditional' })

    expect(result.items.length).toBeGreaterThan(0)
  })

  it('searches useful phrases', async () => {
    const search = new ContentSearchService()
    const result = await search.search('usefulPhrases', { query: 'opinion' })

    expect(result.items.length).toBeGreaterThan(0)
  })

  it('paginates results correctly', async () => {
    const search = new ContentSearchService()
    const result = await search.search('readingPassages', { page: 1, pageSize: 1 })

    expect(result.items.length).toBeLessThanOrEqual(1)
    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(1)
    expect(result.totalPages).toBeGreaterThanOrEqual(1)
  })

  it('returns empty for no matches', async () => {
    const search = new ContentSearchService()
    const result = await search.search('readingPassages', { query: 'nonexistentquerythatwontmatch' })

    expect(result.total).toBe(0)
    expect(result.items).toHaveLength(0)
  })

  it('filters by packId', async () => {
    const search = new ContentSearchService()
    const result = await search.search('readingPassages', { packId: 'reading-passages-v1' })

    expect(result.items.length).toBeGreaterThan(0)
  })

  it('convenience methods work', async () => {
    const search = new ContentSearchService()

    const byTags = await search.searchByTags('readingPassages', ['technology'])
    expect(byTags.length).toBeGreaterThan(0)

    const byTopic = await search.searchByTopic('readingPassages', 'Environment')
    expect(byTopic.length).toBeGreaterThan(0)

    const byDifficulty = await search.searchByDifficulty('readingPassages', 'easy')
    expect(byDifficulty.length).toBeGreaterThan(0)
  })
})
