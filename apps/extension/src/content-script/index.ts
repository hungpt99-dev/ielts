import './saveSelectedText'
import './selectionPanel'
import './aiExplain'
import './videoHelper'
import './miniTutor'
import './highlighter/savedKeywordHighlighter'
import './vocabularySaveHandler'
import { initBridgeClient } from './bridge-client'

initBridgeClient()

const BRIDGE_NAMESPACE = 'IELTS_JOURNEY_EXTENSION_BRIDGE'

const VALID_TYPES = new Set([
  'PING_EXTENSION', 'PING_EXTENSION_RESPONSE',
  'GET_SYNC_STATUS', 'GET_SYNC_STATUS_RESPONSE',
  'EXPORT_EXTENSION_DATA', 'EXPORT_EXTENSION_DATA_RESPONSE',
  'IMPORT_EXTENSION_DATA', 'IMPORT_EXTENSION_DATA_RESPONSE',
])

function isValidBridgeMessage(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false
  const m = data as Record<string, unknown>
  return (
    m.namespace === BRIDGE_NAMESPACE &&
    typeof m.type === 'string' &&
    VALID_TYPES.has(m.type) &&
    typeof m.requestId === 'string' &&
    m.source === 'web'
  )
}

function respondBridge(
  requestId: string,
  type: string,
  success: boolean,
  payload?: unknown,
  error?: string,
): void {
  window.postMessage(
    { namespace: BRIDGE_NAMESPACE, type, requestId, source: 'content-script', createdAt: new Date().toISOString(), success, payload, error },
    window.location.origin,
  )
}

function forwardToBackground(type: string, requestId: string, payload?: unknown): void {
  try {
    chrome.runtime.sendMessage({ type, payload }, (response: { success: boolean; data?: unknown; error?: string }) => {
      if (chrome.runtime.lastError) {
        respondBridge(requestId, type + '_RESPONSE', false, undefined, 'EXTENSION_RUNTIME_UNAVAILABLE')
        return
      }
      respondBridge(requestId, type + '_RESPONSE', !!response?.success, response?.data, response?.error)
    })
  } catch {
    respondBridge(requestId, type + '_RESPONSE', false, undefined, 'EXTENSION_RUNTIME_UNAVAILABLE')
  }
}

window.addEventListener('message', (event: MessageEvent) => {
  try {
    if (!isValidBridgeMessage(event.data)) return

    const { type, requestId, payload } = event.data

    if (type === 'PING_EXTENSION') {
      try {
        const manifest = chrome.runtime.getManifest()
        respondBridge(requestId, 'PING_EXTENSION_RESPONSE', true, {
          connected: true,
          extensionVersion: manifest.version || '0.0.0',
          extensionId: chrome.runtime.id,
          bridgeVersion: 1,
          syncAvailable: true,
        })
      } catch {
        // Extension context invalidated (extension was reloaded)
      }
      return
    }

    if (type === 'GET_SYNC_STATUS' || type === 'EXPORT_EXTENSION_DATA' || type === 'IMPORT_EXTENSION_DATA') {
      forwardToBackground(type, requestId, payload)
    }
  } catch {
    // Silently ignore errors (extension context may be invalidated)
  }
})

// Background asks content script to coordinate a bidirectional sync with the web page.
// 1. Posts extension data to the page (IMPORT_EXTENSION_DATA)
// 2. Requests web data from the page (EXPORT_EXTENSION_DATA)
// 3. Sends web data back to the background via callback response
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || typeof message !== 'object') return false
  const msg = message as Record<string, unknown>

  if (msg.type === 'EXTENSION_SYNC_DATA') {
    console.log('[ContentScript] Received EXTENSION_SYNC_DATA from background')
    const extData = msg.data as Record<string, unknown>

    // Step 1: Post extension data to the web page
    const importRequestId = crypto.randomUUID()
    window.postMessage(
      { namespace: BRIDGE_NAMESPACE, type: 'IMPORT_EXTENSION_DATA', requestId: importRequestId, source: 'content-script', createdAt: new Date().toISOString(), payload: extData },
      window.location.origin,
    )
    console.log('[ContentScript] Posted IMPORT_EXTENSION_DATA to page')

    // Step 2: Request web data from the page
    const exportRequestId = crypto.randomUUID()
    const exportTimeout = setTimeout(() => {
      console.warn('[ContentScript] Timeout waiting for EXPORT_EXTENSION_DATA_RESPONSE from page')
      sendResponse({ success: false, error: 'Web page did not respond' })
    }, 10000)

    const handleExportResponse = (event: MessageEvent) => {
      if (event.data?.namespace !== BRIDGE_NAMESPACE) return
      if (event.data?.type !== 'EXPORT_EXTENSION_DATA_RESPONSE') return
      if (event.data?.requestId !== exportRequestId) return
      console.log('[ContentScript] Received EXPORT_EXTENSION_DATA_RESPONSE from page')
      window.removeEventListener('message', handleExportResponse)
      clearTimeout(exportTimeout)
      sendResponse({ success: true, data: event.data.payload })
    }
    window.addEventListener('message', handleExportResponse)

    window.postMessage(
      { namespace: BRIDGE_NAMESPACE, type: 'EXPORT_EXTENSION_DATA', requestId: exportRequestId, source: 'content-script', createdAt: new Date().toISOString() },
      window.location.origin,
    )
    console.log('[ContentScript] Posted EXPORT_EXTENSION_DATA to page, waiting for response...')

    return true // Keep channel open for async response
  }

  return false
})

export {}
