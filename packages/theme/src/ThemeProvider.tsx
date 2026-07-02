import {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useState,
  type ReactNode,
} from 'react'
import type { ThemeMode, ThemeContextValue } from './types'
import {
  getSystemTheme,
  isDarkMode,
  applyTheme,
  applyAccentColor,
  getStoredThemeMode,
  storeThemeMode,
  getStoredAccentColor,
  storeAccentColor,
  clearLegacyDarkModeStorage,
} from './utils'

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'system',
  dark: false,
  accentColor: '#2563eb',
  setMode: () => {},
  toggle: () => {},
  setAccentColor: () => {},
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(getStoredThemeMode)
  const [accentColor, setAccentColorState] = useState(getStoredAccentColor)
  const [systemDark, setSystemDark] = useState(getSystemTheme)

  const dark = isDarkMode(mode)

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode)
    storeThemeMode(newMode)
    clearLegacyDarkModeStorage()
  }, [])

  const toggle = useCallback(() => {
    setMode(dark ? 'light' : 'dark')
  }, [dark, setMode])

  const setAccentColor = useCallback((color: string) => {
    setAccentColorState(color)
    storeAccentColor(color)
  }, [])

  useEffect(() => {
    applyTheme(mode)
  }, [mode, systemDark])

  useEffect(() => {
    applyAccentColor(accentColor)
  }, [accentColor])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      const newSystemDark = getSystemTheme()
      setSystemDark(newSystemDark)
      if (mode === 'system') {
        applyTheme('system')
      }
    }
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [mode])

  return (
    <ThemeContext.Provider
      value={{ mode, dark, accentColor, setMode, toggle, setAccentColor }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext)
}
