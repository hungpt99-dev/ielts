import type { DesignTokens } from './types'

export const TOKENS: DesignTokens = {
  color: {
    background: '#f8fafc',
    surface: '#ffffff',
    surfaceAlt: '#f1f5f9',
    primary: '#2563eb',
    primaryHover: '#1d4ed8',
    primaryLight: '#dbeafe',
    text: '#0f172a',
    textSecondary: '#475569',
    muted: '#94a3b8',
    border: '#e2e8f0',
    success: '#22c55e',
    successLight: '#dcfce7',
    warning: '#f59e0b',
    warningLight: '#fef3c7',
    danger: '#ef4444',
    dangerLight: '#fee2e2',
    info: '#3b82f6',
    infoLight: '#dbeafe',
  },
  radius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },
  shadow: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
  },
  font: {
    sans: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    mono: '"JetBrains Mono", "Fira Code", monospace',
  },
  transition: {
    fast: '150ms ease',
    normal: '200ms ease',
  },
}

export const DARK_TOKENS: Partial<DesignTokens> = {
  color: {
    background: '#0f172a',
    surface: '#1e293b',
    surfaceAlt: '#0f172a',
    primary: '#3b82f6',
    primaryHover: '#60a5fa',
    primaryLight: '#1e3a5f',
    text: '#f1f5f9',
    textSecondary: '#94a3b8',
    muted: '#64748b',
    border: '#334155',
    success: '#22c55e',
    successLight: '#14532d',
    warning: '#f59e0b',
    warningLight: '#78350f',
    danger: '#ef4444',
    dangerLight: '#7f1d1d',
    info: '#3b82f6',
    infoLight: '#1e3a5f',
  },
  shadow: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.3)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.4)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.4)',
  },
}

export const ACCENT_COLOR_PRESETS = [
  { name: 'Blue', value: '#2563eb' },
  { name: 'Green', value: '#16a34a' },
  { name: 'Purple', value: '#7c3aed' },
  { name: 'Rose', value: '#e11d48' },
  { name: 'Orange', value: '#ea580c' },
  { name: 'Teal', value: '#0d9488' },
  { name: 'Indigo', value: '#4f46e5' },
  { name: 'Pink', value: '#db2777' },
] as const

export const DEFAULT_ACCENT_COLOR = '#2563eb'

export const THEME_MODES = ['light', 'dark', 'system'] as const
