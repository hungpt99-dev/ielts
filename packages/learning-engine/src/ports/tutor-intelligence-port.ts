import type { LearningContext, BuildLearningContextRequest } from '../domain/entities/learning-context'
import type { LearningOperationOptions } from '../domain/results/learning-operation-result'

export interface TeachingStrategyDecision {
  strategy: string
  reason: string
}

export interface TeachingStrategyRequest {
  skill: string
  objectiveType: string
  recentAccuracy?: number
  repeatedMistakesCount: number
}

export interface EducationalContentRequest<TSchema> {
  systemPrompt: string
  userMessage: string
  schema: TSchema
  temperature?: number
  maxTokens?: number
}

export interface EducationalContentResult<T> {
  success: boolean
  data?: T
  error?: { code: string; message: string; recoverable: boolean }
}

export interface OpenResponseEvaluationRequest<TSchema> {
  response: string
  rubric: string[]
  schema: TSchema
}

export interface OpenResponseEvaluationResult<T> {
  success: boolean
  data?: T
  error?: { code: string; message: string; recoverable: boolean }
}

export interface FeedbackExplanationRequest {
  attemptId: string
  feedbackSummary: string
}

export interface FeedbackExplanationResult {
  explanation: string
  suggestions: string[]
}

export interface TutorLearningOutcome {
  sessionId: string
  skill: string
  score: number
  maximumScore: number
  accuracy: number
  mistakes: Array<{ category: string; text: string }>
  strengths: string[]
}

export interface RecordLearningOutcomeResult {
  success: boolean
}

export interface TutorIntelligencePort {
  getLearnerContext(request: BuildLearningContextRequest): Promise<LearningContext>

  selectTeachingStrategy(request: TeachingStrategyRequest): Promise<TeachingStrategyDecision>

  generateEducationalContent<T>(
    request: EducationalContentRequest<T>,
    options?: LearningOperationOptions,
  ): Promise<EducationalContentResult<T>>

  evaluateOpenResponse<T>(
    request: OpenResponseEvaluationRequest<T>,
    options?: LearningOperationOptions,
  ): Promise<OpenResponseEvaluationResult<T>>

  explainFeedback(request: FeedbackExplanationRequest): Promise<FeedbackExplanationResult>

  recordLearningOutcome(outcome: TutorLearningOutcome): Promise<RecordLearningOutcomeResult>
}
