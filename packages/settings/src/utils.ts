import type { ThemeMode } from './types'

export function themeModeFromDarkMode(darkMode: boolean): ThemeMode {
  return darkMode ? 'dark' : 'light'
}

export function darkModeFromThemeMode(themeMode: ThemeMode): boolean {
  return themeMode === 'dark'
}

export function extendSettingsWithLegacyEndpoint<T extends { aiBaseUrl: string }>(
  settings: T,
  legacyEndpoint: string,
): T & { aiEndpoint: string } {
  return { ...settings, aiEndpoint: settings.aiBaseUrl || legacyEndpoint }
}
