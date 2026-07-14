import { useState, useEffect } from 'react'

export default function OfflineIndicator() {
  const [offline, setOffline] = useState(false)
  const [dbHealthy, setDbHealthy] = useState(true)

  useEffect(() => {
    setOffline(!navigator.onLine)

    async function checkDbHealth() {
      try {
        if (!window.indexedDB) {
          setDbHealthy(false)
          return
        }
        const { isDbOpen } = await import('@ielts/storage')
        if (isDbOpen()) {
          setDbHealthy(true)
          return
        }
        const req = window.indexedDB.open('__ielts_health__')
        await new Promise<void>((resolve, reject) => {
          req.onsuccess = () => { req.result.close(); window.indexedDB.deleteDatabase('__ielts_health__'); resolve() }
          req.onerror = () => reject(req.error)
        })
        setDbHealthy(true)
      } catch (error) {
        console.error('apps/web/src/components/ui/OfflineIndicator.tsx error:', error);
        setDbHealthy(false)
      }
    }

    checkDbHealth()

    function handleOnline() { setOffline(false) }
    function handleOffline() { setOffline(true) }
    function handleDbReady() { setDbHealthy(true) }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('app-db-ready', handleDbReady)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('app-db-ready', handleDbReady)
    }
  }, [])

  if (!offline && dbHealthy) return null

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[var(--z-banner)] flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium"
      style={{
        backgroundColor: offline ? 'var(--color-warning)' : 'var(--color-danger)',
        color: offline ? 'var(--color-warning-dark)' : 'var(--color-on-danger)',
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 8px)',
      }}
      role="alert"
      aria-live="assertive"
    >
      <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 010 12.728m-2.829-2.829a5 5 0 000-7.07m-4.243 4.243a2 2 0 010-2.828M3 3l18 18" />
      </svg>
      {offline ? (
        <span>You are offline. Your data is saved locally and will sync when you reconnect.</span>
      ) : (
        <span>Local storage is not available. Some features may not work.</span>
      )}
    </div>
  )
}
