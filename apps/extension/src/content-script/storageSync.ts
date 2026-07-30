import { STORAGE_KEYS } from '@ielts/config'

const WEB_SETTINGS_KEY = STORAGE_KEYS.localStorage.userSettings
const EXT_SETTINGS_KEY = STORAGE_KEYS.extensionLocal.extensionSettings

interface ExtensionSettingsData {
  nativeLanguage?: string
  themeMode?: string
  aiModel?: string
  aiBaseUrl?: string
  accentColor?: string
  [key: string]: unknown
}

function readWebSettings(): Record<string, unknown> | null {
  try {
    const raw = window.localStorage.getItem(WEB_SETTINGS_KEY)
    if (!raw) return null
    return JSON.parse(raw) as Record<string, unknown>
  } catch {
    return null
  }
}

function readWebNativeLanguage(): string {
  const settings = readWebSettings()
  if (!settings) return ''
  const study = (settings.study || settings) as Record<string, unknown>
  return (study.nativeLanguage as string) || ''
}

function readWebThemeMode(): string {
  const settings = readWebSettings()
  if (!settings) return ''
  const theme = (settings.theme || settings) as Record<string, unknown>
  return (theme.mode as string) || ''
}

function readWebAccentColor(): string {
  const settings = readWebSettings()
  if (!settings) return ''
  const theme = (settings.theme || settings) as Record<string, unknown>
  return (theme.accentColor as string) || ''
}

async function readExtSettings(): Promise<ExtensionSettingsData | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get(EXT_SETTINGS_KEY, (result) => {
      const data = result[EXT_SETTINGS_KEY] as ExtensionSettingsData | undefined
      resolve(data || null)
    })
  })
}

async function writeExtSettings(patch: Partial<ExtensionSettingsData>): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.get(EXT_SETTINGS_KEY, (result) => {
      const current = (result[EXT_SETTINGS_KEY] as Record<string, unknown>) || {}
      const merged = { ...current, ...patch }
      chrome.storage.local.set({ [EXT_SETTINGS_KEY]: merged }, () => resolve())
    })
  })
}

function writeWebNativeLanguage(lang: string): void {
  try {
    const raw = window.localStorage.getItem(WEB_SETTINGS_KEY)
    const settings = raw ? JSON.parse(raw) as Record<string, unknown> : {}
    const study = (settings.study || {}) as Record<string, unknown>
    ;(settings as Record<string, unknown>).study = { ...study, nativeLanguage: lang }
    window.localStorage.setItem(WEB_SETTINGS_KEY, JSON.stringify(settings))

    window.dispatchEvent(new CustomEvent('ielts-settings-updated', {
      detail: { study: { nativeLanguage: lang } },
    }))
  } catch {
    /* localStorage unavailable */
  }
}

function writeWebThemeMode(mode: string): void {
  try {
    const raw = window.localStorage.getItem(WEB_SETTINGS_KEY)
    const settings = raw ? JSON.parse(raw) as Record<string, unknown> : {}
    const theme = (settings.theme || {}) as Record<string, unknown>
    ;(settings as Record<string, unknown>).theme = { ...theme, mode }
    window.localStorage.setItem(WEB_SETTINGS_KEY, JSON.stringify(settings))
  } catch {
    /* localStorage unavailable */
  }
}

/**
 * Sync settings from web app's localStorage → extension's chrome.storage.local
 */
async function syncWebToExt(): Promise<void> {
  const webLang = readWebNativeLanguage()
  const webTheme = readWebThemeMode()
  const webAccent = readWebAccentColor()
  const extSettings = await readExtSettings()

  const patch: Partial<ExtensionSettingsData> = {}

  if (webLang && webLang !== (extSettings?.nativeLanguage || '')) {
    patch.nativeLanguage = webLang
  }
  if (webTheme && webTheme !== (extSettings?.themeMode || '')) {
    patch.themeMode = webTheme
  }
  if (webAccent && webAccent !== (extSettings?.accentColor || '')) {
    patch.accentColor = webAccent
  }

  if (Object.keys(patch).length > 0) {
    await writeExtSettings(patch)
  }
}

/**
 * Sync settings from extension's chrome.storage.local → web app's localStorage
 */
async function syncExtToWeb(): Promise<void> {
  const extSettings = await readExtSettings()
  if (!extSettings) return

  if (extSettings.nativeLanguage) {
    const webLang = readWebNativeLanguage()
    if (extSettings.nativeLanguage !== webLang) {
      writeWebNativeLanguage(extSettings.nativeLanguage)
    }
  }

  if (extSettings.themeMode) {
    const webTheme = readWebThemeMode()
    if (extSettings.themeMode !== webTheme) {
      writeWebThemeMode(extSettings.themeMode)
    }
  }
}

/**
 * Watch chrome.storage.local for extension settings changes, sync to web app
 */
function watchExtStorageChanges(): void {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return
    if (changes[EXT_SETTINGS_KEY]) {
      syncExtToWeb()
    }
  })
}

/**
 * Poll localStorage for web app settings changes, sync to extension
 */
function watchWebStorageChanges(): void {
  let lastWebLang = readWebNativeLanguage()
  let lastWebTheme = readWebThemeMode()

  setInterval(() => {
    const currentLang = readWebNativeLanguage()
    const currentTheme = readWebThemeMode()

    if (currentLang !== lastWebLang || currentTheme !== lastWebTheme) {
      lastWebLang = currentLang
      lastWebTheme = currentTheme
      syncWebToExt()
    }
  }, 2000)
}

/**
 * Initialize bidirectional settings sync between web app and extension.
 * Call once on content script startup.
 */
export function initStorageSync(): void {
  syncWebToExt()
  watchExtStorageChanges()
  watchWebStorageChanges()
}

/**
 * Get the resolved native language — checks extension first, falls back to web app.
 * Use this from any content script instead of reading chrome.storage directly.
 */
export async function getResolvedNativeLanguage(): Promise<string> {
  const extSettings = await readExtSettings()
  if (extSettings?.nativeLanguage) return extSettings.nativeLanguage

  const webLang = readWebNativeLanguage()
  if (webLang) {
    await writeExtSettings({ nativeLanguage: webLang })
    return webLang
  }

  return ''
}
