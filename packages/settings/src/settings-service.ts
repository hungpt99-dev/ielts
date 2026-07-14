import { STORAGE_KEYS } from '@ielts/config'
import { DEFAULT_SHARED_SETTINGS } from './defaults'
import type { SharedSettings, UserConfiguration } from './types'
import { userConfigurationSchema } from './schemas'

export const SETTINGS_STORAGE_KEY = STORAGE_KEYS.localStorage.userSettings

export function loadUserConfiguration(): UserConfiguration {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY)
    const data = raw ? JSON.parse(raw) : {}
    return userConfigurationSchema.parse(data)
  } catch {
    return userConfigurationSchema.parse({})
  }
}

export async function getSettings(key?: string): Promise<SharedSettings> {
  const storageKey = key ?? SETTINGS_STORAGE_KEY
  try {
    const raw = localStorage.getItem(storageKey)
    if (raw) {
      const parsed = JSON.parse(raw)
      return { ...DEFAULT_SHARED_SETTINGS, ...parsed }
    }
  } catch (error) {
  console.error('packages/settings/src/settings-service.ts error:', error);
  }
  return { ...DEFAULT_SHARED_SETTINGS }
}

export async function saveSettings(settings: SharedSettings, key?: string): Promise<void> {
  const storageKey = key ?? SETTINGS_STORAGE_KEY
  try {
    localStorage.setItem(storageKey, JSON.stringify(settings))
  } catch (e) {
    console.error('Failed to save settings:', e)
  }
}

export async function patchSettings(patch: Partial<SharedSettings>, key?: string): Promise<SharedSettings> {
  const current = await getSettings(key)
  const merged = { ...current, ...patch }
  await saveSettings(merged, key)
  return merged
}
