import { useEffect, useState, useCallback } from 'react'
import AITutorPopup from '../../features/ai-tutor/components/AITutorPopup'
import { STORAGE_KEYS } from '@ielts/config'

interface ChatIconState {
  isOpen: boolean
  unreadCount: number
}

function loadChatState(): ChatIconState {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.localStorage.aiTutorChatState)
    if (stored) {
      const parsed = JSON.parse(stored)
      return {
        isOpen: typeof parsed.isOpen === 'boolean' ? parsed.isOpen : false,
        unreadCount: typeof parsed.unreadCount === 'number' ? parsed.unreadCount : 0,
      }
    }
  } catch (error) {
  console.error('apps/web/src/components/aiTutor/ChatIcon.tsx error:', error);
  }
  return { isOpen: false, unreadCount: 0 }
}

function saveChatState(state: ChatIconState) {
  try {
    localStorage.setItem(STORAGE_KEYS.localStorage.aiTutorChatState, JSON.stringify(state))
  } catch (error) {
console.error('apps/web/src/components/aiTutor/ChatIcon.tsx error:', error);
  }
}

interface ChatIconProps {
  onToggle?: (isOpen: boolean) => void
  hideButton?: boolean
}

export default function ChatIcon({ onToggle, hideButton }: ChatIconProps) {
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
    const toggleHandler = () => {
      setState(prev => ({ ...prev, isOpen: !prev.isOpen, unreadCount: prev.isOpen ? prev.unreadCount : 0 }))
    }
    const openHandler = () => {
      setState(prev => prev.isOpen ? prev : { ...prev, isOpen: true })
    }
    window.addEventListener('toggle-ai-tutor-chat', toggleHandler)
    window.addEventListener('open-ai-tutor-chat', openHandler)
    return () => {
      window.removeEventListener('toggle-ai-tutor-chat', toggleHandler)
      window.removeEventListener('open-ai-tutor-chat', openHandler)
    }
  }, [])

  return (
    <>
      <AITutorPopup isOpen={isOpen} onClose={handleToggle} />

      {!hideButton && <button
        type="button"
        onClick={handleToggle}
        className="fixed right-4 sm:right-6 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl active:scale-95 bottom-[calc(72px+env(safe-area-inset-bottom,0px)+16px)] lg:bottom-6"
        style={{
          backgroundColor: 'var(--color-primary)',
          color: 'var(--color-on-primary)',
          zIndex: 'var(--z-ai-tutor, 60)',
          opacity: isOpen ? 0 : 1,
          pointerEvents: isOpen ? 'none' : 'auto',
        }}
        aria-label={isOpen ? 'Close AI Tutor chat' : 'Open AI Tutor chat'}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        title="AI Tutor Assistant"
      >
        {isOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}

        {!isOpen && unreadCount > 0 && (
          <span
            className="absolute -right-1 -top-1 flex min-w-[22px] items-center justify-center rounded-full px-1.5 text-xs font-bold leading-tight"
            style={{
              backgroundColor: 'var(--color-danger)',
              color: 'var(--color-on-danger)',
            }}
            aria-label={`${unreadCount} unread message${unreadCount !== 1 ? 's' : ''}`}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>}
    </>
  )
}
