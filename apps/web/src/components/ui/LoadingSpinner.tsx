interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  message?: string
  fullPage?: boolean
}

const sizeMap = {
  sm: 'h-5 w-5 border-2',
  md: 'h-8 w-8 border-[3px]',
  lg: 'h-12 w-12 border-4',
}

export default function LoadingSpinner({ size = 'md', message, fullPage }: LoadingSpinnerProps) {
  const content = (
    <div className={`flex flex-col items-center justify-center gap-3 ${fullPage ? 'h-full min-h-[200px]' : ''}`}>
      <div
        className={`animate-spin rounded-full border-t-transparent ${sizeMap[size]}`}
        style={{
          borderColor: 'var(--color-primary)',
          borderTopColor: 'transparent',
        }}
        role="status"
        aria-label="Loading"
      />
      {message && (
        <p className="text-sm" style={{ color: 'var(--color-muted)' }}>
          {message}
        </p>
      )}
    </div>
  )

  if (fullPage) {
    return (
      <div className="flex h-full min-h-[50vh] items-center justify-center">
        {content}
      </div>
    )
  }

  return content
}
