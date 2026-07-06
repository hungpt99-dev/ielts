import { useEffect, useCallback, useRef, type ReactNode } from 'react'
import { IconClose } from '../icons/IconMap'

export type DrawerSide = 'left' | 'right' | 'bottom'
export type DrawerSize = 'sm' | 'md' | 'lg' | 'full'

export interface DrawerProps {
  open: boolean
  onClose: () => void
  title?: string
  side?: DrawerSide
  size?: DrawerSize
  children: ReactNode
  footer?: ReactNode
  closeOnOverlay?: boolean
  showCloseButton?: boolean
  dragToDismiss?: boolean
}

const sideStyle: Record<DrawerSide, Record<string, string>> = {
  left: {
    top: '0',
    left: '0',
    bottom: '0',
    flexDirection: 'column',
  },
  right: {
    top: '0',
    right: '0',
    bottom: '0',
    flexDirection: 'column',
  },
  bottom: {
    left: '0',
    right: '0',
    bottom: '0',
    flexDirection: 'column',
  },
}

const sizeStyle: Record<DrawerSide, Record<DrawerSize, Record<string, string>>> = {
  left: {
    sm: { width: 'min(280px, 85vw)' },
    md: { width: 'min(360px, 92vw)' },
    lg: { width: 'min(480px, 95vw)' },
    full: { width: '100%' },
  },
  right: {
    sm: { width: 'min(280px, 85vw)' },
    md: { width: 'min(360px, 92vw)' },
    lg: { width: 'min(480px, 95vw)' },
    full: { width: '100%' },
  },
  bottom: {
    sm: { height: '30vh' },
    md: { height: '50vh' },
    lg: { height: '70vh' },
    full: { height: '100vh' },
  },
}

export function Drawer({
  open,
  onClose,
  title,
  side = 'right',
  size = 'md',
  children,
  footer,
  closeOnOverlay = true,
  showCloseButton = true,
  dragToDismiss = true,
}: DrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const dragOffsetRef = useRef(0)
  const isDraggingRef = useRef(false)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Tab' && drawerRef.current) {
        const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
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
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
      previousFocusRef.current?.focus()
    }
  }, [open, handleKeyDown])

  const handleDragStart = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      if (!dragToDismiss) return
      isDraggingRef.current = true
      const pos = 'touches' in e ? e.touches[0] : e
      dragStartRef.current = { x: pos.clientX, y: pos.clientY }
      dragOffsetRef.current = 0
    },
    [dragToDismiss],
  )

  const handleDragMove = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      if (!isDraggingRef.current || !drawerRef.current) return
      const pos = 'touches' in e ? e.touches[0] : e
      if (side === 'right') {
        dragOffsetRef.current = Math.max(0, dragStartRef.current.x - pos.clientX)
      } else if (side === 'left') {
        dragOffsetRef.current = Math.max(0, pos.clientX - dragStartRef.current.x)
      } else {
        dragOffsetRef.current = Math.max(0, pos.clientY - dragStartRef.current.y)
      }
      drawerRef.current.style.transform =
        side === 'right'
          ? `translateX(${dragOffsetRef.current}px)`
          : side === 'left'
            ? `translateX(-${dragOffsetRef.current}px)`
            : `translateY(${dragOffsetRef.current}px)`
    },
    [side],
  )

  const handleDragEnd = useCallback(() => {
    if (!isDraggingRef.current) return
    isDraggingRef.current = false
    const threshold = 100
    if (dragOffsetRef.current > threshold) {
      onClose()
    } else if (drawerRef.current) {
      drawerRef.current.style.transform = ''
    }
    dragOffsetRef.current = 0
  }, [onClose])

  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 'var(--z-modal-backdrop)',
        background: 'var(--color-overlay)',
        WebkitBackdropFilter: 'blur(4px)',
        backdropFilter: 'blur(4px)',
        animation: 'fadeIn var(--transition-fast)',
      }}
      onClick={(e) => {
        if (closeOnOverlay && e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          position: 'fixed',
          display: 'flex',
          background: 'var(--color-surface)',
          borderLeft: side === 'right' ? '1px solid var(--color-border-light)' : undefined,
          borderRight: side === 'left' ? '1px solid var(--color-border-light)' : undefined,
          borderTop: side === 'bottom' ? '1px solid var(--color-border-light)' : undefined,
          boxShadow: 'var(--shadow-xl)',
          transition: isDraggingRef.current ? 'none' : 'all var(--transition-normal)',
          animation:
            side === 'right'
              ? 'slideInRight var(--transition-normal)'
              : side === 'left'
                ? 'slideInLeft var(--transition-normal)'
                : 'slideInUp var(--transition-normal)',
          ...sideStyle[side],
          ...sizeStyle[side][size],
        }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={handleDragStart}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchStart={handleDragStart}
        onTouchMove={handleDragMove}
        onTouchEnd={handleDragEnd}
      >
        {(title || showCloseButton) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 'var(--spacing-md) var(--spacing-lg)',
              borderBottom: '1px solid var(--color-border-light)',
              flexShrink: 0,
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
                }}
              >
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                type="button"
                aria-label="Close drawer"
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
              flexShrink: 0,
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
