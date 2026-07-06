import { useCallback } from 'react'
import { IconMessageSquare } from '../../../ui/src/icons/IconMap'

interface ChatIconProps {
  isOpen: boolean
  unreadCount: number
  isOnline?: boolean
  onToggle: () => void
}

export function ChatIcon({ isOpen, unreadCount, isOnline = true, onToggle }: ChatIconProps) {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onToggle()
      }
    },
    [onToggle],
  )

  return (
    <button
      onClick={onToggle}
      onKeyDown={handleKeyDown}
      className="relative rounded-lg p-2 transition-colors hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
      style={{ color: 'var(--color-muted)' }}
      aria-label={isOpen ? 'Close AI Tutor chat' : 'Open AI Tutor chat'}
      aria-expanded={isOpen}
      aria-haspopup="dialog"
      title="AI Tutor Assistant"
    >
      <IconMessageSquare size={20} aria-hidden="true" />

      {unreadCount > 0 && (
        <span
          className="absolute -right-0.5 -top-0.5 flex min-w-[18px] items-center justify-center rounded-full px-1 text-[11px] font-bold leading-tight"
          style={{
            backgroundColor: 'var(--color-danger)',
            color: 'var(--color-on-danger, #fff)',
          }}
          aria-label={`${unreadCount} unread message${unreadCount !== 1 ? 's' : ''}`}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}

      <span
        className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2"
        style={{
          backgroundColor: isOnline ? 'var(--color-success, #22c55e)' : 'var(--color-muted)',
          borderColor: 'var(--color-surface)',
        }}
        aria-label={isOnline ? 'AI Tutor is online' : 'AI Tutor is away'}
      />
    </button>
  )
}
