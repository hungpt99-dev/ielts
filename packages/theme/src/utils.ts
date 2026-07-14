import { DEFAULT_ACCENT_COLOR } from './tokens'

export function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function isDarkMode(mode: 'light' | 'dark' | 'system'): boolean {
  if (mode === 'system') return getSystemTheme() === 'dark'
  return mode === 'dark'
}

export function applyTheme(mode: 'light' | 'dark' | 'system'): void {
  const root = document.documentElement
  const dark = isDarkMode(mode)
  root.classList.toggle('dark', dark)
}

export function applyAccentColor(color: string): void {
  const root = document.documentElement
  if (color === DEFAULT_ACCENT_COLOR) {
    root.style.removeProperty('--color-primary')
    root.style.removeProperty('--color-primary-hover')
    root.style.removeProperty('--color-primary-dark')
    root.style.removeProperty('--color-primary-light')
  } else {
    root.style.setProperty('--color-primary', color)
    root.style.setProperty('--color-primary-hover', adjustColor(color, -20))
    root.style.setProperty('--color-primary-dark', adjustColor(color, -40))
    root.style.setProperty('--color-primary-light', mixWithWhite(color, 0.85))
  }
}

export function getStoredThemeMode(): 'light' | 'dark' | 'system' {
  try {
    const stored = localStorage.getItem('ielts-theme-mode')
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored
  } catch (error) {
  console.error('packages/theme/src/utils.ts error:', error);
  }
  return 'system'
}

export function storeThemeMode(mode: 'light' | 'dark' | 'system'): void {
  try {
    localStorage.setItem('ielts-theme-mode', mode)
  } catch (error) {
console.error('packages/theme/src/utils.ts error:', error);
  }
}

export function getStoredAccentColor(): string {
  try {
    return localStorage.getItem('ielts-accent-color') || '#2563eb'
  } catch (error) {
    console.error('packages/theme/src/utils.ts error:', error);
    return '#2563eb'
  }
}

export function storeAccentColor(color: string): void {
  try {
    localStorage.setItem('ielts-accent-color', color)
  } catch (error) {
console.error('packages/theme/src/utils.ts error:', error);
  }
}

const STORAGE_KEY_DARK_MODE = 'ielts-dark-mode'

export function clearLegacyDarkModeStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_DARK_MODE)
  } catch (error) {
console.error('packages/theme/src/utils.ts error:', error);
  }
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '')
  const num = parseInt(clean, 16)
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255]
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function adjustColor(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex)
  return rgbToHex(r + amount, g + amount, b + amount)
}

function mixWithWhite(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex)
  const mix = (c: number) => Math.round(c + (255 - c) * amount)
  return rgbToHex(mix(r), mix(g), mix(b))
}
