import { z } from 'zod'

export const OPENAI_BASE_URL = 'https://api.openai.com/v1'
export const DEFAULT_MODEL = 'gpt-4.1-mini'

export const AI_PROVIDERS = ['openai', 'custom'] as const

export const aiProviderSchema = z.enum(AI_PROVIDERS)

export const AI_PROVIDER_IDS = [
  'openai', 'claude', 'gemini', 'deepseek',
  'openrouter', 'groq', 'local', 'custom',
] as const

export const aiUserSettingsSchema = z.object({
  providerId: z.enum(AI_PROVIDER_IDS).default('openai'),
  model: z.string().optional(),
  customApiUrl: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
})

const studySettingsSchema = z.object({
  targetBand: z.number().min(0).max(9).default(6.5),
  currentBand: z.number().min(0).max(9).default(5.5),
  examDate: z.string().optional(),
  dailyStudyMinutes: z.number().int().positive().default(60),
  weakSkills: z.array(z.string()).default([]),
  nativeLanguage: z.string().default(''),
  studyGoal: z.enum(['academic', 'general']).default('academic'),
  preferredSchedule: z.array(z.string()).default(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']),
})

const themeSettingsSchema = z.object({
  mode: z.enum(['light', 'dark', 'system']).default('system'),
  accentColor: z.string().default('#2563eb'),
})

const notificationSettingsSchema = z.object({
  enabled: z.boolean().default(true),
  reminderTime: z.string().default('09:00'),
})

export const userConfigurationSchema = z.object({
  version: z.number().int().positive().default(1),
  ai: aiUserSettingsSchema.default(aiUserSettingsSchema.parse({})),
  study: studySettingsSchema.default(studySettingsSchema.parse({})),
  theme: themeSettingsSchema.default(themeSettingsSchema.parse({})),
  notifications: notificationSettingsSchema.default(notificationSettingsSchema.parse({})),
})

export const aiSettingsSchema = z.object({
  aiProvider: aiProviderSchema.default('openai'),
  aiBaseUrl: z.string().default(''),
  aiApiKey: z.string().default(''),
  aiModel: z.string().default(DEFAULT_MODEL),
})

export const THEME_MODES = ['light', 'dark', 'system'] as const

export const themeModeSchema = z.enum(THEME_MODES)

export const NATIVE_LANGUAGES = [
  { value: '', label: 'Auto (let AI decide)' },
  { value: 'Arabic', label: 'العربية (Arabic)' },
  { value: 'Bengali', label: 'বাংলা (Bengali)' },
  { value: 'Chinese (Simplified)', label: '简体中文 (Chinese Simplified)' },
  { value: 'Chinese (Traditional)', label: '繁體中文 (Chinese Traditional)' },
  { value: 'Dutch', label: 'Nederlands (Dutch)' },
  { value: 'English', label: 'English' },
  { value: 'French', label: 'Français (French)' },
  { value: 'German', label: 'Deutsch (German)' },
  { value: 'Greek', label: 'Ελληνικά (Greek)' },
  { value: 'Hindi', label: 'हिन्दी (Hindi)' },
  { value: 'Indonesian', label: 'Bahasa Indonesia (Indonesian)' },
  { value: 'Italian', label: 'Italiano (Italian)' },
  { value: 'Japanese', label: '日本語 (Japanese)' },
  { value: 'Korean', label: '한국어 (Korean)' },
  { value: 'Malay', label: 'Bahasa Melayu (Malay)' },
  { value: 'Persian', label: 'فارسی (Persian)' },
  { value: 'Polish', label: 'Polski (Polish)' },
  { value: 'Portuguese', label: 'Português (Portuguese)' },
  { value: 'Russian', label: 'Русский (Russian)' },
  { value: 'Spanish', label: 'Español (Spanish)' },
  { value: 'Swahili', label: 'Kiswahili (Swahili)' },
  { value: 'Tagalog', label: 'Tagalog (Filipino)' },
  { value: 'Tamil', label: 'தமிழ் (Tamil)' },
  { value: 'Thai', label: 'ไทย (Thai)' },
  { value: 'Turkish', label: 'Türkçe (Turkish)' },
  { value: 'Urdu', label: 'اردو (Urdu)' },
  { value: 'Vietnamese', label: 'Tiếng Việt (Vietnamese)' },
] as const

export const nativeLanguageSchema = z.string().default('')

export const sharedSettingsSchema = aiSettingsSchema.extend({
  themeMode: themeModeSchema.default('system'),
  nativeLanguage: nativeLanguageSchema,
})
