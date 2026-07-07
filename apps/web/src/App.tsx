import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { SettingsProvider } from './context/SettingsContext'
import AppLayout from './components/Layout'
import LandingPage from './pages/LandingPage'
import { initProactiveTutor } from './services/proactiveTutorInit'

export default function App() {
  useEffect(() => {
    initProactiveTutor()
  }, [])

  return (
    <ThemeProvider>
      <SettingsProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/*" element={<AppLayout />} />
        </Routes>
      </SettingsProvider>
    </ThemeProvider>
  )
}
