import type { TutorEvent } from '../domain/events/tutor-event'
import type { LearningEvent } from '../domain/events/learning-event'

export interface TutorEventPublisher {
  publishTutorEvent(event: TutorEvent): void
  publishLearningEvent(event: LearningEvent): void
}
