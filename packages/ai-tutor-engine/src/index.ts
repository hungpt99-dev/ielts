// ═══════════════════════════════════════════════════════════════════════
// AI Tutor Engine — Single authoritative public API
// ═══════════════════════════════════════════════════════════════════════

// ── Engine Facade ─────────────────────────────────────────────────────
export { createAITutorEngine } from './application/create-engine'
export type { AITutorEngine, TutorRequestOptions, TutorOperationResult, ContextSuggestionRequest } from './application/ai-tutor-engine'
export type { AITutorEngineDependencies } from './application/create-engine'

// ── Application Use Cases ─────────────────────────────────────────────
export { sendTutorMessage } from './application/chat/send-tutor-message'
export type { SendTutorMessageDependencies } from './application/chat/send-tutor-message'
export { continueTutorSession } from './application/chat/continue-tutor-session'
export { summarizeChatSession } from './application/chat/summarize-chat-session'
export type { SessionSummary } from './application/chat/summarize-chat-session'

export { getNextBestAction } from './application/recommendations/get-next-best-action'
export { getDailyRecommendation } from './application/recommendations/get-daily-recommendation'
export { generateContextSuggestions } from './application/recommendations/generate-context-suggestions'
export type { ContextSuggestion } from './application/recommendations/generate-context-suggestions'

export { generateProgressReview } from './application/progress/generate-progress-review'
export type { GenerateProgressReviewDeps } from './application/progress/generate-progress-review'

export { updateTutorMemory, extractMemoryFromChat } from './application/memory/update-tutor-memory'

export { evaluateReminders } from './application/reminders/evaluate-reminders'
export type { ReminderEvaluationResult } from './application/reminders/evaluate-reminders'

export { explainRoadmapTask, recommendRoadmapAdjustment } from './application/roadmap'
export type { RoadmapTaskExplanation, RoadmapAdjustmentRecommendation } from './application/roadmap'

// ── Domain Entities ───────────────────────────────────────────────────
export type { LearnerProfile, LearnerProfileUpdate, IELTSExamType } from './domain/entities/learner-profile'
export type { LearnerStateSnapshot, SkillState, ExamContext, RoadmapContext, ProgressContext, MistakeSummary, VocabularySummary, ActivitySummary, TutorPreferences, TutorMode, TutorContextScope, TutorContextSource, TutorInteractionSource, TutorContextItem, ContextQuality, LearnerConstraint, ProactiveCategory, RoadmapTask } from './domain/entities/learner-context'
export type { TutorChatRequest, TutorChatResult, TutorChatMessage, TutorChatSession, TutorAction, TutorRecommendation, TutorTeachingStrategy, TutorPageContext, TutorMemoryCandidate } from './domain/entities/tutor-message'
export type { TutorMemory, UpdateTutorMemoryRequest, UpdateTutorMemoryResult, TutorWeakPointMemory, TutorMistakeMemory, TutorPreferenceMemory, TutorGoalMemory } from './domain/entities/tutor-memory'
export type { ProactiveMessage, ProactiveMessageSettings, ProactiveTriggerType, ProactiveInterventionCandidate, ProactiveEvaluationRequest, ProactiveEvaluationResult, ProactiveMessageAction } from './domain/entities/proactive-message'
export type { NextBestAction, NextBestActionRequest, NextBestActionResult, DailyRecommendation, TaskRecommendation, WeeklyRecommendation } from './domain/entities/tutor-recommendation'
export type { ProgressReviewRequest, ProgressReviewResult, LearnerProgressAnalysis, ProgressInsight, RepeatedMistake, ProgressRisk } from './domain/entities/progress-review'

// ── Value Objects ─────────────────────────────────────────────────────
export type { BandScore, IELTSSection, SkillBandScores, LocalDate, DayOfWeek, StudyDuration } from './domain/value-objects'
export { isValidBandScore, formatStudyDuration } from './domain/value-objects'

// ── Events ────────────────────────────────────────────────────────────
export type { LearningEvent, LearningEventType, LearningEventSource } from './domain/events/learning-event'
export type { TutorEvent, TutorEventType } from './domain/events/tutor-event'

// ── Policies ──────────────────────────────────────────────────────────
export { evaluateCooldown, updateCooldown } from './domain/policies/cooldown-policy'
export type { CooldownEntry, CooldownPolicyConfig } from './domain/policies/cooldown-policy'
export { isInQuietHours, getQuietHoursRemainingMs } from './domain/policies/quiet-hours-policy'
export type { QuietHoursConfig } from './domain/policies/quiet-hours-policy'
export { isDuplicate, filterDuplicates } from './domain/policies/duplicate-message-policy'
export { calculateInterventionScore, selectBestInterventions } from './domain/policies/recommendation-priority-policy'
export type { ScoringWeights } from './domain/policies/recommendation-priority-policy'

