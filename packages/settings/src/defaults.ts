import type { AISettings, SharedSettings } from './types'
import { DEFAULT_MODEL } from './schemas'

export const DEFAULT_AI_SETTINGS: AISettings = {
  aiProvider: 'openai',
  aiBaseUrl: '',
  aiApiKey: '',
  aiModel: DEFAULT_MODEL,
}

export const DEFAULT_SHARED_SETTINGS: SharedSettings = {
  ...DEFAULT_AI_SETTINGS,
  themeMode: 'system',
  nativeLanguage: '',
}
