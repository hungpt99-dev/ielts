
export const ErrorCode = {
  // General
  UNKNOWN: 'UNKNOWN',
  NOT_FOUND: 'NOT_FOUND',
  CONFIG: 'CONFIG_ERROR',
  TIMEOUT: 'TIMEOUT',

  // Storage
  STORAGE: 'STORAGE_ERROR',
  STORAGE_CLOSED: 'STORAGE_CLOSED',
  ENTITY_NOT_FOUND: 'ENTITY_NOT_FOUND',
  DUPLICATE_ENTITY: 'DUPLICATE_ENTITY',
  MIGRATION_FAILED: 'MIGRATION_FAILED',
  BACKUP_FAILED: 'BACKUP_FAILED',

  // AI
  AI: 'AI_ERROR',
  AI_AUTH: 'AI_AUTH_ERROR',
  AI_RATE_LIMIT: 'AI_RATE_LIMIT',
  AI_NETWORK: 'AI_NETWORK_ERROR',
  AI_EMPTY_RESPONSE: 'AI_EMPTY_RESPONSE',
  AI_CONFIG: 'AI_CONFIG_ERROR',

  // Validation
  VALIDATION: 'VALIDATION_ERROR',

  // Import/Export
  IMPORT_EXPORT: 'IMPORT_EXPORT_ERROR',
  PARSE_FAILED: 'PARSE_FAILED',
  INVALID_FORMAT: 'INVALID_FORMAT',

  // Extension
  EXTENSION: 'EXTENSION_ERROR',

  // Permission
  PERMISSION: 'PERMISSION_ERROR',
  PERMISSION_DENIED: 'PERMISSION_DENIED',

  // Network
  NETWORK: 'NETWORK_ERROR',
  NETWORK_TIMEOUT: 'NETWORK_TIMEOUT',
} as const

export type ErrorCodeType = (typeof ErrorCode)[keyof typeof ErrorCode]


export class AppError extends Error {
  constructor(
    message: string,
    public code: ErrorCodeType = ErrorCode.UNKNOWN,
    public readonly cause?: unknown,
  ) {
    super(message)
    this.name = 'AppError'
    Object.setPrototypeOf(this, new.target.prototype)
  }

  get userMessage(): string {
    return this.message
  }
}

export class StorageError extends AppError {
  constructor(message: string, code: ErrorCodeType = ErrorCode.STORAGE, cause?: unknown) {
    super(message, code, cause)
    this.name = 'StorageError'
  }
}

export class DatabaseClosedError extends StorageError {
  constructor() {
    super('Database is closed. Open a connection first.', ErrorCode.STORAGE_CLOSED)
    this.name = 'DatabaseClosedError'
  }
}

export class EntityNotFoundError extends StorageError {
  constructor(entity: string, id: string) {
    super(`${entity} with id "${id}" not found`, ErrorCode.ENTITY_NOT_FOUND)
    this.name = 'EntityNotFoundError'
  }
}

export class DuplicateEntityError extends StorageError {
  constructor(entity: string, id: string) {
    super(`${entity} with id "${id}" already exists`, ErrorCode.DUPLICATE_ENTITY)
    this.name = 'DuplicateEntityError'
  }
}

export class MigrationError extends AppError {
  constructor(message: string, cause?: unknown) {
    super(message, ErrorCode.MIGRATION_FAILED, cause)
    this.name = 'MigrationError'
  }
}

export class BackupError extends AppError {
  constructor(message: string, cause?: unknown) {
    super(message, ErrorCode.BACKUP_FAILED, cause)
    this.name = 'BackupError'
  }
}

export class AIError extends AppError {
  constructor(message: string, code: ErrorCodeType = ErrorCode.AI, cause?: unknown) {
    super(message, code, cause)
    this.name = 'AIError'
  }
}

export class AIAuthError extends AIError {
  constructor(message = 'Invalid API key. Check your key in Settings.') {
    super(message, ErrorCode.AI_AUTH)
    this.name = 'AIAuthError'
  }
}

export class AIRateLimitError extends AIError {
  constructor(message = 'Rate limit exceeded. Wait a moment and try again.') {
    super(message, ErrorCode.AI_RATE_LIMIT)
    this.name = 'AIRateLimitError'
  }
}

export class AINetworkError extends AIError {
  constructor(message = 'Network error. Check your internet connection and API endpoint.') {
    super(message, ErrorCode.AI_NETWORK)
    this.name = 'AINetworkError'
  }
}

export class AIEmptyResponseError extends AIError {
  constructor(message = 'AI returned an empty response. Try again.') {
    super(message, ErrorCode.AI_EMPTY_RESPONSE)
    this.name = 'AIEmptyResponseError'
  }
}

export class AIConfigError extends AIError {
  constructor(message = 'API key not configured. Add your AI API key in Settings.') {
    super(message, ErrorCode.AI_CONFIG)
    this.name = 'AIConfigError'
  }
}

export class ValidationError extends AppError {
  constructor(message: string, cause?: unknown) {
    super(message, ErrorCode.VALIDATION, cause)
    this.name = 'ValidationError'
  }
}

export class ImportExportError extends AppError {
  constructor(message: string, cause?: unknown) {
    super(message, ErrorCode.IMPORT_EXPORT, cause)
    this.name = 'ImportExportError'
  }
}

