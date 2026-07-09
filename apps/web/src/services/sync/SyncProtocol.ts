import type { ExtensionVocabEntryData, ExtensionArticleEntryData, ExtensionMistakeEntryData, SharedSettingsPatchData } from './SyncMapper'

export const SYNC_ACTION_PREFIX = 'SYNC_'

export const SyncActions = {
  PUSH_SETTINGS: 'SYNC_PUSH_SETTINGS',
  PUSH_VOCAB: 'SYNC_PUSH_VOCAB',
  REQUEST_EXTENSION_DATA: 'SYNC_REQUEST_EXTENSION_DATA',
  EXTENSION_DATA: 'SYNC_EXTENSION_DATA',
} as const

export type SyncAction = (typeof SyncActions)[keyof typeof SyncActions]

export interface SyncRequestPayload {
  requestId: string
  action: SyncAction
  data?: unknown
}

export interface SyncResponsePayload {
  source: 'ielts-extension'
  action: typeof SyncActions.EXTENSION_DATA
  requestId: string
  data: ExtensionDataResponse
}

export interface ExtensionDataResponse {
  vocabulary: ExtensionVocabEntryData[]
  articles: ExtensionArticleEntryData[]
  mistakes: ExtensionMistakeEntryData[]
}

export interface SyncPushSettingsData {
  aiProvider: string
  aiModel: string
  aiBaseUrl: string
  aiApiKey: string
  themeMode: 'light' | 'dark' | 'system'
}

const RESPONSE_TIMEOUT_MS = 8000

const pendingRequests = new Map<string, {
  resolve: (data: ExtensionDataResponse) => void
  reject: (error: Error) => void
  timer: ReturnType<typeof setTimeout>
}>()

export function initSyncResponseListener(): void {
  window.addEventListener('message', (event: MessageEvent) => {
    if (event.origin !== window.location.origin) return
    const msg = event.data
    if (!msg || typeof msg !== 'object') return
    if (msg.source !== 'ielts-extension' || msg.action !== SyncActions.EXTENSION_DATA) return
    if (!msg.requestId || !msg.data) return

    const pending = pendingRequests.get(msg.requestId)
    if (!pending) return

    clearTimeout(pending.timer)
    pendingRequests.delete(msg.requestId)
    pending.resolve(msg.data as ExtensionDataResponse)
  })
}

export function requestExtensionData(): Promise<ExtensionDataResponse> {
  return new Promise((resolve, reject) => {
    const requestId = crypto.randomUUID()

    const timer = setTimeout(() => {
      pendingRequests.delete(requestId)
      reject(new Error('Extension did not respond in time'))
    }, RESPONSE_TIMEOUT_MS)

    pendingRequests.set(requestId, { resolve, reject, timer })

    try {
      window.postMessage(
        { source: 'ielts-page', action: SyncActions.REQUEST_EXTENSION_DATA, requestId },
        window.location.origin,
      )
    } catch {
      clearTimeout(timer)
      pendingRequests.delete(requestId)
      reject(new Error('Failed to send sync request to extension'))
    }
  })
}

export function pushSettingsToExtension(settings: SyncPushSettingsData): void {
  try {
    window.postMessage(
      { source: 'ielts-page', action: SyncActions.PUSH_SETTINGS, data: settings },
      window.location.origin,
    )
  } catch {}
}
