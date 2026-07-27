import {
  type SharedSettings,
  DEFAULT_SHARED_SETTINGS,
  THEME_MODES,
  AI_PROVIDERS,
} from '@ielts/settings'
import { STORAGE_KEYS } from '@ielts/config'

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
  autoTranslateTranscript: boolean
  highlightExcludedHosts: string[]
  defaultCategory: typeof SAVE_CATEGORIES[number]
  defaultTopic: string
  nativeLanguage: string
  aiTimeout: number
  aiTemperature?: number
}

export const DEFAULT_SETTINGS: ExtensionSettings = {
  ...DEFAULT_SHARED_SETTINGS,
  floatingToolbar: true,
  autoSaveSelected: false,
  autoHighlightSavedVocabulary: true,
  autoAiLookup: false,
  autoTranslateTranscript: false,
  highlightExcludedHosts: ['ieltsjourney.dev'],
  defaultCategory: 'vocabulary',
  defaultTopic: 'general',
  nativeLanguage: '',
  aiTimeout: 30000,
}

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
    try { listener(settings) } catch (error) {
 console.error('apps/extension/src/background/settingsStorage.ts error:', error);
 /* ignore listener error */ }
  }
}

interface ExtensionSettingsData {
  aiProvider: 'openai' | 'custom'
  aiBaseUrl: string
  aiModel: string
  themeMode: 'light' | 'dark' | 'system'
  floatingToolbar: boolean
  autoSaveSelected: boolean
  autoHighlightSavedVocabulary: boolean
  autoAiLookup: boolean
  autoTranslateTranscript: boolean
  highlightExcludedHosts: string[]
  defaultCategory: typeof SAVE_CATEGORIES[number]
  defaultTopic: string
  nativeLanguage: string
  aiTimeout: number
  aiTemperature?: number
}

const SETTINGS_STORAGE_KEY = STORAGE_KEYS.extensionLocal.extensionSettings
const LOCAL_API_KEY = STORAGE_KEYS.extensionLocal.aiApiKey
const LOCAL_SETTINGS_BACKUP = STORAGE_KEYS.extensionLocal.settingsBackup

function toStorageSettings(s: ExtensionSettings): ExtensionSettingsData {
  return {
    aiProvider: s.aiProvider,
    aiBaseUrl: s.aiBaseUrl,
    aiModel: s.aiModel,
    themeMode: s.themeMode,
    floatingToolbar: s.floatingToolbar,
    autoSaveSelected: s.autoSaveSelected,
    autoHighlightSavedVocabulary: s.autoHighlightSavedVocabulary,
    autoAiLookup: s.autoAiLookup,
    autoTranslateTranscript: s.autoTranslateTranscript,
    highlightExcludedHosts: s.highlightExcludedHosts,
    defaultCategory: s.defaultCategory,
    defaultTopic: s.defaultTopic,
    nativeLanguage: s.nativeLanguage,
    aiTimeout: s.aiTimeout,
    aiTemperature: s.aiTemperature,
  }
}

function getDefaults(): Promise<ExtensionSettings> {
  return new Promise((resolve) => {
    chrome.storage.local.get([SETTINGS_STORAGE_KEY], (result) => {
      const stored = result[SETTINGS_STORAGE_KEY] as Partial<ExtensionSettings> | undefined
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
  const settingsData = toStorageSettings(settings)
  await Promise.all([
    new Promise<void>((resolve) => {
      chrome.storage.local.set({ [SETTINGS_STORAGE_KEY]: settingsData, [LOCAL_SETTINGS_BACKUP]: settingsData }, () => {
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
    chrome.storage.local.remove([SETTINGS_STORAGE_KEY, LOCAL_API_KEY, LOCAL_SETTINGS_BACKUP], resolve)
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