export class InvalidFormatError extends ImportExportError {
  constructor(message = 'Invalid file format. Check that the file is a valid backup.') {
    super(message, ErrorCode.INVALID_FORMAT)
    this.name = 'InvalidFormatError'
  }
}

export class ExtensionError extends AppError {
  constructor(message: string, cause?: unknown) {
    super(message, ErrorCode.EXTENSION, cause)
    this.name = 'ExtensionError'
  }
}

export class PermissionError extends AppError {
  constructor(message: string, cause?: unknown) {
    super(message, ErrorCode.PERMISSION, cause)
    this.name = 'PermissionError'
  }
}

export class PermissionDeniedError extends PermissionError {
  constructor(message = 'Permission denied. Check your browser permissions.') {
    super(message, ErrorCode.PERMISSION_DENIED)
    this.name = 'PermissionDeniedError'
  }
}

export class NotFoundError extends AppError {
  constructor(entity: string, id?: string) {
    const msg = id ? `${entity} "${id}" not found` : `${entity} not found`
    super(msg, ErrorCode.NOT_FOUND)
    this.name = 'NotFoundError'
  }
}

export class NetworkError extends AppError {
  constructor(message = 'Network error. Check your internet connection.') {
    super(message, ErrorCode.NETWORK)
    this.name = 'NetworkError'
  }
}

export class TimeoutError extends AppError {
  constructor(message = 'Operation timed out.') {
    super(message, ErrorCode.TIMEOUT)
    this.name = 'TimeoutError'
  }
}


const USER_FRIENDLY_MESSAGES: Record<string, string> = {
  [ErrorCode.STORAGE]: 'A database error occurred. Your data should be safe.',
  [ErrorCode.STORAGE_CLOSED]: 'The database connection was lost. Refreshing the page may help.',
  [ErrorCode.ENTITY_NOT_FOUND]: 'The requested item was not found. It may have been deleted.',
  [ErrorCode.MIGRATION_FAILED]: 'A database update failed. Try clearing your browser data for this site.',
  [ErrorCode.BACKUP_FAILED]: 'Backup failed. Check that you have enough storage space.',
  [ErrorCode.AI]: 'The AI service returned an error. Try again later.',
  [ErrorCode.AI_AUTH]: 'Your AI API key appears to be invalid. Check your key in Settings.',
  [ErrorCode.AI_RATE_LIMIT]: 'AI rate limit reached. Wait a moment before trying again.',
  [ErrorCode.AI_NETWORK]: 'Could not reach the AI service. Check your internet connection.',
  [ErrorCode.AI_EMPTY_RESPONSE]: 'The AI returned an empty response. Try rephrasing your request.',
  [ErrorCode.AI_CONFIG]: 'AI is not configured. Add your API key in Settings.',
  [ErrorCode.VALIDATION]: 'The provided data is invalid. Check your input and try again.',
  [ErrorCode.IMPORT_EXPORT]: 'Import or export failed. Check the file and try again.',
  [ErrorCode.INVALID_FORMAT]: 'The file format is not recognized. Please select a valid backup file.',
  [ErrorCode.EXTENSION]: 'The browser extension encountered an error. Try reloading the page.',
  [ErrorCode.PERMISSION]: 'A permission is required to perform this action.',
  [ErrorCode.PERMISSION_DENIED]: 'Permission was denied. Check your browser settings.',
  [ErrorCode.NETWORK]: 'A network error occurred. Check your internet connection.',
  [ErrorCode.NETWORK_TIMEOUT]: 'The request timed out. Check your connection and try again.',
  [ErrorCode.TIMEOUT]: 'The operation took too long. Try again.',
}

const RETRYABLE_ERRORS: ReadonlySet<string> = new Set([
  ErrorCode.STORAGE,
  ErrorCode.STORAGE_CLOSED,
  ErrorCode.BACKUP_FAILED,
  ErrorCode.AI,
  ErrorCode.AI_RATE_LIMIT,
  ErrorCode.AI_NETWORK,
  ErrorCode.AI_EMPTY_RESPONSE,
  ErrorCode.NETWORK,
  ErrorCode.NETWORK_TIMEOUT,
  ErrorCode.TIMEOUT,
  ErrorCode.IMPORT_EXPORT,
])

export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return USER_FRIENDLY_MESSAGES[error.code] ?? error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'An unexpected error occurred.'
}

export function getDetailedErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    if (error.cause instanceof Error) {
      return `${error.message} (${error.cause.message})`
    }
    return error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  return String(error)
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError
}

export function isRetryable(error: unknown): boolean {
  if (error instanceof AppError) {
    return RETRYABLE_ERRORS.has(error.code)
  }
  return true
}

export function toAppError(error: unknown, fallbackMessage?: string): AppError {
  if (error instanceof AppError) return error
  if (error instanceof Error) {
    return new AppError(fallbackMessage ?? error.message, ErrorCode.UNKNOWN, error)
  }
  return new AppError(fallbackMessage ?? 'An unexpected error occurred.', ErrorCode.UNKNOWN, error)
}

export function getErrorCode(error: unknown): ErrorCodeType {
  if (error instanceof AppError) return error.code
  return ErrorCode.UNKNOWN
}

export function classifyError(error: unknown): { code: ErrorCodeType; message: string; retryable: boolean } {
  const appError = toAppError(error)
  return {
    code: appError.code,
    message: getErrorMessage(appError),
    retryable: isRetryable(appError),
  }
}
