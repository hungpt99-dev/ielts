interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  message?: string
  fullPage?: boolean
}

const sizeMap = {
  sm: { width: '16px', height: '16px', borderWidth: '2px' },
  md: { width: '24px', height: '24px', borderWidth: '3px' },
  lg: { width: '32px', height: '32px', borderWidth: '4px' },
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
        gap: '12px',
        minHeight: fullPage ? '500px' : minHeightMap[size],
      }}
    >
      <div
        style={{
          width: dims.width,
          height: dims.height,
          border: `${dims.borderWidth} solid var(--color-border)`,
          borderTopColor: 'var(--color-primary)',
          borderRadius: '50%',
          animation: 'loading-spinner-spin 0.8s linear infinite',
        }}
      />
      {message && (
        <span style={{ fontSize: '13px', color: 'var(--color-muted)' }}>
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
