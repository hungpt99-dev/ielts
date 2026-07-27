import { Routes, Route, Navigate } from 'react-router-dom'
import { ROUTES } from '@ielts/config'
import { ThemeProvider } from '../context/ThemeContext'
import { ToastProvider } from '../components/ui/Toast'
import ErrorBoundary from '../components/ui/ErrorBoundary'
import LandingPage from '../pages/LandingPage'
import PrivacyPage from '../pages/PrivacyPage'
import PublicTabPage from '../components/PublicTabPage'

export default function LandingApp() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ToastProvider>
          <Routes>
            <Route path={ROUTES.landing} element={<LandingPage />} />
            <Route path={ROUTES.privacy} element={<PrivacyPage />} />
            <Route path={ROUTES.info} element={<PublicTabPage />} />
            <Route path={ROUTES.feedback} element={<PublicTabPage />} />
            <Route path="*" element={<Navigate to={ROUTES.landing} replace />} />
          </Routes>
        </ToastProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
