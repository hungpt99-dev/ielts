export type OperationResultStatus =
  | 'success'
  | 'partial'
  | 'needs-context'
  | 'unavailable'
  | 'cancelled'
  | 'failure'

export interface OperationError {
  code: string
  message: string
  recoverable: boolean
}

export interface OperationWarning {
  code: string
  message: string
}

export interface OperationMetadata {
  requestId?: string
  correlationId?: string
  durationMs?: number
  aiUsed: boolean
  cacheHit: boolean
  schemaVersion: string
}

export type OperationResult<T> =
  | { status: 'success'; data: T; metadata?: OperationMetadata }
  | { status: 'partial'; data: T; warnings: OperationWarning[]; metadata?: OperationMetadata }
  | { status: 'needs-context'; missingContext: string[]; suggestedAction?: { type: string; label: string; payload?: Record<string, unknown> } }
  | { status: 'unavailable'; reason: string; fallback?: T }
  | { status: 'cancelled' }
  | { status: 'failure'; error: OperationError }
