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
    case 'vocabulary': {
      const ext = entity as Record<string, unknown>
      const mapped = {
        id: ext.id as string,
        word: ext.word as string,
        meaning: (ext.meaning as string) || (ext.word as string) || '',
        meaningVi: (ext.meaningVi as string) || '',
        pronunciation: (ext.pronunciation as string) || '',
        partOfSpeech: (ext.partOfSpeech as string) || '',
        topic: (ext.topic as string) || 'general',
        exampleSentence: (ext.exampleSentence as string) || (ext.sourceSentence as string) || '',
        collocations: Array.isArray(ext.collocations) ? ext.collocations : [],
        synonyms: Array.isArray(ext.synonyms) ? ext.synonyms : [],
        antonyms: Array.isArray(ext.antonyms) ? ext.antonyms : [],
        wordFamily: Array.isArray(ext.wordFamily) ? ext.wordFamily : [],
        personalNote: (ext.personalNote as string) || '',
        difficulty: (ext.difficulty as string) || 'medium',
        status: (ext.status as string) || 'new',
        tags: Array.isArray(ext.tags) ? ext.tags : [],
        createdAt: (ext.createdAt as string) || new Date().toISOString(),
        updatedAt: (ext.updatedAt as string) || new Date().toISOString(),
      }
      await DatabaseService.addVocabulary(mapped as any)
      break
    }
    case 'article':
      await DatabaseService.add('readingPassages', entity)
      break
    case 'mistake': {
      const ext = entity as Record<string, unknown>
      const mapped = {
        id: ext.id as string,
        mistake: ext.mistake as string,
        correction: ext.correction as string,
        explanation: (ext.explanation as string) || '',
        source: (ext.source as string) || '',
        topic: (ext.topic as string) || 'general',
        date: (ext.date as string) || new Date().toISOString(),
        skill: (ext.skill as string) || 'grammar',
        status: (ext.status as string) || 'new',
        repetitionCount: typeof ext.repetitionCount === 'number' ? ext.repetitionCount : 0,
        createdAt: (ext.createdAt as string) || new Date().toISOString(),
        updatedAt: (ext.updatedAt as string) || new Date().toISOString(),
      }
      await DatabaseService.addMistake(mapped as any)
      break
    }
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
