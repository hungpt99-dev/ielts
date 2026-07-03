import { Component, type ErrorInfo, type ReactNode } from 'react'
import Button from './Button'

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

    const isDev = this.props.showDetails ?? import.meta.env?.DEV ?? process.env.NODE_ENV === 'development'

    return (
      <div className="flex h-full min-h-[300px] items-center justify-center p-8">
        <div className="w-full max-w-md text-center">
          <div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
            style={{ backgroundColor: 'var(--color-danger-light)', color: 'var(--color-danger)' }}
          >
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <h3 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
            Something went wrong
          </h3>

          <p className="mt-2 text-sm" style={{ color: 'var(--color-muted)' }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>

          <p className="mt-1 text-xs" style={{ color: 'var(--color-muted)' }}>
            Try refreshing the page or going back. If the issue persists, you can try again below.
          </p>

          {isDev && this.state.error && (
            <details className="mt-4 text-left">
              <summary
                className="cursor-pointer text-xs font-medium"
                style={{ color: 'var(--color-muted)' }}
              >
                Error details
              </summary>
              <pre
                className="mt-2 max-h-40 overflow-auto rounded-lg bg-black/5 p-3 text-left text-[10px] leading-relaxed dark:bg-white/5"
                style={{ color: 'var(--color-text)' }}
              >
                {this.state.error.stack || this.state.error.message}
              </pre>
            </details>
          )}

          <div className="mt-6 flex items-center justify-center gap-3">
            <Button variant="secondary" onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
            <Button variant="primary" onClick={this.handleRetry}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }
}
