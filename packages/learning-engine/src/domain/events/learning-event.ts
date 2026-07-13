export type LearningEventType =
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

export interface LearningEventBase {
  id: string
  type: LearningEventType
  occurredAt: string
  source: string
  sessionId?: string
  correlationId?: string
  schemaVersion: string
}

export interface LearningSessionCreatedEvent extends LearningEventBase {
  type: 'learning_session_created'
  sessionId: string
  skill: string
  objectiveId: string
  plannedDuration: number
}

export interface LearningSessionCompletedEvent extends LearningEventBase {
  type: 'learning_session_completed'
  sessionId: string
  skill: string
  actualDuration: number
  score: number
  maximumScore: number
  accuracy: number
  roadmapTaskId?: string
}

export interface ExerciseCompletedEvent extends LearningEventBase {
  type: 'exercise_completed'
  sessionId: string
  exerciseId: string
  skill: string
  score: number
  maximumScore: number
}

export interface MistakeDetectedEvent extends LearningEventBase {
  type: 'mistake_detected'
  mistakeId: string
  skill: string
  category: string
  recurrenceCount: number
}

export interface SkillImprovedEvent extends LearningEventBase {
  type: 'skill_improved'
  skill: string
  previousAccuracy: number
  currentAccuracy: number
}

export type LearningEvent =
  | LearningSessionCreatedEvent
  | LearningSessionStartedEvent
  | LearningSessionPausedEvent
  | LearningSessionCompletedEvent
  | LearningSessionAbandonedEvent
  | ExerciseGeneratedEvent
  | ExerciseCompletedEvent
  | AnswerEvaluatedEvent
  | MistakeDetectedEvent
  | MistakeRepeatedEvent
  | VocabularyMasteredEvent
  | VocabularyReviewDueEvent
  | SkillImprovedEvent
  | DifficultyChangedEvent
  | RoadmapTaskFulfilledEvent

export interface LearningSessionStartedEvent extends LearningEventBase {
  type: 'learning_session_started'
  sessionId: string
}

export interface LearningSessionPausedEvent extends LearningEventBase {
  type: 'learning_session_paused'
  sessionId: string
}

export interface LearningSessionAbandonedEvent extends LearningEventBase {
  type: 'learning_session_abandoned'
  sessionId: string
  reason?: string
}

export interface ExerciseGeneratedEvent extends LearningEventBase {
  type: 'exercise_generated'
  sessionId: string
  exerciseId: string
  skill: string
  sourceType: string
}

export interface AnswerEvaluatedEvent extends LearningEventBase {
  type: 'answer_evaluated'
  sessionId: string
  exerciseId: string
  questionId: string
  status: string
  score: number
}

export interface MistakeRepeatedEvent extends LearningEventBase {
  type: 'mistake_repeated'
  skill: string
  pattern: string
  recurrenceCount: number
}

export interface VocabularyMasteredEvent extends LearningEventBase {
  type: 'vocabulary_mastered'
  wordId: string
  word: string
}

export interface VocabularyReviewDueEvent extends LearningEventBase {
  type: 'vocabulary_review_due'
  wordIds: string[]
}

export interface DifficultyChangedEvent extends LearningEventBase {
  type: 'difficulty_changed'
  skill: string
  previousDifficulty: string
  newDifficulty: string
  reason: string
}

export interface RoadmapTaskFulfilledEvent extends LearningEventBase {
  type: 'roadmap_task_fulfilled'
  roadmapTaskId: string
  sessionId: string
  accuracy: number
}
