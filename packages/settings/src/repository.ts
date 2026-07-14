import type { UserConfiguration } from './types'

export interface UserSettingsRepository {
  getSettings(): Promise<UserConfiguration>
  updateSettings(update: Partial<UserConfiguration>): Promise<UserConfiguration>
  resetSettings(): Promise<UserConfiguration>
}
