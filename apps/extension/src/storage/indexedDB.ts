import type { LearningEntry, SaveCategory } from '../types'
import { openDB, STORE_NAMES } from './db'

const STORE = STORE_NAMES.LEARNING_ENTRIES

export async function saveEntry(entry: LearningEntry): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    const store = tx.objectStore(STORE)
    store.put(entry)
    tx.oncomplete = () => {
      db.close()
      resolve()
    }
    tx.onerror = () => {
      db.close()
      reject(tx.error)
    }
  })
}

export async function getAllEntries(): Promise<LearningEntry[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const store = tx.objectStore(STORE)
    const request = store.getAll()
    request.onsuccess = () => {
      db.close()
      resolve(request.result as LearningEntry[])
    }
    request.onerror = () => {
      db.close()
      reject(request.error)
    }
  })
}

export async function getEntriesByCategory(category: SaveCategory): Promise<LearningEntry[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const store = tx.objectStore(STORE)
    const index = store.index('category')
    const request = index.getAll(category)
    request.onsuccess = () => {
      db.close()
      resolve(request.result as LearningEntry[])
    }
    request.onerror = () => {
      db.close()
      reject(request.error)
    }
  })
}

export async function getEntryById(id: string): Promise<LearningEntry | undefined> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const store = tx.objectStore(STORE)
    const request = store.get(id)
    request.onsuccess = () => {
      db.close()
      resolve(request.result as LearningEntry | undefined)
    }
    request.onerror = () => {
      db.close()
      reject(request.error)
    }
  })
}

export async function updateEntry(id: string, updates: Partial<LearningEntry>): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    const store = tx.objectStore(STORE)
    const getRequest = store.get(id)
    getRequest.onsuccess = () => {
      const existing = getRequest.result as LearningEntry | undefined
      if (existing) {
        const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() }
        store.put(updated)
      }
    }
    tx.oncomplete = () => {
      db.close()
      resolve()
    }
    tx.onerror = () => {
      db.close()
      reject(tx.error)
    }
  })
}

export async function deleteEntry(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    const store = tx.objectStore(STORE)
    store.delete(id)
    tx.oncomplete = () => {
      db.close()
      resolve()
    }
    tx.onerror = () => {
      db.close()
      reject(tx.error)
    }
  })
}

export async function getTodayEntries(): Promise<LearningEntry[]> {
  const all = await getAllEntries()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString()
  return all.filter(e => e.createdAt >= todayStr)
}

export async function getEntriesByDateRange(start: string, end: string): Promise<LearningEntry[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const store = tx.objectStore(STORE)
    const index = store.index('createdAt')
    const range = IDBKeyRange.bound(start, end)
    const request = index.getAll(range)
    request.onsuccess = () => {
      db.close()
      resolve(request.result as LearningEntry[])
    }
    request.onerror = () => {
      db.close()
      reject(request.error)
    }
  })
}

export async function searchEntries(query: string): Promise<LearningEntry[]> {
  const all = await getAllEntries()
  const lower = query.toLowerCase()
  return all.filter(e =>
    e.text.toLowerCase().includes(lower) ||
    e.topic.toLowerCase().includes(lower) ||
    e.pageTitle.toLowerCase().includes(lower) ||
    e.personalNote.toLowerCase().includes(lower) ||
    e.tags.some(t => t.toLowerCase().includes(lower))
  )
}

export async function getStats(): Promise<{
  total: number
  byCategory: Record<string, number>
  todayCount: number
}> {
  const all = await getAllEntries()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString()
  const byCategory: Record<string, number> = {}
  let todayCount = 0
  for (const e of all) {
    byCategory[e.category] = (byCategory[e.category] || 0) + 1
    if (e.createdAt >= todayStr) todayCount++
  }
  return { total: all.length, byCategory, todayCount }
}

export async function clearAllEntries(): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    const store = tx.objectStore(STORE)
    store.clear()
    tx.oncomplete = () => {
      db.close()
      resolve()
    }
    tx.onerror = () => {
      db.close()
      reject(tx.error)
    }
  })
}

export async function exportAllEntries(): Promise<string> {
  const entries = await getAllEntries()
  return JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), entries }, null, 2)
}

export async function importEntries(json: string): Promise<number> {
  const data = JSON.parse(json)
  if (!data.entries || !Array.isArray(data.entries)) throw new Error('Invalid import format')
  let count = 0
  for (const entry of data.entries) {
    if (entry.id && entry.text && entry.category) {
      await saveEntry(entry as LearningEntry)
      count++
    }
  }
  return count
}
