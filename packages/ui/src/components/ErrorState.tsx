import { type ReactNode } from 'react'

export interface ErrorStateProps {
  icon?: ReactNode
  title?: string
  message?: string
  action?: ReactNode
  onRetry?: () => void
  compact?: boolean
  error?: Error | string | null
}

export function ErrorState({
  icon,
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  action,
  onRetry,
  compact = false,
  error,
}: ErrorStateProps) {
  const displayMessage = error
    ? typeof error === 'string'
      ? error
      : error.message || message
    : message

  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: compact ? 'var(--spacing-lg)' : 'var(--spacing-2xl)',
        gap: 'var(--spacing-sm)',
        minHeight: compact ? undefined : '200px',
        width: '100%',
      }}
    >
      {icon ? (
        <div
          style={{
            color: 'var(--color-danger)',
            marginBottom: 'var(--spacing-xs)',
            fontSize: compact ? 'var(--text-2xl)' : 'var(--text-4xl)',
            lineHeight: '1',
          }}
        >
          {icon}
        </div>
      ) : (
        <div
          style={{
            width: compact ? '40px' : '56px',
            height: compact ? '40px' : '56px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--color-danger-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-danger)',
            fontSize: compact ? 'var(--text-xl)' : 'var(--text-2xl)',
            marginBottom: 'var(--spacing-xs)',
          }}
        >
          !
        </div>
      )}
      <h3
        style={{
          margin: 0,
          fontSize: compact ? 'var(--text-base)' : 'var(--text-lg)',
          fontWeight: 'var(--weight-semibold)',
          color: 'var(--color-text)',
          fontFamily: 'var(--font-sans)',
          lineHeight: 'var(--leading-tight)',
        }}
      >
        {title}
      </h3>
      <p
        style={{
          margin: 0,
          fontSize: 'var(--text-sm)',
          color: 'var(--color-text-secondary)',
          fontFamily: 'var(--font-sans)',
          lineHeight: 'var(--leading-relaxed)',
          maxWidth: '400px',
        }}
      >
        {displayMessage}
      </p>
      <div style={{ display: 'flex', gap: 'var(--spacing-xs)', marginTop: 'var(--spacing-xs)' }}>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--spacing-2xs)',
              padding: 'var(--spacing-xs) var(--spacing-md)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--weight-semibold)',
              fontFamily: 'var(--font-sans)',
              background: 'var(--color-primary)',
              color: 'var(--color-on-primary)',
              border: 'none',
              borderRadius: 'var(--radius-lg)',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
              lineHeight: 'var(--leading-normal)',
            }}
          >
            Try Again
          </button>
        )}
        {action}
      </div>
    </div>
  )
}
