import { useState, useEffect } from 'react'

export default function PwaUpdateBanner() {
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    function handleUpdate() {
      if (!dismissed) setVisible(true)
    }
    window.addEventListener('pwa-update-available', handleUpdate)
    return () => window.removeEventListener('pwa-update-available', handleUpdate)
  }, [dismissed])

  function handleUpdateNow() {
    setVisible(false)
    window.location.reload()
  }

  function handleDismiss() {
    setVisible(false)
    setDismissed(true)
  }

  if (!visible) return null

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[var(--z-banner)] flex items-center justify-between gap-3 px-4 py-3 shadow-xl"
      style={{
        backgroundColor: 'var(--color-surface)',
        borderTop: '1px solid var(--color-border)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)',
      }}
      role="alert"
      aria-live="polite"
    >
      <p className="text-sm" style={{ color: 'var(--color-text)', fontFamily: 'var(--font-sans)' }}>
        A new version is available.
      </p>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleDismiss}
          className="rounded-lg px-3 py-1.5 text-sm font-medium"
          style={{
            color: 'var(--color-text-secondary)',
            background: 'none',
            border: '1px solid var(--color-border)',
            cursor: 'pointer',
            touchAction: 'manipulation',
            minHeight: 44,
          }}
          aria-label="Dismiss update notification"
        >
          Later
        </button>
        <button
          onClick={handleUpdateNow}
          className="rounded-lg px-4 py-1.5 text-sm font-semibold"
          style={{
            color: '#fff',
            backgroundColor: 'var(--color-primary)',
            border: 'none',
            cursor: 'pointer',
            touchAction: 'manipulation',
            minHeight: 44,
          }}
          aria-label="Update now"
        >
          Update
        </button>
      </div>
    </div>
  )
}
