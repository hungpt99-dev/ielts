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
  const idbEntries = await getAllVocabulary().catch((err) => {
    console.error('[loadVocabulary] IndexedDB read failed:', err)
    return [] as PopupVocabEntry[]
  })

  const entries = idbEntries
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
