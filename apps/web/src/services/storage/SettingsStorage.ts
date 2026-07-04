import type { AppSettings } from '../../models'
import { DEFAULT_SETTINGS } from '../../models'
import { isValidBridgeMessage } from '@ielts/storage'
import { themeModeFromDarkMode, darkModeFromThemeMode } from '@ielts/settings'
import type { SharedSettingsPatch } from '@ielts/settings'
import { SETTINGS_BRIDGE_ACTIONS, BRIDGE_SOURCES } from '@ielts/settings'


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
  debouncedNotifyExtension()
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


let _applyingRemote = false
let _notifyTimer: ReturnType<typeof setTimeout> | null = null

function overlappingFromApp(settings: AppSettings): SharedSettingsPatch {
  return {
    aiProvider: settings.aiProvider,
    aiModel: settings.aiModel,
    aiBaseUrl: settings.aiBaseUrl || settings.aiEndpoint,
    aiApiKey: settings.aiApiKey,
    themeMode: themeModeFromDarkMode(settings.darkMode),
  }
}

function notifyExtension(): void {
  if (_applyingRemote) return
  const settings = loadAppSettings()
  const data = overlappingFromApp(settings)
  window.postMessage(
    { source: BRIDGE_SOURCES.PAGE, action: SETTINGS_BRIDGE_ACTIONS.SETTINGS_CHANGED, data },
    window.location.origin,
  )
}

function debouncedNotifyExtension(): void {
  if (_notifyTimer) clearTimeout(_notifyTimer)
  _notifyTimer = setTimeout(() => {
    _notifyTimer = null
    notifyExtension()
  }, 300)
}

function handleBridgeMessage(event: MessageEvent): void {
  if (event.origin !== window.location.origin) return
  if (!isValidBridgeMessage(event.data)) return
  if (event.data.source !== BRIDGE_SOURCES.EXTENSION) return
  if (event.data.action !== SETTINGS_BRIDGE_ACTIONS.SETTINGS_SYNC) return
  if (!event.data.data || typeof event.data.data !== 'object') return

  _applyingRemote = true
  try {
    const data = event.data.data as SharedSettingsPatch
    const current = loadAppSettings()
    const patch: Partial<AppSettings> = {}

    if (typeof data.aiProvider === 'string') patch.aiProvider = data.aiProvider as AppSettings['aiProvider']
    if (typeof data.aiModel === 'string') patch.aiModel = data.aiModel
    if (typeof data.aiBaseUrl === 'string') patch.aiBaseUrl = data.aiBaseUrl
    if (typeof data.aiApiKey === 'string') patch.aiApiKey = data.aiApiKey
    if (data.themeMode === 'dark' || data.themeMode === 'light' || data.themeMode === 'system') {
      patch.darkMode = darkModeFromThemeMode(data.themeMode)
    }

    const merged = { ...current, ...patch }
    setSetting(KEYS.APP_SETTINGS, merged)
  } finally {
    _applyingRemote = false
  }
}

export function initSettingsBridge(): void {
  window.addEventListener('message', handleBridgeMessage)
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
