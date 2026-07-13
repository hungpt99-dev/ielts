export type LearningEventType =
  | 'task_started'
  | 'task_completed'
  | 'task_missed'
  | 'task_rescheduled'
  | 'exercise_completed'
  | 'writing_reviewed'
  | 'speaking_session_completed'
  | 'mistake_recorded'
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

export type LearningEventSource =
  | 'web-app'
  | 'extension'
  | 'ai-tutor'
  | 'roadmap'
  | 'vocabulary'
  | 'mistakes'
  | 'dashboard'

export interface LearningEventBase {
  id: string
  type: LearningEventType
  occurredAt: string
  source: LearningEventSource
  entityId?: string
  correlationId?: string
  schemaVersion: string
}

export interface TaskStartedEvent extends LearningEventBase {
  type: 'task_started'
  taskId: string
  taskTitle: string
  skill: string
}

export interface TaskCompletedEvent extends LearningEventBase {
  type: 'task_completed'
  taskId: string
  taskTitle: string
  skill: string
  durationMinutes: number
}

export interface TaskMissedEvent extends LearningEventBase {
  type: 'task_missed'
  taskId: string
  taskTitle: string
  skill: string
}

export interface ExerciseCompletedEvent extends LearningEventBase {
  type: 'exercise_completed'
  exerciseId: string
  skill: string
  score: number
  total: number
  accuracy: number
}

export interface MistakeRecordedEvent extends LearningEventBase {
  type: 'mistake_recorded'
  mistakeId: string
  skill: string
  category: string
  text: string
}

export interface VocabularySavedEvent extends LearningEventBase {
  type: 'vocabulary_saved'
  wordId: string
  word: string
  topic?: string
}

export interface VocabularyReviewedEvent extends LearningEventBase {
  type: 'vocabulary_reviewed'
  wordId: string
  word: string
  correct: boolean
}

export interface ContentSavedEvent extends LearningEventBase {
  type: 'content_saved'
  contentId: string
  contentType: 'article' | 'video' | 'text'
  topic?: string
}

export interface TutorRecommendationAcceptedEvent extends LearningEventBase {
  type: 'tutor_recommendation_accepted'
  recommendationId: string
  recommendationType: string
}

export interface UserReturnedEvent extends LearningEventBase {
  type: 'user_returned'
  inactiveDays: number
}

export type LearningEvent =
  | TaskStartedEvent
  | TaskCompletedEvent
  | TaskMissedEvent
  | TaskRescheduledEvent
  | ExerciseCompletedEvent
  | WritingReviewedEvent
  | SpeakingSessionCompletedEvent
  | MistakeRecordedEvent
  | VocabularySavedEvent
  | VocabularyReviewedEvent
  | ContentSavedEvent
  | RoadmapGeneratedEvent
  | RoadmapUpdatedEvent
  | ProgressMilestoneEvent
  | TutorMessageSentEvent
  | TutorRecommendationAcceptedEvent
  | TutorRecommendationDismissedEvent
  | UserReturnedEvent

export interface TaskRescheduledEvent extends LearningEventBase {
  type: 'task_rescheduled'
  taskId: string
  oldDate: string
  newDate: string
}

export interface WritingReviewedEvent extends LearningEventBase {
  type: 'writing_reviewed'
  draftId: string
  estimatedBand: number
  mistakes: Array<{ category: string; text: string }>
}

export interface SpeakingSessionCompletedEvent extends LearningEventBase {
  type: 'speaking_session_completed'
  sessionId: string
  estimatedBand?: number
  weaknesses: string[]
}

export interface RoadmapGeneratedEvent extends LearningEventBase {
  type: 'roadmap_generated'
  totalWeeks: number
  targetBand: number
}

export interface RoadmapUpdatedEvent extends LearningEventBase {
  type: 'roadmap_updated'
  changeType: string
}

export interface ProgressMilestoneEvent extends LearningEventBase {
  type: 'progress_milestone'
  milestoneType: string
  value: number
}

export interface TutorMessageSentEvent extends LearningEventBase {
  type: 'tutor_message_sent'
  sessionId: string
  mode: string
}

export interface TutorRecommendationDismissedEvent extends LearningEventBase {
  type: 'tutor_recommendation_dismissed'
  recommendationId: string
}
