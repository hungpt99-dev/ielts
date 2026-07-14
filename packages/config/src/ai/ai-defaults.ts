export const DEFAULT_AI_TIMEOUT_MS = 30_000
export const DEFAULT_AI_MAX_RETRIES = 2
export const DEFAULT_AI_TEMPERATURE = 0.7
export const DEFAULT_AI_MODEL = 'gpt-4.1-mini'

export const AI_PROVIDER_IDS = [
  'openai', 'claude', 'gemini', 'deepseek',
  'openrouter', 'groq', 'local', 'custom',
] as const
