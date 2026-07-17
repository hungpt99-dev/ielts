import { STORAGE_KEYS } from '@ielts/config'
import type { UserConfiguration } from './types'
import type { UserSettingsRepository } from './repository'
import { userConfigurationSchema } from './schemas'
import { migrateFromLegacySettings } from './migration'

const SETTINGS_KEY = STORAGE_KEYS.localStorage.userSettings

export class LocalStorageUserSettingsRepository implements UserSettingsRepository {
  async getSettings(): Promise<UserConfiguration> {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY)
      if (!raw) return userConfigurationSchema.parse({})

      const data = JSON.parse(raw)
      const canonicalResult = userConfigurationSchema.safeParse(data)
      if (canonicalResult.success) return canonicalResult.data

      const migrated = migrateFromLegacySettings(data)
      if (migrated) return migrated

      return userConfigurationSchema.parse({})
    } catch {
      return userConfigurationSchema.parse({})
    }
  }

  async updateSettings(update: Partial<UserConfiguration>): Promise<UserConfiguration> {
    const current = await this.getSettings()
    const merged = { ...current, ...update } as UserConfiguration
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged))
    } catch (e) {
      console.error('Failed to save settings:', e)
    }
    return merged
  }

  async resetSettings(): Promise<UserConfiguration> {
    const defaults = userConfigurationSchema.parse({})
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(defaults))
    } catch (e) {
      console.error('Failed to reset settings:', e)
    }
    return defaults
  }
}
