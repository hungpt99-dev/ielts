import type { ExtensionVocabEntry } from '../../storage/vocabularyStore'
import type { ExtensionMistakeEntry } from '../../storage/mistakeStore'

export function toExtensionVocab(item: Record<string, unknown>, id: string): ExtensionVocabEntry {
  return {
    id,
    word: (item.word as string) || '',
    sourceSentence: (item.sourceSentence as string) || (item.meaning as string) || '',
    pageTitle: (item.pageTitle as string) || '',
    pageUrl: (item.pageUrl as string) || '',
    topic: (item.topic as string) || 'general',
    personalNote: (item.personalNote as string) || '',
    tags: Array.isArray(item.tags) ? item.tags as string[] : [],
    meaning: (item.meaning as string) || '',
    meaningVi: (item.meaningVi as string) || '',
    partOfSpeech: (item.partOfSpeech as string) || '',
    pronunciation: (item.pronunciation as string) || '',
    exampleSentence: (item.exampleSentence as string) || '',
    synonyms: Array.isArray(item.synonyms) ? item.synonyms as string[] : [],
    antonyms: Array.isArray(item.antonyms) ? item.antonyms as string[] : [],
    collocations: Array.isArray(item.collocations) ? item.collocations as string[] : [],
    wordFamily: Array.isArray(item.wordFamily) ? item.wordFamily as string[] : [],
    difficulty: (item.difficulty as string) || 'medium',
    status: ((item.status as string) || 'new') as ExtensionVocabEntry['status'],
    addedToReview: true,
    reviewId: '',
    createdAt: (item.createdAt as string) || new Date().toISOString(),
    updatedAt: (item.updatedAt as string) || new Date().toISOString(),
  }
}

export function toExtensionMistake(item: Record<string, unknown>, id: string): ExtensionMistakeEntry {
  return {
    id,
    mistake: (item.mistake as string) || '',
    correction: (item.correction as string) || '',
    explanation: (item.explanation as string) || '',
    source: (item.source as string) || '',
    topic: (item.topic as string) || '',
    date: (item.date as string) || new Date().toISOString(),
    skill: (item.skill as ExtensionMistakeEntry['skill']) || 'vocabulary',
    status: ((item.status as string) === 'resolved' ? 'fixed' : (item.status as string) || 'new') as ExtensionMistakeEntry['status'],
    repetitionCount: (item.repetitionCount as number) || 0,
    createdAt: (item.createdAt as string) || new Date().toISOString(),
    updatedAt: (item.updatedAt as string) || new Date().toISOString(),
  }
}

export function toWebVocab(v: Record<string, unknown>): Record<string, unknown> {
  return {
    id: v.id,
    word: (v.word as string) || (v.sourceSentence as string)?.split(/\s+/)[0] || 'unknown',
    meaning: (v.meaning as string) || (v.sourceSentence as string) || (v.word as string) || '',
    meaningVi: (v.meaningVi as string) || '',
    pronunciation: (v.pronunciation as string) || '',
    partOfSpeech: (v.partOfSpeech as string) || '',
    topic: (v.topic as string) || 'general',
    exampleSentence: (v.exampleSentence as string) || (v.sourceSentence as string) || '',
    collocations: Array.isArray(v.collocations) ? v.collocations as string[] : [],
    synonyms: Array.isArray(v.synonyms) ? v.synonyms as string[] : [],
    antonyms: Array.isArray(v.antonyms) ? v.antonyms as string[] : [],
    wordFamily: Array.isArray(v.wordFamily) ? v.wordFamily as string[] : [],
    personalNote: (v.personalNote as string) || '',
    difficulty: ((v.difficulty as string) || 'medium') as 'easy' | 'medium' | 'hard',
    status: ((v.status as string) || 'new') as 'new' | 'learning' | 'reviewing' | 'mastered',
    tags: Array.isArray(v.tags) ? v.tags as string[] : [],
    createdAt: (v.createdAt as string) || new Date().toISOString(),
    updatedAt: (v.updatedAt as string) || new Date().toISOString(),
  }
}

export async function syncStorageForHighlighter(getAllVocabulary: () => Promise<ExtensionVocabEntry[]>): Promise<void> {
  try {
    const allVocab = await getAllVocabulary().catch(() => [])
    await new Promise<void>(r => chrome.storage.local.set({ vocabulary: allVocab }, r))
  } catch {}
}
