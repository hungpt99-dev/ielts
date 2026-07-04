import { safeSendMessage } from '../utils/safe-chrome'

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

function handlePageMessage(event: MessageEvent): void {
  if (event.origin !== window.location.origin) return
  if (!isValidBridgeMessage(event.data)) return
  if (event.data.source !== 'ielts-page') return

  if (event.data.action === 'SETTINGS_CHANGED' && event.data.data) {
    forwardToBackground(event.data.data as Record<string, unknown>)
  }
}

function handleBackgroundMessage(message: unknown): void {
  if (!message || typeof message !== 'object') return
  const msg = message as Record<string, unknown>
  if (msg.type === 'SETTINGS_SYNC' && msg.payload) {
    forwardToPage(msg.payload)
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
