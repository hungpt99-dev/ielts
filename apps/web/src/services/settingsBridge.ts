import type { UserConfiguration } from '@ielts/settings'
import { STORAGE_KEYS } from '@ielts/config'

interface ExtensionSettings {
  aiModel: string
  aiBaseUrl: string
  themeMode: string
  nativeLanguage: string
  accentColor: string
}

function toExtensionSettings(config: UserConfiguration): ExtensionSettings {
  return {
    aiModel: config.ai?.model ?? '',
    aiBaseUrl: config.ai?.customApiUrl ?? '',
    themeMode: config.themeMode ?? '',
    nativeLanguage: config.nativeLanguage ?? '',
    accentColor: config.accentColor ?? '',
  }
}

export function persistUserConfig(
  config: UserConfiguration,
  providerId?: string,
): void {
  try {
    localStorage.setItem(
      STORAGE_KEYS.localStorage.userSettings,
      JSON.stringify(config),
    )
  } catch {
    /* localStorage may be unavailable in some contexts */
  }

  try {
    chrome?.storage?.local?.set({
      [STORAGE_KEYS.extensionLocal.extensionSettings]: toExtensionSettings(config),
    })
  } catch {
    /* chrome.storage unavailable outside extension context */
  }
}

export function persistApiKey(key: string, providerId: string = 'openai'): void {
  try {
    localStorage.setItem(
      `${STORAGE_KEYS.localStorage.apiKeyPrefix}${providerId}`,
      key,
    )
  } catch {
    /* localStorage may be unavailable */
  }

  try {
    chrome?.storage?.local?.set({
      [STORAGE_KEYS.extensionLocal.aiApiKey]: key,
    })
  } catch {
    /* chrome.storage unavailable */
  }
}
