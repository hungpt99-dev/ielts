import type { AIAdapter, AIAdapterConfig, CompletionRequest, CompletionResponse } from './types'
import { AIAuthError, AIRateLimitError, AINetworkError, AIEmptyResponseError, AIError, AITimeoutError } from '../errors/types'
import { buildRequestBody } from './model-capabilities'

export class OpenAiCompatibleAdapter implements AIAdapter {
  async complete(
    request: CompletionRequest,
    config: AIAdapterConfig,
  ): Promise<CompletionResponse> {
    const apiKey = (config.apiKey ?? '').trim()
    if (!apiKey) {
      throw new AIError('API key is empty', 'MISSING_API_KEY')
    }

    const baseUrl = (config.baseUrl ?? '').trim().replace(/\/+$/, '')
    if (!baseUrl) {
      throw new AIError('Base URL is empty', 'MISSING_BASE_URL')
    }

    const model = (request.model ?? config.model ?? '').trim()
    if (!model) {
      throw new AIError('Model name is empty', 'MISSING_MODEL')
    }

    const url = `${baseUrl}/chat/completions`

    const body = buildRequestBody(model, request.messages, {
      temperature: request.temperature ?? config.temperature,
      maxTokens: request.max_tokens ?? config.maxTokens,
    })

    const signal = createTimeoutSignal(request.signal, config.timeoutMs)

    let response: Response
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
        signal,
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new AITimeoutError()
      }
      if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
        throw new AINetworkError()
      }
      if (message.includes('abort') || message.includes('AbortError')) {
        throw new AITimeoutError()
      }
      throw new AIError(`AI request failed: ${message}`, 'REQUEST_FAILED')
    }

    if (!response.ok) {
      await throwProviderError(response, model, url)
    }

    const data = await response.json()
    const content: string = data.choices?.[0]?.message?.content || ''

    if (!content) {
      throw new AIEmptyResponseError()
    }

    return {
      content,
      model: data.model || model,
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
      const apiKey = (config.apiKey ?? '').trim()
      if (!apiKey) return false

      const model = (config.model ?? '').trim()
      if (!model) return false

      await this.complete(
        {
          model,
          messages: [{ role: 'user', content: 'Say "ok"' }],
          max_tokens: 10,
        },
        { ...config, apiKey, model },
      )
      return true
    } catch {
      return false
    }
  }
}

async function throwProviderError(response: Response, model: string, _url: string): Promise<never> {
  let providerMessage: string | undefined
  let providerCode: string | undefined
  let providerType: string | undefined

  try {
    const errorBody = await response.json()
    const err = errorBody?.error
    if (err) {
      providerMessage = err.message
      providerCode = err.code
      providerType = err.type
    }
  } catch {
    // could not parse error body
  }

  if (response.status === 401) throw new AIAuthError()
  if (response.status === 429) throw new AIRateLimitError()

  const parts: string[] = [`HTTP ${response.status}`]
  if (providerMessage) parts.push(providerMessage)
  if (providerCode) parts.push(`(code: ${providerCode})`)
  if (providerType) parts.push(`[${providerType}]`)
  parts.push(`model: ${model}`)

  throw new AIError(parts.join(' — '), response.status === 404 ? 'MODEL_NOT_FOUND' : 'API_ERROR')
}

const DEFAULT_TIMEOUT_MS = 120_000

function createTimeoutSignal(
  requestSignal?: AbortSignal,
  timeoutMs?: number,
): AbortSignal | undefined {
  const effectiveTimeout = timeoutMs ?? DEFAULT_TIMEOUT_MS

  if (requestSignal) {
    return requestSignal
  }

  if (effectiveTimeout <= 0) {
    return undefined
  }

  const controller = new AbortController()
  setTimeout(() => controller.abort(), effectiveTimeout)
  return controller.signal
}
