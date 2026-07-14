export type AiAdapterType = 'openai-compatible'

export type AiProviderId =
  | 'openai'
  | 'claude'
  | 'gemini'
  | 'deepseek'
  | 'openrouter'
  | 'groq'
  | 'local'
  | 'custom'

export interface AiProviderDefinition {
  readonly id: AiProviderId
  readonly displayName: string
  readonly adapter: AiAdapterType
  readonly defaultApiUrl?: string
  readonly defaultModel?: string
  readonly requiresApiKey: boolean
  readonly allowsCustomApiUrl: boolean
  readonly allowsCustomModel: boolean
  readonly visibleInProviderPicker: boolean
}

export interface AiCredential {
  readonly apiKey: string
}
