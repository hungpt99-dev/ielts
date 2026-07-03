import {
  useEffect,
  useState,
  useCallback,
  createContext,
  useContext,
  useRef,
  type ReactNode,
} from 'react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface ToastMessage {
  id: string
  type: ToastType
  message: string
}

interface ToastContextValue {
  showToast: (type: ToastType, message: string) => void
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
})

export function useToast(): ToastContextValue {
  return useContext(ToastContext)
}

const ICON: Record<ToastType, string> = {
  success: '✓',
  error: '✕',
  info: 'ℹ',
  warning: '⚠',
}

const BG: Record<ToastType, string> = {
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
        gap: '8px',
        padding: '10px 14px',
        borderRadius: 'var(--radius-md)',
        background: BG[toast.type],
        color: 'var(--color-on-primary, #ffffff)',
        fontSize: '13px',
        lineHeight: '1.4',
        boxShadow: 'var(--shadow-md)',
        pointerEvents: 'auto',
        opacity: exiting ? '0' : '1',
        transform: exiting ? 'translateX(100%)' : 'translateX(0)',
        transition: 'opacity 0.2s ease, transform 0.2s ease',
        maxWidth: '360px',
        wordBreak: 'break-word',
      }}
    >
      <span aria-hidden="true" style={{ flexShrink: 0, fontSize: '14px', fontWeight: 700 }}>
        {ICON[toast.type]}
      </span>
      <span>{toast.message}</span>
    </div>
  )
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const counterRef = useRef(0)

  const showToast = useCallback((type: ToastType, message: string) => {
    counterRef.current += 1
    const id = `toast-${counterRef.current}-${Date.now()}`
    setToasts((prev) => [...prev, { id, type, message }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        style={{
          position: 'fixed',
          bottom: '16px',
          right: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          zIndex: 2147483647,
          pointerEvents: 'none',
        }}
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}
