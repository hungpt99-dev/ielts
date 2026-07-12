import { getAllVocabulary, saveVocabularyEntry } from '../../storage/vocabularyStore'
import { getAllMistakes, saveMistakeEntry } from '../../storage/mistakeStore'
import { getAllEntries, saveEntry } from '../../storage/indexedDB'
import { getAllArticles, saveArticleEntry } from '../../storage/articleStore'
import { getAllArtifacts, saveArtifact, type ExtensionArtifact } from '../../services/artifactService'
import { findWebAppTab } from './webTabConnection'
import { loadSettings, saveSettings, setApiKey } from '../settingsStorage'
import { toExtensionVocab, toExtensionMistake, syncStorageForHighlighter } from './syncHelpers'

const TIMEOUT_MS = 15000
const META_KEY = 'ielts-bidi-sync-meta'

interface SyncMeta { lastBidirectionalSyncAt: string | null }

function getMeta(): SyncMeta {
  try { return JSON.parse(localStorage.getItem(META_KEY) || '{}') } catch {}
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
  const [vocab, mistakes, entries, articles, artifacts] = await Promise.all([
    getAllVocabulary().catch(() => []),
    getAllMistakes().catch(() => []),
    getAllEntries().catch(() => []),
    getAllArticles().catch(() => []),
    getAllArtifacts().catch(() => []),
  ])
  return { vocabulary: vocab, mistakes, learningEntries: entries, articles, artifacts }
}

async function importWebData(data: Record<string, unknown>): Promise<{ imported: number; updated: number }> {
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
    } catch {}
  }

  const vocabList = data.vocabulary as Record<string, unknown>[] | undefined
  if (Array.isArray(vocabList)) {
    const existing = await getAllVocabulary().catch(() => [])
    const existingIds = new Set(existing.map(v => v.id))
    for (const item of vocabList) {
      const id = (item.id as string) || crypto.randomUUID()
      if (existingIds.has(id)) { updated++ } else { imported++ }
      existingIds.add(id)
      await saveVocabularyEntry(toExtensionVocab(item, id)).catch(() => {})
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
      await saveMistakeEntry(toExtensionMistake(item, id)).catch(() => {})
    }
  }

  const entriesList = data.learningEntries as Record<string, unknown>[] | undefined
  if (Array.isArray(entriesList)) {
    const existing = await getAllEntries().catch(() => [])
    const existingIds = new Set(existing.map(e => e.id))
    for (const item of entriesList) {
      const id = (item.id as string) || crypto.randomUUID()
      if (existingIds.has(id)) { updated++ } else { imported++ }
      existingIds.add(id)
      await saveEntry({
        id,
        text: (item.text as string) || '',
        category: (item.category as any) || 'reading',
        topic: (item.topic as string) || '',
        skill: (item.skill as any) || 'general',
        difficulty: ((item.difficulty as string) || '') as '' | 'easy' | 'medium' | 'hard',
        tags: Array.isArray(item.tags) ? item.tags as string[] : [],
        personalNote: (item.personalNote as string) || '',
        pageTitle: (item.pageTitle as string) || '',
        pageUrl: (item.pageUrl as string) || '',
        status: (item.status as any) || 'new',
        createdAt: (item.createdAt as string) || new Date().toISOString(),
        updatedAt: (item.updatedAt as string) || new Date().toISOString(),
      }).catch(() => {})
    }
  }

  const articlesList = data.articles as Record<string, unknown>[] | undefined
  if (Array.isArray(articlesList)) {
    const existing = await getAllArticles().catch(() => [])
    const existingIds = new Set(existing.map(a => a.id))
    for (const item of articlesList) {
      const id = (item.id as string) || crypto.randomUUID()
      if (existingIds.has(id)) { updated++ } else { imported++ }
      existingIds.add(id)
      await saveArticleEntry({
        id,
        title: (item.title as string) || (item.pageTitle as string) || 'Untitled',
        url: (item.source as string) || (item.pageUrl as string) || '',
        content: (item.content as string) || (item.text as string) || '',
        selectedParagraph: '',
        topic: (item.topic as string) || 'general',
        tags: Array.isArray(item.tags) ? item.tags as string[] : [],
        personalNote: (item.personalNote as string) || '',
        isReadingPractice: false,
        difficulty: (item.difficulty as string) || '',
        aiQuestions: [],
        status: 'new',
        createdAt: (item.createdAt as string) || new Date().toISOString(),
        updatedAt: (item.updatedAt as string) || new Date().toISOString(),
      } as any).catch(() => {})
    }
  }

  const artifactsList = data.artifacts as Record<string, unknown>[] | undefined
  if (Array.isArray(artifactsList)) {
    const existing = await getAllArtifacts().catch(() => [])
    const existingIds = new Set(existing.map(a => a.id))
    for (const item of artifactsList) {
      const id = (item.id as string) || crypto.randomUUID()
      if (existingIds.has(id)) { updated++ } else { imported++ }
      existingIds.add(id)
      await saveArtifact({
        id,
        url: (item.url as string) || (item.pageUrl as string) || '',
        title: (item.title as string) || 'Untitled',
        description: (item.description as string) || (item.excerpt as string) || '',
        favicon: (item.favicon as string) || '',
        contentText: (item.contentText as string) || (item.content as string) || (item.text as string) || '',
        tags: Array.isArray(item.tags) ? item.tags as string[] : [],
        isFavorite: !!item.isFavorite,
        category: (item.category as ExtensionArtifact['category']) || 'article',
        contentType: (item.contentType as string) || (item.category as string) || 'article',
        source: (item.source as string) || 'web',
        wordCount: (item.wordCount as number) || ((item.contentText as string) || '').split(/\s+/).filter(Boolean).length || 0,
        readingStatus: (item.readingStatus as ExtensionArtifact['readingStatus']) || 'unread',
        createdAt: (item.createdAt as string) || new Date().toISOString(),
        updatedAt: (item.updatedAt as string) || new Date().toISOString(),
      }).catch(() => {})
    }
  }

  await syncStorageForHighlighter(getAllVocabulary)
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
