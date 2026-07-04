import { z } from 'zod'

export const OPENAI_BASE_URL = 'https://api.openai.com/v1'
export const DEFAULT_MODEL = 'gpt-4o-mini'

export const AI_PROVIDERS = ['openai', 'custom'] as const

export const aiProviderSchema = z.enum(AI_PROVIDERS)

export const aiSettingsSchema = z.object({
  aiProvider: aiProviderSchema.default('openai'),
  aiBaseUrl: z.string().default(''),
  aiApiKey: z.string().default(''),
  aiModel: z.string().default(DEFAULT_MODEL),
})

export const THEME_MODES = ['light', 'dark', 'system'] as const

export const themeModeSchema = z.enum(THEME_MODES)

export const sharedSettingsSchema = aiSettingsSchema.extend({
  themeMode: themeModeSchema.default('system'),
})