// ── Domain Services ───────────────────────────────────────────────────
export { analyzeSkillPriorities } from './domain/services/skill-priority-analyzer'
export type { SkillPriorityAnalysis, RankedSkill, SkillGap } from './domain/services/skill-priority-analyzer'
export { detectRecurringPatterns } from './domain/services/mistake-pattern-analyzer'
export type { MistakeAnalysisInput } from './domain/services/mistake-pattern-analyzer'
export { analyzeLearnerProgress } from './domain/services/progress-analyzer'

// ── Context System ────────────────────────────────────────────────────
export { LearnerContextBuilder, ContextSourceRegistry, selectContextForScope, evaluateFreshness, summarizeForPrompt, summarizeState, toSharedLearnerContext, CachedContextBuilder } from './context'
export type { LearnerContextDependencies, ContextSource, ContextSummary } from './context'

// ── Memory System ─────────────────────────────────────────────────────
export { TutorMemoryManager, MemoryDeduplicator, MemoryCompactor, MemoryExtractor } from './memory'

// ── Proactive System ──────────────────────────────────────────────────
export { TriggerRegistry, MessageGeneratorRegistry, ProactiveTutorOrchestrator, createDefaultGenerators, CachedProactiveEvaluator } from './proactive'
export type { TriggerHandler, MessageGenerator } from './proactive'

// ── AI Layer ──────────────────────────────────────────────────────────
export type { TutorAIClient, TutorAIRequest, TutorAIRequestOptions, TutorAIResult, TutorPrompt, TutorPromptBuilder } from './ai'
export { FallbackTutorAIClient, GeneralChatPromptBuilder, JsonSchemaParser, FallbackPolicy } from './ai'
export type { FallbackResult } from './ai'

// ── Ports (Repository Contracts) ──────────────────────────────────────
export type { LearnerProfileRepository } from './ports/learner-profile-repository'
export type { LearnerProgressRepository } from './ports/learner-progress-repository'
export type { TutorMessageRepository } from './ports/tutor-message-repository'
export type { TutorMemoryRepository } from './ports/tutor-memory-repository'
export type { TutorSettingsRepository } from './ports/tutor-settings-repository'
export type { RoadmapRepository } from './ports/roadmap-repository'
export type { MistakeRepository } from './ports/mistake-repository'
export type { VocabularyRepository } from './ports/vocabulary-repository'
export type { SavedContentRepository } from './ports/saved-content-repository'
export type { ReminderRepository, Reminder } from './ports/reminder-repository'
export type { TutorEventPublisher } from './ports/tutor-event-publisher'
export type { NotificationPort } from './ports/notification-port'
export type { ClockPort } from './ports/clock-port'
export { SystemClock } from './ports/clock-port'

// ── Errors ────────────────────────────────────────────────────────────
export type { TutorError, TutorErrorCode } from './domain/errors/tutor-error'
export { createTutorError } from './domain/errors/tutor-error'

// ── Results ───────────────────────────────────────────────────────────
export type { AITutorInitializationResult, TutorStateSnapshot } from './domain/results/tutor-result'

// ── Skill Modules ─────────────────────────────────────────────────────
export type { WritingTutorModule, WritingReviewRequest, WritingFeedbackResult, WritingTaskType, WritingExerciseRequest, WritingExamType } from './skill-modules/writing'
export type { SpeakingTutorModule, SpeakingReviewRequest, SpeakingFeedbackResult, SpeakingPart } from './skill-modules/speaking'
export type { ReadingTutorModule, ReadingExplanationRequest, ReadingExplanationResult } from './skill-modules/reading'
export type { ListeningTutorModule, ListeningExplanationRequest, ListeningExplanationResult } from './skill-modules/listening'
export type { VocabularyTutorModule, VocabularyExplanationRequest, VocabularyExplanationResult } from './skill-modules/vocabulary'
export type { GrammarTutorModule, GrammarExplanationRequest, GrammarExplanationResult } from './skill-modules/grammar'

// ── Prompt Builders ───────────────────────────────────────────────────
export { buildLearningProgressReviewPrompt } from './prompts/learningProgressReview'
export type { ProgressReviewData, SkillProgress, WeaknessReport, WeakSkill, VocabularyStatus, ReviewSummary, StudyConsistency, AIProgressReviewResponse } from './prompts/learningProgressReview'

// ── Backward Compatibility ────────────────────────────────────────────
// Legacy component kept for existing consumers
export { default as ChatPopup } from './components/ChatPopup'

// Legacy types kept for backward compatibility
export type {
  ProactiveMessage as LegacyProactiveMessage,
  ProactiveMessageSettings as LegacyProactiveMessageSettings,
  ChatMessage,
  ChatWidgetProps,
  ContextSuggestion as LegacyContextSuggestion,
  QuickAction,
} from './types'
