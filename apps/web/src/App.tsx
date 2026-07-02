import { useEffect, useState } from 'react'
import { ThemeProvider } from './context/ThemeContext'
import { SettingsProvider } from './context/SettingsContext'
import AppLayout from './components/Layout'
import { loadSeedData, isSeedDataLoaded } from './data/seed'

function SeedDataLoader({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(isSeedDataLoaded)

  useEffect(() => {
    if (!ready) {
      loadSeedData().then(() => setReady(true)).catch(() => setReady(true))
    }
  }, [ready])

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
            Loading your IELTS journey...
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export default function App() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <SeedDataLoader>
          <AppLayout />
        </SeedDataLoader>
      </SettingsProvider>
    </ThemeProvider>
  )
}
