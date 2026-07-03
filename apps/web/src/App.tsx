import { Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { SettingsProvider } from './context/SettingsContext'
import AppLayout from './components/Layout'
import LandingPage from './pages/LandingPage'

export default function App() {
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
