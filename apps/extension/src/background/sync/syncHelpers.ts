import type { ExtensionVocabEntry } from '../../storage/vocabularyStore'
import type { ExtensionMistakeEntry } from '../../storage/mistakeStore'

export type { ExtensionVocabEntry }

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

export async function syncStorageForHighlighter(getAllVocabulary: () => Promise<ExtensionVocabEntry[]>): Promise<void> {
  try {
    const allVocab = await getAllVocabulary().catch(() => [])
    await new Promise<void>(r => chrome.storage.local.set({ vocabulary: allVocab }, r))
  } catch (error) {
    console.error('apps/extension/src/background/sync/syncHelpers.ts error:', error);
  }
}
