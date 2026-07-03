import { useEffect, useState, useCallback } from 'react'
import AITutorChat from '../../features/ai-tutor/AITutorChat'

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
}

export default function ChatIcon({ onToggle }: ChatIconProps) {
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
      setState(prev => ({ ...prev, isOpen: !prev.isOpen, unreadCount: prev.isOpen ? prev.unreadCount : 0 }))
    }
    window.addEventListener('toggle-ai-tutor-chat', handler)
    return () => window.removeEventListener('toggle-ai-tutor-chat', handler)
  }, [])

  return <AITutorChat isOpen={isOpen} onClose={handleToggle} />
}
