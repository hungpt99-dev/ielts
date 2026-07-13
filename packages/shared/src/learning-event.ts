import type { IELTSSection } from './ielts-section'

export type SharedEventSource = 'web-app' | 'extension' | 'ai-tutor' | 'roadmap' | 'vocabulary' | 'mistakes' | 'dashboard' | 'learning-engine' | 'study-plan'

export type SharedLearningEventType =
  | 'learning_session_created'
  | 'learning_session_started'
  | 'learning_session_paused'
  | 'learning_session_completed'
  | 'learning_session_abandoned'
  | 'exercise_generated'
  | 'exercise_completed'
  | 'answer_evaluated'
  | 'mistake_detected'
  | 'mistake_repeated'
  | 'vocabulary_mastered'
  | 'vocabulary_review_due'
  | 'skill_improved'
  | 'difficulty_changed'
  | 'roadmap_task_fulfilled'
  | 'task_started'
  | 'task_completed'
  | 'task_missed'
  | 'task_rescheduled'
  | 'writing_reviewed'
  | 'speaking_session_completed'
  | 'vocabulary_saved'
  | 'vocabulary_reviewed'
  | 'content_saved'
  | 'roadmap_generated'
  | 'roadmap_updated'
  | 'progress_milestone'
  | 'tutor_message_sent'
  | 'tutor_recommendation_accepted'
  | 'tutor_recommendation_dismissed'
  | 'user_returned'

export interface SharedLearningEventBase {
  id: string
  type: SharedLearningEventType
  occurredAt: string
  source: SharedEventSource
  entityId?: string
  correlationId?: string
  schemaVersion: string
}

export interface SessionEvent extends SharedLearningEventBase {
  type: 'learning_session_created' | 'learning_session_started' | 'learning_session_paused' | 'learning_session_completed' | 'learning_session_abandoned'
  sessionId: string
  skill?: IELTSSection
}

export interface ExerciseEvent extends SharedLearningEventBase {
  type: 'exercise_generated' | 'exercise_completed'
  sessionId: string
  exerciseId: string
  skill: IELTSSection
  score?: number
  maximumScore?: number
}

export interface MistakeEvent extends SharedLearningEventBase {
  type: 'mistake_detected' | 'mistake_repeated'
  mistakeId: string
  skill: IELTSSection
  category: string
  recurrenceCount?: number
}

export interface TaskEvent extends SharedLearningEventBase {
  type: 'task_started' | 'task_completed' | 'task_missed' | 'task_rescheduled'
  taskId: string
  skill: IELTSSection
  durationMinutes?: number
}

export interface VocabularyEvent extends SharedLearningEventBase {
  type: 'vocabulary_mastered' | 'vocabulary_review_due' | 'vocabulary_saved' | 'vocabulary_reviewed'
  wordId: string
  word: string
  correct?: boolean
}

export type SharedLearningEvent =
  | SessionEvent
  | ExerciseEvent
  | MistakeEvent
  | TaskEvent
  | VocabularyEvent
  | (SharedLearningEventBase & { type: 'answer_evaluated'; sessionId: string; exerciseId: string; questionId: string; status: string; score: number })
  | (SharedLearningEventBase & { type: 'skill_improved'; skill: IELTSSection; previousAccuracy: number; currentAccuracy: number })
  | (SharedLearningEventBase & { type: 'difficulty_changed'; skill: IELTSSection; previousDifficulty: string; newDifficulty: string; reason: string })
  | (SharedLearningEventBase & { type: 'roadmap_task_fulfilled'; roadmapTaskId: string; sessionId: string; accuracy: number })
  | (SharedLearningEventBase & { type: 'writing_reviewed'; draftId: string; estimatedBand?: number })
  | (SharedLearningEventBase & { type: 'speaking_session_completed'; sessionId: string; estimatedBand?: number })
  | (SharedLearningEventBase & { type: 'content_saved'; contentId: string; contentType: string })
  | (SharedLearningEventBase & { type: 'roadmap_generated' | 'roadmap_updated' })
  | (SharedLearningEventBase & { type: 'progress_milestone'; milestoneType: string; value: number })
  | (SharedLearningEventBase & { type: 'tutor_message_sent'; sessionId: string; mode: string })
  | (SharedLearningEventBase & { type: 'tutor_recommendation_accepted' | 'tutor_recommendation_dismissed'; recommendationId: string })
  | (SharedLearningEventBase & { type: 'user_returned'; inactiveDays: number })
