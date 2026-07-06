import { safeStorageGet } from '../../utils/safe-chrome'
import { getAllVocabulary } from '../../storage/vocabularyStore'

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

export async function loadVocabulary(): Promise<{
  entries: PopupVocabEntry[]
  stats: PopupVocabStats
}> {
  const [storageResult, idbEntries] = await Promise.all([
    safeStorageGet<any[]>('vocabulary'),
    getAllVocabulary().catch(() => [] as PopupVocabEntry[]),
  ])

  const storageEntries: PopupVocabEntry[] = (Array.isArray(storageResult) ? storageResult : [])
    .filter((item: Record<string, unknown>) => item.word)
    .map(normalizeEntry)

  const allMap = new Map<string, PopupVocabEntry>()

  for (const entry of idbEntries) {
    const key = entry.word.toLowerCase()
    if (!allMap.has(key)) allMap.set(key, entry)
  }

  for (const entry of storageEntries) {
    const key = entry.word.toLowerCase()
    allMap.set(key, entry)
  }

  const entries = Array.from(allMap.values())
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const stats: PopupVocabStats = {
    total: entries.length,
    newCount: entries.filter(e => e.status === 'new').length,
    learningCount: entries.filter(e => e.status === 'learning' || e.status === 'reviewing').length,
    masteredCount: entries.filter(e => e.status === 'mastered').length,
  }

  return { entries, stats }
}

export async function findWord(word: string): Promise<PopupVocabEntry | undefined> {
  const { entries } = await loadVocabulary()
  return entries.find(e => e.word.toLowerCase() === word.toLowerCase())
}

function normalizeEntry(raw: Record<string, unknown>): PopupVocabEntry {
  return {
    id: (raw.id as string) || '',
    word: (raw.word as string) || (raw.text as string)?.split(/\s+/)[0] || '',
    meaning: (raw.meaning as string) || (raw.text as string) || '',
    pronunciation: (raw.pronunciation as string) || '',
    partOfSpeech: (raw.partOfSpeech as string) || '',
    topic: (raw.topic as string) || '',
    difficulty: (raw.difficulty as string) || '',
    status: (raw.status as string) || 'new',
    createdAt: (raw.createdAt as string) || (raw.savedAt as string) || new Date().toISOString(),
  }
}
