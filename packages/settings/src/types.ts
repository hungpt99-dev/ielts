import type { z } from 'zod'
import type { aiSettingsSchema, sharedSettingsSchema, aiProviderSchema, themeModeSchema } from './schemas'

export type AISettings = z.infer<typeof aiSettingsSchema>
export type SharedSettings = z.infer<typeof sharedSettingsSchema>
export type AiProvider = z.infer<typeof aiProviderSchema>
export type ThemeMode = z.infer<typeof themeModeSchema>
