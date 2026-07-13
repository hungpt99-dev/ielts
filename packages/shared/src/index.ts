export type { IELTSSection } from './ielts-section'

export type {
  BandScore,
  ExerciseDifficulty,
  ExerciseDifficultyLevel,
  ProgressTrend,
  LocalDate,
  DayOfWeek,
  SkillBandScores,
  VerbConjugation,
} from './value-objects'

export type {
  ExerciseQuestion,
  ExerciseQuestionType,
  MultipleChoiceQuestion,
  GapFillQuestion,
  TrueFalseNotGivenQuestion,
  ShortAnswerQuestion,
  MatchingQuestion,
  ErrorCorrectionQuestion,
  EssayQuestion,
  SpeakingResponseQuestion,
} from './exercise-question'

export type {
  OperationResult,
  OperationResultStatus,
  OperationError,
  OperationWarning,
  OperationMetadata,
} from './operation-result'

export type {
  LearnerContext,
} from './learner-context'

export type {
  MistakeEvidence,
  MistakeSeverity,
  MistakeReviewStatus,
  SkillEvidence,
  SkillEvidenceType,
  SkillProgress,
  VocabularyEvidence,
} from './mistake-evidence'

export type {
  LearningOutcome,
} from './learning-outcome'

export type {
  SharedLearningEvent,
  SharedLearningEventType,
  SharedEventSource,
} from './learning-event'

export { createSharedEvent } from './mappers'

export {
  mapLegacyMistakeToEvidence,
  mapLegacySessionToOutcome,
  mapLegacyResultToEvaluation,
} from './mappers/legacy-to-canonical'

export type {
  ProactiveMessageTriggerType,
  ProactiveMessageCategory,
  ProactiveMessagePriority,
  ProactiveMessageAction,
  ProactiveMessage,
  ProactiveMessageSettings,
} from './proactive-schemas'

export {
  proactiveMessageTriggerTypeSchema,
  proactiveMessageCategorySchema,
  proactiveMessagePrioritySchema,
  proactiveMessageActionSchema,
  proactiveMessageSchema,
  proactiveMessageSettingsSchema,
} from './proactive-schemas'

// ── Evaluation Types (cross-engine contract) ─────────────────────────
export type {
  EvaluationStatus,
  EvaluationMethod,
  AnswerEvaluation,
  RubricScore,
  WritingEvaluation,
  SpeakingEvaluation,
} from './evaluation-types'

// ── Attempt Types (cross-engine contract) ────────────────────────────
export type {
  LearningAttemptStatus,
  LearningAnswer,
  LearningAttempt,
  SubmitLearningAnswerRequest,
  SubmitLearningAnswerResult,
} from './attempt-types'

// ── Feedback Types (cross-engine contract) ───────────────────────────
export type {
  LearningFeedback,
  FeedbackExplanationRequest,
  FeedbackExplanationResult,
} from './feedback-types'

// ── Validation Schemas ───────────────────────────────────────────────
export {
  ieltsSectionSchema,
  mistakeSeveritySchema,
  mistakeEvidenceSchema,
  skillEvidenceSchema,
  vocabularyEvidenceSchema,
  learningOutcomeSchema,
  evaluationStatusSchema,
  evaluationMethodSchema,
  learningAttemptStatusSchema,
  exerciseDifficultySchema,
  progressTrendSchema,
  skillEvidenceTypeSchema,
  mistakeReviewStatusSchema,
} from './validation'
