import { isValidBridgeMessage } from '@ielts/storage'
import { emitLearningEvent } from '../../features/learningEvents/LearningEventBus'
import type { CreateLearningEventInput, LearningEventSource } from '../../features/learningEvents/types'

const BRIDGE_SOURCE = 'ielts-extension'
const BRIDGE_ACTION = 'LEARNING_EVENT'

interface BridgeLearningEventData {
  eventType: string
  source: string
  payload: Record<string, unknown>
  page?: string
  entityType?: string | null
  entityId?: string | null
  metadata?: Record<string, string>
}

let initialized = false

function isExtensionLearningEvent(data: unknown): data is BridgeLearningEventData {
  if (!data || typeof data !== 'object') return false
  const d = data as Record<string, unknown>
  return (
    typeof d.eventType === 'string' &&
    typeof d.source === 'string' &&
    typeof d.payload === 'object' &&
    d.payload !== null
  )
}

function handleMessage(event: MessageEvent): void {
  if (event.origin !== window.location.origin) return
  if (!isValidBridgeMessage(event.data)) return
  if (event.data.source !== BRIDGE_SOURCE) return
  if (event.data.action !== BRIDGE_ACTION) return
  if (!event.data.data || typeof event.data.data !== 'object') return

  const data = event.data.data as Record<string, unknown>

  if (!isExtensionLearningEvent(data)) return

  const source = data.source as LearningEventSource
  const payload = data.payload as CreateLearningEventInput['payload']

  emitLearningEvent({
    eventType: data.eventType as CreateLearningEventInput['eventType'],
    source,
    payload,
    page: (data.page as string) ?? window.location.pathname,
    entityType: (data.entityType as CreateLearningEventInput['entityType']) ?? null,
    entityId: (data.entityId as string) ?? null,
    metadata: (data.metadata as Record<string, string>) ?? {},
  })
}

export function initExtensionEventBridge(): void {
  if (initialized) return
  initialized = true
  window.addEventListener('message', handleMessage)
}

export function destroyExtensionEventBridge(): void {
  if (!initialized) return
  initialized = false
  window.removeEventListener('message', handleMessage)
}
