import { useEffect, useCallback, useRef, type ReactNode } from 'react'
import { IconClose } from '../icons/IconMap'

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full'

export interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  size?: ModalSize
  children: ReactNode
  footer?: ReactNode
  closeOnOverlay?: boolean
  showCloseButton?: boolean
}

const sizeStyle: Record<ModalSize, Record<string, string>> = {
  sm: { maxWidth: '400px' },
  md: { maxWidth: '520px' },
  lg: { maxWidth: '680px' },
  xl: { maxWidth: '900px' },
  full: { maxWidth: '100%', margin: 'var(--spacing-md)' },
}

function getScrollbarWidth(): number {
  return window.innerWidth - document.documentElement.clientWidth
}

export function Modal({
  open,
  onClose,
  title,
  size = 'md',
  children,
  footer,
  closeOnOverlay = true,
  showCloseButton = true,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const scrollbarWidthRef = useRef(0)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
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
    },
    [onClose],
  )

  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement
      scrollbarWidthRef.current = getScrollbarWidth()
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
      document.body.style.paddingRight = `${scrollbarWidthRef.current}px`
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
      document.body.style.paddingRight = ''
      previousFocusRef.current?.focus()
    }
  }, [open, handleKeyDown])

  if (!open) return null

  const content = (
    <div
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
        if (closeOnOverlay && e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          width: '100%',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border-light)',
          borderRadius: 'var(--radius-2xl)',
          boxShadow: 'var(--shadow-xl)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
          animation: 'slideUp var(--transition-normal)',
          ...sizeStyle[size],
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || showCloseButton) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 'var(--spacing-md) var(--spacing-lg)',
              borderBottom: '1px solid var(--color-border-light)',
            }}
          >
            {title && (
              <h2
                style={{
                  margin: 0,
                  fontSize: 'var(--text-lg)',
                  fontWeight: 'var(--weight-semibold)',
                  color: 'var(--color-text)',
                  fontFamily: 'var(--font-sans)',
                  lineHeight: 'var(--leading-tight)',
                }}
              >
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                type="button"
                aria-label="Close modal"
                onClick={onClose}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 'var(--spacing-xl)',
                  height: 'var(--spacing-xl)',
                  padding: 0,
                  marginLeft: 'auto',
                  background: 'none',
                  border: 'none',
                  borderRadius: 'var(--radius-full)',
                  cursor: 'pointer',
                  color: 'var(--color-muted)',
                  fontSize: 'var(--text-lg)',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <IconClose size={18} />
              </button>
            )}
          </div>
        )}
        <div
          style={{
            padding: 'var(--spacing-lg)',
            overflowY: 'auto',
            flex: 1,
          }}
        >
          {children}
        </div>
        {footer && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 'var(--spacing-sm)',
              padding: 'var(--spacing-md) var(--spacing-lg)',
              borderTop: '1px solid var(--color-border-light)',
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  )

  return content
}
