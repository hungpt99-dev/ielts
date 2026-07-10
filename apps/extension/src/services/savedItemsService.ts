import { getAllEntries } from '../storage/indexedDB'
import { safeStorageGet } from '../utils/safe-chrome'
import type { LearningEntry, SaveCategory } from '../types'

export interface SavedItemDisplay extends LearningEntry {
  source: 'indexedDB' | 'chromeStorage'
}

export interface SavedItemsStats {
  total: number
  byCategory: Record<string, number>
}

const STORAGE_KEY = 'savedItems'

async function loadChromeStorageItems(): Promise<SavedItemDisplay[]> {
  try {
    const result = await safeStorageGet<unknown[]>(STORAGE_KEY)
    const items = (result[STORAGE_KEY] as Record<string, unknown>[]) || []
    return items.map((item) => {
      const category = (item.category as SaveCategory) || 'reading'
      return {
        id: (item.id as string) || crypto.randomUUID(),
        text: (item.text as string) || '',
        category,
        topic: (item.topic as string) || '',
        skill: (item.skill as LearningEntry['skill']) || 'general',
        difficulty: (item.difficulty as LearningEntry['difficulty']) || '',
        tags: Array.isArray(item.tags) ? (item.tags as string[]) : [],
        personalNote: (item.personalNote as string) || '',
        pageTitle: (item.pageTitle as string) || '',
        pageUrl: (item.pageUrl as string) || '',
        status: (item.status as LearningEntry['status']) || 'new',
        createdAt: (item.createdAt as string) || new Date().toISOString(),
        updatedAt: (item.updatedAt as string) || new Date().toISOString(),
        source: 'chromeStorage',
      } as SavedItemDisplay
    })
  } catch {
    return []
  }
}

async function loadIndexedDbItems(): Promise<SavedItemDisplay[]> {
  try {
    const entries = await getAllEntries()
    return entries.map((e) => ({ ...e, source: 'indexedDB' as const }))
  } catch {
    return []
  }
}

export async function getAllSavedItems(): Promise<SavedItemDisplay[]> {
  const [idbItems, chromeItems] = await Promise.all([
    loadIndexedDbItems(),
    loadChromeStorageItems(),
  ])
  const all = [...chromeItems, ...idbItems]
  all.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return all
}

export async function getSavedItemsByCategory(
  category: SaveCategory | 'all',
): Promise<SavedItemDisplay[]> {
  const all = await getAllSavedItems()
  if (category === 'all') return all
  return all.filter((item) => item.category === category)
}

export async function getSavedItemsStats(): Promise<SavedItemsStats> {
  const all = await getAllSavedItems()
  const byCategory: Record<string, number> = {}
  for (const item of all) {
    byCategory[item.category] = (byCategory[item.category] || 0) + 1
  }
  return { total: all.length, byCategory }
}

export async function searchSavedItems(query: string): Promise<SavedItemDisplay[]> {
  const all = await getAllSavedItems()
  const lower = query.toLowerCase()
  return all.filter(
    (item) =>
      item.text.toLowerCase().includes(lower) ||
      item.topic.toLowerCase().includes(lower) ||
      item.pageTitle.toLowerCase().includes(lower) ||
      item.personalNote.toLowerCase().includes(lower) ||
      item.tags.some((t) => t.toLowerCase().includes(lower)),
  )
}
