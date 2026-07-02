import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import 'fake-indexeddb/auto'
import { initDb, destroyDb, getDb, APP_SCHEMA } from '@ielts/storage'
import { ContentSeedingService } from '../seeding'
import { ContentImportExportService } from '../importExport'

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

describe('ContentImportExportService', () => {
  beforeEach(async () => {
    setupDb()
    await clearAllData()
    const seeding = new ContentSeedingService()
    await seeding.seedAll()
  })

  afterEach(() => {
    destroyDb()
  })

  it('exports all content data', async () => {
    const service = new ContentImportExportService()
    const exported = await service.exportData()

    expect(exported.version).toBe(1)
    expect(exported.source).toBe('content-package')
    expect(exported.exportedAt).toBeTruthy()
    expect(exported.content).toBeDefined()
    expect(Object.keys(exported.content).length).toBeGreaterThan(0)
  })

  it('exports selected pack IDs', async () => {
    const service = new ContentImportExportService()
    const exported = await service.exportData({ packIds: ['reading-passages-v1'] })

    expect(Object.keys(exported.content)).toEqual(['readingPassages'])
  })

  it('exports without user edits', async () => {
    const service = new ContentImportExportService()
    const exported = await service.exportData({ includeUserEdits: false })

    for (const items of Object.values(exported.content)) {
      for (const item of items as Array<Record<string, unknown>>) {
        expect(item.id?.toString()).toMatch(/^built-in-/)
      }
    }
  })

  it('imports data in merge mode', async () => {
    const svc = new ContentImportExportService()
    const exported = await svc.exportData({ packIds: ['reading-passages-v1'] })

    await clearAllData()

    const importResult = await svc.importData(exported, { mode: 'merge' })
    expect(importResult.added).toBeGreaterThan(0)
    expect(importResult.errors).toHaveLength(0)
  })

  it('imports data in replace mode', async () => {
    const svc = new ContentImportExportService()
    const exported = await svc.exportData({ packIds: ['reading-passages-v1'] })

    await clearAllData()

    const importResult = await svc.importData(exported, { mode: 'replace' })
    expect(importResult.added).toBeGreaterThan(0)
  })

  it('skips duplicates in dedup mode', async () => {
    const svc = new ContentImportExportService()
    const exported = await svc.exportData({ packIds: ['reading-passages-v1'] })

    const importResult = await svc.importData(exported, { mode: 'merge', dedup: true })
    expect(importResult.skipped).toBeGreaterThanOrEqual(0)
    expect(importResult.errors).toHaveLength(0)
  })

  it('imports data with new items', async () => {
    const svc = new ContentImportExportService()
    const exported = await svc.exportData({ packIds: ['reading-passages-v1'] })

    const extraItem = {
      id: 'imported-extra-item',
      title: 'Imported Reading',
      content: 'This is an imported reading passage.',
      source: 'imported',
      topic: 'General',
      difficulty: 'easy',
      wordCount: 50,
      tags: ['imported'],
      isFavorite: false,
      status: 'new',
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    exported.content.readingPassages.push(extraItem)

    await clearAllData()

    const importResult = await svc.importData(exported, { mode: 'replace' })
    expect(importResult.added).toBeGreaterThan(0)
  })

  it('rejects invalid data', async () => {
    const service = new ContentImportExportService()
    const result = await service.importData('invalid data', { mode: 'merge' })
    expect(result.failed).toBeGreaterThan(0)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('rejects null data', async () => {
    const service = new ContentImportExportService()
    const result = await service.importData(null, { mode: 'merge' })
    expect(result.failed).toBeGreaterThan(0)
  })

  it('generates export filename', () => {
    const service = new ContentImportExportService()
    const filename = service.generateExportFilename()
    expect(filename).toMatch(/^ielts-content-export-\d{4}-\d{2}-\d{2}\.json$/)
  })

  it('returns exportable table names', () => {
    const service = new ContentImportExportService()
    const tables = service.getExportableTableNames()
    expect(tables.length).toBeGreaterThan(0)
    expect(tables).toContain('readingPassages')
    expect(tables).toContain('writingPrompts')
  })

  it('handles import with contentMeta and userContentEdits', async () => {
    const svc = new ContentImportExportService()
    const exported = await svc.exportData()

    await clearAllData()

    await svc.importData(exported, { mode: 'replace' })

    const db = getDb()
    const readingItems = await db.table('readingPassages').toArray()
    expect(readingItems.length).toBeGreaterThan(0)
  })
})
