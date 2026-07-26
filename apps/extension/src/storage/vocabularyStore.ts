import type { VocabularyEntryOutput } from '@ielts/storage'
import { openDB, STORE_NAMES } from './db'

export type ExtensionVocabEntry = VocabularyEntryOutput & {
  translation: string
}

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
    const request = db.transaction(STORE, 'readonly').objectStore(STORE).getAll()
    request.onsuccess = () => { db.close(); resolve(request.result as ExtensionVocabEntry[]) }
    request.onerror = () => { db.close(); reject(request.error) }
  })
}

export async function getVocabularyById(id: string): Promise<ExtensionVocabEntry | undefined> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE, 'readonly').objectStore(STORE).get(id)
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
        store.put({ ...existing, ...updates })
      }
      tx.oncomplete = () => { db.close(); resolve() }
      tx.onerror = () => { db.close(); reject(tx.error) }
    }
    getRequest.onerror = () => { db.close(); reject(getRequest.error) }
  })
}

export async function deleteVocabularyEntry(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE, 'readwrite').objectStore(STORE).delete(id)
    request.onsuccess = () => { db.close(); resolve() }
    request.onerror = () => { db.close(); reject(request.error) }
  })
}

export async function getVocabularyDueForReview(): Promise<ExtensionVocabEntry[]> {
  const all = await getAllVocabulary().catch(() => [] as ExtensionVocabEntry[])
  return all.filter(v => v.addedToReview && v.status !== 'mastered')
}
