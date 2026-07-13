import type { LearningEvent } from '../domain/events/learning-event'

export interface LearningEventPublisher {
  publish(event: LearningEvent): void
  publishMany(events: LearningEvent[]): void
}
