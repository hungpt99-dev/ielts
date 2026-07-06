import { ChatWidget } from './ChatWidget'
import type { ChatWidgetProps } from '../types'
import { useState, useEffect } from 'react'

interface ChatPopupProps extends ChatWidgetProps {
  onOpenSettings?: () => void
}

export default function ChatPopup({
  isOpen,
  onClose,
  hasAiKey: hasAiKeyProp,
  onOpenSettings,
  onSendMessage,
  onQuickAction,
  onClearChat,
  contextSuggestions,
  title = 'AI Tutor',
  subtitle = 'Online · IELTS Coach',
  placeholder = 'Type a message...',
  className,
  voiceButton,
  voiceInput,
}: ChatPopupProps) {
  const [hasAiKey, setHasAiKey] = useState(hasAiKeyProp ?? false)

  useEffect(() => {
    if (hasAiKeyProp !== undefined) {
      setHasAiKey(hasAiKeyProp)
      return
    }
    try {
      const raw = localStorage.getItem('ielts-settings')
      if (raw) {
        const settings = JSON.parse(raw)
        setHasAiKey(!!settings.aiApiKey)
      }
    } catch {
      /* ignore */
    }
  }, [hasAiKeyProp])

  return (
    <ChatWidget
      isOpen={isOpen}
      onClose={onClose}
      hasAiKey={hasAiKey}
      onOpenSettings={onOpenSettings ?? (() => {
        window.location.hash = '#/settings'
        onClose()
      })}
      onSendMessage={onSendMessage}
      onQuickAction={onQuickAction}
      onClearChat={onClearChat}
      contextSuggestions={contextSuggestions}
      title={title}
      subtitle={subtitle}
      placeholder={placeholder}
      className={className}
      voiceButton={voiceButton}
      voiceInput={voiceInput}
    />
  )
}
