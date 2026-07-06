import { z } from 'zod'
import { openDB, STORE_NAMES } from './db'

export const extensionMistakeSchema = z.object({
  id: z.string(),
  mistake: z.string().min(1, 'Mistake description is required'),
  correction: z.string().min(1, 'Correction is required'),
  explanation: z.string().default(''),
  source: z.string().default(''),
  topic: z.string().default(''),
  date: z.string(),
  skill: z.enum(['vocabulary', 'grammar', 'reading', 'listening', 'writing', 'speaking']),
  status: z.enum(['new', 'reviewing', 'fixed']).default('new'),
  repetitionCount: z.number().default(0),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type ExtensionMistakeEntry = z.infer<typeof extensionMistakeSchema>

export const MISTAKE_SKILLS: { value: ExtensionMistakeEntry['skill']; label: string; color: string }[] = [
  { value: 'vocabulary', label: 'Vocabulary', color: '#8b5cf6' },
  { value: 'grammar', label: 'Grammar', color: '#3b82f6' },
  { value: 'reading', label: 'Reading', color: '#06b6d4' },
  { value: 'listening', label: 'Listening', color: '#10b981' },
  { value: 'writing', label: 'Writing', color: '#f59e0b' },
  { value: 'speaking', label: 'Speaking', color: '#ec4899' },
]

export const STATUS_OPTIONS: { value: ExtensionMistakeEntry['status']; label: string; color: string }[] = [
  { value: 'new', label: 'New', color: '#ef4444' },
  { value: 'reviewing', label: 'Reviewing', color: '#f59e0b' },
  { value: 'fixed', label: 'Fixed', color: '#10b981' },
]

const STORE = STORE_NAMES.MISTAKES

export async function saveMistakeEntry(entry: ExtensionMistakeEntry): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    const store = tx.objectStore(STORE)
    store.put(entry)
    tx.oncomplete = () => { db.close(); resolve() }
    tx.onerror = () => { db.close(); reject(tx.error) }
  })
}

export async function getAllMistakes(): Promise<ExtensionMistakeEntry[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const store = tx.objectStore(STORE)
    const request = store.getAll()
    request.onsuccess = () => { db.close(); resolve(request.result as ExtensionMistakeEntry[]) }
    request.onerror = () => { db.close(); reject(request.error) }
  })
}

export async function getMistakeById(id: string): Promise<ExtensionMistakeEntry | undefined> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const store = tx.objectStore(STORE)
    const request = store.get(id)
    request.onsuccess = () => { db.close(); resolve(request.result as ExtensionMistakeEntry | undefined) }
    request.onerror = () => { db.close(); reject(request.error) }
  })
}

export async function updateMistakeEntry(id: string, updates: Partial<ExtensionMistakeEntry>): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    const store = tx.objectStore(STORE)
    const getRequest = store.get(id)
    getRequest.onsuccess = () => {
      const existing = getRequest.result as ExtensionMistakeEntry | undefined
      if (existing) {
        store.put({ ...existing, ...updates, updatedAt: new Date().toISOString() })
      }
    }
    tx.oncomplete = () => { db.close(); resolve() }
    tx.onerror = () => { db.close(); reject(tx.error) }
  })
}

export async function deleteMistakeEntry(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    const store = tx.objectStore(STORE)
    store.delete(id)
    tx.oncomplete = () => { db.close(); resolve() }
    tx.onerror = () => { db.close(); reject(tx.error) }
  })
}

export async function getMistakesByStatus(status: ExtensionMistakeEntry['status']): Promise<ExtensionMistakeEntry[]> {
  const all = await getAllMistakes()
  return all.filter(e => e.status === status)
}

export async function searchMistakes(query: string): Promise<ExtensionMistakeEntry[]> {
  const all = await getAllMistakes()
  const lower = query.toLowerCase()
  return all.filter(e =>
    e.mistake.toLowerCase().includes(lower) ||
    e.correction.toLowerCase().includes(lower) ||
    e.explanation.toLowerCase().includes(lower) ||
    e.source.toLowerCase().includes(lower) ||
    e.topic.toLowerCase().includes(lower)
  )
}

export async function getMistakeStats(): Promise<{
  total: number
  newCount: number
  reviewingCount: number
  fixedCount: number
  bySkill: Record<string, number>
  dueForReview: number
}> {
  const all = await getAllMistakes()
  const bySkill: Record<string, number> = {}
  let newCount = 0
  let reviewingCount = 0
  let fixedCount = 0

  for (const e of all) {
    if (e.status === 'new') newCount++
    else if (e.status === 'reviewing') reviewingCount++
    else if (e.status === 'fixed') fixedCount++
    bySkill[e.skill] = (bySkill[e.skill] || 0) + 1
  }

  const dueForReview = all.filter(e => {
    if (e.status === 'fixed') return false
    if (e.status === 'new') return true
    const daysSinceUpdate = Math.floor(
      (Date.now() - new Date(e.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
    )
    return daysSinceUpdate >= 1
  }).length

  return { total: all.length, newCount, reviewingCount, fixedCount, bySkill, dueForReview }
}
