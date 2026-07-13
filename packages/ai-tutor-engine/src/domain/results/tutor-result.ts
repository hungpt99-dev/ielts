import type { TutorError } from '../errors/tutor-error'
import type { TutorContextSource } from '../entities/learner-context'
import type { TutorAction } from '../entities/tutor-message'

export interface TutorOperationMetadata {
  requestId?: string
  correlationId?: string
  durationMs?: number
  aiUsed: boolean
  schemaVersion: string
}

export interface TutorWarning {
  code: string
  message: string
}

export type TutorUnavailableReason =
  | 'ai_not_configured'
  | 'ai_quota_exceeded'
  | 'profile_missing'
  | 'offline'

export type TutorOperationResult<T> =
  | {
      status: 'success'
      data: T
      metadata: TutorOperationMetadata
    }
  | {
      status: 'partial'
      data: T
      warnings: TutorWarning[]
      metadata: TutorOperationMetadata
    }
  | {
      status: 'needs-context'
      missingContext: TutorContextSource[]
      suggestedAction?: TutorAction
    }
  | {
      status: 'unavailable'
      reason: TutorUnavailableReason
      fallback?: T
    }
  | {
      status: 'cancelled'
    }
  | {
      status: 'failure'
      error: TutorError
    }

export interface AITutorInitializationResult {
  initialized: boolean
  aiAvailable: boolean
  storageAvailable: boolean
  errors: TutorError[]
}

export interface TutorStateSnapshot {
  initialized: boolean
  aiConfigured: boolean
  proactiveEnabled: boolean
  currentSessionsCount: number
  activeProactiveMessages: number
  memoryVersion: number
}
