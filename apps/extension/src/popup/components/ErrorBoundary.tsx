import { Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'
import { IconAlertCircle } from '@ielts/ui'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode | ((error: Error, retry: () => void) => ReactNode)
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  showDetails?: boolean
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.props.onError?.(error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    const { fallback } = this.props

    if (fallback !== undefined) {
      if (typeof fallback === 'function') {
        return fallback(this.state.error!, this.handleRetry)
      }
      return fallback
    }

    const isDev = this.props.showDetails ?? process.env.NODE_ENV === 'development'
    const error = this.state.error

    return (
      <div
        role="alert"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '500px',
          padding: 'var(--spacing-lg) var(--spacing-md)',
          gap: 'var(--spacing-sm)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--color-danger-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'var(--text-2xl)',
          }}
          aria-hidden="true"
        >
          <IconAlertCircle size={24} color="var(--color-danger)" />
        </div>

        <h2
          style={{
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--weight-semibold)',
            color: 'var(--color-text)',
            margin: 0,
          }}
        >
          Something went wrong
        </h2>

        <p
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--color-muted)',
            maxWidth: '300px',
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          {error?.message || 'An unexpected error occurred'}
        </p>

        <p
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--color-muted)',
            maxWidth: '400px',
            margin: 0,
          }}
        >
          Try closing and reopening the popup. If the issue persists, refresh the page and try again.
        </p>

        {isDev && error && (
          <details
            style={{
              width: '100%',
              maxWidth: '320px',
              textAlign: 'left',
              fontSize: 'var(--text-xs)',
            }}
          >
            <summary
              style={{
                cursor: 'pointer',
                fontWeight: 'var(--weight-medium)',
                color: 'var(--color-muted)',
              }}
            >
              Error details
            </summary>
            <pre
              style={{
                marginTop: '8px',
                padding: 'var(--spacing-xs) var(--spacing-sm)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-surface-alt)',
                color: 'var(--color-text)',
                fontSize: 'var(--text-xs)',
                lineHeight: 1.5,
                overflow: 'auto',
                maxHeight: '150px',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}
            >
              {error.stack || error.message}
            </pre>
          </details>
        )}

        <div style={{ display: 'flex', gap: 'var(--spacing-xs)', marginTop: '4px' }}>
          <button
            onClick={this.handleRetry}
            style={{
              padding: 'var(--spacing-xs) var(--spacing-md)',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: 'var(--color-primary)',
              color: 'var(--color-text-inverse)',
              cursor: 'pointer',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--weight-medium)',
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }
}
