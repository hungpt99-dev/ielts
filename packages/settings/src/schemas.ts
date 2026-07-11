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
