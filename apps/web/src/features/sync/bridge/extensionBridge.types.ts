export const BRIDGE_NAMESPACE = 'IELTS_JOURNEY_EXTENSION_BRIDGE'

export type BridgeMessageType =
  | 'PING_EXTENSION'
  | 'PING_EXTENSION_RESPONSE'
  | 'GET_SYNC_STATUS'
  | 'GET_SYNC_STATUS_RESPONSE'
  | 'EXPORT_EXTENSION_DATA'
  | 'EXPORT_EXTENSION_DATA_RESPONSE'
  | 'IMPORT_EXTENSION_DATA'
  | 'IMPORT_EXTENSION_DATA_RESPONSE'

export type BridgeSource = 'web' | 'content-script' | 'extension'

export interface BridgeMessageBase {
  namespace: typeof BRIDGE_NAMESPACE
  type: BridgeMessageType
  requestId: string
  source: BridgeSource
  createdAt: string
}

export interface BridgeResponse<T = unknown> extends BridgeMessageBase {
  success: boolean
  payload?: T
  error?: string
}

export interface PingExtensionResult {
  connected: true
  extensionVersion: string
  extensionId: string
  bridgeVersion: number
  syncAvailable: true
}

export type ExtensionStatus =
  | { state: 'checking' }
  | { state: 'connected'; version: string; bridgeVersion: number }
  | { state: 'not_detected' }
  | { state: 'error'; message: string }
