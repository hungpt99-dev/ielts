import { DEFAULT_AI_MODEL } from '@ielts/config'
import type { AISettings, SharedSettings } from './types'

export const DEFAULT_AI_SETTINGS: AISettings = {
  aiProvider: 'openai',
  aiBaseUrl: '',
  aiApiKey: '',
  aiModel: DEFAULT_AI_MODEL,
}

export const DEFAULT_SHARED_SETTINGS: SharedSettings = {
  ...DEFAULT_AI_SETTINGS,
  themeMode: 'system',
  nativeLanguage: '',
}
