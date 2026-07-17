export const BRIDGE_PROTOCOL_VERSION = 1

export type BridgeMessageType =
  | 'PING_EXTENSION'
  | 'PING_EXTENSION_RESPONSE'
  | 'GET_SYNC_STATUS'
  | 'GET_SYNC_STATUS_RESPONSE'
  | 'EXPORT_EXTENSION_DATA'
  | 'EXPORT_EXTENSION_DATA_RESPONSE'
  | 'IMPORT_EXTENSION_DATA'
  | 'IMPORT_EXTENSION_DATA_RESPONSE'
  | 'SAVE_VOCABULARY'
  | 'SAVE_VOCABULARY_RESPONSE'
  | 'SAVE_SENTENCE'
  | 'SAVE_SENTENCE_RESPONSE'
  | 'SAVE_NOTE'
  | 'SAVE_NOTE_RESPONSE'
  | 'IMPORT_CONTENT'
  | 'IMPORT_CONTENT_RESPONSE'
  | 'GET_SETTINGS'
  | 'GET_SETTINGS_RESPONSE'
  | 'SYNC_STATUS'
  | 'SYNC_STATUS_RESPONSE'
  | 'PUSH_PROGRESS'
  | 'PUSH_PROGRESS_RESPONSE'

export type BridgeSource = 'web' | 'content-script' | 'extension'

export interface BridgeMessage<T = unknown> {
  version: number
  correlationId: string
  source: BridgeSource
  type: BridgeMessageType
  payload?: T
  idempotencyKey?: string
  timestamp: string
}

export interface BridgeResponse<T = unknown> extends BridgeMessage<T> {
  success: boolean
  error?: string
}
