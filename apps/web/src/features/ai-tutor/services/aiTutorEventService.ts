import type { AITutorEventType } from '../types/aiTutor.types'

interface AITutorEvent {
  eventType: AITutorEventType
  targetBand?: string
  todayFocus?: string
  skill?: string
  metadata?: Record<string, unknown>
}

export function emitAITutorEvent(_event: AITutorEvent): void {
  if (import.meta.env.DEV) {
    console.debug('[AI Tutor Event]', _event.eventType, _event)
  }
}
