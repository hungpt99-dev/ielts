import { DATA_SYNC_ACTION, type DataSyncPayload, type SyncEntityType, type SyncOperation } from '@ielts/storage'
import { DatabaseService } from './Database'

export function pushDataSync(entityType: SyncEntityType, operation: SyncOperation, entityId: string, entity: Record<string, unknown>): void {
  const payload: DataSyncPayload = {
    entityType,
    operation,
    entityId,
    entity,
    timestamp: new Date().toISOString(),
    messageId: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
  }
  try {
    window.postMessage(
      { source: 'ielts-page', action: DATA_SYNC_ACTION, data: payload },
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
      const word = (ext.word as string) || (ext.text as string) || (ext.name as string) || ''
      const meaning = (ext.meaning as string) || word || ''
      const topic = (ext.topic as string) || 'general'
      const example = (ext.exampleSentence as string) || (ext.sourceSentence as string) || (ext.text as string) || ''
      const mapped = {
        id: (ext.id as string) || crypto.randomUUID(),
        word,
        meaning,
        meaningVi: (ext.meaningVi as string) || '',
        pronunciation: (ext.pronunciation as string) || '',
        partOfSpeech: (ext.partOfSpeech as string) || '',
        topic,
        exampleSentence: example,
        collocations: Array.isArray(ext.collocations) ? ext.collocations : [],
        synonyms: Array.isArray(ext.synonyms) ? ext.synonyms : [],
        antonyms: Array.isArray(ext.antonyms) ? ext.antonyms : [],
        wordFamily: Array.isArray(ext.wordFamily) ? ext.wordFamily : [],
        personalNote: (ext.personalNote as string) || (ext.note as string) || '',
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
  saveToDatabase(payload).then(() => {
    notifyListeners(payload.entityType, payload.operation, payload.entityId)
  }).catch(err => {
    console.error('[DataSync] Save failed:', err)
  })
}

let initialized = false

export function initDataSyncManager(): void {
  if (initialized) return
  initialized = true

  window.addEventListener('message', (event: MessageEvent) => {
    if (event.origin !== window.location.origin) return
    const msg = event.data
    if (!msg || typeof msg !== 'object') return
    if (msg.source === 'ielts-page' || msg.action !== DATA_SYNC_ACTION) return
    if (!msg.data || typeof msg.data !== 'object') return

    handleDataSync(msg.data as DataSyncPayload)
  })
}
