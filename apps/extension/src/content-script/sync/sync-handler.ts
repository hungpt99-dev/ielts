import { safeStorageGet } from '../../utils/safe-chrome'
import { getAllVocabulary } from '../../storage/vocabularyStore'
import { getAllArticles } from '../../storage/articleStore'
import { getAllMistakes } from '../../storage/mistakeStore'

const SYNC_ACTIONS = {
  PUSH_SETTINGS: 'SYNC_PUSH_SETTINGS',
  PUSH_VOCAB: 'SYNC_PUSH_VOCAB',
  REQUEST_EXTENSION_DATA: 'SYNC_REQUEST_EXTENSION_DATA',
} as const

function isValidSyncMessage(data: unknown): data is {
  source: string
  action: string
  requestId?: string
  data?: unknown
} {
  if (!data || typeof data !== 'object') return false
  const msg = data as Record<string, unknown>
  return msg.source === 'ielts-page' && typeof msg.action === 'string'
}

function mapStatus(s: string): 'new' | 'learning' | 'reviewing' | 'mastered' {
  if (s === 'new' || s === 'learning' || s === 'reviewing' || s === 'mastered') return s
  return 'new'
}

function handlePushSettings(data: Record<string, unknown>): void {
  const patch: Record<string, unknown> = {}
  if (typeof data.aiProvider === 'string') patch.aiProvider = data.aiProvider
  if (typeof data.aiModel === 'string') patch.aiModel = data.aiModel
  if (typeof data.aiBaseUrl === 'string') patch.aiBaseUrl = data.aiBaseUrl
  if (typeof data.aiApiKey === 'string') patch.aiApiKey = data.aiApiKey
  if (typeof data.themeMode === 'string') patch.themeMode = data.themeMode

  if (Object.keys(patch).length > 0) {
    safeStorageGet(['extensionSettings']).then((result) => {
      const existing = (result.extensionSettings as Record<string, unknown>) || {}
      const merged = { ...existing, ...patch }
      chrome.storage.local.set({ extensionSettings: merged }).catch(() => {})
    }).catch(() => {})
  }
}

function handlePushVocab(data: Record<string, unknown>[]): void {
  if (!Array.isArray(data) || data.length === 0) return
  const vocabList = data.map((item) => ({
    id: item.id as string || crypto.randomUUID(),
    word: item.word as string || '',
    sourceSentence: (item.meaning as string) || (item.sourceSentence as string) || '',
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
    status: mapStatus(item.status as string),
    addedToReview: true,
    reviewId: '',
    createdAt: (item.createdAt as string) || new Date().toISOString(),
    updatedAt: (item.updatedAt as string) || new Date().toISOString(),
  }))

  safeStorageGet(['vocabulary']).then((result) => {
    const existing = (result.vocabulary as Record<string, unknown>[]) || []
    const existingIds = new Set(existing.map(v => v.id as string))
    const merged = [...existing]
    let added = 0
    for (const v of vocabList) {
      if (!existingIds.has(v.id)) {
        merged.unshift(v)
        existingIds.add(v.id)
        added++
      }
    }
    if (added > 0) {
      chrome.storage.local.set({ vocabulary: merged }).catch(() => {})
    }
  }).catch(() => {})
}

async function collectExtensionData(): Promise<{
  vocabulary: Record<string, unknown>[]
  articles: Record<string, unknown>[]
  mistakes: Record<string, unknown>[]
}> {
  const [vocabEntries, articleEntries, mistakeEntries] = await Promise.all([
    getAllVocabulary().catch(() => []),
    getAllArticles().catch(() => []),
    getAllMistakes().catch(() => []),
  ])

  return {
    vocabulary: vocabEntries as unknown as Record<string, unknown>[],
    articles: articleEntries.map(a => ({
      id: a.id,
      title: a.title,
      url: a.url,
      content: a.content,
      selectedParagraph: a.selectedParagraph || '',
      topic: a.topic || '',
      tags: a.tags || [],
      personalNote: a.personalNote || '',
      difficulty: a.difficulty || '',
      status: a.status || 'new',
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    })),
    mistakes: mistakeEntries.map(m => ({
      id: m.id,
      mistake: m.mistake,
      correction: m.correction,
      explanation: m.explanation || '',
      source: m.source || '',
      topic: m.topic || '',
      date: m.date,
      skill: m.skill,
      status: m.status,
      repetitionCount: m.repetitionCount || 0,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    })),
  }
}

export function handleSyncMessage(event: MessageEvent): void {
  if (event.origin !== window.location.origin) return
  if (!isValidSyncMessage(event.data)) return

  const { action, data, requestId } = event.data

  switch (action) {
    case SYNC_ACTIONS.PUSH_SETTINGS:
      if (data && typeof data === 'object') {
        handlePushSettings(data as Record<string, unknown>)
      }
      break

    case SYNC_ACTIONS.PUSH_VOCAB:
      if (data && typeof data === 'object') {
        handlePushVocab(data as Record<string, unknown>[])
      }
      break

    case SYNC_ACTIONS.REQUEST_EXTENSION_DATA:
      if (requestId) {
        sendExtensionData(requestId)
      }
      break
  }
}

async function sendExtensionData(requestId: string): Promise<void> {
  try {
    const data = await collectExtensionData()
    window.postMessage(
      {
        source: 'ielts-extension',
        action: 'SYNC_EXTENSION_DATA',
        requestId,
        data,
      },
      window.location.origin,
    )
  } catch {
    // silently ignore
  }
}
