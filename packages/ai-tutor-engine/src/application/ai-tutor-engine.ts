import type { TutorChatRequest, TutorChatResult } from '../domain/entities/tutor-message'
import type { ProactiveMessage } from '../domain/entities/proactive-message'
import type { ProgressReviewRequest, ProgressReviewResult } from '../domain/entities/progress-review'
import type { NextBestActionRequest, NextBestActionResult } from '../domain/entities/tutor-recommendation'
import type { LearningEvent } from '../domain/events/learning-event'
import type { UpdateTutorMemoryRequest, UpdateTutorMemoryResult } from '../domain/entities/tutor-memory'
import type { AITutorInitializationResult, TutorStateSnapshot } from '../domain/results/tutor-result'
import type { LearnerStateSnapshot } from '../domain/entities/learner-context'

export interface AITutorEngine {
  initialize(): Promise<AITutorInitializationResult>

  chat(
    request: TutorChatRequest,
    options?: TutorRequestOptions,
  ): Promise<TutorOperationResult<TutorChatResult>>

  getNextBestAction(
    request: NextBestActionRequest,
  ): Promise<TutorOperationResult<NextBestActionResult>>

  evaluateProactiveSupport(
    request: ProactiveEvaluationRequest,
  ): Promise<TutorOperationResult<ProactiveEvaluationResult>>

  generateProgressReview(
    request: ProgressReviewRequest,
  ): Promise<TutorOperationResult<ProgressReviewResult>>

  generateContextSuggestions(
    request: ContextSuggestionRequest,
  ): Promise<TutorOperationResult<ContextSuggestion[]>>

  handleLearningEvent(
    event: LearningEvent,
  ): Promise<TutorOperationResult<void>>

  updateMemory(
    request: UpdateTutorMemoryRequest,
  ): Promise<TutorOperationResult<UpdateTutorMemoryResult>>

  getTutorState(): Promise<TutorStateSnapshot>
}

export interface TutorRequestOptions {
  signal?: AbortSignal
  timeoutMs?: number
}

export interface TutorOperationResult<T> {
  status: 'success' | 'partial' | 'unavailable' | 'failure' | 'cancelled'
  data?: T
  error?: { code: string; message: string; recoverable: boolean }
  warnings?: Array<{ code: string; message: string }>
}

export interface ContextSuggestion {
  title: string
  message: string
  action?: string
  actionLabel: string
}

export interface ContextSuggestionRequest {
  learnerState: LearnerStateSnapshot
}

export interface ProactiveEvaluationRequest {
  triggerEvent?: string
  learnerState: LearnerStateSnapshot
  recentMessages: ProactiveMessage[]
}

export interface ProactiveEvaluationResult {
  candidates: Array<{
    triggerType: string
    category: string
    title: string
    message: string
    reason: string
  }>
  selected: ProactiveMessage[]
  throttled: number
  reason?: string
  nextAllowedTime?: string
}
