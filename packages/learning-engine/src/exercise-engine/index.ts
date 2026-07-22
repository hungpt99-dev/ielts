export { ExerciseEngine, type ExerciseEngineDependencies, type CreateExerciseRequest, type StartAttemptRequest as EngineStartAttemptRequest, type SaveResponseRequest, type SubmitAttemptRequest, type PauseAttemptRequest, type ResumeAttemptRequest, type EvaluateAttemptRequest } from './application'
export { generateWithRepair } from './application'

export {
  type ExerciseModule, EXERCISE_MODULES, isExerciseModule,
  type ExerciseMode, EXERCISE_MODES, isExerciseMode,
  type ExerciseFamily, EXERCISE_FAMILIES, isExerciseFamily,
  type IeltsVariant, IELTS_VARIANTS, isIeltsVariant,
  type ExerciseStatus, type ExerciseSource, type CefrLevel, type LearningObjective,
  type ExerciseDifficultyProfile, type QuestionDifficultyProfile,
  createDefaultDifficultyProfile, validateDifficultyProfile,
  type BaseQuestion, type AnswerEvidence,
  type MultipleChoiceQuestion, type MultipleSelectQuestion,
  type TrueFalseNotGivenQuestion, type YesNoNotGivenQuestion,
  type CompletionQuestion, type CompletionGap,
  type MatchingQuestion, type MatchingItem,
  type OrderingQuestion, type OrderingItem,
  type ShortAnswerQuestion, type ClassificationQuestion,
  type MapLabellingQuestion, type MapLabel, type MapPosition,
  type DiagramLabellingQuestion, type DiagramLabel,
  type ExerciseQuestion, type QuestionGroup,
  type ChoiceResponse, type MultiChoiceResponse, type TextResponse,
  type MatchingResponse, type OrderingResponse, type WritingResponse,
  type SpeakingResponse, type ClassificationResponse, type MapResponse,
  type LearnerResponse, type AnswerNormalizationPolicy,
  createDefaultNormalizationPolicy, normalizeAnswer,
  type BaseExercise, type ReadingPassage, type ReadingExercise,
  type ListeningPart, type ListeningExercise, type AudioSegment,
  type WritingTask, type WritingRubricCriterion, type WritingExercise,
  type SpeakingPart, type SpeakingExercise,
  type GrammarExerciseType, type GrammarItem, type GrammarExercise,
  type VocabularyExerciseType, type VocabularyTerm, type SpacedRepetitionMetadata, type VocabularyExercise,
  type SavedContentReference, type SavedContentExercise,
  type MistakeEvidence, type MistakeReviewExercise,
  type Exercise,
  type ExerciseAttemptStatus, type ExerciseAttempt,
  type ExerciseResult, type QuestionResult, type QuestionTypeResult,
  type ExerciseFeedback, type FeedbackItem, type ExerciseMistakeRecord,
  type PerformanceMetric, type LearningRecommendation,
  VALID_ATTEMPT_TRANSITIONS, isValidTransition,
} from './domain/types'

export {
  type ExerciseBlueprint, type ExerciseStructureRule, type ExerciseTimingRule,
  type ExerciseScoringRule, type ExerciseValidationRule,
  type ReadingBlueprint, type ListeningBlueprint, type WritingBlueprint,
  type SpeakingBlueprint, type GrammarBlueprint, type VocabularyBlueprint,
  type ReviewBlueprint, type ModuleExerciseBlueprint,
  freezeBlueprint,
  createFullListeningBlueprint, createListeningPartBlueprint,
  createFullReadingBlueprint, createReadingPassageBlueprint,
  createFullWritingBlueprint, createWritingTaskBlueprint,
  createFullSpeakingBlueprint,
  createFocusedGrammarBlueprint, createFocusedVocabularyBlueprint,
  createSavedContentBlueprint, createMistakeReviewBlueprint,
} from './domain/blueprints'

export {
  type ExerciseEngineErrorCode,
  ExerciseEngineError, InvalidExerciseBlueprintError,
  UnsupportedExerciseTypeError, IncompleteExerciseError,
  InvalidQuestionCountError, DuplicateExerciseItemIdError,
  InvalidAttemptStateTransitionError, IeltsInvariantViolatedError,
  GenerationRepairLimitExceededError,
} from './domain/errors'

export {
  type ValidationResult,
  validateExerciseBlueprint, validateExercise,
  validateExerciseAgainstBlueprint, validateAttempt,
  validateAttemptTransition, validateResponse,
} from './domain/validators'

export {
  type ExerciseEngineEventType, type ExerciseEngineEvent,
  type ExerciseEventPublisher,
  type ExerciseCreatedEvent, type ExerciseGeneratedEvent,
  type ExerciseStartedEvent, type ExercisePausedEvent,
  type ExerciseResumedEvent, type ExerciseSubmittedEvent,
  type ExerciseEvaluatedEvent, type ExerciseCompletedEvent,
  type ExerciseAbandonedEvent, type MistakeRecordedEvent,
  type LearningProgressUpdatedEvent,
} from './domain/events'

export {
  type ExerciseRepository, type ExerciseAttemptRepository,
  type ExerciseBlueprintRepository, type ExerciseGeneratorPort,
  type ExerciseEvaluatorPort, type ExerciseGenerationContext,
  type GenerationRepairResult,
} from './domain/ports'

export {
  type ExerciseScoringStrategy,
  scoreObjectiveQuestion, estimateBandFromRawScore,
} from './scoring/scoring-strategies'
export {
  ObjectiveScoringStrategy, ReadingScoringStrategy,
  ListeningScoringStrategy, WritingScoringStrategy,
  SpeakingScoringStrategy, GrammarScoringStrategy,
  VocabularyScoringStrategy, getScoringStrategy,
} from './scoring'

