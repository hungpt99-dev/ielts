import { getAllEntries } from '../storage/indexedDB'
import { getAllVocabulary } from '../storage/vocabularyStore'
import { getAllArticles } from '../storage/articleStore'
import { getAllMistakes } from '../storage/mistakeStore'
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

async function loadVocabularyItems(): Promise<SavedItemDisplay[]> {
  try {
    const entries = await getAllVocabulary()
    return entries.map((v) => ({
      id: v.id,
      text: v.word + (v.meaning ? ` — ${v.meaning}` : ''),
      category: 'vocabulary' as SaveCategory,
      topic: v.topic,
      skill: 'vocabulary' as LearningEntry['skill'],
      difficulty: v.difficulty as LearningEntry['difficulty'],
      tags: v.tags,
      personalNote: v.personalNote,
      pageTitle: v.pageTitle,
      pageUrl: v.pageUrl,
      status: v.status as LearningEntry['status'],
      createdAt: v.createdAt,
      updatedAt: v.updatedAt,
      source: 'indexedDB' as const,
    }))
  } catch {
    return []
  }
}

async function loadArticleItems(): Promise<SavedItemDisplay[]> {
  try {
    const entries = await getAllArticles()
    return entries.map((a) => ({
      id: a.id,
      text: a.title + (a.content ? ` — ${a.content.slice(0, 200)}` : ''),
      category: 'reading' as SaveCategory,
      topic: a.topic,
      skill: 'reading' as LearningEntry['skill'],
      difficulty: a.difficulty as LearningEntry['difficulty'],
      tags: a.tags,
      personalNote: a.personalNote,
      pageTitle: a.title,
      pageUrl: a.url,
      status: a.status as LearningEntry['status'],
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
      source: 'indexedDB' as const,
    }))
  } catch {
    return []
  }
}

async function loadMistakeItems(): Promise<SavedItemDisplay[]> {
  try {
    const entries = await getAllMistakes()
    return entries.map((m) => ({
      id: m.id,
      text: m.mistake + (m.correction ? ` → ${m.correction}` : ''),
      category: 'mistake' as SaveCategory,
      topic: m.topic,
      skill: m.skill as LearningEntry['skill'],
      difficulty: '' as LearningEntry['difficulty'],
      tags: [],
      personalNote: m.explanation,
      pageTitle: m.source,
      pageUrl: '',
      status: m.status as LearningEntry['status'],
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
      source: 'indexedDB' as const,
    }))
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

async function loadSavedItems(): Promise<SavedItemDisplay[]> {
  const [vocab, articles, mistakes, idb, chrome] = await Promise.all([
    loadVocabularyItems(),
    loadArticleItems(),
    loadMistakeItems(),
    loadIndexedDbItems(),
    loadChromeStorageItems(),
  ])
  const seen = new Set<string>()
  const all: SavedItemDisplay[] = []
  for (const item of [...chrome, ...vocab, ...articles, ...mistakes, ...idb]) {
    if (!seen.has(item.id)) {
      seen.add(item.id)
      all.push(item)
    }
  }
  all.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return all
}

export async function getAllSavedItems(): Promise<SavedItemDisplay[]> {
  return loadSavedItems()
}

export async function getSavedItemsStats(): Promise<SavedItemsStats> {
  const all = await getAllSavedItems()
  const byCategory: Record<string, number> = {}
  for (const item of all) {
    byCategory[item.category] = (byCategory[item.category] || 0) + 1
  }
  return { total: all.length, byCategory }
}
