import { z } from 'zod'

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

export const THEME_MODES = ['light', 'dark', 'system'] as const

export const AI_PROVIDERS = ['openai', 'custom'] as const

export const extensionSettingsSchema = z.object({
  aiProvider: z.enum(AI_PROVIDERS).default('openai'),
  aiBaseUrl: z.string().default(''),
  aiApiKey: z.string().default(''),
  aiModel: z.string().default('gpt-4o-mini'),
  themeMode: z.enum(THEME_MODES).default('system'),
  floatingToolbar: z.boolean().default(true),
  autoSaveSelected: z.boolean().default(false),
  defaultCategory: z.enum(SAVE_CATEGORIES).default('vocabulary'),
  defaultTopic: z.string().default('general'),
})

export type ExtensionSettings = z.infer<typeof extensionSettingsSchema>

export const DEFAULT_SETTINGS: ExtensionSettings = {
  aiProvider: 'openai',
  aiBaseUrl: '',
  aiApiKey: '',
  aiModel: 'gpt-4o-mini',
  themeMode: 'system',
  floatingToolbar: true,
  autoSaveSelected: false,
  defaultCategory: 'vocabulary',
  defaultTopic: 'general',
}

interface SyncSettings {
  aiProvider: 'openai' | 'custom'
  aiBaseUrl: string
  aiModel: string
  themeMode: 'light' | 'dark' | 'system'
  floatingToolbar: boolean
  autoSaveSelected: boolean
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
    defaultCategory: s.defaultCategory,
    defaultTopic: s.defaultTopic,
  }
}

function getDefaults(): Promise<ExtensionSettings> {
  return new Promise((resolve) => {
    chrome.storage.sync.get([SYNC_KEY], (result) => {
      const stored = result[SYNC_KEY] as Partial<ExtensionSettings> | undefined
      if (stored) {
        const parsed = extensionSettingsSchema.safeParse({ ...DEFAULT_SETTINGS, ...stored })
        if (parsed.success) {
          resolve(parsed.data)
          return
        }
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

export function saveSettings(settings: ExtensionSettings): Promise<void> {
  return new Promise((resolve) => {
    const syncData = toSyncSettings(settings)
    chrome.storage.sync.set({ [SYNC_KEY]: syncData }, () => {
      chrome.storage.local.set({ [LOCAL_SETTINGS_BACKUP]: syncData })
      resolve()
    })
    setApiKey(settings.aiApiKey || '')
  })
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
    chrome.storage.sync.remove([SYNC_KEY], () => {
      chrome.storage.local.remove([LOCAL_API_KEY, LOCAL_SETTINGS_BACKUP], resolve)
    })
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


