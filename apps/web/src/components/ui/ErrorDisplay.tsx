import type { ReactNode } from 'react'
import Button from './Button'

type ErrorDisplayVariant = 'inline' | 'card' | 'banner'

interface ErrorDisplayProps {
  message?: string
  error?: unknown
  onRetry?: () => void
  retryLabel?: string
  variant?: ErrorDisplayVariant
  title?: string
  icon?: ReactNode
  children?: ReactNode
}

const defaultIcon = (
  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

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
}: ErrorDisplayProps) {
  const errorInfo = error ? getErrorInfo(error) : null
  const displayTitle = title ?? errorInfo?.title ?? 'Error'
  const displayMessage = message ?? errorInfo?.message ?? 'An unexpected error occurred.'
  const displayIcon = icon ?? defaultIcon

  if (variant === 'inline') {
    return (
      <div
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--color-danger) 10%, transparent)',
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
          backgroundColor: 'color-mix(in srgb, var(--color-danger) 8%, transparent)',
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

  return (
    <div className="flex h-full min-h-[200px] items-center justify-center p-8">
      <div className="max-w-md text-center">
        <div
          className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-danger) 15%, transparent)',
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
