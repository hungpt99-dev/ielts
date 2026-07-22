import type { LearnerResponse } from './response'

export type ExerciseAttemptStatus =
  | 'not_started'
  | 'in_progress'
  | 'paused'
  | 'submitted'
  | 'evaluating'
  | 'completed'
  | 'abandoned'
  | 'failed'

export interface ExerciseAttempt {
  id: string
  exerciseId: string
  exerciseSnapshotVersion: string

  status: ExerciseAttemptStatus

  responses: Record<string, LearnerResponse>

  startedAt?: string
  pausedAt?: string
  submittedAt?: string
  completedAt?: string

  elapsedSeconds: number
  remainingSeconds?: number

  result?: ExerciseResult
}

export interface ExerciseResult {
  rawScore: number
  maximumScore: number
  accuracy: number

  estimatedBand?: number
  bandConfidence?: number

  perQuestionResults?: Record<string, QuestionResult>
  perTypeResults?: Record<string, QuestionTypeResult>

  feedback?: ExerciseFeedback
  requiresAiEvaluation: boolean
  requiresManualReview: boolean
}

export interface QuestionResult {
  questionId: string
  correct: boolean
  partialCredit: number
  score: number
  maxScore: number
  feedback?: string
  explanation?: string
}

export interface QuestionTypeResult {
  questionType: string
  totalQuestions: number
  correctCount: number
  accuracy: number
  averageScore: number
}

export interface ExerciseFeedback {
  summary: string

  strengths: FeedbackItem[]
  weaknesses: FeedbackItem[]
  mistakes: ExerciseMistakeRecord[]

  questionTypePerformance?: Record<string, PerformanceMetric>
  learningObjectivePerformance?: Record<string, PerformanceMetric>

  recommendedNextActions: LearningRecommendation[]
}

export interface FeedbackItem {
  category: string
  description: string
  severity: 'info' | 'warning' | 'critical'
}

export interface ExerciseMistakeRecord {
  questionId: string
  errorType: string
  description: string
  learnerAnswer?: unknown
  expectedAnswer?: unknown
  explanation?: string
}

export interface PerformanceMetric {
  accuracy: number
  count: number
  averageScore: number
}

export interface LearningRecommendation {
  action: string
  reason: string
  priority: 'high' | 'medium' | 'low'
  targetModule?: string
  targetObjectiveId?: string
}

export const VALID_ATTEMPT_TRANSITIONS: Record<ExerciseAttemptStatus, ExerciseAttemptStatus[]> = {
  not_started: ['in_progress'],
  in_progress: ['paused', 'submitted', 'abandoned', 'failed'],
  paused: ['in_progress', 'abandoned'],
  submitted: ['evaluating', 'completed', 'failed'],
  evaluating: ['completed', 'failed'],
  completed: [],
  abandoned: [],
  failed: [],
}

export function isValidTransition(from: ExerciseAttemptStatus, to: ExerciseAttemptStatus): boolean {
  return VALID_ATTEMPT_TRANSITIONS[from].includes(to)
}
