// ═══════════════════════════════════════════════════════════════════════
// @ielts/learning-engine — Single authoritative engine for
// study planning AND learning/exercise generation
// ═══════════════════════════════════════════════════════════════════════

// ── Learning Engine Facade (NEW) ─────────────────────────────────────
export { createLearningEngine } from './orchestration/create-engine'
export type { LearningEngine, LearningEngineDependencies } from './orchestration'
export type { AdaptDifficultyRequest, AdaptDifficultyResult, GenerateReviewRequest, GenerateReviewResult, CreateContentSessionRequest } from './orchestration/learning-engine-facade'

// ── Application Use Cases (NEW) ──────────────────────────────────────
export { createLearningSession } from './application/sessions/create-learning-session'
export { resumeLearningSession } from './application/sessions/resume-learning-session'
export { completeLearningSession } from './application/sessions/complete-learning-session'
export { generateLearningActivity } from './application/activities/generate-learning-activity'
export { startAttempt } from './application/attempts/start-attempt'
export { submitAnswer } from './application/attempts/submit-answer'
export { adaptDifficulty } from './application/adaptation/adapt-difficulty'
export { generateMistakeReview } from './application/review/generate-mistake-review'

// ── Domain Entities (NEW) ────────────────────────────────────────────
export type {
  LearningSession, LearningSessionStatus, LearningSessionSource, LearningMode,
  CreateLearningSessionRequest, CreateLearningSessionResult,
  CompleteLearningSessionRequest, CompleteLearningSessionResult,
  ResumeLearningSessionResult, LearningSessionSummaryResult,
} from './domain/entities/learning-session'
export type {
  LearningObjective, LearningObjectiveType, LearningObjectiveSource,
  TaskPriority, LearningSuccessCriterion,
} from './domain/entities/learning-objective'
export type {
  LearningActivity, ActivityType, GenerateLearningActivityRequest,
  GenerateLearningActivityResult, LearningSourceContent,
} from './domain/entities/learning-activity'
export type {
  Exercise, ExerciseType, ExerciseSourceType, ExplanationPolicy,
  EvaluationPolicy, LearningContentPayload, ExerciseTemplate, ExerciseTemplateInput,
  GenerateExerciseRequest,
} from './domain/entities/exercise'
export type {
  ExerciseQuestion, ExerciseQuestionType,
  MultipleChoiceQuestion, GapFillQuestion, TrueFalseNotGivenQuestion,
  ShortAnswerQuestion, MatchingQuestion, ErrorCorrectionQuestion,
  EssayQuestion, SpeakingResponseQuestion,
} from './domain/entities/exercise-question'
export type {
  LearningAttempt, LearningAttemptStatus, LearningAnswer,
  StartAttemptRequest, SubmitLearningAnswerRequest, SubmitLearningAnswerResult,
} from './domain/entities/learning-attempt'
export type {
  AnswerEvaluation, EvaluationStatus, EvaluationMethod,
  RubricScore, WritingEvaluation, SpeakingEvaluation,
} from './domain/entities/evaluation'
export type { MistakeEvidence, MistakeSeverity, MistakeReviewStatus } from './domain/entities/mistake-evidence'
export type { SkillEvidence, SkillEvidenceType, SkillProgress } from './domain/entities/skill-evidence'
export type { LearningOutcome, VocabularyEvidence } from './domain/entities/learning-outcome'
export type { LearningRecommendation, RecommendationAction, LearningRecommendationRequest, LearningRecommendationResult } from './domain/entities/learning-recommendation'
export type { LearningLesson, LearningExample } from './domain/entities/learning-lesson'
export type { LearningContext, LearningContextScope, LearningContextQuality, BuildLearningContextRequest } from './domain/entities/learning-context'

// ── Policies (NEW) ───────────────────────────────────────────────────
export { determineDifficulty, gradeAnswer, planActivities, estimateQuestionCount, selectEvaluationMethod, isDeterministicallyGradable } from './domain/policies'
export type { DifficultyDecision, DifficultyInput, ActivityPlan } from './domain/policies'

// ── Events (NEW) ─────────────────────────────────────────────────────
export type { LearningEvent, LearningEventType } from './domain/events/learning-event'

// ── Value Objects (NEW) ──────────────────────────────────────────────
export type { BandScore, IELTSSection, SkillBandScores, LocalDate, ExerciseDifficulty, ExerciseScore } from './domain/value-objects'
export type { OfficialIeltsBand, InternalProficiencyScore, IeltsSkill, SkillBandProfile, IeltsLevelEstimate } from './domain/value-objects'
export { calculateAccuracy, isOfficialIeltsBand, toNearestOfficialBand, roundToOfficialBand, toDisplayBand, normalizeInternalScore, validateOfficialBand, bandGap, OFFICIAL_IELTS_BANDS } from './domain/value-objects'

