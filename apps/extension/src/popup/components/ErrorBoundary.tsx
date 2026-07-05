import { Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'

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
          padding: '24px 16px',
          gap: '12px',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: 'var(--color-danger-light, #fef2f2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
          }}
          aria-hidden="true"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-danger, #ef4444)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
        </div>

        <h2
          style={{
            fontSize: '16px',
            fontWeight: 600,
            color: 'var(--color-text)',
            margin: 0,
          }}
        >
          Something went wrong
        </h2>

        <p
          style={{
            fontSize: '13px',
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
            fontSize: '12px',
            color: 'var(--color-muted)',
            maxWidth: '280px',
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
              fontSize: '11px',
            }}
          >
            <summary
              style={{
                cursor: 'pointer',
                fontWeight: 500,
                color: 'var(--color-muted)',
              }}
            >
              Error details
            </summary>
            <pre
              style={{
                marginTop: '8px',
                padding: '8px 10px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--color-surface-alt)',
                color: 'var(--color-text)',
                fontSize: '10px',
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

        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
          <button
            onClick={this.handleRetry}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: 'var(--color-primary)',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }
}
