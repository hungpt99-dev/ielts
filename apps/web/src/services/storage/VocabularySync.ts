import type { VocabularyEntry } from '../../models'
import { DatabaseService } from './Database'

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

function handleVocabChanged(): void {
  DatabaseService.getAll<VocabularyEntry>('vocabulary').then((all) => {
    try {
      window.postMessage(
        { source: 'ielts-page', action: 'VOCAB_LIST_SYNC', data: all },
        window.location.origin,
      )
    } catch {}
  }).catch(() => {})
}

export function sendLatestVocabToExtension(): void {
  handleVocabChanged()
}
