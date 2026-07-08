import {
  type SharedSettings,
  type SharedSettingsPatch,
  DEFAULT_SHARED_SETTINGS,
  THEME_MODES,
  AI_PROVIDERS,
} from '@ielts/settings'

export { THEME_MODES, AI_PROVIDERS }

export const SAVE_CATEGORIES = [
  'vocabulary',
  'phrase',
  'sentence',
  'grammar',
  'reading',
  'writing',
  'speaking',
  'mistake',
] as const

export type ExtensionSettings = SharedSettings & {
  floatingToolbar: boolean
  autoSaveSelected: boolean
  autoHighlightSavedVocabulary: boolean
  autoAiLookup: boolean
  defaultCategory: typeof SAVE_CATEGORIES[number]
  defaultTopic: string
}

export const DEFAULT_SETTINGS: ExtensionSettings = {
  ...DEFAULT_SHARED_SETTINGS,
  floatingToolbar: true,
  autoSaveSelected: false,
  autoHighlightSavedVocabulary: true,
  autoAiLookup: false,
  defaultCategory: 'vocabulary',
  defaultTopic: 'general',
}

// Fields shared between extension and website settings
export type WebsiteOverlappingSettings = SharedSettingsPatch

type SettingsChangeListener = (settings: ExtensionSettings) => void
let listeners: SettingsChangeListener[] = []

export function addSettingsChangeListener(listener: SettingsChangeListener): void {
  listeners.push(listener)
}

export function removeSettingsChangeListener(listener: SettingsChangeListener): void {
  listeners = listeners.filter(l => l !== listener)
}

function notifyListeners(settings: ExtensionSettings): void {
  for (const listener of listeners) {
    try { listener(settings) } catch { /* ignore listener error */ }
  }
}

interface SyncSettings {
  aiProvider: 'openai' | 'custom'
  aiBaseUrl: string
  aiModel: string
  themeMode: 'light' | 'dark' | 'system'
  floatingToolbar: boolean
  autoSaveSelected: boolean
  autoHighlightSavedVocabulary: boolean
  autoAiLookup: boolean
  defaultCategory: typeof SAVE_CATEGORIES[number]
  defaultTopic: string
}

const SYNC_KEY = 'extensionSettings'
const LOCAL_API_KEY = 'aiApiKey'
const LOCAL_SETTINGS_BACKUP = 'ielts-settings-backup'

function toSyncSettings(s: ExtensionSettings): SyncSettings {
  return {
    aiProvider: s.aiProvider,
    aiBaseUrl: s.aiBaseUrl,
    aiModel: s.aiModel,
    themeMode: s.themeMode,
    floatingToolbar: s.floatingToolbar,
    autoSaveSelected: s.autoSaveSelected,
    autoHighlightSavedVocabulary: s.autoHighlightSavedVocabulary,
    autoAiLookup: s.autoAiLookup,
    defaultCategory: s.defaultCategory,
    defaultTopic: s.defaultTopic,
  }
}

function getDefaults(): Promise<ExtensionSettings> {
  return new Promise((resolve) => {
    chrome.storage.local.get([SYNC_KEY], (result) => {
      const stored = result[SYNC_KEY] as Partial<ExtensionSettings> | undefined
      if (stored && typeof stored === 'object') {
        resolve({ ...DEFAULT_SETTINGS, ...stored })
        return
      }
      resolve({ ...DEFAULT_SETTINGS })
    })
  })
}

export async function loadSettings(): Promise<ExtensionSettings> {
  const settings = await getDefaults()
  const apiKey = await getApiKey()
  return { ...settings, aiApiKey: apiKey }
}

export async function saveSettings(settings: ExtensionSettings): Promise<void> {
  const syncData = toSyncSettings(settings)
  await Promise.all([
    new Promise<void>((resolve) => {
      chrome.storage.local.set({ [SYNC_KEY]: syncData, [LOCAL_SETTINGS_BACKUP]: syncData }, () => {
        resolve()
      })
    }),
    setApiKey(settings.aiApiKey || ''),
  ])
  notifyListeners(settings)
}

export async function patchSettings(patch: Partial<ExtensionSettings>): Promise<ExtensionSettings> {
  const current = await loadSettings()
  const merged = { ...current, ...patch }
  await saveSettings(merged)
  return merged
}

// ── Bridge integration ──

// Apply overlapping settings pushed from the website bridge.
// Handles aiApiKey separately via chrome.storage.local.
export async function syncFromWebsite(websiteSettings: WebsiteOverlappingSettings): Promise<ExtensionSettings> {
  const patch: Partial<ExtensionSettings> = {}
  if (websiteSettings.aiProvider !== undefined) patch.aiProvider = websiteSettings.aiProvider
  if (websiteSettings.aiModel !== undefined) patch.aiModel = websiteSettings.aiModel
  if (websiteSettings.aiBaseUrl !== undefined) patch.aiBaseUrl = websiteSettings.aiBaseUrl
  if (websiteSettings.themeMode !== undefined) patch.themeMode = websiteSettings.themeMode

  const merged = await patchSettings(patch)

  if (websiteSettings.aiApiKey !== undefined) {
    merged.aiApiKey = websiteSettings.aiApiKey
    await setApiKey(websiteSettings.aiApiKey)
    notifyListeners(merged)
  }

  return merged
}

// Extract overlapping settings for the website bridge.
// Excludes aiApiKey (handled separately via chrome.storage.local).
export function getOverlappingForWebsite(settings: ExtensionSettings): WebsiteOverlappingSettings {
  return {
    aiProvider: settings.aiProvider,
    aiModel: settings.aiModel,
    aiBaseUrl: settings.aiBaseUrl,
    themeMode: settings.themeMode,
  }
}

export function getApiKey(): Promise<string> {
  return new Promise((resolve) => {
    chrome.storage.local.get([LOCAL_API_KEY], (result) => {
      resolve(result[LOCAL_API_KEY] || '')
    })
  })
}

export function setApiKey(key: string): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [LOCAL_API_KEY]: key }, resolve)
  })
}

export function clearAllSettings(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.remove([SYNC_KEY, LOCAL_API_KEY, LOCAL_SETTINGS_BACKUP], resolve)
  })
}

export function exportSettingsData(): Promise<{
  settings: ExtensionSettings
  exportedAt: string
}> {
  return loadSettings().then((settings) => ({
    settings,
    exportedAt: new Date().toISOString(),
  }))
}

export function importSettingsData(data: {
  settings: ExtensionSettings
}): Promise<void> {
  return saveSettings(data.settings)
}


