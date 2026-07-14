import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  loadAppSettings,
  saveAppSettings,
  removeAppSettings,
  patchAppSettings,
  getSetting,
  setSetting,
  removeSetting,
  getThemeMode,
  setThemeMode,
  getAccentColor,
  setAccentColor,
  loadNotificationPrefs,
  saveNotificationPrefs,
  getDarkMode,
  setDarkMode,
} from '../SettingsStorage'
import { DEFAULT_SETTINGS } from '../../../models'
import { STORAGE_KEYS } from '@ielts/config'

const APP_SETTINGS_KEY = STORAGE_KEYS.localStorage.appSettings
const THEME_MODE_KEY = STORAGE_KEYS.localStorage.themeMode
const ACCENT_COLOR_KEY = STORAGE_KEYS.localStorage.accentColor
const NOTIFICATION_PREFS_KEY = STORAGE_KEYS.localStorage.notificationPrefs
const DARK_MODE_KEY = 'ielts-dark-mode'

function mockStorage(data: Record<string, string>) {
  const store = { ...data }
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key: string) => store[key] ?? null)
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key: string, value: string) => {
    store[key] = value
  })
  vi.spyOn(Storage.prototype, 'removeItem').mockImplementation((key: string) => {
    delete store[key]
  })
  return store
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('getSetting / setSetting / removeSetting', () => {
  it('returns default when key does not exist', () => {
    mockStorage({})
    expect(getSetting('nonexistent', 42)).toBe(42)
  })

  it('returns parsed value when key exists', () => {
    mockStorage({ foo: '"bar"' })
    expect(getSetting('foo', 'default')).toBe('bar')
  })

  it('returns default on corrupt JSON', () => {
    mockStorage({ foo: '{not-json}' })
    expect(getSetting('foo', 'fallback')).toBe('fallback')
  })

  it('stores and retrieves a value via setSetting', () => {
    const store = mockStorage({})
    setSetting('name', 'test')
    expect(store['name']).toBe('"test"')
    expect(getSetting('name', '')).toBe('test')
  })

  it('removes a key via removeSetting', () => {
    const store = mockStorage({ foo: '"bar"' })
    removeSetting('foo')
    expect(store['foo']).toBeUndefined()
  })
})

describe('loadAppSettings', () => {
  it('returns DEFAULT_SETTINGS when nothing is stored', () => {
    mockStorage({})
    expect(loadAppSettings()).toEqual(DEFAULT_SETTINGS)
  })

  it('merges stored settings over defaults', () => {
    mockStorage({
      [APP_SETTINGS_KEY]: JSON.stringify({ targetBand: 8.0, dailyStudyMinutes: 120 }),
    })
    const result = loadAppSettings()
    expect(result.targetBand).toBe(8.0)
    expect(result.dailyStudyMinutes).toBe(120)
    expect(result.currentBand).toBe(DEFAULT_SETTINGS.currentBand)
  })

  it('returns defaults when stored JSON is corrupt', () => {
    mockStorage({ [APP_SETTINGS_KEY]: 'not-json' })
    expect(loadAppSettings()).toEqual(DEFAULT_SETTINGS)
  })

  it('migrates aiEndpoint to aiBaseUrl when aiBaseUrl is missing', () => {
    mockStorage({
      [APP_SETTINGS_KEY]: JSON.stringify({ aiEndpoint: 'https://old-endpoint.com' }),
    })
    const result = loadAppSettings()
    expect(result.aiBaseUrl).toBe('https://old-endpoint.com')
  })

  it('prefers aiBaseUrl over aiEndpoint when both exist', () => {
    mockStorage({
      [APP_SETTINGS_KEY]: JSON.stringify({ aiBaseUrl: 'https://new.com', aiEndpoint: 'https://old.com' }),
    })
    const result = loadAppSettings()
    expect(result.aiBaseUrl).toBe('https://new.com')
  })
})

describe('saveAppSettings', () => {
  it('persists settings to localStorage', () => {
    const store = mockStorage({})
    const custom = { ...DEFAULT_SETTINGS, targetBand: 8.0 }

    vi.useFakeTimers()
    saveAppSettings(custom)
    vi.advanceTimersByTime(300)

    expect(JSON.parse(store[APP_SETTINGS_KEY])).toMatchObject({ targetBand: 8.0 })
  })

  it('posts a message to the extension bridge', () => {
    mockStorage({})
    const postMessage = vi.spyOn(window, 'postMessage').mockImplementation(() => {})

    vi.useFakeTimers()
    saveAppSettings(DEFAULT_SETTINGS)
    vi.advanceTimersByTime(300)

    expect(postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        source: 'ielts-page',
        action: 'SETTINGS_CHANGED',
      }),
      window.location.origin,
    )
    postMessage.mockRestore()
  })
})

describe('removeAppSettings', () => {
  it('removes settings from localStorage', () => {
    const store = mockStorage({ [APP_SETTINGS_KEY]: '{}' })
    removeAppSettings()
    expect(store[APP_SETTINGS_KEY]).toBeUndefined()
  })
})

describe('patchAppSettings', () => {
  it('merges patch with existing and persists', () => {
    mockStorage({
      [APP_SETTINGS_KEY]: JSON.stringify({ ...DEFAULT_SETTINGS, targetBand: 7.5 }),
    })

    vi.useFakeTimers()
    const result = patchAppSettings({ targetBand: 8.0, dailyStudyMinutes: 90 })
    vi.advanceTimersByTime(300)

    expect(result.targetBand).toBe(8.0)
    expect(result.dailyStudyMinutes).toBe(90)
    expect(result.currentBand).toBe(DEFAULT_SETTINGS.currentBand)
  })
})

describe('theme mode', () => {
  it('getThemeMode returns default "system"', () => {
    mockStorage({})
    expect(getThemeMode()).toBe('system')
  })

  it('setThemeMode stores the value', () => {
    const store = mockStorage({})
    setThemeMode('dark')
    expect(store[THEME_MODE_KEY]).toBe('"dark"')
  })
})

describe('accent color', () => {
  it('getAccentColor returns default blue', () => {
    mockStorage({})
    expect(getAccentColor()).toBe('#2563eb')
  })

  it('setAccentColor stores the value', () => {
    const store = mockStorage({})
    setAccentColor('#ff0000')
    expect(store[ACCENT_COLOR_KEY]).toBe('"#ff0000"')
  })
})

describe('dark mode', () => {
  it('getDarkMode defaults to false', () => {
    mockStorage({})
    expect(getDarkMode()).toBe(false)
  })

  it('setDarkMode stores the value', () => {
    const store = mockStorage({})
    setDarkMode(true)
    expect(store[DARK_MODE_KEY]).toBe('true')
  })
})

describe('notification prefs', () => {
  it('loadNotificationPrefs returns defaults when not stored', () => {
    mockStorage({})
    expect(loadNotificationPrefs()).toEqual({ enabled: false, reminderTime: '09:00' })
  })

  it('loadNotificationPrefs returns exactly the stored value', () => {
    mockStorage({
      [NOTIFICATION_PREFS_KEY]: JSON.stringify({ enabled: true }),
    })
    expect(loadNotificationPrefs()).toEqual({ enabled: true })
  })

  it('saveNotificationPrefs persists', () => {
    const store = mockStorage({})
    saveNotificationPrefs({ enabled: true, reminderTime: '07:30' })
    expect(JSON.parse(store[NOTIFICATION_PREFS_KEY])).toEqual({
      enabled: true,
      reminderTime: '07:30',
    })
  })
})