// ── Ports (NEW) ──────────────────────────────────────────────────────
export type { LearnerContextPort } from './ports/learner-context-port'
export type { TutorIntelligencePort, TeachingStrategyDecision, EducationalContentRequest, EducationalContentResult } from './ports/tutor-intelligence-port'
export type { RoadmapLearningTask, StudyPlanPort } from './ports/study-plan-port'
export type { LearningSessionRepository, ExerciseRepository, LearningAttemptRepository, LearningOutcomeRepository } from './ports/session-repository'
export type { ProgressRepository } from './ports/progress-repository'
export type { MistakeRepository } from './ports/mistake-repository'
export type { VocabularyRepository, VocabularyEntry } from './ports/vocabulary-repository'
export type { LearningEventPublisher } from './ports/learning-event-publisher'
export type { ClockPort } from './ports/clock-port'

// ── Results (NEW) ────────────────────────────────────────────────────
export type { LearningOperationResult, LearningOperationMetadata, LearningOperationOptions, LearningWarning } from './domain/results/learning-operation-result'

// ── Study Plan Engine (EXISTING — preserved) ─────────────────────────
export { DailyPlanEngine } from './daily-plan/DailyPlanEngine';
export type { DailyPlanEngineConfig } from './daily-plan/DailyPlanEngine';
export { AiPlanOrchestrator } from './daily-plan/AiPlanOrchestrator';
export type {
  AICallFn,
  AiPlanOrchestratorConfig,
  EnrichPlanParams,
  EnrichPlanResult,
  ExplainabilityContext,
} from './daily-plan/AiPlanOrchestrator';
export { PlanRegenerator } from './daily-plan/PlanRegenerator';
export type { RegeneratePlanParams, PlanRegeneratorConfig } from './daily-plan/PlanRegenerator';
export { applyTaskEnrichments, buildTaskEnrichmentRequirements } from './daily-plan/enrichment/applyTaskEnrichments';
export { isGenericTitle, isValidTaskCandidate, calculateAffordableCandidateCount, selectRequirementsForAi, buildTaskGenerationBatches, validateBatchResponse, compareRequirementPriority } from './daily-plan/enrichment/selectRequirementsForAi';
export {
  mergeProfileSources,
  mapScheduleToStudyDays,
  createWeeklyAvailability,
  validateCriticalFields,
  normalizeProfile,
  buildUserProfile,
  buildNormalizedProfile,
  PlanEngineIntegration,
} from './daily-plan/PlanEngineIntegration';
export type { SettingsSource, PersonalizationSource, BuildProfileParams } from './daily-plan/PlanEngineIntegration';
export type * from './daily-plan/types';

// ── Skill Modules (NEW — implemented) ─────────────────────────────────
export { SkillRegistry, WritingSkillModule, SpeakingSkillModule, ReadingSkillModule, ListeningSkillModule, VocabularySkillModule, GrammarSkillModule, createDefaultSkillRegistry } from './skills'
export type { LearningSkillModule, SkillActivityGenerationRequest, SkillActivityGenerationResult, SkillEvaluationRequest, SkillEvaluationResult, SkillReviewRequest, SkillReviewResult } from './skills'

// ── Domain Services (NEW — implemented) ───────────────────────────────
export { analyzeObjective, selectExerciseConfig, buildProgressEvidence, aggregateSkillProgress, buildMistakeEvidence, detectRecurrencePattern, buildSkillEvidence, aggregateSkillEvidence, getWeakestSkills } from './domain/services'
export type { ObjectiveAnalysisInput, ExerciseSelectionInput, SelectedExerciseConfig, BuildProgressEvidenceInput, BuildMistakeEvidenceInput } from './domain/services'

// ── Content System (NEW — implemented) ────────────────────────────────
export { ContentSourceRegistry, ArticleContentAdapter, YouTubeTranscriptAdapter, SavedVocabularyAdapter, normalizeContent, estimateTokens, selectRelevantSegment } from './content'
export type { ContentAdapter, ContentSourceType, ContentValidationResult } from './content'

// ── Infrastructure Adapters (NEW — implemented) ───────────────────────
export { InMemoryLearnerContextAdapter } from './infrastructure/adapters'
export { OfflineTutorIntelligenceAdapter } from './infrastructure/ai'
export { InMemoryCache, CachedActivityGenerator } from './infrastructure/cache'
export type { CacheEntry } from './infrastructure/cache'
export { MigrationRunner } from './infrastructure/migrations'
export type { Migration, MigrationRecord } from './infrastructure/migrations'
export { InMemorySessionRepository, InMemoryExerciseRepository, InMemoryAttemptRepository, InMemoryOutcomeRepository } from './infrastructure/persistence'
