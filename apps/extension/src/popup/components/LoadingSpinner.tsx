interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  message?: string
  fullPage?: boolean
}

const sizeMap = {
  sm: { width: 'var(--spacing-md)', height: 'var(--spacing-md)', borderWidth: 'var(--spacing-3xs)' },
  md: { width: 'var(--spacing-lg)', height: 'var(--spacing-lg)', borderWidth: '3px' },
  lg: { width: 'var(--spacing-xl)', height: 'var(--spacing-xl)', borderWidth: 'var(--spacing-2xs)' },
}

const minHeightMap = {
  sm: '100px',
  md: '200px',
  lg: '300px',
}

export default function LoadingSpinner({ size = 'md', message, fullPage }: LoadingSpinnerProps) {
  const dims = sizeMap[size]
  const content = (
    <div
      role="status"
      aria-label="Loading"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--spacing-sm)',
        minHeight: fullPage ? '500px' : minHeightMap[size],
      }}
    >
      <div
        style={{
          width: dims.width,
          height: dims.height,
          border: `${dims.borderWidth} solid var(--color-border)`,
          borderTopColor: 'var(--color-primary)',
          borderRadius: 'var(--radius-full)',
          animation: 'loading-spinner-spin 0.8s linear infinite',
        }}
      />
      {message && (
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-muted)' }}>
          {message}
        </span>
      )}
      <style>{`
        @keyframes loading-spinner-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )

  if (fullPage) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '500px' }}>
        {content}
      </div>
    )
  }

  return content
}
