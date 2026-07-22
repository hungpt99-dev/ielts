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

export interface ProviderModelCapability {
  modelPrefix: string
  supportsTemperature: boolean
  supportsMaxTokens: boolean
  supportsMaxCompletionTokens: boolean
  supportsReasoningEffort: boolean
}

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
  readonly modelCapabilities?: ProviderModelCapability[]
}

export interface AiCredential {
  readonly apiKey: string
}

export interface AiModelAssignments {
  tutor?: { providerId: string; modelId: string }
  exerciseGeneration?: { providerId: string; modelId: string }
  writingEvaluation?: { providerId: string; modelId: string }
  speakingEvaluation?: { providerId: string; modelId: string }
  planEnrichment?: { providerId: string; modelId: string }
}
