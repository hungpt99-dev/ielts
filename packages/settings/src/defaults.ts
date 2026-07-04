import type { AISettings, SharedSettings } from './types'

export const DEFAULT_AI_SETTINGS: AISettings = {
  aiProvider: 'openai',
  aiBaseUrl: '',
  aiApiKey: '',
  aiModel: 'gpt-4o-mini',
}

export const DEFAULT_SHARED_SETTINGS: SharedSettings = {
  ...DEFAULT_AI_SETTINGS,
  themeMode: 'system',
}
