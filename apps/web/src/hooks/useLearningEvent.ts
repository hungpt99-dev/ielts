import { useEffect, useRef } from 'react'
import { emitLearningEvent } from '../features/learningEvents/LearningEventBus'
import type { LearningEventType, LearningEventSource, LearningEntityType, LearningEventPayload } from '../features/learningEvents/types'

interface UseLearningEventOptions {
  eventType: LearningEventType
  source: LearningEventSource
  payload: LearningEventPayload
  page?: string
  entityType?: LearningEntityType | null
  entityId?: string | null
  metadata?: Record<string, string>
  deps?: unknown[]
  enabled?: boolean
}

export function useLearningEvent(options: UseLearningEventOptions): void {
  const { eventType, source, payload, page, entityType, entityId, metadata, deps = [], enabled = true } = options
  const emittedRef = useRef(false)

  useEffect(() => {
    if (!enabled) return
    if (emittedRef.current) return
    emittedRef.current = true

    try {
      emitLearningEvent({
        eventType,
        source,
        payload,
        page: page ?? window.location.pathname,
        entityType: entityType ?? null,
        entityId: entityId ?? null,
        metadata: metadata ?? {},
      })
    } catch (error) {
      console.error('apps/web/src/hooks/useLearningEvent.ts error:', error);
      // Event emission failure must not block user action
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventType, source, enabled, ...deps])
}

export function usePageViewEvent(
  eventType: LearningEventType,
  entityType: LearningEntityType,
  payload: LearningEventPayload,
  options?: { page?: string; deps?: unknown[]; enabled?: boolean },
): void {
  useLearningEvent({
    eventType,
    source: 'website',
    payload,
    page: options?.page,
    entityType,
    deps: options?.deps,
    enabled: options?.enabled ?? true,
  })
}

export async function safeEmit(
  eventType: LearningEventType,
  source: LearningEventSource,
  payload: LearningEventPayload,
  options?: {
    page?: string
    entityType?: LearningEntityType | null
    entityId?: string | null
    metadata?: Record<string, string>
  },
): Promise<void> {
  try {
    await emitLearningEvent({
      eventType,
      source,
      payload,
      page: options?.page ?? window.location.pathname,
      entityType: options?.entityType ?? null,
      entityId: options?.entityId ?? null,
      metadata: options?.metadata ?? {},
    })
  } catch (error) {
    console.error('apps/web/src/hooks/useLearningEvent.ts error:', error);
    // Event emission failure must not block user action
  }
}
