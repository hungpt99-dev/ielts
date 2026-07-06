import {
  useEffect,
  useState,
  useCallback,
  createContext,
  useContext,
  useRef,
  type ReactNode,
} from 'react'
import { IconCheckCircle, IconAlertCircle, IconInfo, IconWarning } from '../icons/IconMap'

export type ToastType = 'success' | 'error' | 'info' | 'warning'
export type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'

export interface ToastMessage {
  id: string
  type: ToastType
  message: string
  action?: {
    label: string
    onClick: () => void
  }
}

export interface ToastContextValue {
  showToast: (type: ToastType, message: string, action?: ToastMessage['action']) => void
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
})

export function useToast(): ToastContextValue {
  return useContext(ToastContext)
}

const iconMap: Record<ToastType, ReactNode> = {
  success: <IconCheckCircle size={16} />,
  error: <IconAlertCircle size={16} />,
  info: <IconInfo size={16} />,
  warning: <IconWarning size={16} />,
}

const bgMap: Record<ToastType, string> = {
  success: 'var(--color-success)',
  error: 'var(--color-danger)',
  info: 'var(--color-info)',
  warning: 'var(--color-warning)',
}

function ToastItem({
  toast,
  onRemove,
}: {
  toast: ToastMessage
  onRemove: (id: string) => void
}) {
  const [exiting, setExiting] = useState(false)
  const removeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true)
      removeTimerRef.current = setTimeout(() => onRemove(toast.id), 200)
    }, 2800)
    return () => {
      clearTimeout(timer)
      if (removeTimerRef.current) clearTimeout(removeTimerRef.current)
    }
  }, [toast.id, onRemove])

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-xs)',
        padding: 'var(--spacing-xs) var(--spacing-sm)',
        borderRadius: 'var(--radius-xl)',
        background: bgMap[toast.type],
        color: 'var(--color-on-primary)',
        fontSize: 'var(--text-sm)',
        fontFamily: 'var(--font-sans)',
        lineHeight: 'var(--leading-normal)',
        boxShadow: 'var(--shadow-lg)',
        pointerEvents: 'auto',
        opacity: exiting ? '0' : '1',
        transform: exiting ? 'translateX(100%)' : 'translateX(0)',
        transition: 'opacity var(--transition-normal), transform var(--transition-normal)',
        maxWidth: '400px',
        wordBreak: 'break-word',
        fontWeight: 'var(--weight-medium)',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          flexShrink: 0,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '16px',
          height: '16px',
        }}
      >
        {iconMap[toast.type]}
      </span>
      <span style={{ flex: 1 }}>{toast.message}</span>
      {toast.action && (
        <button
          type="button"
          onClick={() => {
            toast.action!.onClick()
            onRemove(toast.id)
          }}
          style={{
            flexShrink: 0,
            background: 'var(--color-overlay)',
            border: '1px solid var(--color-border-light)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--spacing-2xs) var(--spacing-xs)',
            fontSize: 'var(--text-xs)',
            fontWeight: 'var(--weight-semibold)',
            color: 'inherit',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            transition: 'background var(--transition-fast)',
          }}
        >
          {toast.action.label}
        </button>
      )}
    </div>
  )
}

export interface ToastProviderProps {
  children: ReactNode
  position?: ToastPosition
}

export function ToastProvider({ children, position = 'bottom-right' }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const counterRef = useRef(0)

  const showToast = useCallback((type: ToastType, message: string, action?: ToastMessage['action']) => {
    counterRef.current += 1
    const id = `toast-${counterRef.current}-${Date.now()}`
    setToasts((prev) => [...prev, { id, type, message, action }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const positionStyle = (() => {
    switch (position) {
      case 'top-left': return { top: 'var(--spacing-lg)', left: 'var(--spacing-lg)' } as const
      case 'top-right': return { top: 'var(--spacing-lg)', right: 'var(--spacing-lg)' } as const
      case 'top-center': return { top: 'var(--spacing-lg)', left: '50%', transform: 'translateX(-50%)' } as const
      case 'bottom-left': return { bottom: 'var(--spacing-lg)', left: 'var(--spacing-lg)' } as const
      case 'bottom-center': return { bottom: 'var(--spacing-lg)', left: '50%', transform: 'translateX(-50%)' } as const
      default: return { bottom: 'var(--spacing-lg)', right: 'var(--spacing-lg)' } as const
    }
  })()

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        style={{
          position: 'fixed',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--spacing-xs)',
          zIndex: 'var(--z-toast)',
          pointerEvents: 'none',
          ...positionStyle,
        }}
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}
