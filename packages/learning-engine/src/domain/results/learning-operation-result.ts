import type { LearningError } from '../errors/learning-error'
import type { LearningContextScope } from '../entities/learning-context'

export interface LearningOperationMetadata {
  requestId?: string
  correlationId?: string
  durationMs?: number
  aiUsed: boolean
  cacheHit: boolean
  schemaVersion: string
}

export interface LearningWarning {
  code: string
  message: string
}

export type LearningUnavailableReason =
  | 'ai_not_configured'
  | 'profile_missing'
  | 'offline'
  | 'no_suitable_content'

export interface LearningAction {
  type: string
  label: string
  payload?: Record<string, unknown>
}

export type LearningOperationResult<T> =
  | { status: 'success'; data: T; metadata: LearningOperationMetadata }
  | { status: 'partial'; data: T; warnings: LearningWarning[]; metadata: LearningOperationMetadata }
  | { status: 'needs-context'; missingContext: LearningContextScope[]; suggestedAction?: LearningAction }
  | { status: 'unavailable'; reason: LearningUnavailableReason; fallback?: T }
  | { status: 'cancelled' }
  | { status: 'failure'; error: LearningError }

export interface LearningOperationOptions {
  signal?: AbortSignal
  timeoutMs?: number
  correlationId?: string
}
