import { DATA_SYNC_ACTION } from '@ielts/storage'
import { safeStorageSet } from '../utils/safe-chrome'

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

function handlePageMessage(event: MessageEvent): void {
  if (event.origin !== window.location.origin) return
  if (!isValidBridgeMessage(event.data)) return
  if (event.data.source !== 'ielts-page') return

  if (event.data.action === 'VOCAB_LIST_SYNC' && Array.isArray(event.data.data)) {
    const list = event.data.data as Record<string, unknown>[]
    safeStorageSet({ vocabulary: list }).catch(() => {})
  }
}

function handleBackgroundMessage(message: unknown): void {
  if (!message || typeof message !== 'object') return
  const msg = message as Record<string, unknown>
  if (msg.type === 'FORWARD_DATA_SYNC_BATCH' && Array.isArray(msg.payload)) {
    for (const item of msg.payload) {
      try {
        window.postMessage(
          { source: 'ielts-extension', action: DATA_SYNC_ACTION, data: item },
          window.location.origin,
        )
      } catch {}
    }
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