export { calculateTiming, type TimingEstimate, type TimingBreakdown } from './timing'

export {
  InMemoryExerciseRepository,
  InMemoryExerciseAttemptRepository,
  InMemoryExerciseBlueprintRepository,
} from './infrastructure/in-memory-repositories'

export {
  type IeltsTestVariant,
  type ReadingExerciseType,
  type ListeningExerciseType,
  type WritingExerciseType,
  type SpeakingExerciseType,
  type ExerciseCategory,
  type PassageEvidence,
  type CompletionWordLimit,
  type ListeningSource,
  type TranscriptSegment,
  type SpeakerDefinition,
  type AudioAssetReference,
  type TtsScript,
  type AccentProfile,
  type MapLabellingTask,
  type MapLandmark,
  type MapPath,
  type MapLabelTarget,
  type AcademicTask1Visual,
  type DataSeries,
  type ProcessStage,
  type MapState,
  type WritingAssessment,
  type CriterionAssessment,
  type Improvement,
  type SpeakingCueCard,
  type SpeakingAssessment,
  type PronunciationAssessment,
  type ExerciseQualityReport,
  type QualityIssue,
  type ExerciseCapability,
  type GeneratedActivityEnvelope,
  type IeltsDifficultyProfile,
  type IeltsTaskTypeId,
} from './domain/ielts'

export {
  type ListeningValidationResult,
  validateChronologicalOrder,
  validateWordLimit,
  detectAmbiguousAnswer,
  validateDistractors,
  validateTranscriptAuthenticity,
  countListeningWords,
  createDefaultListeningDifficulty,
} from './domain/ielts/listening-validators'

export {
  type ExerciseTypeDefinition,
  type ExerciseTypeRegistry,
  createDefaultExerciseRegistry,
} from './domain/ielts/task-registry'

export {
  buildReadingPassagePrompt,
  buildFullPassageSimulationPrompt,
  buildTrueFalseNotGivenPrompt,
  buildMultipleChoicePrompt,
  buildSentenceCompletionPrompt,
  buildMatchingHeadingsPrompt,
  buildListeningExercisePrompt,
  buildWritingTask1AcademicPrompt,
  buildWritingTask1GeneralPrompt,
  buildWritingTask2Prompt,
} from './application/prompt-builders-ielts'

export {
  buildSpeakingPart1Prompt,
  buildSpeakingPart2Prompt,
  buildSpeakingPart3Prompt,
  buildSpeakingFullTestPrompt,
} from './application/prompt-builders-speaking'

export {
  type SpeakingPhase,
  type SpeakingMode,
  type SpeakingState,
  type SpeakingResponse as SpeakingTurnResponse,
  SPEAKING_PHASE_ORDER,
  SPEAKING_PHASE_DURATIONS,
  createSpeakingState,
  canProvideHints,
  canProvideFeedback,
  canCorrectLearner,
  nextPhase,
  getPhaseDuration,
  isExamSimulation,
} from './domain/ielts/speaking-state-machine'

export {
  WRITING_RUBRIC_CRITERIA,
  type RubricCriterion,
  getCriteriaForTaskType,
  calculateWritingBand,
  calculateFullWritingBand,
  isOffTopic,
  checkWordCount,
  createDefaultCriterionAssessment,
  createDefaultWritingAssessment,
  DISCLAIMER_AI_SCORING as DISCLAIMER_AI_SCORING,
} from './domain/ielts/writing-assessment'

export {
  type MockTestConfig,
  type ReadingPassageAllocation,
  type ListeningPartAllocation,
  IELTS_MOCK_TEST_CONFIGS,
  allocateReadingQuestions,
  allocateListeningParts,
  MOCK_TEST_DISCLAIMER,
} from './domain/ielts/mock-test-composer'

export {
  type VariantRules,
  ACADEMIC_RULES,
  GENERAL_TRAINING_RULES,
  getVariantRules,
  isAcademicVariant,
} from './domain/ielts/variant-rules'

export {
  type ValidationResult as IeltsValidationResult,
  validateReadingPassage,
  validateReadingQuestion,
  validateTrueFalseNotGiven,
  validateYesNoNotGiven,
  repairReadingContent,
  validatePassageCoverage,
  validateDifficultyAlignment,
  validateCompletionParaphrasing,
  validateDistractorQuality,
  validateInferenceQuality,
  validateSkillVariety,
  assessReadingQualityExpanded,
  validateBuiltInReadingActivity,
} from './domain/ielts/validators'

export {
  type ReadingPassageProfile,
  type ParagraphFunction,
  type ReadingQuestionDifficulty,
  type ReadingQuestionPlan,
  type ReadingTaskGroupPlan,
  type ReadingQuestionSkill,
  type TfngEvidence,
  type CompletionValidation,
  type DistractorSource,
  type PassageCoverage,
  type ActivityContentSource,
  type ReadingExerciseQualityReport,
  type QualityConfig,
  DEFAULT_QUALITY_CONFIG,
} from './domain/ielts/ielts-types'

export {
  profileReadingPassage,
  estimateQuestionDifficulty,
} from './domain/ielts/passage-profiler'

export {
  createReadingQuestionPlan,
  estimateDirectRetrievalRatio,
  getPassageParagraphIds,
  selectTargetParagraphs,
} from './domain/ielts/question-planner'

export {
  auditReadingExercise,
  auditAllSeedExercises,
  type SeedAuditResult,
} from './domain/ielts/seed-data-validator'
