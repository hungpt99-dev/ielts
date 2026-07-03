import { useState, useRef, useEffect } from 'react'

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
          gap: '6px',
          padding: '10px 14px',
          background: isOpen ? 'var(--color-surface-alt)' : 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          cursor: 'pointer',
          color: 'var(--color-text)',
          fontSize: '13px',
          fontWeight: 500,
          fontFamily: 'inherit',
          transition: 'all 0.15s ease',
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
        <span style={{ fontSize: '16px', lineHeight: '1' }}>💬</span>
        <span>{isOpen ? 'Close Chat' : 'Chat'}</span>
      </button>

      {isOpen && (
        <div
          ref={popupRef}
          role="dialog"
          aria-label="Chat"
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 8px)',
            left: '0',
            right: '0',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            padding: '16px',
            minHeight: '200px',
            maxHeight: '400px',
            overflowY: 'auto',
            zIndex: 100,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
            }}
          >
            <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--color-text)' }}>
              💬 Chat
            </span>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-muted)',
                cursor: 'pointer',
                fontSize: '16px',
                padding: '4px 8px',
                borderRadius: '6px',
                lineHeight: '1',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--color-surface-alt)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none'
              }}
            >
              ✕
            </button>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              color: 'var(--color-text-secondary)',
              fontSize: '13px',
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
