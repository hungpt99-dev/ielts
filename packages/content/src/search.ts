import { getDb } from '@ielts/storage'
import type { ContentFilter, ContentSearchResult } from './types'
import { ALL_BUILT_IN_PACKS, BUILT_IN_TABLES } from './built-in'

interface SearchableItem {
  id: string
  title?: string
  name?: string
  topic?: string
  content?: string
  transcript?: string
  question?: string
  phrase?: string
  tags?: string[]
  skill?: string
  difficulty?: string
  isFavorite?: boolean
  [key: string]: unknown
}

export class ContentSearchService {
  async search<T extends SearchableItem>(
    tableName: string,
    filter: ContentFilter,
  ): Promise<ContentSearchResult<T>> {
    const db = getDb()
    const table = db.table(tableName)

    let items = (await table.toArray()) as T[]

    items = this.applyFilter(items, filter)

    const page = filter.page ?? 1
    const pageSize = filter.pageSize ?? 20
    const total = items.length
    const totalPages = Math.ceil(total / pageSize)
    const start = (page - 1) * pageSize
    const paged = items.slice(start, start + pageSize)

    return {
      items: paged as T[],
      total,
      page,
      pageSize,
      totalPages,
    }
  }

  async searchAll<T extends SearchableItem>(
    filter: ContentFilter,
  ): Promise<Record<string, ContentSearchResult<T>>> {
    const results: Record<string, ContentSearchResult<T>> = {}

    for (const pack of ALL_BUILT_IN_PACKS) {
      const tableName = BUILT_IN_TABLES[pack.id]
      results[tableName] = await this.search<T>(tableName, filter)
    }

    return results
  }

  applyFilter<T extends SearchableItem>(items: T[], filter: ContentFilter): T[] {
    let filtered = [...items]

    if (filter.query) {
      const q = filter.query.toLowerCase()
      filtered = filtered.filter(item => {
        const searchFields = [
          item.title,
          item.name,
          item.topic,
          item.content,
          item.transcript,
          item.question,
          item.phrase,
          item.id,
        ]
        return searchFields.some(f => f && f.toLowerCase().includes(q))
      })
    }

    if (filter.contentType) {
      const pack = ALL_BUILT_IN_PACKS.find(p => BUILT_IN_TABLES[p.id])
      const types = Array.isArray(filter.contentType) ? filter.contentType : [filter.contentType]
      if (pack && !types.includes(pack.contentType as never)) {
        filtered = filtered.filter(() => false)
      }
    }

    if (filter.skill) {
      const skills = Array.isArray(filter.skill) ? filter.skill : [filter.skill]
      filtered = filtered.filter(item => {
        if (!item.skill) return false
        return skills.some(s => item.skill?.toLowerCase() === s.toLowerCase())
      })
    }

    if (filter.topic) {
      const topics = Array.isArray(filter.topic) ? filter.topic : [filter.topic]
      filtered = filtered.filter(item => {
        if (!item.topic) return false
        return topics.some(t => item.topic?.toLowerCase() === t.toLowerCase())
      })
    }

    if (filter.difficulty) {
      const difficulties = Array.isArray(filter.difficulty) ? filter.difficulty : [filter.difficulty]
      filtered = filtered.filter(item => {
        if (!item.difficulty) return false
        return difficulties.some(d => item.difficulty?.toLowerCase() === d.toLowerCase())
      })
    }

    if (filter.tags && filter.tags.length > 0) {
      filtered = filtered.filter(item => {
        if (!item.tags || item.tags.length === 0) return false
        return filter.tags!.some(t => item.tags!.includes(t))
      })
    }

    if (filter.isBuiltIn !== undefined) {
      filtered = filtered.filter(item =>
        filter.isBuiltIn ? item.id.startsWith('built-in-') : !item.id.startsWith('built-in-'),
      )
    }

    if (filter.isFavorite !== undefined) {
      filtered = filtered.filter(item => item.isFavorite === filter.isFavorite)
    }

    if (filter.packId) {
      const tableName = BUILT_IN_TABLES[filter.packId]
      if (tableName) {
        const packItems = ALL_BUILT_IN_PACKS.find(p => p.id === filter.packId)?.items ?? []
        const packIds = new Set(packItems.map(i => (i as Record<string, unknown>).id as string))
        filtered = filtered.filter(item => packIds.has(item.id))
      }
    }

    return filtered
  }

  async searchByTags<T extends SearchableItem>(
    tableName: string,
    tags: string[],
  ): Promise<T[]> {
    return this.search(tableName, { tags, pageSize: 100 }).then(r => r.items as T[])
  }

  async searchByTopic<T extends SearchableItem>(
    tableName: string,
    topic: string,
  ): Promise<T[]> {
    return this.search(tableName, { topic, pageSize: 100 }).then(r => r.items as T[])
  }

  async searchBySkill<T extends SearchableItem>(
    tableName: string,
    skill: string,
  ): Promise<T[]> {
    return this.search(tableName, { skill, pageSize: 100 }).then(r => r.items as T[])
  }

  async searchByDifficulty<T extends SearchableItem>(
    tableName: string,
    difficulty: string,
  ): Promise<T[]> {
    return this.search(tableName, { difficulty, pageSize: 100 }).then(r => r.items as T[])
  }
}

export function createContentSearchService(): ContentSearchService {
  return new ContentSearchService()
}
