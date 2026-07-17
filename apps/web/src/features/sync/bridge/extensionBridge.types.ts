import type { BridgeMessageType, BridgeSource, BridgeMessage, BridgeResponse } from '@ielts/shared'
export type { BridgeMessageType, BridgeSource, BridgeMessage, BridgeResponse }

export const BRIDGE_NAMESPACE = 'IELTS_JOURNEY_EXTENSION_BRIDGE'

export interface BridgeMessageBase {
  namespace: typeof BRIDGE_NAMESPACE
  type: BridgeMessageType
  requestId: string
  source: BridgeSource
  correlationId?: string
  idempotencyKey?: string
  createdAt: string
}

export type ExtensionBridgeResponse<T = unknown> = BridgeMessageBase & {
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
