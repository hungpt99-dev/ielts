import { getAllVocabulary, type ExtensionVocabEntry } from '../../storage/vocabularyStore'
import { safeStorageGet } from '../../utils/safe-chrome'

const VOCABULARY_STORAGE_KEY = 'yt-learning-vocabulary'

export interface PopupVocabEntry {
  id: string
  word: string
  meaning: string
  pronunciation: string
  partOfSpeech: string
  topic: string
  difficulty: string
  status: string
  createdAt: string
}

export interface PopupVocabStats {
  total: number
  newCount: number
  learningCount: number
  masteredCount: number
}

/**
 * Reads vocabulary from both IndexedDB (extension origin) and chrome.storage.local.
 * The YouTube content script saves words to chrome.storage.local via VocabularyService,
 * but IndexedDB writes from content scripts live at YouTube's origin — not the
 * extension's — so the popup cannot see them.  Merging both sources covers all paths.
 */
export async function loadVocabulary(): Promise<{
  entries: PopupVocabEntry[]
  stats: PopupVocabStats
}> {
  const idbEntries: PopupVocabEntry[] = (await getAllVocabulary().catch(() => []))
    .map(toPopupEntry)

  const storageRaw = await safeStorageGet<unknown[]>(VOCABULARY_STORAGE_KEY)
  const storageEntries: PopupVocabEntry[] = ((storageRaw[VOCABULARY_STORAGE_KEY] || []) as Record<string, unknown>[])
    .map(toPopupEntry)

  // Merge: prefer IndexedDB entries (richer data), dedup by word
  const byWord = new Map<string, PopupVocabEntry>()
  for (const e of idbEntries) byWord.set(e.word.toLowerCase(), e)
  for (const e of storageEntries) {
    const key = e.word.toLowerCase()
    if (!byWord.has(key)) byWord.set(key, e)
  }

  const entries = [...byWord.values()]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const stats: PopupVocabStats = {
    total: entries.length,
    newCount: entries.filter(e => e.status === 'new').length,
    learningCount: entries.filter(e => e.status === 'learning' || e.status === 'reviewing').length,
    masteredCount: entries.filter(e => e.status === 'mastered').length,
  }

  return { entries, stats }
}

function toPopupEntry(raw: Record<string, unknown>): PopupVocabEntry {
  if (isExtensionVocabEntry(raw)) {
    return {
      id: raw.id ?? crypto.randomUUID(),
      word: raw.word ?? '',
      meaning: raw.meaning ?? '',
      pronunciation: raw.pronunciation ?? '',
      partOfSpeech: raw.partOfSpeech ?? '',
      topic: raw.topic ?? '',
      difficulty: raw.difficulty ?? '',
      status: raw.status ?? 'new',
      createdAt: raw.createdAt ?? new Date().toISOString(),
    }
  }
  // VocabEntry from chrome.storage.local (VocabularyService format)
  return {
    id: (raw.id as string) ?? crypto.randomUUID(),
    word: (raw.word as string) ?? '',
    meaning: (raw.meaning as string) ?? (raw.translation as string) ?? '',
    pronunciation: (raw.pronunciation as string) ?? '',
    partOfSpeech: (raw.partOfSpeech as string) ?? '',
    topic: (raw.topic as string) ?? '',
    difficulty: (raw.difficulty as string) ?? '',
    status: 'new',
    createdAt: (raw.savedAt as string) ?? (raw.createdAt as string) ?? new Date().toISOString(),
  }
}

function isExtensionVocabEntry(raw: Record<string, unknown>): raw is ExtensionVocabEntry {
  return 'status' in raw || 'createdAt' in raw
}

export async function findWord(word: string): Promise<PopupVocabEntry | undefined> {
  const { entries } = await loadVocabulary()
  return entries.find(e => e.word.toLowerCase() === word.toLowerCase())
}
