export type ThemeMode = 'light' | 'dark' | 'system'

export interface ThemeContextValue {
  mode: ThemeMode
  dark: boolean
  accentColor: string
  setMode: (mode: ThemeMode) => void
  toggle: () => void
  setAccentColor: (color: string) => void
}

export interface DesignTokens {
  color: {
    background: string
    surface: string
    surfaceAlt: string
    primary: string
    primaryHover: string
    primaryLight: string
    text: string
    textSecondary: string
    muted: string
    border: string
    success: string
    successLight: string
    warning: string
    warningLight: string
    danger: string
    dangerLight: string
    info: string
    infoLight: string
  }
  radius: {
    sm: string
    md: string
    lg: string
    xl: string
  }
  spacing: {
    xs: string
    sm: string
    md: string
    lg: string
    xl: string
  }
  shadow: {
    sm: string
    md: string
    lg: string
  }
  font: {
    sans: string
    mono: string
  }
  transition: {
    fast: string
    normal: string
  }
}
