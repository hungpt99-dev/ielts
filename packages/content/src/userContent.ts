import { getDb, UserContentEditRepository } from '@ielts/storage'
import type { UserContentEdit } from '@ielts/storage'
import type { ContentFilter, ContentSearchResult, UserContentEditInput } from './types'
import { ContentSearchService } from './search'
import { ALL_BUILT_IN_PACKS, BUILT_IN_TABLES } from './built-in'

export class UserContentService {
  private editRepo: UserContentEditRepository
  private searchService: ContentSearchService

  constructor() {
    this.editRepo = new UserContentEditRepository()
    this.searchService = new ContentSearchService()
  }

  isBuiltInId(id: string): boolean {
    return id.startsWith('built-in-')
  }

  async editBuiltInContent(input: UserContentEditInput): Promise<{ userItemId: string; edit: UserContentEdit }> {
    const db = getDb()
    const table = db.table(input.tableName)

    const original = await table.get(input.originalId)
    if (!original) {
      throw new Error(`Content not found: ${input.originalId} in table ${input.tableName}`)
    }

    const existingEdit = await this.editRepo.findByOriginalId(input.originalId)
    if (existingEdit) {
      const existing = await table.get(existingEdit.userItemId)
      if (existing) {
        const updated = { ...existing, ...input.changes }
        await table.put(updated)
        return { userItemId: existingEdit.userItemId, edit: existingEdit }
      }
    }

    const userItemId = crypto.randomUUID()
    const now = new Date().toISOString()
    const userCopy = {
      ...(original as Record<string, unknown>),
      ...input.changes,
      id: userItemId,
      createdAt: original.createdAt ?? now,
      updatedAt: now,
    }

    await table.put(userCopy)

    const edit = await this.editRepo.create({
      originalId: input.originalId,
      userItemId,
      contentType: input.contentType,
      tableName: input.tableName,
      editedAt: now,
      createdAt: now,
    })

    return { userItemId, edit }
  }

  async getEffectiveItems<T extends Record<string, unknown>>(tableName: string, filter?: ContentFilter): Promise<T[]> {
    const db = getDb()
    const table = db.table(tableName)
    let items = (await table.toArray()) as T[]

    const userEdits = await this.editRepo.findUserEditsByTable(tableName)
    const editedOriginalIds = new Set(userEdits.map(e => e.originalId))
    const userItemIds = new Set(userEdits.map(e => e.userItemId))

    const builtInItems = items.filter(i => {
      const id = i.id as string
      return id.startsWith('built-in-') && !editedOriginalIds.has(id)
    })
    const userItems = items.filter(i => userItemIds.has(i.id as string))
    const otherItems = items.filter(i => {
      const id = i.id as string
      return !id.startsWith('built-in-') && !userItemIds.has(id)
    })

    const combined = [...builtInItems, ...userItems, ...otherItems]

    const filtered = this.searchService.applyFilter(combined as any, filter ?? {})

    return filtered as unknown as T[]
  }

  async getEffectiveItem<T extends Record<string, unknown>>(tableName: string, itemId: string): Promise<T | undefined> {
    const db = getDb()
    const table = db.table(tableName)

    if (this.isBuiltInId(itemId)) {
      const edit = await this.editRepo.findByOriginalId(itemId)
      if (edit) {
        const userVersion = await table.get(edit.userItemId)
        if (userVersion) return userVersion as T
      }
    }

    return table.get(itemId) as Promise<T | undefined>
  }

  async revertToBuiltIn(originalId: string): Promise<void> {
    const edit = await this.editRepo.findByOriginalId(originalId)
    if (!edit) {
      throw new Error(`No user edit found for built-in content: ${originalId}`)
    }

    const db = getDb()
    const table = db.table(edit.tableName)
    await table.delete(edit.userItemId)
    await this.editRepo.delete(edit.id)
  }

  async deleteUserEdit(editId: string): Promise<void> {
    const edit = await this.editRepo.findById(editId)
    if (!edit) {
      throw new Error(`User edit not found: ${editId}`)
    }

    const db = getDb()
    const table = db.table(edit.tableName)
    await table.delete(edit.userItemId)
    await this.editRepo.delete(editId)
  }

  async getUserEditsForTable(tableName: string): Promise<UserContentEdit[]> {
    return this.editRepo.findUserEditsByTable(tableName)
  }

  async hasUserEdit(originalId: string): Promise<boolean> {
    return this.editRepo.hasUserEdit(originalId)
  }

  async getBuiltInItem(tableName: string, itemId: string): Promise<Record<string, unknown> | undefined> {
    const pack = ALL_BUILT_IN_PACKS.find(p => BUILT_IN_TABLES[p.id] === tableName)
    if (!pack) return undefined
    const items = pack.items as Record<string, unknown>[]
    return items.find(i => i.id === itemId)
  }

  async searchUserContent<T extends Record<string, unknown>>(
    tableName: string,
    filter: ContentFilter,
  ): Promise<ContentSearchResult<T>> {
    const items = await this.getEffectiveItems<T>(tableName, filter)
    const page = filter.page ?? 1
    const pageSize = filter.pageSize ?? 20
    const total = items.length
    const totalPages = Math.ceil(total / pageSize)
    const start = (page - 1) * pageSize
    const paged = items.slice(start, start + pageSize)

    return {
      items: paged,
      total,
      page,
      pageSize,
      totalPages,
    }
  }
}

export function createUserContentService(): UserContentService {
  return new UserContentService()
}
