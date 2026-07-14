export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LoggingConfig {
  readonly level: LogLevel
}

export const DEFAULT_LOGGING_CONFIG: LoggingConfig = {
  level: 'info',
}
