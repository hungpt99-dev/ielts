import {
  getDb,
  initDb,
  ContentMetaRepository,
  APP_SCHEMA,
} from '@ielts/storage'
import { ALL_BUILT_IN_PACKS, BUILT_IN_TABLES } from './built-in'
import type { PackEntry } from './built-in'
import type { ContentSeedingOptions, ContentSeedingResult } from './types'

export class ContentSeedingService {
  private metaRepo: ContentMetaRepository

  constructor() {
    this.metaRepo = new ContentMetaRepository()
  }

  async seedAll(options: ContentSeedingOptions = {}): Promise<ContentSeedingResult> {
    const result: ContentSeedingResult = {
      seeded: 0,
      skipped: 0,
      errors: [],
      packs: [],
    }

    for (let i = 0; i < ALL_BUILT_IN_PACKS.length; i++) {
      const pack = ALL_BUILT_IN_PACKS[i]
      try {
        const packResult = await this.seedPack(pack, options)
        result.seeded += packResult.seeded
        result.skipped += packResult.skipped
        result.packs.push({
          packId: pack.id,
          packName: pack.name,
          version: 1,
          count: packResult.seeded,
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : `Failed to seed pack ${pack.id}`
        result.errors.push(message)
      }
      if (options.onProgress) {
        options.onProgress(pack.id, i + 1, ALL_BUILT_IN_PACKS.length)
      }
    }

    return result
  }

  async seedPack(pack: PackEntry, options: ContentSeedingOptions = {}): Promise<{ seeded: number; skipped: number }> {
    const version = 1
    const isSeeded = await this.metaRepo.isPackSeeded(pack.id, version)

    if (isSeeded && !options.force) {
      return { seeded: 0, skipped: pack.items.length }
    }

    const db = getDb()
    const table = db.table(pack.tableName)
    const items = pack.items as Record<string, unknown>[]

    let seeded = 0
    let skipped = 0

    await db.transaction('rw', table.name, async () => {
      if (options.force) {
        const existing = await table.toArray()
        const builtInExisting = existing.filter(i => i.id?.toString().startsWith('built-in-'))
        for (const item of builtInExisting) {
          await table.delete(item.id as string)
        }
      }

      for (const item of items) {
        const id = item.id as string
        if (!options.force) {
          const exists = await table.get(id)
          if (exists) {
            skipped++
            continue
          }
        }
        await table.put(item)
        seeded++
      }
    })

    await this.metaRepo.markPackSeeded(
      pack.id,
      pack.name,
      version,
      items.length,
    )

    return { seeded, skipped }
  }

  async seedSingleTable(tableName: string, options: ContentSeedingOptions = {}): Promise<{ seeded: number; skipped: number }> {
    const packEntry = ALL_BUILT_IN_PACKS.find(p => BUILT_IN_TABLES[p.id] === tableName)
    if (!packEntry) {
      return { seeded: 0, skipped: 0 }
    }
    return this.seedPack(packEntry, options)
  }

  async getSeedingStatus(): Promise<Array<{ packId: string; packName: string; version: number; seeded: boolean; itemCount: number }>> {
    const allMeta = await this.metaRepo.findSeededPacks()
    const metaMap = new Map(allMeta.map(m => [m.packId, m]))

    return ALL_BUILT_IN_PACKS.map(pack => {
      const meta = metaMap.get(pack.id)
      return {
        packId: pack.id,
        packName: pack.name,
        version: 1,
        seeded: meta !== undefined && meta.packVersion >= 1,
        itemCount: pack.items.length,
      }
    })
  }

  getBuiltInPacks() {
    return ALL_BUILT_IN_PACKS.map(pack => ({
      id: pack.id,
      name: pack.name,
      tableName: pack.tableName,
      contentType: pack.contentType,
      itemCount: pack.items.length,
    }))
  }

  getPackItems(packId: string): unknown[] {
    const pack = ALL_BUILT_IN_PACKS.find(p => p.id === packId)
    return pack?.items ?? []
  }

  ensureDbInitialized(): void {
    try {
      getDb()
    } catch {
      initDb(APP_SCHEMA)
    }
  }
}

export function createContentSeedingService(): ContentSeedingService {
  return new ContentSeedingService()
}
