import type { IELTSSection } from '../value-objects'
import type { ExerciseDifficulty } from '../value-objects'
import type { LearningObjective } from './learning-objective'
import type { LearningActivity } from './learning-activity'

export type LearningSessionStatus =
  | 'prepared'
  | 'in-progress'
  | 'paused'
  | 'completed'
  | 'abandoned'
  | 'expired'

export type LearningSessionSource =
  | 'roadmap'
  | 'tutor-recommendation'
  | 'user-selected'
  | 'mistake-review'
  | 'vocabulary-review'
  | 'saved-content'
  | 'imported-content'
  | 'system'

export type LearningMode = 'learn' | 'practice' | 'review' | 'assess' | 'apply'

export interface LearningGenerationMetadata {
  generatedAt: string
  schemaVersion: string
  contextSnapshotHash: string
  aiUsed: boolean
  aiCallCount: number
  templateUsed: boolean
  cacheHit: boolean
}

export interface LearningSession {
  id: string
  objective: LearningObjective
  skill: IELTSSection
  mode: LearningMode
  source: LearningSessionSource
  sourceIds: string[]
  plannedDurationMinutes: number
  actualDurationMinutes?: number
  difficulty: ExerciseDifficulty
  status: LearningSessionStatus
  activities: LearningActivity[]
  currentActivityIndex: number
  contextSnapshotId: string
  roadmapTaskId?: string
  startedAt?: string
  pausedAt?: string
  completedAt?: string
  generationMetadata: LearningGenerationMetadata
  version: number
}

export interface CreateLearningSessionRequest {
  objective: LearningObjective
  skill: IELTSSection
  mode: LearningMode
  source: LearningSessionSource
  sourceIds: string[]
  plannedDurationMinutes: number
  difficulty?: ExerciseDifficulty
  contextScope: string
  roadmapTaskId?: string
  correlationId: string
}

export interface CreateLearningSessionResult {
  session: LearningSession
  warnings: string[]
}

export interface ResumeLearningSessionResult {
  session: LearningSession | null
  currentActivity: LearningActivity | null
  savedAnswers: Record<string, unknown>[]
}

export interface CompleteLearningSessionRequest {
  sessionId: string
  actualDurationMinutes: number
  correlationId: string
}

export interface CompleteLearningSessionResult {
  session: LearningSession
  outcomes: import('./learning-outcome').LearningOutcome[]
  recommendations: import('./learning-recommendation').LearningRecommendation[]
}

export interface LearningSessionSummaryResult {
  session: LearningSession
  totalScore: number
  totalMaximum: number
  accuracy: number
  mistakesCount: number
  strengthsCount: number
}
