import { useEffect, useState } from 'react'
import { ThemeProvider } from '../context/ThemeContext'
import { SettingsProvider } from '../context/SettingsContext'
import AppLayout from '../components/Layout'
import { ToastProvider } from '../components/ui/Toast'
import { loadSeedData, isSeedDataLoaded } from '../data/seed'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ErrorBoundary from '../components/ui/ErrorBoundary'

function SeedDataLoader({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(isSeedDataLoaded)

  useEffect(() => {
    if (!ready) {
      loadSeedData().then(() => setReady(true)).catch(() => setReady(true))
    }
  }, [ready])

  if (!ready) {
    return <LoadingSpinner size="lg" message="Loading your IELTS journey..." fullPage />
  }

  return <>{children}</>
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <SettingsProvider>
          <ToastProvider>
            <ErrorBoundary>
              <SeedDataLoader>
                <AppLayout />
              </SeedDataLoader>
            </ErrorBoundary>
          </ToastProvider>
        </SettingsProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
