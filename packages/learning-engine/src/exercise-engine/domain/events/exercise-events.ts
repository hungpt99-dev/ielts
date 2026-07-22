import type { ExerciseModule } from '../types/exercise-module'
import type { ExerciseMode } from '../types/exercise-mode'
import type { ExerciseResult } from '../types/attempt'

export type ExerciseEngineEventType =
  | 'exercise_created'
  | 'exercise_generated'
  | 'exercise_started'
  | 'exercise_paused'
  | 'exercise_resumed'
  | 'exercise_submitted'
  | 'exercise_evaluated'
  | 'exercise_completed'
  | 'exercise_abandoned'
  | 'mistake_recorded'
  | 'learning_progress_updated'

export interface ExerciseEngineEventBase {
  id: string
  type: ExerciseEngineEventType
  occurredAt: string
  exerciseId?: string
  attemptId?: string
  blueprintVersion?: string
  generationRequestId?: string
}

export interface ExerciseCreatedEvent extends ExerciseEngineEventBase {
  type: 'exercise_created'
  exerciseId: string
  module: ExerciseModule
  mode: ExerciseMode
}

export interface ExerciseGeneratedEvent extends ExerciseEngineEventBase {
  type: 'exercise_generated'
  exerciseId: string
  blueprintId: string
  module: ExerciseModule
  aiUsed: boolean
}

export interface ExerciseStartedEvent extends ExerciseEngineEventBase {
  type: 'exercise_started'
  exerciseId: string
  attemptId: string
}

export interface ExercisePausedEvent extends ExerciseEngineEventBase {
  type: 'exercise_paused'
  exerciseId: string
  attemptId: string
  elapsedSeconds: number
}

export interface ExerciseResumedEvent extends ExerciseEngineEventBase {
  type: 'exercise_resumed'
  exerciseId: string
  attemptId: string
}

export interface ExerciseSubmittedEvent extends ExerciseEngineEventBase {
  type: 'exercise_submitted'
  exerciseId: string
  attemptId: string
  responseCount: number
}

export interface ExerciseEvaluatedEvent extends ExerciseEngineEventBase {
  type: 'exercise_evaluated'
  exerciseId: string
  attemptId: string
  result: ExerciseResult
}

export interface ExerciseCompletedEvent extends ExerciseEngineEventBase {
  type: 'exercise_completed'
  exerciseId: string
  attemptId: string
  result: ExerciseResult
}

export interface ExerciseAbandonedEvent extends ExerciseEngineEventBase {
  type: 'exercise_abandoned'
  exerciseId: string
  attemptId: string
  reason?: string
}

export interface MistakeRecordedEvent extends ExerciseEngineEventBase {
  type: 'mistake_recorded'
  exerciseId: string
  attemptId: string
  mistakeId: string
  module: ExerciseModule
  errorType: string
}

export interface LearningProgressUpdatedEvent extends ExerciseEngineEventBase {
  type: 'learning_progress_updated'
  module: ExerciseModule
  accuracy: number
  attemptCount: number
}

export type ExerciseEngineEvent =
  | ExerciseCreatedEvent
  | ExerciseGeneratedEvent
  | ExerciseStartedEvent
  | ExercisePausedEvent
  | ExerciseResumedEvent
  | ExerciseSubmittedEvent
  | ExerciseEvaluatedEvent
  | ExerciseCompletedEvent
  | ExerciseAbandonedEvent
  | MistakeRecordedEvent
  | LearningProgressUpdatedEvent

export interface ExerciseEventPublisher {
  publish(event: ExerciseEngineEvent): Promise<void>
}
