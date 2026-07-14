import type { z } from 'zod'
import type { aiSettingsSchema, sharedSettingsSchema, aiProviderSchema, themeModeSchema, aiUserSettingsSchema, userConfigurationSchema } from './schemas'

export type AISettings = z.infer<typeof aiSettingsSchema>
export type SharedSettings = z.infer<typeof sharedSettingsSchema>
export type AiProvider = z.infer<typeof aiProviderSchema>
export type ThemeMode = z.infer<typeof themeModeSchema>
export type AiUserSettings = z.infer<typeof aiUserSettingsSchema>
export type UserConfiguration = z.infer<typeof userConfigurationSchema>
