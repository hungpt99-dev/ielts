import { useEffect, useCallback, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { IconClose } from '@ielts/ui'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  footer?: ReactNode
  closeOnOverlay?: boolean
  showCloseButton?: boolean
}

const sizeClasses = {
  sm: 'w-[380px] max-w-full',
  md: 'w-[500px] max-w-full',
  lg: 'w-[660px] max-w-full',
  xl: 'w-[880px] max-w-full',
  full: 'w-full max-w-full mx-4',
}

export default function Modal({
  open,
  onClose,
  title,
  children,
  size = 'md',
  footer,
  closeOnOverlay = true,
  showCloseButton = true,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  onCloseRef.current = onClose

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onCloseRef.current()
    if (e.key === 'Tab' && dialogRef.current) {
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last?.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first?.focus()
        }
      }
    }
  }, [])

  useEffect(() => {
    if (!open) return

    previousFocusRef.current = document.activeElement as HTMLElement
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`
    }

    dialogRef.current?.focus()

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
      previousFocusRef.current?.focus()
    }
  }, [open, handleKeyDown])

  if (!open) return null

  return createPortal(
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 'var(--z-modal-backdrop)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--spacing-md)',
        background: 'var(--color-overlay)',
        animation: 'fadeIn var(--transition-fast)',
      }}
      onClick={(e) => {
        if (closeOnOverlay && e.target === overlayRef.current) onClose()
      }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        style={{
          maxHeight: '90vh',
          overflowY: 'auto',
          borderRadius: 'var(--radius-2xl)',
          border: '1px solid var(--color-border-light)',
          background: 'var(--color-surface)',
          boxShadow: 'var(--shadow-xl)',
          outline: 'none',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideUp var(--transition-normal)',
        }}
        className={sizeClasses[size]}
      >
        {(title || showCloseButton) && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'var(--spacing-md) var(--spacing-lg)',
            borderBottom: '1px solid var(--color-border-light)',
          }}>
            {title && (
              <h2 style={{ margin: 0, fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)', fontFamily: 'var(--font-sans)' }}>
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                aria-label="Close dialog"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '44px',
                  height: '44px',
                  borderRadius: 'var(--radius-full)',
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--color-muted)',
                  cursor: 'pointer',
                  transition: 'all var(--transition-fast)',
                  marginLeft: 'auto',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <IconClose size={18} />
              </button>
            )}
          </div>
        )}
        <div style={{ padding: 'var(--spacing-lg)', flex: 1, overflowY: 'auto' }}>
          {children}
        </div>
        {footer && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 'var(--spacing-sm)',
            padding: 'var(--spacing-md) var(--spacing-lg)',
            borderTop: '1px solid var(--color-border-light)',
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
