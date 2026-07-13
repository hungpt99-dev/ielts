import type { CreateLearningSessionRequest, CreateLearningSessionResult, CompleteLearningSessionRequest, CompleteLearningSessionResult, ResumeLearningSessionResult, LearningSessionSummaryResult } from '../domain/entities/learning-session'
import type { GenerateLearningActivityRequest, GenerateLearningActivityResult } from '../domain/entities/learning-activity'
import type { SubmitLearningAnswerRequest, SubmitLearningAnswerResult } from '../domain/entities/learning-attempt'
import type { LearningRecommendationRequest, LearningRecommendationResult } from '../domain/entities/learning-recommendation'
import type { LearningOperationOptions, LearningOperationResult } from '../domain/results/learning-operation-result'
import type { RoadmapLearningTask } from '../ports/study-plan-port'
import type { LearningSourceContent } from '../domain/entities/learning-activity'

export interface AdaptDifficultyRequest {
  skill: string
  currentBand?: number
  targetBand?: number
  recentAccuracy?: number
  consecutiveCorrect: number
  consecutiveMistakes: number
  totalAttempts: number
}

export interface AdaptDifficultyResult {
  level: string
  reasons: string[]
  confidence: number
}

export interface GenerateReviewRequest {
  skill?: string
  count?: number
}

export interface GenerateReviewResult {
  exercise: import('../domain/entities/exercise').Exercise
}

export interface CreateContentSessionRequest {
  content: LearningSourceContent
  skill: string
  availableMinutes: number
}

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

  createSessionFromRoadmapTask(
    task: RoadmapLearningTask,
    options?: LearningOperationOptions,
  ): Promise<LearningOperationResult<CreateLearningSessionResult>>

  createSessionFromContent(
    request: CreateContentSessionRequest,
    options?: LearningOperationOptions,
  ): Promise<LearningOperationResult<CreateLearningSessionResult>>

  adaptDifficulty(
    request: AdaptDifficultyRequest,
  ): Promise<LearningOperationResult<AdaptDifficultyResult>>

  generateReview(
    request: GenerateReviewRequest,
    options?: LearningOperationOptions,
  ): Promise<LearningOperationResult<GenerateReviewResult>>

  getSessionSummary(sessionId: string): Promise<LearningOperationResult<LearningSessionSummaryResult>>
}
