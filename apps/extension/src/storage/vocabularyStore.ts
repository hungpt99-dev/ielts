import { openDB, STORE_NAMES } from './db'

export interface VerbConjugation {
  base: string
  pastSimple: string
  pastParticiple: string
  presentParticiple: string
  thirdPersonSingular: string
}

export interface ExtensionVocabEntry {
  id: string
  word: string
  sourceSentence: string
  pageTitle: string
  pageUrl: string
  topic: string
  personalNote: string
  tags: string[]
  meaning: string
  translation: string
  partOfSpeech: string
  pronunciation: string
  exampleSentence: string
  synonyms: string[]
  antonyms: string[]
  collocations: string[]
  wordFamily: string[]
  verbConjugation?: VerbConjugation
  difficulty: 'easy' | 'medium' | 'hard' | ''
  status: 'new' | 'learning' | 'reviewing' | 'mastered'
  addedToReview: boolean
  reviewId: string
  createdAt: string
  updatedAt: string
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
