import { type ReactNode } from 'react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  message?: string
  fullPage?: boolean
  fullHeight?: boolean
}

const sizeMap = {
  sm: { width: 'var(--spacing-lg)', height: 'var(--spacing-lg)', borderWidth: '2px' },
  md: { width: 'var(--spacing-2xl)', height: 'var(--spacing-2xl)', borderWidth: '3px' },
  lg: { width: 'var(--spacing-3xl)', height: 'var(--spacing-3xl)', borderWidth: '4px' },
}

export default function LoadingSpinner({ size = 'md', message, fullPage, fullHeight }: LoadingSpinnerProps) {
  const s = sizeMap[size]

  const spinner = (
    <div
      style={{
        width: s.width,
        height: s.height,
        border: `${s.borderWidth} solid var(--color-border)`,
        borderTopColor: 'var(--color-primary)',
        borderRadius: 'var(--radius-full)',
        animation: 'spin 0.6s linear infinite',
      }}
      role="status"
      aria-label="Loading"
    />
  )

  const content = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--spacing-sm)',
        minHeight: fullHeight ? 'var(--spacing-3xl)' : undefined,
      }}
    >
      {spinner}
      {message && (
        <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-muted)', fontFamily: 'var(--font-sans)' }}>
          {message}
        </p>
      )}
    </div>
  )

  if (fullPage) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '50vh',
          width: '100%',
        }}
      >
        {content}
      </div>
    )
  }

  return content
}
