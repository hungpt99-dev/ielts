import type { TutorError } from '../domain/errors/tutor-error'

export interface TutorAIRequest<TSchema> {
  systemPrompt: string
  userMessage: string
  schema: TSchema
  temperature?: number
  maxTokens?: number
}

export interface TutorAIRequestOptions {
  signal?: AbortSignal
  timeoutMs?: number
  cacheKey?: string
}

export interface TutorAIResult<TSchema> {
  success: boolean
  data?: TSchema
  error?: TutorError
  usage?: {
    promptTokens: number
    completionTokens: number
  }
}

export interface TutorAIClient {
  generateStructured<TSchema>(
    request: TutorAIRequest<TSchema>,
    options?: TutorAIRequestOptions,
  ): Promise<TutorAIResult<TSchema>>
}

export class FallbackTutorAIClient implements TutorAIClient {
  async generateStructured<TSchema>(
    _request: TutorAIRequest<TSchema>,
    _options?: TutorAIRequestOptions,
  ): Promise<TutorAIResult<TSchema>> {
    return {
      success: false,
      error: {
        code: 'ai_not_configured',
        message: 'AI provider is not configured',
        recoverable: true,
      },
    }
  }
}
