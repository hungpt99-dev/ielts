export type LearningErrorCode =
  | 'missing_profile'
  | 'missing_roadmap_task'
  | 'invalid_source_content'
  | 'unsupported_skill'
  | 'unsupported_question_type'
  | 'ai_unavailable'
  | 'ai_timeout'
  | 'ai_invalid_output'
  | 'ai_failed'
  | 'storage_failure'
  | 'evaluation_failure'
  | 'generation_failed'
  | 'generation_failure'
  | 'migration_failure'
  | 'operation_cancelled'
  | 'context_unavailable'
  | 'content_too_large'
  | 'session_expired'
  | 'attempt_already_submitted'

export interface LearningError {
  code: LearningErrorCode
  message: string
  recoverable: boolean
  cause?: unknown
  context?: Record<string, string | number | boolean>
}
