import { z } from 'zod'
import { openDB, STORE_NAMES } from './db'

export const articleQuestionSchema = z.object({
  type: z.enum(['multiple-choice', 'true-false', 'short-answer', 'gap-fill', 'matching']),
  question: z.string().min(1),
  passage: z.string().optional(),
  options: z.array(z.string()).optional(),
  correctAnswer: z.string().min(1),
  explanation: z.string().min(1),
  skill: z.enum(['reading', 'listening', 'writing', 'speaking']).default('reading'),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  bandScore: z.string().optional(),
})

export const extensionArticleSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Title is required'),
  url: z.string().default(''),
  content: z.string().default(''),
  selectedParagraph: z.string().default(''),
  topic: z.string().default(''),
  tags: z.array(z.string()).default([]),
  personalNote: z.string().default(''),
  isReadingPractice: z.boolean().default(false),
  difficulty: z.enum(['easy', 'medium', 'hard', '']).default(''),

  aiQuestions: z.array(articleQuestionSchema).default([]),
  aiQuestionsGeneratedAt: z.string().optional(),

  status: z.enum(['new', 'reading', 'reviewed']).default('new'),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type ArticleQuestion = z.infer<typeof articleQuestionSchema>
export type ExtensionArticleEntry = z.infer<typeof extensionArticleSchema>

const STORE = STORE_NAMES.ARTICLES

export const IELTS_TOPICS = [
  'education',
  'environment',
  'technology',
  'health',
  'travel',
  'culture',
  'economy',
  'society',
  'science',
  'sports',
  'food',
  'work',
  'general',
] as const

export async function saveArticleEntry(entry: ExtensionArticleEntry): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    const store = tx.objectStore(STORE)
    store.put(entry)
    tx.oncomplete = () => { db.close(); resolve() }
    tx.onerror = () => { db.close(); reject(tx.error) }
  })
}

export async function getAllArticles(): Promise<ExtensionArticleEntry[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const store = tx.objectStore(STORE)
    const request = store.getAll()
    request.onsuccess = () => { db.close(); resolve(request.result as ExtensionArticleEntry[]) }
    request.onerror = () => { db.close(); reject(request.error) }
  })
}

export async function getArticleById(id: string): Promise<ExtensionArticleEntry | undefined> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const store = tx.objectStore(STORE)
    const request = store.get(id)
    request.onsuccess = () => { db.close(); resolve(request.result as ExtensionArticleEntry | undefined) }
    request.onerror = () => { db.close(); reject(request.error) }
  })
}

export async function updateArticleEntry(id: string, updates: Partial<ExtensionArticleEntry>): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    const store = tx.objectStore(STORE)
    const getRequest = store.get(id)
    getRequest.onsuccess = () => {
      const existing = getRequest.result as ExtensionArticleEntry | undefined
      if (existing) {
        store.put({ ...existing, ...updates, updatedAt: new Date().toISOString() })
      }
    }
    tx.oncomplete = () => { db.close(); resolve() }
    tx.onerror = () => { db.close(); reject(tx.error) }
  })
}

export async function deleteArticleEntry(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    const store = tx.objectStore(STORE)
    store.delete(id)
    tx.oncomplete = () => { db.close(); resolve() }
    tx.onerror = () => { db.close(); reject(tx.error) }
  })
}

export async function getArticlesByTopic(topic: string): Promise<ExtensionArticleEntry[]> {
  const all = await getAllArticles()
  return all.filter(a => a.topic === topic)
}

export async function getReadingPracticeArticles(): Promise<ExtensionArticleEntry[]> {
  const all = await getAllArticles()
  return all.filter(a => a.isReadingPractice)
}

export async function getArticleStats(): Promise<{
  total: number
  readingPractice: number
  withQuestions: number
  byTopic: Record<string, number>
}> {
  const all = await getAllArticles()
  const byTopic: Record<string, number> = {}
  let readingPractice = 0
  let withQuestions = 0
  for (const a of all) {
    byTopic[a.topic || 'general'] = (byTopic[a.topic || 'general'] || 0) + 1
    if (a.isReadingPractice) readingPractice++
    if (a.aiQuestions.length > 0) withQuestions++
  }
  return {
    total: all.length,
    readingPractice,
    withQuestions,
    byTopic,
  }
}
