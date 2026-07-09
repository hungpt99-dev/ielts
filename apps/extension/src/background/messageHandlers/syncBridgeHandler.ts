import { getAllVocabulary } from '../../storage/vocabularyStore'
import { getAllMistakes, saveMistakeEntry } from '../../storage/mistakeStore'
import { saveVocabularyEntry } from '../../storage/vocabularyStore'
import { loadSettings, saveSettings, setApiKey } from '../settingsStorage'

const SYNC_META_KEY = 'ielts-sync-metadata-background'

function getMeta(): { lastSyncFromWebAt: string | null; lastSyncToWebAt: string | null } {
  try {
    const raw = localStorage.getItem(SYNC_META_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { lastSyncFromWebAt: null, lastSyncToWebAt: null }
}

function saveMeta(meta: { lastSyncFromWebAt: string | null; lastSyncToWebAt: string | null }): void {
  try {
    localStorage.setItem(SYNC_META_KEY, JSON.stringify(meta))
  } catch {}
}

export async function handleGetSyncStatus(): Promise<{
  success: boolean
  data?: { lastSyncFromWebAt: string | null; lastSyncToWebAt: string | null; pendingLocalChangesCount: number }
  error?: string
}> {
  try {
    const meta = getMeta()
    const [vocab, mistakes] = await Promise.all([
      getAllVocabulary().catch(() => []),
      getAllMistakes().catch(() => []),
    ])
    return {
      success: true,
      data: {
        ...meta,
        pendingLocalChangesCount: vocab.length + mistakes.length,
      },
    }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'GET_SYNC_STATUS failed' }
  }
}

export async function handleExportData(): Promise<{
  success: boolean
  data?: { vocabulary: Record<string, unknown>[]; mistakes: Record<string, unknown>[]; settings: Record<string, unknown> }
  error?: string
}> {
  try {
    const [vocab, mistakes, extSettings] = await Promise.all([
      getAllVocabulary().catch(() => []),
      getAllMistakes().catch(() => []),
      loadSettings().catch(() => null),
    ])
    return {
      success: true,
      data: {
        vocabulary: vocab as unknown as Record<string, unknown>[],
        mistakes: mistakes as unknown as Record<string, unknown>[],
        settings: {
          aiProvider: extSettings?.aiProvider || 'openai',
          aiModel: extSettings?.aiModel || 'gpt-4o-mini',
          aiBaseUrl: extSettings?.aiBaseUrl || '',
          aiApiKey: extSettings?.aiApiKey || '',
          themeMode: extSettings?.themeMode || 'light',
        },
      },
    }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'EXPORT failed' }
  }
}

export async function handleImportData(payload: unknown): Promise<{
  success: boolean
  data?: { imported: number; updated: number }
  error?: string
}> {
  try {
    const data = payload as { vocabulary?: Record<string, unknown>[]; mistakes?: Record<string, unknown>[]; settings?: Record<string, unknown> } | undefined
    if (!data) {
      return { success: false, error: 'No data provided' }
    }

    let imported = 0
    let updated = 0

    if (data.settings && typeof data.settings === 'object') {
      const s = data.settings
      const current = await loadSettings().catch(() => null) || {} as Record<string, unknown>
      await saveSettings({
        ...current as any,
        aiProvider: (s.aiProvider as string) || current.aiProvider || 'openai',
        aiModel: (s.aiModel as string) || current.aiModel || 'gpt-4o-mini',
        aiBaseUrl: (s.aiBaseUrl as string) || current.aiBaseUrl || '',
        aiApiKey: (s.aiApiKey as string) || current.aiApiKey || '',
        themeMode: (s.themeMode as string) || current.themeMode || 'light',
      } as any)
      if ((s.aiApiKey as string)) {
        await setApiKey(s.aiApiKey as string)
      }
    }

    if (Array.isArray(data.vocabulary)) {
      const existing = await getAllVocabulary().catch(() => [])
      const existingIds = new Set(existing.map(v => v.id))
      for (const item of data.vocabulary) {
        const id = (item.id as string) || crypto.randomUUID()
        if (existingIds.has(id)) { updated++ } else { imported++ }
        existingIds.add(id)
        await saveVocabularyEntry({
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
          status: ((item.status as string) || 'new') as 'new' | 'learning' | 'reviewing' | 'mastered',
          addedToReview: true,
          reviewId: '',
          createdAt: (item.createdAt as string) || new Date().toISOString(),
          updatedAt: (item.updatedAt as string) || new Date().toISOString(),
        }).catch(() => {})
      }
    }

    if (Array.isArray(data.mistakes)) {
      const existing = await getAllMistakes().catch(() => [])
      const existingIds = new Set(existing.map(m => m.id))
      for (const item of data.mistakes) {
        const id = (item.id as string) || crypto.randomUUID()
        if (existingIds.has(id)) { updated++ } else { imported++ }
        existingIds.add(id)
        await saveMistakeEntry({
          id,
          mistake: (item.mistake as string) || '',
          correction: (item.correction as string) || '',
          explanation: (item.explanation as string) || '',
          source: (item.source as string) || '',
          topic: (item.topic as string) || '',
          date: (item.date as string) || new Date().toISOString(),
          skill: (item.skill as 'vocabulary' | 'grammar' | 'reading' | 'listening' | 'writing' | 'speaking') || 'vocabulary',
          status: ((item.status as string) === 'resolved' ? 'fixed' : (item.status as string) || 'new') as 'new' | 'reviewing' | 'fixed',
          repetitionCount: (item.repetitionCount as number) || 0,
          createdAt: (item.createdAt as string) || new Date().toISOString(),
          updatedAt: (item.updatedAt as string) || new Date().toISOString(),
        }).catch(() => {})
      }
    }

    const meta = getMeta()
    meta.lastSyncFromWebAt = new Date().toISOString()
    saveMeta(meta)

    // Sync to chrome.storage.local for auto-highlighter
    try {
      const allVocab = await getAllVocabulary().catch(() => [])
      await new Promise<void>(r => chrome.storage.local.set({ vocabulary: allVocab }, r))
    } catch {}

    return { success: true, data: { imported, updated } }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'IMPORT failed' }
  }
}
