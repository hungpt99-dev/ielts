export const DEFAULT_AI_TIMEOUT_MS = 120_000
export const DEFAULT_AI_MAX_RETRIES = 2
export const DEFAULT_AI_TEMPERATURE = 0.7
export const DEFAULT_AI_MODEL = ''
export const DEFAULT_AI_MAX_TOKENS = 24_000

/** @deprecated Use dynamic call budgeting in AiPlanOrchestrator instead. */
export const DEFAULT_PLAN_ENRICH_MAX_CALLS = 10
export const DEFAULT_PLAN_ENRICH_HARD_CALL_LIMIT = 25
export const DEFAULT_PLAN_ENRICH_MAX_REPAIR_CALLS = 3

export const AI_PROVIDER_IDS = [
  'openai', 'claude', 'gemini', 'deepseek',
  'openrouter', 'groq', 'local', 'custom',
] as const

export const DEFAULT_AI_PROVIDER_ID = 'openai'

export const DEFAULT_AI_MODEL_ASSIGNMENTS: import('./ai-types').AiModelAssignments = {}
