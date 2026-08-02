export interface VocabularyEvent {
  id: string
  type: string
  occurredAt: Date
  payload: Record<string, unknown>
}

export type VocabularyEventHandler = (event: VocabularyEvent) => void

export interface EventBusPort {
  publish(event: VocabularyEvent): void
  subscribe(type: VocabularyEvent['type'], handler: VocabularyEventHandler): void
  unsubscribe(handler: VocabularyEventHandler): void
}
