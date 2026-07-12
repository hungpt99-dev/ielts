import type { ReactNode } from 'react'
import Button from './Button'

type ErrorDisplayVariant = 'inline' | 'card' | 'banner' | 'page'

interface ErrorDisplayProps {
  message?: string
  error?: unknown
  onRetry?: () => void
  retryLabel?: string
  variant?: ErrorDisplayVariant
  title?: string
  icon?: ReactNode
  children?: ReactNode
  helpLink?: string
  helpLinkText?: string
}

function WarningIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

function AlertCircleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}

function getErrorInfo(error: unknown): { message: string; title: string } {
  if (error instanceof Error) {
    const name = error.name.replace(/([A-Z])/g, ' $1').trim()
    return { message: error.message, title: name || 'Error' }
  }
  return { message: 'An unexpected error occurred.', title: 'Error' }
}

export default function ErrorDisplay({
  message,
  error,
  onRetry,
  retryLabel = 'Try Again',
  variant = 'card',
  title,
  icon,
  children,
  helpLink,
  helpLinkText,
}: ErrorDisplayProps) {
  const errorInfo = error ? getErrorInfo(error) : null
  const displayTitle = title ?? errorInfo?.title ?? 'Something went wrong'
  const displayMessage = message ?? errorInfo?.message ?? 'An unexpected error occurred. Please try again.'
  const displayIcon = icon ?? (variant === 'page' ? <WarningIcon /> : <AlertCircleIcon />)

  if (variant === 'inline') {
    return (
      <div
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm"
        style={{
          backgroundColor: 'var(--color-danger-light)',
          color: 'var(--color-danger)',
        }}
        role="alert"
      >
        <span className="shrink-0">{displayIcon}</span>
        <span className="flex-1">{displayMessage}</span>
        {onRetry && (
          <Button variant="ghost" size="sm" onClick={onRetry}>
            {retryLabel}
          </Button>
        )}
        {children}
      </div>
    )
  }

  if (variant === 'banner') {
    return (
      <div
        className="flex items-center gap-3 rounded-lg border px-4 py-3"
        style={{
          borderColor: 'var(--color-danger)',
          backgroundColor: 'var(--color-danger-light)',
        }}
        role="alert"
      >
        <span className="shrink-0" style={{ color: 'var(--color-danger)' }}>
          {displayIcon}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium" style={{ color: 'var(--color-danger)' }}>
            {displayTitle}
          </p>
          <p className="mt-0.5 text-xs" style={{ color: 'var(--color-muted)' }}>
            {displayMessage}
          </p>
        </div>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            {retryLabel}
          </Button>
        )}
        {children}
      </div>
    )
  }

  if (variant === 'page') {
    return (
      <div
        className="flex w-full min-h-[300px] items-center justify-center p-8"
        role="alert"
      >
        <div className="w-full max-w-lg text-center">
          <div
            className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full"
            style={{
              backgroundColor: 'var(--color-danger-light)',
              color: 'var(--color-danger)',
            }}
          >
            {displayIcon}
          </div>
          <h2
            className="text-xl font-semibold"
            style={{ color: 'var(--color-text)', fontFamily: 'var(--font-sans)', margin: 0 }}
          >
            {displayTitle}
          </h2>
          <p
            className="mt-2 text-sm"
            style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans)', lineHeight: 'var(--leading-relaxed)' }}
          >
            {displayMessage}
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            {onRetry && (
              <Button variant="primary" size="md" onClick={onRetry}>
                {retryLabel}
              </Button>
            )}
            {helpLink && (
              <a
                href={helpLink}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: 'var(--text-sm)',
                  color: 'var(--color-primary)',
                  fontFamily: 'var(--font-sans)',
                  textDecoration: 'underline',
                }}
              >
                {helpLinkText || 'Get help'}
              </a>
            )}
          </div>
          {children}
        </div>
      </div>
    )
  }

  return (
    <div className="flex w-full h-full min-h-[200px] items-center justify-center p-8">
      <div className="w-full max-w-lg text-center">
        <div
          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full"
          style={{
            backgroundColor: 'var(--color-danger-light)',
            color: 'var(--color-danger)',
          }}
        >
          {displayIcon}
        </div>
        <h3 className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>
          {displayTitle}
        </h3>
        <p className="mt-2 text-sm" style={{ color: 'var(--color-muted)' }}>
          {displayMessage}
        </p>
        {onRetry && (
          <Button variant="secondary" className="mt-4" onClick={onRetry}>
            {retryLabel}
          </Button>
        )}
        {children}
      </div>
    </div>
  )
}
