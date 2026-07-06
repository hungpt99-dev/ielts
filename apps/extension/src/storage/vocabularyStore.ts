import { z } from 'zod'
import { openDB, STORE_NAMES } from './db'

export const extensionVocabSchema = z.object({
  id: z.string(),
  word: z.string().min(1, 'Word is required'),
  sourceSentence: z.string().default(''),
  pageTitle: z.string().default(''),
  pageUrl: z.string().default(''),
  topic: z.string().default(''),
  personalNote: z.string().default(''),
  tags: z.array(z.string()).default([]),

  meaning: z.string().default(''),
  meaningVi: z.string().default(''),
  partOfSpeech: z.string().default(''),
  pronunciation: z.string().default(''),
  exampleSentence: z.string().default(''),
  synonyms: z.array(z.string()).default([]),
  antonyms: z.array(z.string()).default([]),
  collocations: z.array(z.string()).default([]),
  wordFamily: z.array(z.string()).default([]),

  difficulty: z.enum(['easy', 'medium', 'hard', '']).default(''),
  status: z.enum(['new', 'learning', 'reviewing', 'mastered']).default('new'),

  addedToReview: z.boolean().default(false),
  reviewId: z.string().default(''),

  createdAt: z.string(),
  updatedAt: z.string(),
})

export type ExtensionVocabEntry = z.infer<typeof extensionVocabSchema>

const STORE = STORE_NAMES.VOCABULARY

export async function saveVocabularyEntry(entry: ExtensionVocabEntry): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    const store = tx.objectStore(STORE)
    store.put(entry)
    tx.oncomplete = () => { db.close(); resolve() }
    tx.onerror = () => { db.close(); reject(tx.error) }
  })
}

export async function getAllVocabulary(): Promise<ExtensionVocabEntry[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const store = tx.objectStore(STORE)
    const request = store.getAll()
    request.onsuccess = () => { db.close(); resolve(request.result as ExtensionVocabEntry[]) }
    request.onerror = () => { db.close(); reject(request.error) }
  })
}

export async function getVocabularyById(id: string): Promise<ExtensionVocabEntry | undefined> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const store = tx.objectStore(STORE)
    const request = store.get(id)
    request.onsuccess = () => { db.close(); resolve(request.result as ExtensionVocabEntry | undefined) }
    request.onerror = () => { db.close(); reject(request.error) }
  })
}

export async function updateVocabularyEntry(id: string, updates: Partial<ExtensionVocabEntry>): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    const store = tx.objectStore(STORE)
    const getRequest = store.get(id)
    getRequest.onsuccess = () => {
      const existing = getRequest.result as ExtensionVocabEntry | undefined
      if (existing) {
        store.put({ ...existing, ...updates, updatedAt: new Date().toISOString() })
      }
    }
    tx.oncomplete = () => { db.close(); resolve() }
    tx.onerror = () => { db.close(); reject(tx.error) }
  })
}

export async function deleteVocabularyEntry(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    const store = tx.objectStore(STORE)
    store.delete(id)
    tx.oncomplete = () => { db.close(); resolve() }
    tx.onerror = () => { db.close(); reject(tx.error) }
  })
}

export async function getVocabularyDueForReview(): Promise<ExtensionVocabEntry[]> {
  const all = await getAllVocabulary()
  return all.filter(v => v.addedToReview)
}

export async function getVocabularyStats(): Promise<{
  total: number
  learning: number
  mastered: number
  addedToReview: number
}> {
  const all = await getAllVocabulary()
  return {
    total: all.length,
    learning: all.filter(v => v.status === 'learning' || v.status === 'new').length,
    mastered: all.filter(v => v.status === 'mastered').length,
    addedToReview: all.filter(v => v.addedToReview).length,
  }
}
