import { useState, useCallback, type ReactNode } from 'react'
import {
  ThemeProvider as BaseThemeProvider,
  useTheme as baseUseTheme,
} from '@ielts/theme'
import type { ThemeMode } from '@ielts/theme'

function readStoredMode(): ThemeMode {
  try {
    const stored = localStorage.getItem('ielts-theme-mode')
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  } catch { /* ignore */ }
  return 'system'
}

function readStoredAccentColor(): string {
  try {
    return localStorage.getItem('ielts-accent-color') || '#2563eb'
  } catch { /* ignore */ }
  return '#2563eb'
}

function persistMode(mode: ThemeMode): void {
  try {
    localStorage.setItem('ielts-theme-mode', mode)
    localStorage.removeItem('ielts-dark-mode')
  } catch { /* ignore */ }
}

function persistAccentColor(color: string): void {
  try {
    localStorage.setItem('ielts-accent-color', color)
  } catch { /* ignore */ }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [storedMode, setStoredMode] = useState<ThemeMode>(readStoredMode)
  const [storedAccent, setStoredAccent] = useState(readStoredAccentColor)

  const handleModeChange = useCallback((mode: ThemeMode) => {
    setStoredMode(mode)
    persistMode(mode)
  }, [])

  const handleAccentChange = useCallback((color: string) => {
    setStoredAccent(color)
    persistAccentColor(color)
  }, [])

  return (
    <BaseThemeProvider
      initialMode={storedMode}
      initialAccentColor={storedAccent}
      onModeChange={handleModeChange}
      onAccentColorChange={handleAccentChange}
    >
      {children}
    </BaseThemeProvider>
  )
}

export const useTheme = baseUseTheme
