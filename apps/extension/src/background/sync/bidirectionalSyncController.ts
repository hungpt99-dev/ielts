import { getAllVocabulary } from '../../storage/vocabularyStore'
import { getAllMistakes, saveMistakeEntry } from '../../storage/mistakeStore'
import { saveVocabularyEntry } from '../../storage/vocabularyStore'
import { findWebAppTab } from './webTabConnection'
import { loadSettings, saveSettings, setApiKey } from '../settingsStorage'

const TIMEOUT_MS = 15000
const META_KEY = 'ielts-sync-metadata-background'

interface SyncMeta {
  lastBidirectionalSyncAt: string | null
}

function getMeta(): SyncMeta {
  try {
    const raw = localStorage.getItem(META_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { lastBidirectionalSyncAt: null }
}

function saveMeta(m: SyncMeta): void {
  try { localStorage.setItem(META_KEY, JSON.stringify(m)) } catch {}
}

export interface SyncSummary {
  created: number
  updated: number
  failed: number
  completedAt: string
}

async function exportExtensionData(): Promise<Record<string, unknown>> {
  console.log('[BidiSync] Exporting extension data...')
  const [vocab, mistakes] = await Promise.all([
    getAllVocabulary().catch(() => { console.warn('[BidiSync] getAllVocabulary failed'); return [] }),
    getAllMistakes().catch(() => { console.warn('[BidiSync] getAllMistakes failed'); return [] }),
  ])
  console.log('[BidiSync] Extension has', vocab.length, 'vocab,', mistakes.length, 'mistakes')
  return {
    vocabulary: vocab,
    mistakes: mistakes,
  }
}

async function importWebData(data: Record<string, unknown>): Promise<{ imported: number; updated: number }> {
  console.log('[BidiSync] importWebData called')
  let imported = 0
  let updated = 0

  const webSettings = data.settings as Record<string, unknown> | undefined
  if (webSettings && typeof webSettings === 'object') {
    try {
      const current = await loadSettings().catch(() => null) || {} as Record<string, unknown>
      await saveSettings({
        ...(current as any),
        aiProvider: (webSettings.aiProvider as string) || (current as any).aiProvider || 'openai',
        aiModel: (webSettings.aiModel as string) || (current as any).aiModel || 'gpt-4o-mini',
        aiBaseUrl: (webSettings.aiBaseUrl as string) || (current as any).aiBaseUrl || '',
        themeMode: (webSettings.themeMode as string) || (current as any).themeMode || 'light',
      } as any)
      if (webSettings.aiApiKey) await setApiKey(webSettings.aiApiKey as string)
      console.log('[BidiSync] Settings imported from web')
    } catch (err) {
      console.warn('[BidiSync] Failed to import settings:', err)
    }
  }

  const vocabList = data.vocabulary as Record<string, unknown>[] | undefined
  if (Array.isArray(vocabList)) {
    const existing = await getAllVocabulary().catch(() => [])
    const existingIds = new Set(existing.map(v => v.id))
    for (const item of vocabList) {
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

  const mistakeList = data.mistakes as Record<string, unknown>[] | undefined
  if (Array.isArray(mistakeList)) {
    const existing = await getAllMistakes().catch(() => [])
    const existingIds = new Set(existing.map(m => m.id))
    for (const item of mistakeList) {
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

  return { imported, updated }
}

export async function syncBidirectional(): Promise<SyncSummary> {
  const summary: SyncSummary = { created: 0, updated: 0, failed: 0, completedAt: '' }

  try {
    console.log('[BidiSync] Finding web app tab...')
    const tab = await findWebAppTab()
    if (!tab) { console.warn('[BidiSync] Web app tab not found'); throw new Error('WEBSITE_NOT_OPEN') }
    console.log('[BidiSync] Found tab:', tab.tabId, tab.url)

    const extData = await exportExtensionData()

    console.log('[BidiSync] Sending EXTENSION_SYNC_DATA to tab', tab.tabId)
    const webData = await new Promise<Record<string, unknown> | null>((resolve) => {
      const timer = setTimeout(() => { console.warn('[BidiSync] Timeout waiting for web response'); resolve(null) }, TIMEOUT_MS)

      function trySend(attempt: number) {
        chrome.tabs.sendMessage(
          tab.tabId,
          { type: 'EXTENSION_SYNC_DATA', data: extData },
          (response: { success: boolean; data?: Record<string, unknown> } | undefined) => {
            if (chrome.runtime.lastError) {
              console.warn('[BidiSync] Attempt', attempt, '-', chrome.runtime.lastError.message)
              if (attempt < 3) {
                if (attempt === 1) {
                  // Try injecting content script
                  chrome.scripting.executeScript({
                    target: { tabId: tab.tabId },
                    files: ['content.js'],
                  }).catch(() => {})
                }
                setTimeout(() => trySend(attempt + 1), 1500)
                return
              }
              clearTimeout(timer)
              resolve(null)
              return
            }
            clearTimeout(timer)
            if (!response?.success) {
              console.warn('[BidiSync] Response not successful:', response)
              resolve(null)
              return
            }
            console.log('[BidiSync] Received web data with', response.data ? Object.keys(response.data).length : 0, 'keys')
            resolve(response.data ?? null)
          },
        )
      }

      trySend(1)
    })

    if (!webData) { console.warn('[BidiSync] No web data received'); throw new Error('WEBSITE_NO_RESPONSE') }

    console.log('[BidiSync] Importing web data...')
    const result = await importWebData(webData)
    summary.created = result.imported
    summary.updated = result.updated
    console.log('[BidiSync] Import result:', result)

    const meta = getMeta()
    meta.lastBidirectionalSyncAt = new Date().toISOString()
    saveMeta(meta)

    summary.completedAt = new Date().toISOString()
    return summary
  } catch (err) {
    if (err instanceof Error && err.message === 'WEBSITE_NOT_OPEN') throw err
    console.error('[BidiSync] Error:', err)
    summary.failed = 1
    summary.completedAt = new Date().toISOString()
    return summary
  }
}
