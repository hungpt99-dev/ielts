import { DATA_SYNC_ACTION, isDataSyncMessage, isDuplicateMessage, createMessageId, type DataSyncPayload, type SyncEntityType, type SyncOperation } from '@ielts/storage'
import { DatabaseService } from './Database'

const BRIDGE_SOURCE = 'ielts-page'
let syncInProgress = 0

export function isSyncInProgress(): boolean {
  return syncInProgress > 0
}

export function pushDataSync(entityType: SyncEntityType, operation: SyncOperation, entityId: string, entity: Record<string, unknown>): void {
  if (syncInProgress > 0) return
  const payload: DataSyncPayload = {
    entityType,
    operation,
    entityId,
    entity,
    timestamp: new Date().toISOString(),
    messageId: createMessageId(),
  }
  try {
    window.postMessage(
      { source: BRIDGE_SOURCE, action: DATA_SYNC_ACTION, data: payload },
      window.location.origin,
    )
  } catch {
    // extension may not be present
  }
}

type DataChangeCallback = (entityType: SyncEntityType, operation: string, entityId: string) => void

const listeners = new Set<DataChangeCallback>()

export function onDataChange(cb: DataChangeCallback): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

function notifyListeners(entityType: SyncEntityType, operation: string, entityId: string): void {
  for (const cb of listeners) {
    try { cb(entityType, operation, entityId) } catch { /* skip */ }
  }
}

async function saveToDatabase(payload: DataSyncPayload): Promise<void> {
  const { entityType, entity } = payload

  switch (entityType) {
    case 'vocabulary':
      await DatabaseService.addVocabulary(entity as any)
      break
    case 'article':
      await DatabaseService.add('readingPassages', entity)
      break
    case 'mistake':
      await DatabaseService.addMistake(entity as any)
      break
    case 'video':
      await DatabaseService.add('listeningTranscripts', entity)
      break
    case 'learningEntry':
      break
    case 'dailyProgress':
      break
  }
}

function handleDataSync(payload: DataSyncPayload): void {
  syncInProgress++
  saveToDatabase(payload).then(() => {
    syncInProgress--
    notifyListeners(payload.entityType, payload.operation, payload.entityId)
  }).catch(err => {
    syncInProgress--
    console.error('[DataSync] Save failed:', err)
  })
}

let initialized = false

export function initDataSyncManager(): void {
  if (initialized) return
  initialized = true

  window.addEventListener('message', (event: MessageEvent) => {
    if (event.origin !== window.location.origin) return
    if (!isDataSyncMessage(event.data)) return
    if (event.data.source === 'ielts-page') return
    if (isDuplicateMessage(event.data.data.messageId)) return

    handleDataSync(event.data.data)
  })
}
