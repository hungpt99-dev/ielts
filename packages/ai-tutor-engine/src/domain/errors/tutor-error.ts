export type TutorErrorCode =
  | 'profile_unavailable'
  | 'progress_unavailable'
  | 'invalid_context'
  | 'ai_not_configured'
  | 'ai_quota_exceeded'
  | 'ai_timeout'
  | 'ai_output_invalid'
  | 'storage_failure'
  | 'context_build_failure'
  | 'memory_failure'
  | 'event_processing_failure'
  | 'generation_cancelled'
  | 'unsupported_tutor_mode'

export interface TutorError {
  code: TutorErrorCode
  message: string
  recoverable: boolean
  cause?: unknown
  context?: Record<string, string | number | boolean>
}

export function createTutorError(
  code: TutorErrorCode,
  message: string,
  options?: { recoverable?: boolean; cause?: unknown; context?: Record<string, string | number | boolean> },
): TutorError {
  return {
    code,
    message,
    recoverable: options?.recoverable ?? true,
    cause: options?.cause,
    context: options?.context,
  }
}
