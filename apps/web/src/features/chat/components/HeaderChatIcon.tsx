import { useState, useEffect, useCallback } from 'react'
import { proactiveMessageEngine } from '../../../services/ProactiveMessageEngine'

interface HeaderChatIconProps {
  onToggle?: () => void
}

export default function HeaderChatIcon({ onToggle }: HeaderChatIconProps) {
  const [unreadCount, setUnreadCount] = useState(0)

  const refresh = useCallback(() => {
    setUnreadCount(proactiveMessageEngine.getUnreadCount())
  }, [])

  useEffect(() => {
    refresh()
    const unsub = proactiveMessageEngine.onMessage(() => {
      refresh()
    })
    return () => unsub()
  }, [refresh])

  const handleClick = useCallback(() => {
    if (onToggle) {
      onToggle()
    } else {
      window.dispatchEvent(new CustomEvent('toggle-ai-tutor-chat'))
    }
  }, [onToggle])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleClick()
      }
    },
    [handleClick],
  )

  return (
    <button
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className="relative rounded-lg p-2 transition-colors hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
      style={{ color: 'var(--color-muted)' }}
      aria-label={`AI Tutor chat${unreadCount > 0 ? ` (${unreadCount} unread messages)` : ''}`}
      aria-haspopup="dialog"
      title="AI Tutor Assistant"
    >
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>

      {unreadCount > 0 && (
        <span
          className="absolute -right-0.5 -top-0.5 flex min-w-[18px] items-center justify-center rounded-full px-1 text-[11px] font-bold leading-tight"
          style={{
            backgroundColor: 'var(--color-danger)',
            color: 'var(--color-on-danger, #fff)',
          }}
          aria-hidden="true"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}

      <span
        className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2"
        style={{
          backgroundColor: 'var(--color-success, #22c55e)',
          borderColor: 'var(--color-surface)',
        }}
        aria-label="AI Tutor is online"
      />
    </button>
  )
}
