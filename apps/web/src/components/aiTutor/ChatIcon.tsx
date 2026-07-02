import { useEffect, useState, useCallback } from 'react'
import ChatPopup from './ChatPopup'

interface ChatIconState {
  isOpen: boolean
  unreadCount: number
}

function loadChatState(): ChatIconState {
  try {
    const stored = localStorage.getItem('ai-tutor-chat-state')
    if (stored) {
      const parsed = JSON.parse(stored)
      return {
        isOpen: typeof parsed.isOpen === 'boolean' ? parsed.isOpen : false,
        unreadCount: typeof parsed.unreadCount === 'number' ? parsed.unreadCount : 0,
      }
    }
  } catch {}
  return { isOpen: false, unreadCount: 0 }
}

function saveChatState(state: ChatIconState) {
  try {
    localStorage.setItem('ai-tutor-chat-state', JSON.stringify(state))
  } catch {}
}

interface ChatIconProps {
  onToggle?: (isOpen: boolean) => void
  isOnline?: boolean
}

export default function ChatIcon({ onToggle, isOnline = true }: ChatIconProps) {
  const [{ isOpen, unreadCount }, setState] = useState<ChatIconState>(loadChatState)

  useEffect(() => {
    saveChatState({ isOpen, unreadCount })
  }, [isOpen, unreadCount])

  const handleToggle = useCallback(() => {
    setState(prev => {
      const next = { ...prev, isOpen: !prev.isOpen, unreadCount: prev.isOpen ? prev.unreadCount : 0 }
      return next
    })
  }, [])

  useEffect(() => {
    onToggle?.(isOpen)
  }, [isOpen, onToggle])

  useEffect(() => {
    const handler = () => {
      setState(prev => ({ ...prev, isOpen: true, unreadCount: 0 }))
    }
    window.addEventListener('toggle-ai-tutor-chat', handler)
    return () => window.removeEventListener('toggle-ai-tutor-chat', handler)
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleToggle()
    }
  }, [handleToggle])

  return (
    <>
      <button
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className="relative rounded-lg p-2 transition-colors hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
        style={{ color: 'var(--color-muted)' }}
        aria-label={isOpen ? 'Close AI Tutor chat' : 'Open AI Tutor chat'}
        aria-expanded={isOpen}
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
            backgroundColor: isOnline ? 'var(--color-success, #22c55e)' : 'var(--color-muted)',
            borderColor: 'var(--color-surface)',
          }}
          aria-label={isOnline ? 'AI Tutor is online' : 'AI Tutor is away'}
        />
      </button>

      <ChatPopup isOpen={isOpen} onClose={handleToggle} />
    </>
  )
}
