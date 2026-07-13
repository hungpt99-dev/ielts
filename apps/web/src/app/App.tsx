import { useEffect, useState, useRef } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from '../context/ThemeContext'
import { SettingsProvider } from '../context/SettingsContext'
import AppLayout from '../components/Layout'
import LandingPage from '../pages/LandingPage'
import OnboardingPage from '../pages/OnboardingPage'
import { isOnboardingComplete } from '../features/onboarding/onboardingService'
import { ToastProvider } from '../components/ui/Toast'
import ErrorBoundary from '../components/ui/ErrorBoundary'
import OfflineIndicator from '../components/ui/OfflineIndicator'
import PwaUpdateBanner from '../components/ui/PwaUpdateBanner'
import { initializeAITutorEngine, initializeLearningEngine } from '../services/engineBootstrap'
import '../features/sync/bridge/webSyncBridge'
import { APP_SCHEMA } from '@ielts/storage'
import { initDb, getDb } from '@ielts/storage'
import { initNativePlatform, useNativeBackButton, useNativeAppState } from '../services/nativePlatform'

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
      console.warn(`[App] DB init attempt ${attempt + 1}/${retries + 1} failed:`, err)
      if (attempt < retries) {
        await new Promise(r => setTimeout(r, DB_INIT_RETRY_DELAY))
      }
    }
  }
  return false
}

export default function App() {
  const [initError, setInitError] = useState(false)
  const initAttempted = useRef(false)

  useNativeBackButton()
  useNativeAppState()

  useEffect(() => {
    if (initAttempted.current) return
    initAttempted.current = true

    let cancelled = false

    async function bootstrap() {
      await initNativePlatform()
      const ok = await ensureDbReady()
      if (cancelled) return
      if (!ok) {
        setInitError(true)
        return
      }
      window.dispatchEvent(new Event('app-db-ready'))
      try {
        await initializeAITutorEngine()
      } catch { /* non-critical */ }
      try {
        await initializeLearningEngine()
      } catch { /* non-critical */ }
    }

    bootstrap()

    function handlePwaOfflineReady() {
      if (!cancelled) {
        window.dispatchEvent(new CustomEvent('app-offline-ready'))
      }
    }
    window.addEventListener('pwa-offline-ready', handlePwaOfflineReady)
    return () => {
      cancelled = true
      window.removeEventListener('pwa-offline-ready', handlePwaOfflineReady)
    }
  }, [])

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <SettingsProvider>
          <ToastProvider>
            <OfflineIndicator />
            <PwaUpdateBanner />
            {initError && (
              <div
                className="fixed top-0 left-0 right-0 z-[var(--z-banner)] flex items-center gap-2 px-4 py-3 text-sm font-medium"
                style={{
                  backgroundColor: 'var(--color-danger)',
                  color: '#fff',
                  paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)',
                }}
                role="alert"
              >
                <span>Storage initialization failed. Some features may not work. Try refreshing the page.</span>
              </div>
            )}
            <Routes>
              <Route
                path="/"
                element={
                  isOnboardingComplete()
                    ? <Navigate to="/dashboard" replace />
                    : <Navigate to="/onboarding" replace />
                }
              />
              <Route path="/landing" element={<LandingPage />} />
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route path="/*" element={<AppLayout />} />
            </Routes>
          </ToastProvider>
        </SettingsProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
