import {
  BRIDGE_NAMESPACE,
  type BridgeMessageBase,
  type BridgeResponse,
  type PingExtensionResult,
  type BridgeMessageType,
  type BridgeSource,
} from './extensionBridge.types'
import './webSyncBridge'

const PING_TIMEOUT = 3000
const MAX_RESPONSE_AGE_MS = 5000

type PendingRequest = {
  resolve: (response: BridgeResponse) => void
  reject: (error: Error) => void
  timer: ReturnType<typeof setTimeout>
  createdAt: number
}

export class ExtensionBridgeClient {
  private pendingRequests = new Map<string, PendingRequest>()
  private listenerAttached = false

  attach(): void {
    if (this.listenerAttached) return
    this.listenerAttached = true
    window.addEventListener('message', this.handleMessage)
  }

  private handleMessage = (event: MessageEvent): void => {
    const msg = event.data
    if (!msg || typeof msg !== 'object') return
    if (msg.namespace !== BRIDGE_NAMESPACE) return
    if (typeof msg.requestId !== 'string') return
    if (typeof msg.source !== 'string') return
    if (msg.source === 'web') return

    const pending = this.pendingRequests.get(msg.requestId)
    if (!pending) return

    const age = Date.now() - pending.createdAt
    if (age > MAX_RESPONSE_AGE_MS) {
      this.pendingRequests.delete(msg.requestId)
      return
    }

    clearTimeout(pending.timer)
    this.pendingRequests.delete(msg.requestId)
    pending.resolve(msg as BridgeResponse)
  }

  private sendMessage(type: BridgeMessageType, payload?: unknown): Promise<BridgeResponse> {
    return new Promise((resolve, reject) => {
      const requestId = crypto.randomUUID()
      const createdAt = new Date().toISOString()
      const source: BridgeSource = 'web'

      const timer = setTimeout(() => {
        this.pendingRequests.delete(requestId)
        reject(new Error('TIMEOUT'))
      }, PING_TIMEOUT)

      this.pendingRequests.set(requestId, { resolve, reject, timer, createdAt: Date.now() })

      const message: BridgeMessageBase & { payload?: unknown } = {
        namespace: BRIDGE_NAMESPACE,
        type,
        requestId,
        source,
        createdAt,
        payload,
      }

      try {
        window.postMessage(message, window.location.origin)
      } catch {
        clearTimeout(timer)
        this.pendingRequests.delete(requestId)
        reject(new Error('POST_MESSAGE_FAILED'))
      }
    })
  }

  async ping(): Promise<PingExtensionResult> {
    this.attach()
    try {
      const response = await this.sendMessage('PING_EXTENSION')
      if (!response.success) {
        throw new Error(response.error || 'PING_FAILED')
      }
      return response.payload as PingExtensionResult
    } catch (err) {
      if (err instanceof Error && err.message === 'TIMEOUT') {
        throw new Error('Extension did not respond')
      }
      throw err
    }
  }

  async requestExport(): Promise<unknown> {
    const response = await this.sendMessage('EXPORT_EXTENSION_DATA')
    if (!response.success) {
      throw new Error(response.error || 'EXPORT_FAILED')
    }
    return response.payload
  }

  async requestImport(payload: unknown): Promise<unknown> {
    const response = await this.sendMessage('IMPORT_EXTENSION_DATA', payload)
    if (!response.success) {
      throw new Error(response.error || 'IMPORT_FAILED')
    }
    return response.payload
  }
}

let sharedClient: ExtensionBridgeClient | null = null

export function getClient(): ExtensionBridgeClient {
  if (!sharedClient) {
    sharedClient = new ExtensionBridgeClient()
  }
  return sharedClient
}
