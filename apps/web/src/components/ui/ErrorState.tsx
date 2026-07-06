import { type ReactNode } from 'react'
import { IconAlertCircle } from '@ielts/ui'

interface ErrorStateProps {
  icon?: ReactNode
  title?: string
  message?: string
  action?: ReactNode
  onRetry?: () => void
  compact?: boolean
  error?: Error | string | null
  variant?: 'card' | 'inline' | 'fullscreen'
  retryLabel?: string
}

export default function ErrorState({
  icon,
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  action,
  onRetry,
  compact = false,
  error,
  variant = 'card',
  retryLabel = 'Try Again',
}: ErrorStateProps) {
  const displayMessage = error
    ? typeof error === 'string' ? error : error.message || message
    : message

  if (variant === 'inline') {
    return (
      <div
        className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm"
        style={{ backgroundColor: 'var(--color-danger-light)', color: 'var(--color-danger)' }}
        role="alert"
      >
        <IconAlertCircle size={16} />
        <span className="flex-1 text-xs">{displayMessage}</span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="shrink-0 text-xs font-medium underline"
            style={{ color: 'var(--color-danger)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            {retryLabel}
          </button>
        )}
      </div>
    )
  }

  if (variant === 'fullscreen') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-8">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl" style={{ backgroundColor: 'var(--color-danger-light)' }}>
            <IconAlertCircle size={32} style={{ color: 'var(--color-danger)' }} />
          </div>
          <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
            {title}
          </h3>
          <p className={`mt-2 leading-relaxed ${compact ? 'text-xs' : 'text-sm'}`} style={{ color: 'var(--color-text-secondary)' }}>
            {displayMessage}
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-5 inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition-all"
              style={{ background: 'var(--color-primary)', color: 'var(--color-on-primary)', border: 'none', cursor: 'pointer' }}
            >
              {retryLabel}
            </button>
          )}
        </div>
      </div>
    )
  }

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
        {icon || <IconAlertCircle size={compact ? 20 : 28} />}
      </div>
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
              borderRadius: 'var(--radius-xl)',
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
              lineHeight: 'var(--leading-normal)',
            }}
          >
            {retryLabel}
          </button>
        )}
        {action}
      </div>
    </div>
  )
}
