export type {
  ISOString,
  ExerciseSkill,
  ExerciseSource,
  ExerciseDifficulty,
  QuestionType,
  ExerciseStatus,
  AttemptStatus,
  ReviewRating,
  MatchingPair,
  FillInBlank,
} from './types'

export type {
  AnswerExplanation,
  ExerciseQuestion,
  Exercise,
  ExerciseAttemptAnswer,
  ExerciseAttempt,
  ExerciseResult,
  ExerciseReviewRecord,
} from './models'

export {
  exerciseSchema,
  exerciseQuestionSchema,
  exerciseAttemptSchema,
  exerciseResultSchema,
  exerciseReviewRecordSchema,
  answerExplanationSchema,
  exerciseSkillSchema,
  exerciseSourceSchema,
  exerciseDifficultySchema,
  questionTypeSchema,
} from './schemas'

export {
  MultipleChoiceScoring,
  GapFillScoring,
  TrueFalseScoring,
  ErrorCorrectionScoring,
  MatchingScoring,
  ShortAnswerScoring,
  RewriteScoring,
  ScoringEngine,
  DEFAULT_SCORING_STRATEGIES,
  createDefaultScoringEngine,
} from './scoringStrategies'
export type {
  ScoreResult,
  ScoringStrategy,
} from './scoringStrategies'

export {
  BuiltInGenerationStrategy,
  AiGenerationStrategy,
  WebContentGenerationStrategy,
  MistakeReviewGenerationStrategy,
  VocabularyPracticeGenerationStrategy,
  GenerationEngine,
  createDefaultGenerationEngine,
} from './generationStrategies'
export type {
  GenerationParams,
  GenerationResult,
  GenerationStrategy,
  MistakeData,
  VocabData,
  GenerateExerciseFn,
} from './generationStrategies'

export {
  SpacedRepetitionScheduler,
  ReviewEligibilityChecker,
  DefaultSchedulerStrategy,
  AdaptiveSchedulerStrategy,
  ReviewScheduler,
  createDefaultReviewScheduler,
  createAdaptiveReviewScheduler,
} from './reviewScheduler'
export type {
  ReviewScheduleConfig,
  SpacedRepetitionInput,
  SpacedRepetitionOutput,
  SchedulerStrategy,
  ExerciseReviewEligibility,
} from './reviewScheduler'

export {
  ProgressiveDifficultyStrategy,
  ConservativeDifficultyStrategy,
  AggressiveDifficultyStrategy,
  DifficultyAdjuster,
  createDefaultDifficultyAdjuster,
} from './difficulty'
export type {
  DifficultyAdjustmentParams,
  DifficultyAdjustmentResult,
  DifficultyAdjustmentStrategy,
} from './difficulty'
