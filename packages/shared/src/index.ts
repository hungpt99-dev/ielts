export type { IELTSSection } from './ielts-section'

export type {
  BandScore,
  ExerciseDifficulty,
  ExerciseDifficultyLevel,
  ProgressTrend,
  LocalDate,
  DayOfWeek,
  SkillBandScores,
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
