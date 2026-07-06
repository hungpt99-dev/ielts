import { useState, useEffect, useCallback, useRef } from 'react'
import { proactiveMessageEngine } from '../../../services/ProactiveMessageEngine'
import { IconMessageCircle } from '@ielts/ui'

interface HeaderChatIconProps {
  onToggle?: () => void
}

export default function HeaderChatIcon({ onToggle }: HeaderChatIconProps) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [hasPulse, setHasPulse] = useState(false)
  const prevCount = useRef(0)

  const refresh = useCallback(() => {
    const count = proactiveMessageEngine.getUnreadCount()
    if (count > prevCount.current && count > 0) {
      setHasPulse(true)
      setTimeout(() => setHasPulse(false), 2000)
    }
    prevCount.current = count
    setUnreadCount(count)
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
      className="relative rounded-lg p-2 transition-colors hover:opacity-80 focus:outline-none focus-visible:ring-2"
      style={{
        color: 'var(--color-muted)',
        ...(hasPulse ? { animation: 'header-icon-pulse 2s ease-in-out' } : {}),
      }}
      aria-label={`AI Tutor chat${unreadCount > 0 ? ` (${unreadCount} unread messages)` : ''}`}
      aria-haspopup="dialog"
      title="AI Tutor Assistant"
    >
      <style>{`
        @keyframes header-icon-pulse {
          0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-primary) 40%, transparent); }
          70% { box-shadow: 0 0 0 8px color-mix(in srgb, var(--color-primary) 0%, transparent); }
          100% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-primary) 0%, transparent); }
        }
      `}</style>
      <IconMessageCircle size={20} />

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
          backgroundColor: 'var(--color-success)',
          borderColor: 'var(--color-surface)',
        }}
        aria-label="AI Tutor is online"
      />
    </button>
  )
}
