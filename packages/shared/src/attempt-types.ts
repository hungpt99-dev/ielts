import type { AnswerEvaluation } from './evaluation-types'

export type LearningAttemptStatus = 'not-started' | 'in-progress' | 'submitted' | 'evaluated' | 'completed' | 'abandoned'

export interface LearningAnswer {
  questionId: string
  answer: unknown
  answeredAt: string
  timeSpentMs: number
  isFinal: boolean
}

export interface LearningAttempt {
  id: string
  sessionId: string
  exerciseId: string
  status: LearningAttemptStatus
  answers: LearningAnswer[]
  startedAt: string
  submittedAt?: string
  evaluatedAt?: string
  timeSpentMs: number
  hintsUsed: number
  version: number
  evaluations?: AnswerEvaluation[]
}

export interface SubmitLearningAnswerRequest {
  sessionId: string
  attemptId: string
  answers: LearningAnswer[]
  correlationId: string
}

export interface SubmitLearningAnswerResult {
  attempt: LearningAttempt
  evaluation: AnswerEvaluation[]
  completed: boolean
}
