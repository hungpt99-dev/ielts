import { useEffect, useState, useRef } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ROUTES } from '@ielts/config'
import { ThemeProvider } from '@ielts/web-app/context/ThemeContext'
import { SettingsProvider } from '@ielts/web-app/context/SettingsContext'
import AppLayout from '@ielts/web-app/components/Layout'
import { ToastProvider } from '@ielts/web-app/components/ui/Toast'
import ErrorBoundary from '@ielts/web-app/components/ui/ErrorBoundary'
import OfflineIndicator from '@ielts/web-app/components/ui/OfflineIndicator'
import { initializeAITutorEngine, initializeLearningEngine } from '@ielts/web-app/services/engineBootstrap'
import { APP_SCHEMA, initDb, getDb } from '@ielts/storage'
import { useExtensionDataRefresh } from './useExtensionDataRefresh'

const DB_INIT_RETRIES = 2
const DB_INIT_RETRY_DELAY = 500

async function ensureDbReady(retries = DB_INIT_RETRIES): Promise<boolean> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      initDb(APP_SCHEMA)
      const db = getDb()
      await db.open()
      return true
    } catch (err) {
      console.error('[ExtensionApp] DB init attempt failed:', err)
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, DB_INIT_RETRY_DELAY))
      }
    }
  }
  return false
}

export default function ExtensionApp() {
  const [initError, setInitError] = useState(false)
  const initAttempted = useRef(false)

  useExtensionDataRefresh()

  useEffect(() => {
    if (initAttempted.current) return
    initAttempted.current = true

    let cancelled = false

    async function bootstrap() {
      const ok = await ensureDbReady()
      if (!ok) {
        if (!cancelled) setInitError(true)
        return
      }
      if (!cancelled) {
        window.dispatchEvent(new Event('app-db-ready'))
      }
      try { await initializeAITutorEngine() } catch { /* non-critical */ }
      try { await initializeLearningEngine() } catch { /* non-critical */ }
    }

    bootstrap()

    return () => { cancelled = true }
  }, [])

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <SettingsProvider>
          <ToastProvider>
            <OfflineIndicator />
            {initError && (
              <div
                className="fixed top-0 left-0 right-0 z-[9999] flex items-center gap-2 px-4 py-3 text-sm font-medium"
                style={{
                  backgroundColor: 'var(--color-danger)',
                  color: '#fff',
                  paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)',
                }}
                role="alert"
              >
                <span>Storage initialization failed. Some features may not work. Try reloading the extension.</span>
              </div>
            )}
            <Routes>
              <Route
                path={ROUTES.landing}
                element={<Navigate to={ROUTES.dashboard} replace />}
              />
              <Route path="/landing" element={<Navigate to={ROUTES.landing} replace />} />
              <Route path="/tutor" element={<Navigate to={ROUTES.tutor} replace />} />
              <Route path="/roadmap" element={<Navigate to={ROUTES.roadmap} replace />} />
              <Route path="/reading" element={<Navigate to={ROUTES.reading} replace />} />
              <Route path="/listening" element={<Navigate to={ROUTES.listening} replace />} />
              <Route path="/*" element={<AppLayout />} />
            </Routes>
          </ToastProvider>
        </SettingsProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
