import { ChatWidget } from './ChatWidget'
import type { ChatWidgetProps } from '@ielts/ai-tutor-engine'
import { useState, useEffect } from 'react'
import { STORAGE_KEYS } from '@ielts/config'

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

  // TODO: replace with a proper settings hook
  useEffect(() => {
    if (hasAiKeyProp !== undefined) {
      setHasAiKey(hasAiKeyProp)
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
