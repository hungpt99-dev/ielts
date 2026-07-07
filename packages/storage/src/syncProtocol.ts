export const SYNC_ENTITY_TYPES = [
  'vocabulary',
  'article',
  'mistake',
  'video',
  'learningEntry',
  'dailyProgress',
] as const
export type SyncEntityType = typeof SYNC_ENTITY_TYPES[number]

export const SYNC_OPERATIONS = ['created', 'updated', 'deleted'] as const
export type SyncOperation = typeof SYNC_OPERATIONS[number]

export interface DataSyncPayload {
  entityType: SyncEntityType
  operation: SyncOperation
  entityId: string
  entity: Record<string, unknown>
  timestamp: string
}

export const DATA_SYNC_ACTION = 'DATA_CHANGED'

export function isDataSyncMessage(data: unknown): data is { source: 'ielts-extension' | 'ielts-page'; action: typeof DATA_SYNC_ACTION; data: DataSyncPayload } {
  if (!data || typeof data !== 'object') return false
  const msg = data as Record<string, unknown>
  if (msg.source !== 'ielts-extension' && msg.source !== 'ielts-page') return false
  if (msg.action !== DATA_SYNC_ACTION) return false
  if (!msg.data || typeof msg.data !== 'object') return false
  const payload = msg.data as Record<string, unknown>
  return (
    typeof payload.entityType === 'string' &&
    SYNC_ENTITY_TYPES.includes(payload.entityType as SyncEntityType) &&
    typeof payload.operation === 'string' &&
    SYNC_OPERATIONS.includes(payload.operation as SyncOperation) &&
    typeof payload.entityId === 'string' &&
    payload.entity !== null && typeof payload.entity === 'object' &&
    typeof payload.timestamp === 'string'
  )
}
