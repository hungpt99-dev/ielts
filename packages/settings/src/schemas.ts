import { z } from 'zod'

export const AI_PROVIDERS = ['openai', 'custom'] as const

export const aiProviderSchema = z.enum(AI_PROVIDERS)

export const aiSettingsSchema = z.object({
  aiProvider: aiProviderSchema.default('openai'),
  aiBaseUrl: z.string().default(''),
  aiApiKey: z.string().default(''),
  aiModel: z.string().default('gpt-4o-mini'),
})

export const THEME_MODES = ['light', 'dark', 'system'] as const

export const themeModeSchema = z.enum(THEME_MODES)

export const sharedSettingsSchema = aiSettingsSchema.extend({
  themeMode: themeModeSchema.default('system'),
})
