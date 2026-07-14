import type { AiProviderId, AiProviderDefinition } from './ai-types'

export const AI_PROVIDER_DEFINITIONS = {
  openai: {
    id: 'openai',
    displayName: 'OpenAI',
    adapter: 'openai-compatible',
    defaultApiUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4.1-mini',
    requiresApiKey: true,
    allowsCustomApiUrl: false,
    allowsCustomModel: true,
    visibleInProviderPicker: true,
  },
  claude: {
    id: 'claude',
    displayName: 'Anthropic Claude',
    adapter: 'openai-compatible',
    defaultApiUrl: 'https://api.anthropic.com/v1',
    defaultModel: 'claude-sonnet-4-20250514',
    requiresApiKey: true,
    allowsCustomApiUrl: false,
    allowsCustomModel: true,
    visibleInProviderPicker: true,
  },
  gemini: {
    id: 'gemini',
    displayName: 'Google Gemini',
    adapter: 'openai-compatible',
    defaultApiUrl: 'https://generativelanguage.googleapis.com/v1beta',
    defaultModel: 'gemini-2.0-flash',
    requiresApiKey: true,
    allowsCustomApiUrl: false,
    allowsCustomModel: true,
    visibleInProviderPicker: true,
  },
  deepseek: {
    id: 'deepseek',
    displayName: 'DeepSeek',
    adapter: 'openai-compatible',
    defaultApiUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    requiresApiKey: true,
    allowsCustomApiUrl: false,
    allowsCustomModel: true,
    visibleInProviderPicker: true,
  },
  openrouter: {
    id: 'openrouter',
    displayName: 'OpenRouter',
    adapter: 'openai-compatible',
    defaultApiUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'openai/gpt-4o-mini',
    requiresApiKey: true,
    allowsCustomApiUrl: false,
    allowsCustomModel: true,
    visibleInProviderPicker: true,
  },
  groq: {
    id: 'groq',
    displayName: 'Groq',
    adapter: 'openai-compatible',
    defaultApiUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.3-70b-versatile',
    requiresApiKey: true,
    allowsCustomApiUrl: false,
    allowsCustomModel: true,
    visibleInProviderPicker: true,
  },
  local: {
    id: 'local',
    displayName: 'Local AI',
    adapter: 'openai-compatible',
    defaultApiUrl: 'http://localhost:11434/v1',
    defaultModel: 'llama3',
    requiresApiKey: false,
    allowsCustomApiUrl: true,
    allowsCustomModel: true,
    visibleInProviderPicker: true,
  },
  custom: {
    id: 'custom',
    displayName: 'Custom Provider',
    adapter: 'openai-compatible',
    requiresApiKey: false,
    allowsCustomApiUrl: true,
    allowsCustomModel: true,
    visibleInProviderPicker: true,
  },
} as const satisfies Record<AiProviderId, AiProviderDefinition>

export function getVisibleProviders(): AiProviderDefinition[] {
  return Object.values(AI_PROVIDER_DEFINITIONS).filter(p => p.visibleInProviderPicker)
}

export function getProviderById(id: AiProviderId): AiProviderDefinition | undefined {
  return AI_PROVIDER_DEFINITIONS[id]
}
