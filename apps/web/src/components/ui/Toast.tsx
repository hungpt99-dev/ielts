import { useEffect, useState, useCallback, useRef, createContext, useContext, type ReactNode } from 'react'
import { IconCheckCircle, IconAlertCircle, IconInfo, IconWarning } from '@ielts/ui'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastMessage {
  id: string
  type: ToastType
  message: string
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastContextValue {
  showToast: (type: ToastType, message: string, action?: ToastMessage['action']) => void
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
})

export function useToast() {
  return useContext(ToastContext)
}

const iconMap: Record<ToastType, ReactNode> = {
  success: <IconCheckCircle size={16} />,
  error: <IconAlertCircle size={16} />,
  info: <IconInfo size={16} />,
  warning: <IconWarning size={16} />,
}

const bgColors: Record<ToastType, string> = {
  success: 'var(--color-success)',
  error: 'var(--color-danger)',
  info: 'var(--color-info)',
  warning: 'var(--color-warning)',
}

function ToastItem({ toast, onRemove }: { toast: ToastMessage; onRemove: (id: string) => void }) {
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

  function handleDismiss() {
    setExiting(true)
    setTimeout(() => onRemove(toast.id), 200)
  }

  return (
    <div
      className={`flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium shadow-lg pointer-events-auto transition-all duration-200 max-w-sm break-words ${
        exiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'
      }`}
      style={{
        background: bgColors[toast.type],
        color: 'var(--color-on-primary)',
        fontFamily: 'var(--font-sans)',
      }}
      role="alert"
    >
      <span className="flex shrink-0 items-center justify-center" aria-hidden="true">
        {iconMap[toast.type]}
      </span>
      <span className="flex-1">{toast.message}</span>
      {toast.action && (
        <button
          type="button"
          onClick={() => {
            toast.action!.onClick()
            onRemove(toast.id)
          }}
          className="shrink-0 rounded-lg px-2 py-0.5 text-xs font-semibold cursor-pointer"
          style={{
            background: 'var(--color-overlay)',
            border: '1px solid var(--color-border-light)',
            color: 'inherit',
          }}
        >
          {toast.action.label}
        </button>
      )}
      <button
        onClick={handleDismiss}
        className="shrink-0 rounded-full p-0.5 hover:opacity-80"
        style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', opacity: 0.7 }}
        aria-label="Dismiss notification"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const counterRef = useRef(0)

  const showToast = useCallback((type: ToastType, message: string, action?: ToastMessage['action']) => {
    counterRef.current += 1
    const id = `toast-${counterRef.current}-${Date.now()}`
    setToasts(prev => [...prev, { id, type, message, action }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className="fixed bottom-6 right-6 z-[var(--z-toast)] flex flex-col gap-2 pointer-events-none"
        role="status"
        aria-live="polite"
        aria-relevant="additions removals"
      >
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onRemove={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
