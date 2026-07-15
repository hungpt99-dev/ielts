import type { CreateLearningSessionRequest, CreateLearningSessionResult, CompleteLearningSessionRequest, CompleteLearningSessionResult, ResumeLearningSessionResult, LearningSessionSummaryResult } from '../domain/entities/learning-session'
import type { GenerateLearningActivityRequest, GenerateLearningActivityResult } from '../domain/entities/learning-activity'
import type { StartAttemptRequest, SubmitLearningAnswerRequest, SubmitLearningAnswerResult, LearningAttempt } from '../domain/entities/learning-attempt'
import type { LearningRecommendationRequest, LearningRecommendationResult } from '../domain/entities/learning-recommendation'
import type { LearningOperationOptions, LearningOperationResult } from '../domain/results/learning-operation-result'
import type { RoadmapLearningTask } from '../ports/study-plan-port'
import type { LearningSourceContent } from '../domain/entities/learning-activity'
import type { Exercise } from '../domain/entities/exercise'

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

export interface EvaluateWritingRequest {
  question: string
  essay: string
}

export interface GenerateWritingPromptRequest {
  taskType: 'task1' | 'task2'
  topic: string
  difficulty: string
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

  startAttempt(
    request: StartAttemptRequest,
    options?: LearningOperationOptions,
  ): Promise<LearningOperationResult<{ attempt: LearningAttempt }>>

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

  getExercises(skill?: string): Promise<LearningOperationResult<{ exercises: Exercise[] }>>

  saveExercise(exercise: Exercise): Promise<LearningOperationResult<void>>

  deleteExercise(id: string): Promise<LearningOperationResult<void>>

  evaluateWriting(request: EvaluateWritingRequest): Promise<LearningOperationResult<{ feedback: any }>>

  generateWritingPrompt(request: GenerateWritingPromptRequest): Promise<LearningOperationResult<{ question: string }>>

  completeExercise(request: {
    skill: string
    topic: string
    questions: Array<{ id: string; question: string; correctAnswer: string | number | string[]; options?: string[]; explanation: string; type?: string; blanks?: string[] }>
    answers: Record<string, unknown>
    sessionId?: string
    attemptId?: string
    timeSpentMs?: number
  }): Promise<LearningOperationResult<{ totalQuestions: number; correctAnswers: number }>>
}
