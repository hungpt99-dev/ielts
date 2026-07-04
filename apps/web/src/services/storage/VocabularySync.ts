import { isValidBridgeMessage } from '@ielts/storage'
import type { VocabularyEntry } from '../../models'
import { DatabaseService } from './Database'

const BRIDGE_SOURCE = 'ielts-extension'
const BRIDGE_ACTION = 'VOCAB_SAVED'

type VocabSyncCallback = (entry: VocabularyEntry) => void
let listeners: VocabSyncCallback[] = []
let initialized = false

export function onVocabSavedFromExtension(callback: VocabSyncCallback): () => void {
  listeners.push(callback)
  return () => {
    listeners = listeners.filter(l => l !== callback)
  }
}

function isFullVocabEntry(data: Record<string, unknown>): data is Record<string, unknown> & { word: string; meaning: string } {
  return typeof data.word === 'string' && data.word.length > 0 && typeof data.meaning === 'string'
}

function isTextSnippet(data: Record<string, unknown>): data is Record<string, unknown> & { text: string } {
  return typeof data.text === 'string' && data.text.length > 0
}

function buildVocabFromText(data: Record<string, unknown>): VocabularyEntry | null {
  const text = (data.text as string) || ''
  if (!text.trim()) return null

  const title = (data.pageTitle as string) || ''
  const url = (data.pageUrl as string) || ''
  const topic = (data.topic as string) || 'general'
  const tags = (data.tags as string[]) || []
  const now = new Date().toISOString()
  const firstWord = text.trim().split(/\s+/)[0] || 'unknown'

  return {
    id: crypto.randomUUID(),
    word: firstWord,
    meaning: text,
    meaningVi: '',
    pronunciation: '',
    partOfSpeech: '',
    topic,
    exampleSentence: url ? `"${text}" — from "${title}" (${url})` : text,
    collocations: [],
    synonyms: [],
    antonyms: [],
    wordFamily: [],
    personalNote: title ? `Saved from: ${title}` : '',
    difficulty: 'medium',
    status: 'new',
    tags,
    createdAt: now,
    updatedAt: now,
  }
}

async function handleVocabMessage(event: MessageEvent): Promise<void> {
  if (event.origin !== window.location.origin) return
  if (!isValidBridgeMessage(event.data)) return
  if (event.data.source !== BRIDGE_SOURCE) return
  if (event.data.action !== BRIDGE_ACTION) return
  if (!event.data.data || typeof event.data.data !== 'object') return

  const data = event.data.data as Record<string, unknown>

  let vocabEntry: VocabularyEntry | null = null

  if (isFullVocabEntry(data)) {
    const now = new Date().toISOString()
    vocabEntry = {
      id: data.id as string || crypto.randomUUID(),
      word: data.word,
      meaning: data.meaning,
      meaningVi: (data.meaningVi as string) || '',
      pronunciation: (data.pronunciation as string) || '',
      partOfSpeech: (data.partOfSpeech as string) || '',
      topic: (data.topic as string) || 'general',
      exampleSentence: (data.exampleSentence as string) || '',
      collocations: (data.collocations as string[]) || [],
      synonyms: (data.synonyms as string[]) || [],
      antonyms: (data.antonyms as string[]) || [],
      wordFamily: (data.wordFamily as string[]) || [],
      personalNote: (data.personalNote as string) || '',
      difficulty: (data.difficulty as VocabularyEntry['difficulty']) || 'medium',
      status: (data.status as VocabularyEntry['status']) || 'new',
      tags: (data.tags as string[]) || [],
      createdAt: (data.createdAt as string) || now,
      updatedAt: now,
    }
  } else if (isTextSnippet(data)) {
    vocabEntry = buildVocabFromText(data)
  }

  if (!vocabEntry) return

  try {
    const existing = await DatabaseService.getAll<VocabularyEntry>('vocabulary')
    const alreadySaved = existing.some(
      v => v.word.toLowerCase() === vocabEntry!.word.toLowerCase(),
    )
    if (alreadySaved) return

    await DatabaseService.add('vocabulary', vocabEntry)
    for (const listener of listeners) {
      try { listener(vocabEntry) } catch { /* ignore */ }
    }
  } catch { /* ignore */ }
}

export function initVocabSync(): void {
  if (initialized) return
  initialized = true
  window.addEventListener('message', handleVocabMessage)
}

export function destroyVocabSync(): void {
  if (!initialized) return
  initialized = false
  window.removeEventListener('message', handleVocabMessage)
  listeners = []
}
