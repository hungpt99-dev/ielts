import { useEffect, useState, useCallback, createContext, useContext, type ReactNode } from 'react'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastMessage {
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

export function useToast() {
  return useContext(ToastContext)
}

const iconPaths: Record<ToastType, string> = {
  success: 'M5 13l4 4L19 7',
  error: 'M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  warning: 'M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
}

const toastStyles: Record<ToastType, string> = {
  success: 'border-[var(--color-success)] bg-[var(--color-success-light)] text-[var(--color-success)]',
  error: 'border-[var(--color-danger)] bg-[var(--color-danger-light)] text-[var(--color-danger)]',
  info: 'border-[var(--color-info)] bg-[var(--color-info-light)] text-[var(--color-info)]',
  warning: 'border-[var(--color-warning)] bg-[var(--color-warning-light)] text-[var(--color-warning)]',
}

function ToastItem({ toast, onRemove }: { toast: ToastMessage; onRemove: (id: string) => void }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const enter = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(enter)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(false)
      setTimeout(() => onRemove(toast.id), 200)
    }, 4000)
    return () => clearTimeout(timer)
  }, [toast.id, onRemove])

  function handleDismiss() {
    setMounted(false)
    setTimeout(() => onRemove(toast.id), 200)
  }

  return (
    <div
      className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm shadow-lg transition-all duration-200 ${
        mounted ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      } ${toastStyles[toast.type]}`}
      role="alert"
    >
      <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d={iconPaths[toast.type]} />
      </svg>
      {toast.message}
      <button
        onClick={handleDismiss}
        className="ml-2 shrink-0 rounded p-0.5 hover:bg-black/10"
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

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
    setToasts(prev => [...prev, { id, type, message }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm pointer-events-none"
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
