import { STORAGE_KEYS } from '@ielts/config'
import type { SharedSettings, UserConfiguration } from './types'
import { DEFAULT_SHARED_SETTINGS } from './defaults'
import { userConfigurationSchema } from './schemas'
import { migrateFromLegacySettings } from './migration'
import { LocalStorageUserSettingsRepository } from './local-storage-user-settings-repository'

export { LocalStorageUserSettingsRepository }

const SETTINGS_STORAGE_KEY = STORAGE_KEYS.localStorage.userSettings

export function loadUserConfiguration(): UserConfiguration {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY)
    if (!raw) return userConfigurationSchema.parse({})

    const data = JSON.parse(raw)

    const canonicalResult = userConfigurationSchema.safeParse(data)
    if (canonicalResult.success) {
      return canonicalResult.data
    }

    const migrated = migrateFromLegacySettings(data)
    if (migrated) return migrated

    return userConfigurationSchema.parse({})
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
