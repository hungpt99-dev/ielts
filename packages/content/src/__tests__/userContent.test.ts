import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import 'fake-indexeddb/auto'
import { initDb, destroyDb, getDb, APP_SCHEMA, UserContentEditRepository } from '@ielts/storage'
import { ContentSeedingService } from '../seeding'
import { UserContentService } from '../userContent'

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

describe('UserContentService', () => {
  beforeEach(async () => {
    setupDb()
    await clearAllData()
    const seeding = new ContentSeedingService()
    await seeding.seedAll()
  })

  afterEach(() => {
    destroyDb()
  })

  it('detects built-in IDs', () => {
    const service = new UserContentService()
    expect(service.isBuiltInId('built-in-reading-education-1')).toBe(true)
    expect(service.isBuiltInId('user-generated-id-123')).toBe(false)
  })

  it('edits a built-in reading passage and creates a copy', async () => {
    const service = new UserContentService()
    const originalId = 'built-in-reading-education-1'

    const result = await service.editBuiltInContent({
      originalId,
      contentType: 'reading-passage',
      tableName: 'readingPassages',
      changes: { notes: 'User added note' },
    })

    expect(result.userItemId).toBeTruthy()
    expect(result.userItemId).not.toBe(originalId)

    const editRepo = new UserContentEditRepository()
    const edit = await editRepo.findByOriginalId(originalId)
    expect(edit).toBeDefined()
    expect(edit!.userItemId).toBe(result.userItemId)
  })

  it('updates existing edit when editing same content again', async () => {
    const service = new UserContentService()
    const originalId = 'built-in-reading-education-1'

    await service.editBuiltInContent({
      originalId,
      contentType: 'reading-passage',
      tableName: 'readingPassages',
      changes: { notes: 'First edit' },
    })

    const result = await service.editBuiltInContent({
      originalId,
      contentType: 'reading-passage',
      tableName: 'readingPassages',
      changes: { notes: 'Second edit' },
    })

    const db = getDb()
    const updated = await db.table('readingPassages').get(result.userItemId) as Record<string, unknown>
    expect(updated.notes).toBe('Second edit')
  })

  it('getEffectiveItem returns user edit when available', async () => {
    const service = new UserContentService()
    const originalId = 'built-in-reading-education-1'

    await service.editBuiltInContent({
      originalId,
      contentType: 'reading-passage',
      tableName: 'readingPassages',
      changes: { title: 'Modified Title' },
    })

    const effective = await service.getEffectiveItem('readingPassages', originalId)
    expect(effective).toBeDefined()
    expect(effective!.title).toBe('Modified Title')
  })

  it('getEffectiveItem returns original when no edit exists', async () => {
    const service = new UserContentService()
    const originalId = 'built-in-reading-education-1'

    const effective = await service.getEffectiveItem('readingPassages', originalId)
    expect(effective).toBeDefined()
    expect(effective!.title).toBe('Education Systems Around the World')
  })

  it('revertToBuiltIn removes user edit', async () => {
    const service = new UserContentService()
    const originalId = 'built-in-reading-education-1'

    await service.editBuiltInContent({
      originalId,
      contentType: 'reading-passage',
      tableName: 'readingPassages',
      changes: { notes: 'Temporary note' },
    })

    await service.revertToBuiltIn(originalId)

    const editRepo = new UserContentEditRepository()
    const edit = await editRepo.findByOriginalId(originalId)
    expect(edit).toBeUndefined()

    const effective = await service.getEffectiveItem('readingPassages', originalId)
    expect(effective!.notes).toBe('')
  })

  it('getEffectiveItems excludes edited built-in and includes user copies', async () => {
    const service = new UserContentService()

    await service.editBuiltInContent({
      originalId: 'built-in-reading-education-1',
      contentType: 'reading-passage',
      tableName: 'readingPassages',
      changes: { title: 'User Modified' },
    })

    const items = await service.getEffectiveItems('readingPassages')
    const titles = items.map(i => i.title as string)

    expect(titles).not.toContain('Education Systems Around the World')
    expect(titles).toContain('User Modified')
  })

  it('hasUserEdit returns correct status', async () => {
    const service = new UserContentService()
    const originalId = 'built-in-reading-education-1'

    expect(await service.hasUserEdit(originalId)).toBe(false)

    await service.editBuiltInContent({
      originalId,
      contentType: 'reading-passage',
      tableName: 'readingPassages',
      changes: { notes: 'Test' },
    })

    expect(await service.hasUserEdit(originalId)).toBe(true)
  })

  it('getUserEditsForTable returns edits for a table', async () => {
    const service = new UserContentService()

    await service.editBuiltInContent({
      originalId: 'built-in-reading-education-1',
      contentType: 'reading-passage',
      tableName: 'readingPassages',
      changes: { notes: 'Test' },
    })

    const edits = await service.getUserEditsForTable('readingPassages')
    expect(edits.length).toBe(1)
    expect(edits[0].tableName).toBe('readingPassages')
  })

  it('getBuiltInItem returns original built-in data', async () => {
    const service = new UserContentService()
    const item = await service.getBuiltInItem('readingPassages', 'built-in-reading-education-1')
    expect(item).toBeDefined()
    expect(item!.title).toBe('Education Systems Around the World')
  })

  it('getBuiltInItem returns undefined for unknown item', async () => {
    const service = new UserContentService()
    const item = await service.getBuiltInItem('readingPassages', 'nonexistent')
    expect(item).toBeUndefined()
  })

  it('searchUserContent paginates results', async () => {
    const service = new UserContentService()
    const result = await service.searchUserContent('readingPassages', { page: 1, pageSize: 1 })

    expect(result.items.length).toBeLessThanOrEqual(1)
    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(1)
  })

  it('deleteUserEdit removes user edit', async () => {
    const service = new UserContentService()

    await service.editBuiltInContent({
      originalId: 'built-in-reading-education-1',
      contentType: 'reading-passage',
      tableName: 'readingPassages',
      changes: { notes: 'To delete' },
    })

    const edits = await service.getUserEditsForTable('readingPassages')
    await service.deleteUserEdit(edits[0].id)

    const hasEdit = await service.hasUserEdit('built-in-reading-education-1')
    expect(hasEdit).toBe(false)
  })
})
