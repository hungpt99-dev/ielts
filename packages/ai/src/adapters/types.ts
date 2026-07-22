export interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface CompletionRequest {
  model: string
  messages: Message[]
  temperature?: number
  max_tokens?: number
  signal?: AbortSignal
}

export interface CompletionResponse {
  content: string
  model: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export interface AIAdapterConfig {
  apiKey: string
  baseUrl: string
  model: string
  temperature?: number
  maxTokens?: number
  timeoutMs?: number
}

export interface AIAdapter {
  complete(request: CompletionRequest, config: AIAdapterConfig): Promise<CompletionResponse>
  testConnection(config: AIAdapterConfig): Promise<boolean>
}
