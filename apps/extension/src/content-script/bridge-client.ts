import { safeSendMessage, safeStorageGet, safeStorageSet } from '../utils/safe-chrome'
import { getAllVocabulary } from '../storage/vocabularyStore'

interface BridgeMessage {
  source: 'ielts-extension' | 'ielts-page'
  action: string
  data?: unknown
  requestId?: string
}

function isValidBridgeMessage(data: unknown): data is BridgeMessage {
  if (!data || typeof data !== 'object') return false
  const msg = data as Record<string, unknown>
  return (
    (msg.source === 'ielts-extension' || msg.source === 'ielts-page') &&
    typeof msg.action === 'string'
  )
}

let initialized = false

function forwardToBackground(settings: Record<string, unknown>): void {
  safeSendMessage({
    type: 'SETTINGS_SYNC',
    payload: settings,
  })
}

function forwardToPage(data: unknown): void {
  try {
    window.postMessage(
      {
        source: 'ielts-extension',
        action: 'SETTINGS_SYNC',
        data,
        requestId: crypto.randomUUID(),
      },
      window.location.origin,
    )
  } catch { /* ignore */ }
}

async function forwardVocabToPage(): Promise<void> {
  const [savedResult, vocabEntries] = await Promise.all([
    safeStorageGet<any[]>('savedItems'),
    getAllVocabulary().catch(() => []),
  ])

  const savedItems = savedResult.savedItems || []

  const vocabFromSaved = savedItems
    .filter((item: Record<string, unknown>) => item.category === 'vocabulary')
    .map((item: Record<string, unknown>) => ({
      source: 'ielts-extension' as const,
      action: 'VOCAB_SAVED' as const,
      data: item,
    }))

  const vocabFromDict = vocabEntries.map((item: Record<string, unknown>) => ({
    source: 'ielts-extension' as const,
    action: 'VOCAB_SAVED' as const,
    data: item,
  }))

  const allMessages = [...vocabFromDict, ...vocabFromSaved]
  for (const msg of allMessages) {
    try {
      window.postMessage(msg, window.location.origin)
    } catch { /* ignore */ }
  }
}

function handlePageMessage(event: MessageEvent): void {
  if (event.origin !== window.location.origin) return
  if (!isValidBridgeMessage(event.data)) return
  if (event.data.source !== 'ielts-page') return

  if (event.data.action === 'SETTINGS_CHANGED' && event.data.data) {
    const data = event.data.data as Record<string, unknown>

    const localPatch: Record<string, unknown> = {}
    if (typeof data.aiApiKey === 'string') localPatch.aiApiKey = data.aiApiKey
    if (typeof data.aiBaseUrl === 'string') localPatch.aiBaseUrl = data.aiBaseUrl
    if (typeof data.aiModel === 'string') localPatch.aiModel = data.aiModel
    if (typeof data.themeMode === 'string') localPatch.themeMode = data.themeMode
    if (Object.keys(localPatch).length > 0) {
      safeStorageSet(localPatch)
    }

    forwardToBackground(data)
  }

  if (event.data.action === 'REQUEST_EXTENSION_VOCAB') {
    forwardVocabToPage()
  }

  if (event.data.action === 'VOCAB_SAVED_BY_WEB' && event.data.data) {
    const data = event.data.data as Record<string, unknown>
    safeStorageGet<any[]>('vocabulary').then((result) => {
      const items = result.vocabulary || []
      const exists = items.some(
        (i: Record<string, unknown>) => i.word === data.word && i.meaning === data.meaning,
      )
      if (!exists) {
        items.unshift(data)
        safeStorageSet({ vocabulary: items }).catch(() => {})
      }
    }).catch(() => {})
  }

  if (event.data.action === 'VOCAB_LIST_SYNC' && Array.isArray(event.data.data)) {
    const list = event.data.data as Record<string, unknown>[]
    safeStorageSet({ vocabulary: list }).catch(() => {})
  }
}

function handleBackgroundMessage(message: unknown): void {
  if (!message || typeof message !== 'object') return
  const msg = message as Record<string, unknown>
  if (msg.type === 'SETTINGS_SYNC' && msg.payload) {
    forwardToPage(msg.payload)
  }
  if (msg.type === 'VOCAB_SAVED' && msg.payload) {
    try {
      window.postMessage(
        { source: 'ielts-extension', action: 'VOCAB_SAVED', data: msg.payload },
        window.location.origin,
      )
    } catch { /* ignore */ }
  }
}

export function initBridgeClient(): void {
  if (initialized) return
  initialized = true
  window.addEventListener('message', handlePageMessage)
  chrome.runtime.onMessage.addListener((message) => {
    handleBackgroundMessage(message)
  })
}

export function destroyBridgeClient(): void {
  if (!initialized) return
  initialized = false
  window.removeEventListener('message', handlePageMessage)
}
