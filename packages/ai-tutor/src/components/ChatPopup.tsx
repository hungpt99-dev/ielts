import { ChatWidget } from './ChatWidget'
import type { ChatWidgetProps } from '../types'
import { useState, useEffect } from 'react'

interface ChatPopupProps extends ChatWidgetProps {
  onOpenSettings?: () => void
}

export default function ChatPopup({ isOpen, onClose, hasAiKey: hasAiKeyProp, onOpenSettings }: ChatPopupProps) {
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
    />
  )
}
