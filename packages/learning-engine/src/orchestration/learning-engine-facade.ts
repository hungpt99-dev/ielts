import type { CreateLearningSessionRequest, CreateLearningSessionResult, CompleteLearningSessionRequest, CompleteLearningSessionResult, ResumeLearningSessionResult, LearningSessionSummaryResult } from '../domain/entities/learning-session'
import type { GenerateLearningActivityRequest, GenerateLearningActivityResult } from '../domain/entities/learning-activity'
import type { SubmitLearningAnswerRequest, SubmitLearningAnswerResult } from '../domain/entities/learning-attempt'
import type { LearningRecommendationRequest, LearningRecommendationResult } from '../domain/entities/learning-recommendation'
import type { LearningOperationOptions, LearningOperationResult } from '../domain/results/learning-operation-result'

export interface LearningEngine {
  createSession(
    request: CreateLearningSessionRequest,
    options?: LearningOperationOptions,
  ): Promise<LearningOperationResult<CreateLearningSessionResult>>

  generateActivity(
    request: GenerateLearningActivityRequest,
    options?: LearningOperationOptions,
  ): Promise<LearningOperationResult<GenerateLearningActivityResult>>

  submitAnswer(
    request: SubmitLearningAnswerRequest,
    options?: LearningOperationOptions,
  ): Promise<LearningOperationResult<SubmitLearningAnswerResult>>

  completeSession(
    request: CompleteLearningSessionRequest,
    options?: LearningOperationOptions,
  ): Promise<LearningOperationResult<CompleteLearningSessionResult>>

  resumeSession(sessionId: string): Promise<LearningOperationResult<ResumeLearningSessionResult>>

  getRecommendedActivity(
    request: LearningRecommendationRequest,
  ): Promise<LearningOperationResult<LearningRecommendationResult>>

  getSessionSummary(sessionId: string): Promise<LearningOperationResult<LearningSessionSummaryResult>>
}
