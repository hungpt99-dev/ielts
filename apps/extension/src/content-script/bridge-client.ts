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

function createBridgeMessage(action: string, data?: unknown): BridgeMessage {
  return {
    source: 'ielts-extension',
    action,
    data,
    requestId: crypto.randomUUID(),
  }
}

function forwardToBackground(settings: Record<string, unknown>): void {
  chrome.runtime.sendMessage({
    type: 'SETTINGS_SYNC',
    payload: settings,
  }).catch((err) => {
    console.warn('[bridge-client] Failed to forward settings to background:', err)
  })
}

function forwardToPage(data: unknown): void {
  window.postMessage(
    createBridgeMessage('SETTINGS_SYNC', data),
    window.location.origin,
  )
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
  window.addEventListener('message', handlePageMessage)
  chrome.runtime.onMessage.addListener((message) => {
    handleBackgroundMessage(message)
  })
}
