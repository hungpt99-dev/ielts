import { IconExplain, IconSpeaking } from '../../../ui/src/icons/IconMap'

interface TutorAvatarProps {
  size?: number
  showStatus?: boolean
  isOnline?: boolean
  pulse?: boolean
  typing?: boolean
  speaking?: boolean
  className?: string
}

export function TutorAvatar({
  size = 40,
  showStatus = true,
  isOnline = true,
  pulse = false,
  typing = false,
  speaking = false,
  className = '',
}: TutorAvatarProps) {
  const glowSize = size * 0.5

  return (
    <div
      className={`relative inline-flex shrink-0 items-center justify-center rounded-full ${className}`}
      style={{
        width: size,
        height: size,
        background: 'linear-gradient(135deg, var(--color-tutor-accent), var(--color-tutor-accent-dark))',
        boxShadow: pulse || typing
          ? `0 0 ${glowSize}px color-mix(in srgb, var(--color-tutor-accent) 40%, transparent)`
          : 'none',
        transition: 'box-shadow 0.3s ease',
      }}
      aria-hidden="true"
    >
      {speaking ? (
        <IconSpeaking
          size={size * 0.5}
          color="white"
          strokeWidth={1.5}
          style={{
            filter: pulse ? 'brightness(1.2)' : 'none',
            transition: 'filter 0.3s ease',
          }}
        />
      ) : (
        <IconExplain
          size={size * 0.5}
          color="white"
          strokeWidth={1.5}
          style={{
            filter: pulse ? 'brightness(1.2)' : 'none',
            transition: 'filter 0.3s ease',
          }}
        />
      )}

      {(pulse || typing) && (
        <span
          className="absolute inset-0 rounded-full"
          style={{
            animation: typing ? 'tutor-avatar-typing 1.2s ease-in-out infinite' : 'tutor-avatar-pulse 2s ease-in-out infinite',
            border: '2px solid var(--color-tutor-accent)',
            opacity: 0.4,
          }}
        />
      )}

      {showStatus && (
        <span
          className="absolute rounded-full border-2"
          style={{
            bottom: '-1px',
            right: '-1px',
            width: size * 0.28,
            height: size * 0.28,
            minWidth: '8px',
            minHeight: '8px',
            backgroundColor: isOnline ? 'var(--color-success)' : 'var(--color-muted)',
            borderColor: 'var(--color-tutor-background)',
            transition: 'background-color 0.3s ease',
          }}
          aria-label={isOnline ? 'Online' : 'Away'}
        />
      )}
    </div>
  )
}
