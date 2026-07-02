import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import 'fake-indexeddb/auto'
import { initDb, destroyDb, getDb, APP_SCHEMA, ContentMetaRepository } from '@ielts/storage'
import { ContentSeedingService } from '../seeding'
import { ALL_BUILT_IN_PACKS } from '../built-in'

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

describe('ContentSeedingService', () => {
  beforeEach(async () => {
    setupDb()
    await clearAllData()
  })

  afterEach(() => {
    destroyDb()
  })

  it('seeds all built-in content packs', async () => {
    const service = new ContentSeedingService()
    const result = await service.seedAll()

    expect(result.errors).toHaveLength(0)
    expect(result.packs.length).toBe(ALL_BUILT_IN_PACKS.length)

    const totalItems = ALL_BUILT_IN_PACKS.reduce((sum, p) => sum + p.items.length, 0)
    expect(result.seeded).toBe(totalItems)
  })

  it('does not re-seed already seeded packs', async () => {
    const service = new ContentSeedingService()
    await service.seedAll()
    const result = await service.seedAll()

    expect(result.seeded).toBe(0)
    expect(result.skipped).toBeGreaterThan(0)
  })

  it('force re-seeds when options.force is true', async () => {
    const service = new ContentSeedingService()
    await service.seedAll()
    const result = await service.seedAll({ force: true })

    const totalItems = ALL_BUILT_IN_PACKS.reduce((sum, p) => sum + p.items.length, 0)
    expect(result.seeded).toBe(totalItems)
    expect(result.errors).toHaveLength(0)
  })

  it('seeds a specific pack by table name', async () => {
    const service = new ContentSeedingService()
    const result = await service.seedSingleTable('readingPassages')

    const readingPack = ALL_BUILT_IN_PACKS.find(p => p.id === 'reading-passages-v1')
    expect(result.seeded).toBe(readingPack!.items.length)
    expect(result.skipped).toBe(0)
  })

  it('returns empty result for unknown table', async () => {
    const service = new ContentSeedingService()
    const result = await service.seedSingleTable('nonexistent')

    expect(result.seeded).toBe(0)
    expect(result.skipped).toBe(0)
  })

  it('stores content in the correct database tables', async () => {
    const service = new ContentSeedingService()
    await service.seedAll()

    const db = getDb()

    for (const pack of ALL_BUILT_IN_PACKS) {
      const table = db.table(pack.tableName)
      const items = await table.toArray()
      expect(items.length).toBeGreaterThanOrEqual(pack.items.length)
    }
  })

  it('tracks seeding metadata in contentMeta table', async () => {
    const service = new ContentSeedingService()
    await service.seedAll()

    const metaRepo = new ContentMetaRepository()
    const allMeta = await metaRepo.findAll()

    expect(allMeta.length).toBe(ALL_BUILT_IN_PACKS.length)

    for (const meta of allMeta) {
      expect(meta.packVersion).toBe(1)
      expect(meta.contentCount).toBeGreaterThan(0)
    }
  })

  it('reports seeding status correctly', async () => {
    const service = new ContentSeedingService()
    let status = await service.getSeedingStatus()

    for (const s of status) {
      expect(s.seeded).toBe(false)
    }

    await service.seedAll()

    status = await service.getSeedingStatus()
    for (const s of status) {
      expect(s.seeded).toBe(true)
      expect(s.packId).toBeTruthy()
    }
  })

  it('reports progress during seeding', async () => {
    const service = new ContentSeedingService()
    const progress: Array<{ packId: string; current: number; total: number }> = []

    await service.seedAll({
      onProgress: (packId, current, total) => {
        progress.push({ packId, current, total })
      },
    })

    expect(progress.length).toBe(ALL_BUILT_IN_PACKS.length)
    expect(progress[progress.length - 1].current).toBe(ALL_BUILT_IN_PACKS.length)
  })

  it('getBuiltInPacks returns pack metadata', () => {
    const service = new ContentSeedingService()
    const packs = service.getBuiltInPacks()

    expect(packs.length).toBe(ALL_BUILT_IN_PACKS.length)

    for (const pack of packs) {
      expect(pack.id).toBeTruthy()
      expect(pack.name).toBeTruthy()
      expect(pack.tableName).toBeTruthy()
      expect(pack.contentType).toBeTruthy()
      expect(pack.itemCount).toBeGreaterThan(0)
    }
  })

  it('getPackItems returns items for a pack', () => {
    const service = new ContentSeedingService()
    const items = service.getPackItems('reading-passages-v1')

    const readingPack = ALL_BUILT_IN_PACKS.find(p => p.id === 'reading-passages-v1')
    expect(items.length).toBe(readingPack!.items.length)
  })

  it('getPackItems returns empty for unknown pack', () => {
    const service = new ContentSeedingService()
    const items = service.getPackItems('nonexistent')
    expect(items).toHaveLength(0)
  })

  it('handles partial pack failures gracefully', async () => {
    const service = new ContentSeedingService()

    const metaRepo = new ContentMetaRepository()
    await metaRepo.markPackSeeded('nonexistent-pack', 'Bad Pack', 999, 0)

    const result = await service.seedAll()
    expect(result.seeded).toBeGreaterThan(0)
  })
})
