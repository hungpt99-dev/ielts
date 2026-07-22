export { AI_PROVIDER_IDS, DEFAULT_AI_PROVIDER_ID, DEFAULT_AI_MODEL } from '@ielts/config'

export {
  AI_PROVIDERS,
  THEME_MODES,
  NATIVE_LANGUAGES,
  OPENAI_BASE_URL,
  aiSettingsSchema,
  sharedSettingsSchema,
  aiUserSettingsSchema,
  userConfigurationSchema,
} from './schemas'

export { DEFAULT_AI_SETTINGS, DEFAULT_SHARED_SETTINGS } from './defaults'

export type { AISettings, SharedSettings, AiUserSettings, UserConfiguration } from './types'

export type { SharedSettingsPatch } from './bridge'
export {
  SETTINGS_BRIDGE_ACTIONS,
  BRIDGE_SOURCES,
} from './bridge'

export {
  themeModeFromDarkMode,
  darkModeFromThemeMode,
  translationTarget,
} from './utils'

export type { UserSettingsRepository } from './repository'

export { migrateFromLegacySettings } from './migration'
export { loadUserConfiguration } from './settings-service'
export { LocalStorageCredentialStore } from './local-storage-credential-store'
export { LocalStorageUserSettingsRepository } from './local-storage-user-settings-repository'
