import type { Message } from '../adapters/types'

export interface ProviderConfig {
  apiKey: string
  baseUrl: string
  model: string
  temperature?: number
  maxTokens?: number
}

export interface AICallResult {
  content: string | null
  error: string | null
}

export interface AIClient {
  complete(
    messages: Message[],
    config: ProviderConfig,
    options?: { temperature?: number; maxTokens?: number },
  ): Promise<AICallResult>
  testConnection(config: ProviderConfig): Promise<boolean>
}
