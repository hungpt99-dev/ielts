import type { AppSettings } from '../../models'
import { DEFAULT_SETTINGS } from '../../models'



const KEYS = {
  APP_SETTINGS: 'ielts-settings',
  THEME_MODE: 'ielts-theme-mode',
  ACCENT_COLOR: 'ielts-accent-color',
  NOTIFICATION_PREFS: 'ielts-notification-prefs',
  DARK_MODE: 'ielts-dark-mode',
} as const

export const SETTINGS_STORAGE_KEYS = KEYS


export function getSetting<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw !== null) {
      return JSON.parse(raw) as T
    }
  } catch {
    /* ignore parse errors — return default */
  }
  return defaultValue
}

export function setSetting<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.error(`Failed to write setting "${key}" to localStorage:`, e)
  }
}

export function removeSetting(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch (e) {
    console.error(`Failed to remove setting "${key}" from localStorage:`, e)
  }
}


export function loadAppSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(KEYS.APP_SETTINGS)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (!('aiBaseUrl' in parsed) && 'aiEndpoint' in parsed) {
        parsed.aiBaseUrl = parsed.aiEndpoint
      }
      return { ...DEFAULT_SETTINGS, ...parsed }
    }
  } catch {}
  return { ...DEFAULT_SETTINGS }
}

export function saveAppSettings(settings: AppSettings): void {
  setSetting(KEYS.APP_SETTINGS, settings)
}

export function removeAppSettings(): void {
  removeSetting(KEYS.APP_SETTINGS)
}

const APP_PREFIX = 'ielts-'

export function clearAllLocalStorage(): void {
  const toRemove: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith(APP_PREFIX)) {
      toRemove.push(key)
    }
  }
  for (const key of toRemove) {
    try {
      localStorage.removeItem(key)
    } catch { /* ignore */ }
  }
}

export function patchAppSettings(patch: Partial<AppSettings>): AppSettings {
  const current = loadAppSettings()
  const merged = { ...current, ...patch }
  saveAppSettings(merged)
  return merged
}


export function getThemeMode(): string {
  return getSetting(KEYS.THEME_MODE, 'system')
}

export function setThemeMode(mode: string): void {
  setSetting(KEYS.THEME_MODE, mode)
}

export function getAccentColor(): string {
  return getSetting(KEYS.ACCENT_COLOR, '#2563eb')
}

export function setAccentColor(color: string): void {
  setSetting(KEYS.ACCENT_COLOR, color)
}

export interface NotificationPrefs {
  enabled: boolean
  reminderTime: string
}

const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  enabled: false,
  reminderTime: '09:00',
}

export function loadNotificationPrefs(): NotificationPrefs {
  return getSetting(KEYS.NOTIFICATION_PREFS, DEFAULT_NOTIFICATION_PREFS)
}

export function saveNotificationPrefs(prefs: NotificationPrefs): void {
  setSetting(KEYS.NOTIFICATION_PREFS, prefs)
}

export function getDarkMode(): boolean {
  return getSetting(KEYS.DARK_MODE, false)
}

export function setDarkMode(dark: boolean): void {
  setSetting(KEYS.DARK_MODE, dark)
}

export function getStorageQuotaStatus(): { usedBytes: number; remaining: number | null; percentUsed: number; isLow: boolean } {
  let usedBytes = 0
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key) {
      const val = localStorage.getItem(key)
      if (val) usedBytes += key.length + val.length
    }
  }
  let remaining: number | null = null
  try {
    const testKey = '__ielts_quota_test__'
    localStorage.setItem(testKey, 'a')
    localStorage.removeItem(testKey)
    remaining = null
  } catch {
    remaining = Math.max(0, 5 * 1024 * 1024 - usedBytes)
  }
  const percentUsed = remaining !== null ? Math.round((usedBytes / (usedBytes + remaining)) * 100) : 0
  const isLow = (remaining !== null && remaining < 50 * 1024) || percentUsed > 90
  return { usedBytes, remaining, percentUsed, isLow }
}
