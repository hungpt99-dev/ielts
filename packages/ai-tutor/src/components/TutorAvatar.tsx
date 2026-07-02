interface TutorAvatarProps {
  size?: number
  showStatus?: boolean
  isOnline?: boolean
  pulse?: boolean
  className?: string
}

export function TutorAvatar({
  size = 40,
  showStatus = true,
  isOnline = true,
  pulse = false,
  className = '',
}: TutorAvatarProps) {
  return (
    <div
      className={`relative inline-flex shrink-0 items-center justify-center rounded-full ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: 'var(--color-primary-light)',
        fontSize: size * 0.45,
      }}
      aria-hidden="true"
    >
      <span
        className="select-none leading-none"
        style={{
          filter: pulse ? 'brightness(1.2)' : 'none',
          transition: 'filter 0.3s ease',
        }}
      >
        🤖
      </span>
      {pulse && (
        <span
          className="absolute inset-0 rounded-full"
          style={{
            animation: 'tutor-avatar-pulse 2s ease-in-out infinite',
            border: '2px solid var(--color-primary)',
            opacity: 0.4,
          }}
        />
      )}
      {showStatus && (
        <span
          className="absolute -bottom-0.5 -right-0.5 rounded-full border-2"
          style={{
            width: size * 0.28,
            height: size * 0.28,
            backgroundColor: isOnline ? 'var(--color-success)' : 'var(--color-muted)',
            borderColor: 'var(--color-surface)',
            transition: 'background-color 0.3s ease',
          }}
          aria-label={isOnline ? 'Online' : 'Away'}
        />
      )}
    </div>
  )
}
