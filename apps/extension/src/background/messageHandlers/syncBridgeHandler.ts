import { DEFAULT_AI_MODEL } from '@ielts/config'
import { getAllVocabulary, saveVocabularyEntry } from '../../storage/vocabularyStore'
import { getAllMistakes, saveMistakeEntry } from '../../storage/mistakeStore'
import { loadSettings, saveSettings, setApiKey } from '../settingsStorage'
import { toExtensionVocab, toExtensionMistake, syncStorageForHighlighter } from '../sync/syncHelpers'

const SYNC_META_KEY = 'ielts-legacy-sync-meta'

function getMeta(): { lastSyncFromWebAt: string | null; lastSyncToWebAt: string | null } {
  try {
    const raw = localStorage.getItem(SYNC_META_KEY)
    if (raw) return JSON.parse(raw)
  } catch (error) {
  console.error('apps/extension/src/background/messageHandlers/syncBridgeHandler.ts error:', error);
  }
  return { lastSyncFromWebAt: null, lastSyncToWebAt: null }
}

function saveMeta(meta: { lastSyncFromWebAt: string | null; lastSyncToWebAt: string | null }): void {
  try {
    localStorage.setItem(SYNC_META_KEY, JSON.stringify(meta))
  } catch (error) {
console.error('apps/extension/src/background/messageHandlers/syncBridgeHandler.ts error:', error);
  }
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
    console.error('apps/extension/src/background/messageHandlers/syncBridgeHandler.ts error:', err);
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
          aiModel: extSettings?.aiModel || DEFAULT_AI_MODEL,
          aiBaseUrl: extSettings?.aiBaseUrl || '',
          aiApiKey: extSettings?.aiApiKey || '',
          themeMode: extSettings?.themeMode || 'light',
        },
      },
    }
  } catch (err) {
    console.error('apps/extension/src/background/messageHandlers/syncBridgeHandler.ts error:', err);
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
        aiModel: (s.aiModel as string) || current.aiModel || DEFAULT_AI_MODEL,
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
        await saveVocabularyEntry(toExtensionVocab(item, id)).catch(() => {})
      }
    }

    if (Array.isArray(data.mistakes)) {
      const existing = await getAllMistakes().catch(() => [])
      const existingIds = new Set(existing.map(m => m.id))
      for (const item of data.mistakes) {
        const id = (item.id as string) || crypto.randomUUID()
        if (existingIds.has(id)) { updated++ } else { imported++ }
        existingIds.add(id)
        await saveMistakeEntry(toExtensionMistake(item, id)).catch(() => {})
      }
    }

    const meta = getMeta()
    meta.lastSyncFromWebAt = new Date().toISOString()
    saveMeta(meta)

    await syncStorageForHighlighter(getAllVocabulary)

    return { success: true, data: { imported, updated } }
  } catch (err) {
    console.error('apps/extension/src/background/messageHandlers/syncBridgeHandler.ts error:', err);
    return { success: false, error: err instanceof Error ? err.message : 'IMPORT failed' }
  }
}
