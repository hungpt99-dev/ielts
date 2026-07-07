import { DATA_SYNC_ACTION, isDataSyncMessage, type DataSyncPayload, type SyncEntityType, type SyncOperation } from '@ielts/storage'

const BRIDGE_SOURCE = 'ielts-extension'

function postToPage(payload: DataSyncPayload): void {
  try {
    window.postMessage(
      { source: BRIDGE_SOURCE, action: DATA_SYNC_ACTION, data: payload },
      window.location.origin,
    )
  } catch {
    // content script may not be on the web app page
  }
}

function postToBackground(payload: DataSyncPayload): void {
  try {
    chrome.runtime.sendMessage({ type: 'DATA_SYNC', payload }).catch(() => {})
  } catch {
    // popup context may not have runtime
  }
}

export function pushSync(entityType: SyncEntityType, operation: SyncOperation, entityId: string, entity: Record<string, unknown>): void {
  const payload: DataSyncPayload = {
    entityType,
    operation,
    entityId,
    entity,
    timestamp: new Date().toISOString(),
  }
  postToPage(payload)
  postToBackground(payload)
}

const inboundHandlers = new Set<(payload: DataSyncPayload) => void>()

export function onDataSync(handler: (payload: DataSyncPayload) => void): () => void {
  inboundHandlers.add(handler)
  return () => { inboundHandlers.delete(handler) }
}

let initialized = false

export function initSyncListener(): void {
  if (initialized) return
  initialized = true

  window.addEventListener('message', handleMessageEvent)
}

export function destroySyncListener(): void {
  if (!initialized) return
  initialized = false
  window.removeEventListener('message', handleMessageEvent)
}

function handleMessageEvent(event: MessageEvent): void {
  if (event.origin !== window.location.origin) return
  if (!isDataSyncMessage(event.data)) return
  if (event.data.source === 'ielts-extension') return

  for (const handler of inboundHandlers) {
    try { handler(event.data.data) } catch { /* skip bad handler */ }
  }
}
