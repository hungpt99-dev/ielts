import type { SharedLearningEvent, SharedLearningEventType, SharedEventSource } from './learning-event'

export function createSharedEvent(
  type: SharedLearningEventType,
  source: SharedEventSource,
  extra: Partial<SharedLearningEvent> & { id?: string; correlationId?: string } = {},
): SharedLearningEvent {
  const event: SharedLearningEvent = {
    id: extra.id ?? crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type,
    occurredAt: new Date().toISOString(),
    source,
    schemaVersion: '1.0',
    ...extra,
  } as unknown as SharedLearningEvent
  return event
}
