import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from '../context/ThemeContext'
import { SettingsProvider } from '../context/SettingsContext'
import AppLayout from '../components/Layout'
import LandingPage from '../pages/LandingPage'
import { isOnboardingComplete } from '../features/onboarding/onboardingService'
import { ToastProvider } from '../components/ui/Toast'
import ErrorBoundary from '../components/ui/ErrorBoundary'
import { initProactiveTutor } from '../services/proactiveTutorInit'
import { initDataSyncManager } from '../services/storage/DataSyncManager'

export default function App() {
  useEffect(() => {
    initProactiveTutor()
    initDataSyncManager()
  }, [])

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <SettingsProvider>
          <ToastProvider>
            <Routes>
              <Route
                path="/"
                element={
                  isOnboardingComplete()
                    ? <Navigate to="/dashboard" replace />
                    : <LandingPage />
                }
              />
              <Route path="/*" element={<AppLayout />} />
            </Routes>
          </ToastProvider>
        </SettingsProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
