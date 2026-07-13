import type { AIAdapter, AIAdapterConfig, CompletionRequest, CompletionResponse } from './types'
import { AIAuthError, AIRateLimitError, AINetworkError, AIEmptyResponseError, AIError } from '../errors/types'

export class OpenAIAdapter implements AIAdapter {
  async complete(
    request: CompletionRequest,
    config: AIAdapterConfig,
  ): Promise<CompletionResponse> {
    const url = `${config.baseUrl.replace(/\/+$/, '')}/chat/completions`

    let response: Response
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: request.model,
          messages: request.messages,
          ...(request.temperature !== undefined ? { temperature: request.temperature } : config.temperature !== undefined ? {} : { temperature: 0.5 }),
          ...(request.max_tokens !== undefined ? { max_tokens: request.max_tokens } : config.maxTokens !== undefined ? {} : { max_tokens: 1500 }),
        }),
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
        throw new AINetworkError()
      }
      throw new AIError(`AI request failed: ${message}`, 'REQUEST_FAILED')
    }

    if (!response.ok) {
      if (response.status === 401) throw new AIAuthError()
      if (response.status === 429) throw new AIRateLimitError()
      throw new AIError(
        `AI API error (${response.status}). Check your provider settings.`,
        'API_ERROR',
      )
    }

    const data = await response.json()
    const content: string = data.choices?.[0]?.message?.content || ''

    if (!content) {
      throw new AIEmptyResponseError()
    }

    return {
      content,
      model: data.model || request.model,
      usage: data.usage
        ? {
            prompt_tokens: data.usage.prompt_tokens,
            completion_tokens: data.usage.completion_tokens,
            total_tokens: data.usage.total_tokens,
          }
        : undefined,
    }
  }

  async testConnection(config: AIAdapterConfig): Promise<boolean> {
    try {
      await this.complete(
        {
          model: config.model,
          messages: [{ role: 'user', content: 'Respond with "ok".' }],
          max_tokens: 10,
        },
        config,
      )
      return true
    } catch {
      return false
    }
  }
}
