import { z } from 'zod'

export const videoQuestionSchema = z.object({
  type: z.enum(['multiple-choice', 'short-answer', 'gap-fill', 'true-false']),
  question: z.string().min(1),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string().min(1),
  explanation: z.string().min(1),
  bandScore: z.string().optional(),
})

export const videoVocabItemSchema = z.object({
  word: z.string().min(1),
  meaning: z.string().default(''),
  partOfSpeech: z.string().default(''),
  example: z.string().default(''),
  synonyms: z.array(z.string()).default([]),
  collocations: z.array(z.string()).default([]),
  context: z.string().default(''),
})

export const shadowingItemSchema = z.object({
  sentence: z.string().min(1),
  translation: z.string().default(''),
  focusWords: z.array(z.string()).default([]),
  notes: z.string().default(''),
})

export const videoEntrySchema = z.object({
  id: z.string(),
  videoTitle: z.string().min(1, 'Video title is required'),
  videoUrl: z.string().default(''),
  platform: z.string().default('youtube'),
  notes: z.string().default(''),
  transcript: z.string().default(''),
  topic: z.string().default(''),
  tags: z.array(z.string()).default([]),

  aiVocabulary: z.array(videoVocabItemSchema).default([]),
  aiSummary: z.string().default(''),
  aiKeyPoints: z.array(z.string()).default([]),
  aiIeltsTopics: z.array(z.string()).default([]),
  aiQuestions: z.array(videoQuestionSchema).default([]),
  aiShadowingScripts: z.array(shadowingItemSchema).default([]),

  aiVocabularyGeneratedAt: z.string().optional(),
  aiSummaryGeneratedAt: z.string().optional(),
  aiQuestionsGeneratedAt: z.string().optional(),
  aiShadowingGeneratedAt: z.string().optional(),

  savedToListening: z.boolean().default(false),
  savedToVocabulary: z.boolean().default(false),

  status: z.enum(['new', 'processing', 'completed']).default('new'),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type VideoQuestion = z.infer<typeof videoQuestionSchema>
export type VideoVocabItem = z.infer<typeof videoVocabItemSchema>
export type ShadowingItem = z.infer<typeof shadowingItemSchema>
export type VideoEntry = z.infer<typeof videoEntrySchema>

const DB_NAME = 'ielts-journey-extension'
const DB_VERSION = 4
const STORE_NAME = 'videos'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('platform', 'platform', { unique: false })
        store.createIndex('topic', 'topic', { unique: false })
        store.createIndex('status', 'status', { unique: false })
        store.createIndex('createdAt', 'createdAt', { unique: false })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function saveVideoEntry(entry: VideoEntry): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    store.put(entry)
    tx.oncomplete = () => { db.close(); resolve() }
    tx.onerror = () => { db.close(); reject(tx.error) }
  })
}

export async function getAllVideos(): Promise<VideoEntry[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.getAll()
    request.onsuccess = () => { db.close(); resolve(request.result as VideoEntry[]) }
    request.onerror = () => { db.close(); reject(request.error) }
  })
}

export async function getVideoById(id: string): Promise<VideoEntry | undefined> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const request = store.get(id)
    request.onsuccess = () => { db.close(); resolve(request.result as VideoEntry | undefined) }
    request.onerror = () => { db.close(); reject(request.error) }
  })
}

export async function updateVideoEntry(id: string, updates: Partial<VideoEntry>): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    const getRequest = store.get(id)
    getRequest.onsuccess = () => {
      const existing = getRequest.result as VideoEntry | undefined
      if (existing) {
        store.put({ ...existing, ...updates, updatedAt: new Date().toISOString() })
      }
    }
    tx.oncomplete = () => { db.close(); resolve() }
    tx.onerror = () => { db.close(); reject(tx.error) }
  })
}

export async function deleteVideoEntry(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    store.delete(id)
    tx.oncomplete = () => { db.close(); resolve() }
    tx.onerror = () => { db.close(); reject(tx.error) }
  })
}

export async function getVideosByPlatform(platform: string): Promise<VideoEntry[]> {
  const all = await getAllVideos()
  return all.filter(v => v.platform === platform)
}

export async function getVideoStats(): Promise<{
  total: number
  withTranscript: number
  savedToListening: number
  savedToVocabulary: number
}> {
  const all = await getAllVideos()
  return {
    total: all.length,
    withTranscript: all.filter(v => v.transcript.length > 0).length,
    savedToListening: all.filter(v => v.savedToListening).length,
    savedToVocabulary: all.filter(v => v.savedToVocabulary).length,
  }
}
