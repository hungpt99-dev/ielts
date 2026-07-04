export {
  AI_PROVIDERS,
  aiProviderSchema,
  aiSettingsSchema,
  THEME_MODES,
  themeModeSchema,
  sharedSettingsSchema,
} from './schemas'

export { DEFAULT_AI_SETTINGS, DEFAULT_SHARED_SETTINGS } from './defaults'

export type { AISettings, SharedSettings, AiProvider, ThemeMode } from './types'

export type { SharedSettingsPatch } from './bridge'
export {
  SETTINGS_BRIDGE_ACTIONS,
  BRIDGE_SOURCES,
  createSettingsBridgeMessage,
} from './bridge'
export type { SettingsBridgeAction, BridgeSource } from './bridge'

export {
  themeModeFromDarkMode,
  darkModeFromThemeMode,
  extendSettingsWithLegacyEndpoint,
} from './utils'
