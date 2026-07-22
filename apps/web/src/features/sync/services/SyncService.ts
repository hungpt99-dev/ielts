import { DEFAULT_AI_MODEL, DEFAULT_AI_PROVIDER_ID } from '@ielts/config'
import { vocabularyRepo, mistakeRepo, artifactRepo } from '../../../services/repositories'
import { STORAGE_KEYS } from '@ielts/config'
import { getClient } from '../bridge/ExtensionBridgeClient'
import type { VocabularyEntry, MistakeEntry, Artifact, ArtifactCategory } from '../../../models'

export interface SyncResult {
  success: boolean
  dataImported: number
  dataUpdated: number
  settingsUpdated: boolean
  error?: string
}

function mapWebSettingsToShared(): Record<string, unknown> {
  const s = (() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.localStorage.userSettings)
      return raw ? JSON.parse(raw) : {}
    } catch { return {} }
  })()
  return {
    aiProvider: s.aiProvider || DEFAULT_AI_PROVIDER_ID,
    aiModel: s.aiModel || DEFAULT_AI_MODEL,
    aiBaseUrl: s.aiBaseUrl || s.aiEndpoint || '',
    aiApiKey: s.aiApiKey || '',
    themeMode: s.darkMode ? 'dark' : 'light',
  }
}

function applySharedSettingsToWeb(ext: Record<string, unknown>): void {
  const current = (() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.localStorage.userSettings)
      return raw ? JSON.parse(raw) : {}
    } catch { return {} }
  })()
  const darkMode = ext.themeMode === 'dark'
  const merged = {
    ...current,
    aiProvider: (ext.aiProvider as string) || current.aiProvider,
    aiModel: (ext.aiModel as string) || current.aiModel,
    aiBaseUrl: (ext.aiBaseUrl as string) || current.aiBaseUrl,
    aiEndpoint: (ext.aiBaseUrl as string) || current.aiEndpoint,
    aiApiKey: (ext.aiApiKey as string) || current.aiApiKey,
    darkMode,
    aiEnabled: true,
  }
  try {
    localStorage.setItem(STORAGE_KEYS.localStorage.userSettings, JSON.stringify(merged))
  } catch { /* ignore */ }
  try { window.dispatchEvent(new CustomEvent('ielts-settings-updated')) } catch (error) {
console.error('apps/web/src/features/sync/services/SyncService.ts error:', error);
  }
}

export async function syncFromExtension(): Promise<SyncResult> {
  const client = getClient()
  try {
    const response = await client.requestExport()
    const data = response as Record<string, unknown> | undefined
    if (!data) {
      return { success: false, dataImported: 0, dataUpdated: 0, settingsUpdated: false, error: 'No data received' }
    }

    let imported = 0

    const existingVocab = await vocabularyRepo.findAll()
    const existingVocabIds = new Set(existingVocab.map(v => v.id))
    const incomingVocab = data.vocabulary as Record<string, unknown>[] | undefined
    if (Array.isArray(incomingVocab)) {
      const normalized = incomingVocab.map(v => ({
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
      }))
      const newVocab = normalized.filter(v => !existingVocabIds.has(v.id))
      if (newVocab.length > 0) {
        await vocabularyRepo.bulkCreate(newVocab as any[]).catch(() => {})
        imported += newVocab.length
        window.dispatchEvent(new CustomEvent('vocabulary-changed'))
      }
    }

    const existingMistakes = await mistakeRepo.findAll()
    const existingMistakeIds = new Set(existingMistakes.map(m => m.id))
    const incomingMistakes = data.mistakes as Record<string, unknown>[] | undefined
    if (Array.isArray(incomingMistakes)) {
      const newMistakes = incomingMistakes.filter(m => !existingMistakeIds.has(m.id as string))
      if (newMistakes.length > 0) {
        await mistakeRepo.bulkCreate(newMistakes as any[]).catch(() => {})
        imported += newMistakes.length
      }
    }

    const incomingArtifacts = data.artifacts as Record<string, unknown>[] | undefined
    if (Array.isArray(incomingArtifacts)) {
      const existingArtifacts = await artifactRepo.findAll()
      const existingArtifactIds = new Set(existingArtifacts.map(a => a.id))
      for (const a of incomingArtifacts) {
        const id = (a.id as string) || crypto.randomUUID()
        if (!existingArtifactIds.has(id)) {
          existingArtifactIds.add(id)
          await artifactRepo.create({
            id,
            url: (a.url as string) || (a.pageUrl as string) || '',
            title: (a.title as string) || 'Untitled',
            description: (a.description as string) || '',
            favicon: (a.favicon as string) || '',
            tags: Array.isArray(a.tags) ? a.tags as string[] : [],
            isFavorite: !!a.isFavorite,
            category: (a.category as ArtifactCategory) || 'article',
            source: (a.source as string) || 'extension',
            contentType: (a.contentType as string) || 'article',
            contentText: (a.contentText as string) || (a.content as string) || '',
            wordCount: (a.wordCount as number) || 0,
            readingStatus: (a.readingStatus as string) || 'unread',
            personalNote: (a.personalNote as string) || '',
            createdAt: (a.createdAt as string) || new Date().toISOString(),
            updatedAt: (a.updatedAt as string) || new Date().toISOString(),
          }).catch(() => {})
          imported++
        }
      }
      if (incomingArtifacts.length > 0) {
        window.dispatchEvent(new CustomEvent('artifacts-changed'))
      }
    }

    let settingsUpdated = false
    const extSettings = data.settings as Record<string, unknown> | undefined
    if (extSettings && typeof extSettings === 'object') {
      applySharedSettingsToWeb(extSettings)
      settingsUpdated = true
    }

    return { success: true, dataImported: imported, dataUpdated: 0, settingsUpdated }
  } catch (err) {
    console.error('apps/web/src/features/sync/services/SyncService.ts error:', err);
    return { success: false, dataImported: 0, dataUpdated: 0, settingsUpdated: false, error: err instanceof Error ? err.message : 'Sync failed' }
  }
}

export async function syncBidirectional(): Promise<{
  toExt: SyncResult
  fromExt: SyncResult
}> {
  const toExt = await syncToExtension()
  if (!toExt.success) return { toExt, fromExt: toExt }
  const fromExt = await syncFromExtension()
  return { toExt, fromExt }
}

export async function syncToExtension(): Promise<SyncResult> {
  const client = getClient()
  try {
    const [vocabEntries, mistakeEntries, artifactEntries] = await Promise.all([
      vocabularyRepo.findAll(),
      mistakeRepo.findAll(),
      artifactRepo.findAll().catch(() => []),
    ])

    const payload = {
      vocabulary: vocabEntries as unknown as Record<string, unknown>[],
      mistakes: mistakeEntries as unknown as Record<string, unknown>[],
      artifacts: artifactEntries as unknown as Record<string, unknown>[],
      settings: mapWebSettingsToShared(),
    }

    const response = await client.requestImport(payload)
    const result = response as { imported?: number; updated?: number } | undefined

    return {
      success: true,
      dataImported: result?.imported ?? 0,
      dataUpdated: result?.updated ?? 0,
      settingsUpdated: true,
    }
  } catch (err) {
    console.error('apps/web/src/features/sync/services/SyncService.ts error:', err);
    return { success: false, dataImported: 0, dataUpdated: 0, settingsUpdated: false, error: err instanceof Error ? err.message : 'Sync failed' }
  }
}
