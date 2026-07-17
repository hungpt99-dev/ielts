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
} from './utils'

const ThemeContext = createContext<ThemeContextValue>({
  mode: 'system',
  dark: false,
  accentColor: '#2563eb',
  setMode: () => {},
  toggle: () => {},
  setAccentColor: () => {},
})

interface ThemeProviderProps {
  children: ReactNode
  initialMode?: ThemeMode
  initialAccentColor?: string
  onModeChange?: (mode: ThemeMode) => void
  onAccentColorChange?: (color: string) => void
}

export function ThemeProvider({
  children,
  initialMode = 'system',
  initialAccentColor = '#2563eb',
  onModeChange,
  onAccentColorChange,
}: ThemeProviderProps) {
  const [mode, setModeState] = useState<ThemeMode>(initialMode)
  const [accentColor, setAccentColorState] = useState(initialAccentColor)
  const [systemDark, setSystemDark] = useState(getSystemTheme)

  const dark = isDarkMode(mode)

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode)
    onModeChange?.(newMode)
  }, [onModeChange])

  const toggle = useCallback(() => {
    setMode(dark ? 'light' : 'dark')
  }, [dark, setMode])

  const setAccentColor = useCallback((color: string) => {
    setAccentColorState(color)
    onAccentColorChange?.(color)
  }, [onAccentColorChange])

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
