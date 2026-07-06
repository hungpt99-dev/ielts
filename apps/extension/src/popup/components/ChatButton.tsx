import { useState, useRef, useEffect } from 'react'
import { IconMessageSquare, IconClose } from '@ielts/ui'

interface ChatButtonProps {
  onToggle?: (isOpen: boolean) => void
}

export default function ChatButton({ onToggle }: ChatButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const popupRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    onToggle?.(isOpen)
  }, [isOpen, onToggle])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        isOpen &&
        popupRef.current &&
        !popupRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(prev => !prev)}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--spacing-xs)',
          padding: 'var(--spacing-sm) var(--spacing-md)',
          background: isOpen ? 'var(--color-surface-alt)' : 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          cursor: 'pointer',
          color: 'var(--color-text)',
          fontSize: 'var(--text-sm)',
          fontWeight: 'var(--weight-medium)',
          fontFamily: 'inherit',
          transition: 'var(--transition-fast)',
          width: '100%',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--color-surface-alt)'
          e.currentTarget.style.borderColor = 'var(--color-primary)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = isOpen ? 'var(--color-surface-alt)' : 'var(--color-surface)'
          e.currentTarget.style.borderColor = 'var(--color-border)'
        }}
      >
        <IconMessageSquare size={16} />
        <span>{isOpen ? 'Close Chat' : 'Chat'}</span>
      </button>

      {isOpen && (
        <div
          ref={popupRef}
          role="dialog"
          aria-label="Chat"
          style={{
            position: 'absolute',
            bottom: 'calc(100% + var(--spacing-xs))',
            left: '0',
            right: '0',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-lg)',
            padding: 'var(--spacing-md)',
            minHeight: '200px',
            maxHeight: '400px',
            overflowY: 'auto',
            zIndex: 'var(--z-dropdown)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 'var(--spacing-sm)',
            }}
          >
            <span style={{ fontWeight: 'var(--weight-semibold)', fontSize: 'var(--text-sm)', color: 'var(--color-text)', display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-2xs)' }}>
              <IconMessageSquare size={14} /> Chat
            </span>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 'var(--spacing-lg)',
                height: 'var(--spacing-lg)',
                background: 'none',
                border: 'none',
                color: 'var(--color-muted)',
                cursor: 'pointer',
                borderRadius: 'var(--radius-md)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--color-surface-alt)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none'
              }}
            >
              <IconClose size={14} />
            </button>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--spacing-xs)',
              color: 'var(--color-text-secondary)',
              fontSize: 'var(--text-sm)',
              lineHeight: '1.5',
            }}
          >
            <p style={{ margin: 0 }}>
              Welcome to the chat! Select text on any webpage and use the AI Tutor to get explanations, translations, and more.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
