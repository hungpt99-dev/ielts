import type { VocabularyEntry } from '../../models'
import { DatabaseService } from './Database'
import { isValidBridgeMessage } from '@ielts/storage'

const BRIDGE_SOURCE = 'ielts-extension'
const BRIDGE_ACTION = 'VOCAB_SAVED'

type VocabSyncCallback = (entry: VocabularyEntry) => void
let listeners: VocabSyncCallback[] = []

export function onVocabSavedFromExtension(callback: VocabSyncCallback): () => void {
  listeners.push(callback)
  return () => {
    listeners = listeners.filter(l => l !== callback)
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
    vocabEntry = data as unknown as VocabularyEntry
  } else if (typeof data.text === 'string') {
    vocabEntry = buildVocabFromText(data)
  }

  if (!vocabEntry) return

  try {
    const existing = await DatabaseService.getAll<VocabularyEntry>('vocabulary')
    const alreadySaved = existing.some(
      v => v.word.toLowerCase() === (vocabEntry!.word || vocabEntry!.id).toLowerCase(),
    )
    if (alreadySaved) return

    await DatabaseService.add('vocabulary', vocabEntry)
    for (const listener of listeners) {
      try { listener(vocabEntry) } catch { /* ignore */ }
    }
  } catch { /* ignore */ }
}

function isFullVocabEntry(data: Record<string, unknown>): boolean {
  return typeof data.word === 'string' && typeof data.meaning === 'string'
}

function buildVocabFromText(data: Record<string, unknown>): VocabularyEntry {
  const now = new Date().toISOString()
  const text = (data.text as string) || ''
  const title = (data.pageTitle as string) || ''
  const url = (data.pageUrl as string) || ''
  const topic = (data.topic as string) || 'general'
  const tags = (data.tags as string[]) || []

  return {
    id: crypto.randomUUID(),
    word: text.trim().split(/\s+/)[0] || 'unknown',
    meaning: text,
    meaningVi: '',
    pronunciation: '',
    partOfSpeech: '',
    topic,
    exampleSentence: `"${text}" — from "${title}" (${url})`,
    collocations: [],
    synonyms: [],
    antonyms: [],
    wordFamily: [],
    personalNote: `Saved from: ${title}`,
    difficulty: 'medium',
    status: 'new',
    tags,
    createdAt: now,
    updatedAt: now,
  }
}

export function initVocabSync(): void {
  window.addEventListener('message', handleVocabMessage)
}

export function destroyVocabSync(): void {
  window.removeEventListener('message', handleVocabMessage)
  listeners = []
}
