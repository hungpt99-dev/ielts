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
  messageId: string
}

export const DATA_SYNC_ACTION = 'DATA_CHANGED'

export function createMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}
