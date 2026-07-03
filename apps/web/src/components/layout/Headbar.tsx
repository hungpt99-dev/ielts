import { useCallback, useState, useEffect } from 'react'
import DarkModeToggle from '../ui/DarkModeToggle'

interface HeadbarProps {
  onMenuToggle: () => void
}

export default function Headbar({ onMenuToggle }: HeadbarProps) {
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const stored = localStorage.getItem('ai-tutor-proactive-messages')
    if (!stored) return
    try {
      const messages = JSON.parse(stored)
      const unread = messages.filter((m: { isRead?: boolean; isDismissed?: boolean }) => !m.isRead && !m.isDismissed).length
      setUnreadCount(unread)
    } catch {}
  }, [])

  const handleChatToggle = useCallback(() => {
    window.dispatchEvent(new CustomEvent('toggle-ai-tutor-chat'))
  }, [])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleChatToggle()
      }
    },
    [handleChatToggle],
  )

  return (
    <header
      className="flex h-16 shrink-0 items-center justify-between border-b px-4"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
      }}
    >
      <button
        onClick={onMenuToggle}
        className="rounded-lg p-2 lg:hidden"
        style={{ color: 'var(--color-muted)' }}
        aria-label="Open sidebar"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <div className="flex-1" />
      <div className="flex items-center gap-1">
        <button
          onClick={handleChatToggle}
          onKeyDown={handleKeyDown}
          className="relative rounded-lg p-2 transition-colors hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
          style={{ color: 'var(--color-muted)' }}
          aria-label="Open AI Tutor chat"
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
              aria-label={`${unreadCount} unread message${unreadCount !== 1 ? 's' : ''}`}
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
        <DarkModeToggle />
      </div>
    </header>
  )
}
