// ═══════════════════════════════════════════════════════════════════════
// @ielts/learning-engine — Single authoritative engine for
// study planning AND learning/exercise generation
// ═══════════════════════════════════════════════════════════════════════

// ── Learning Engine Facade (NEW) ─────────────────────────────────────
export { createLearningEngine } from './orchestration/create-engine'
export type { LearningEngine, LearningEngineDependencies } from './orchestration'

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
export { calculateAccuracy } from './domain/value-objects'

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
