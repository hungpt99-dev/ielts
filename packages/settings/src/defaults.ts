import { DEFAULT_AI_MODEL, DEFAULT_AI_PROVIDER_ID } from '@ielts/config'
import type { AISettings, SharedSettings } from './types'

export const DEFAULT_AI_SETTINGS: AISettings = {
  aiProvider: DEFAULT_AI_PROVIDER_ID,
  aiBaseUrl: '',
  aiApiKey: '',
  aiModel: DEFAULT_AI_MODEL,
}

export const DEFAULT_SHARED_SETTINGS: SharedSettings = {
  ...DEFAULT_AI_SETTINGS,
  themeMode: 'system',
  nativeLanguage: '',
}
