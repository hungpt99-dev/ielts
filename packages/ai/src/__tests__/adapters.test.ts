import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { OpenAiCompatibleAdapter } from '../adapters/openai'
import type { AIAdapterConfig, CompletionRequest } from '../adapters/types'
import { AIAuthError, AIRateLimitError, AINetworkError, AIEmptyResponseError, AIError } from '../errors/types'

const createMockFetch = (status: number, body: unknown) => {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
  })
}

describe('OpenAiCompatibleAdapter', () => {
  let adapter: OpenAiCompatibleAdapter
  let config: AIAdapterConfig
  let request: CompletionRequest

  beforeEach(() => {
    adapter = new OpenAiCompatibleAdapter()
    config = {
      apiKey: 'test-key',
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4',
      temperature: 0.5,
      maxTokens: 1000,
    }
    request = {
      model: 'gpt-4',
      messages: [{ role: 'user', content: 'Hello' }],
      temperature: 0.5,
      max_tokens: 100,
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('complete', () => {
    it('makes a POST request with correct headers and body', async () => {
      const mockFetch = createMockFetch(200, {
        choices: [{ message: { content: 'Response text' } }],
        model: 'gpt-4',
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      })
      vi.stubGlobal('fetch', mockFetch)

      await adapter.complete(request, config)

      expect(mockFetch).toHaveBeenCalledOnce()
      const callUrl = mockFetch.mock.calls[0][0]
      const callOptions = mockFetch.mock.calls[0][1]

      expect(callUrl).toBe('https://api.openai.com/v1/chat/completions')
      expect(callOptions.method).toBe('POST')
      expect(callOptions.headers['Content-Type']).toBe('application/json')
      expect(callOptions.headers['Authorization']).toBe('Bearer test-key')

      const body = JSON.parse(callOptions.body)
      expect(body.model).toBe('gpt-4')
      expect(body.messages).toEqual([{ role: 'user', content: 'Hello' }])
      expect(body.temperature).toBe(0.5)
      expect(body.max_tokens).toBe(100)
    })

    it('GPT-5-mini uses max_completion_tokens not max_tokens', async () => {
      const mockFetch = createMockFetch(200, {
        choices: [{ message: { content: 'Response' } }],
        model: 'gpt-5-mini',
      })
      vi.stubGlobal('fetch', mockFetch)

      const gpt5Request: CompletionRequest = {
        model: 'gpt-5-mini',
        messages: [{ role: 'user', content: 'Hi' }],
        temperature: 0.5,
        max_tokens: 100,
      }

      await adapter.complete(gpt5Request, config)

      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.model).toBe('gpt-5-mini')
      expect(body.max_tokens).toBeUndefined()
      expect(body.max_completion_tokens).toBe(100)
    })

    it('o3-mini omits temperature and uses max_completion_tokens', async () => {
      const mockFetch = createMockFetch(200, {
        choices: [{ message: { content: 'Response' } }],
        model: 'o3-mini',
      })
      vi.stubGlobal('fetch', mockFetch)

      const o3Request: CompletionRequest = {
        model: 'o3-mini',
        messages: [{ role: 'user', content: 'Hi' }],
        temperature: 0.5,
        max_tokens: 100,
      }

      await adapter.complete(o3Request, config)

      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.temperature).toBeUndefined()
      expect(body.max_completion_tokens).toBe(100)
    })

    it('returns content from successful response', async () => {
      vi.stubGlobal('fetch', createMockFetch(200, {
        choices: [{ message: { content: 'Hello! How can I help?' } }],
        model: 'gpt-4',
      }))

      const result = await adapter.complete(request, config)
      expect(result.content).toBe('Hello! How can I help?')
      expect(result.model).toBe('gpt-4')
    })

    it('returns usage data when present', async () => {
      vi.stubGlobal('fetch', createMockFetch(200, {
        choices: [{ message: { content: 'Response' } }],
        model: 'gpt-4',
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
      }))

      const result = await adapter.complete(request, config)
      expect(result.usage).toEqual({ prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 })
    })

    it('returns undefined usage when absent', async () => {
      vi.stubGlobal('fetch', createMockFetch(200, {
        choices: [{ message: { content: 'Response' } }],
        model: 'gpt-4',
      }))

      const result = await adapter.complete(request, config)
      expect(result.usage).toBeUndefined()
    })

    it('throws AIAuthError on 401', async () => {
      vi.stubGlobal('fetch', createMockFetch(401, {
        error: { message: 'Invalid API key', code: 'invalid_api_key', type: 'auth_error' },
      }))

      await expect(adapter.complete(request, config)).rejects.toThrow(AIAuthError)
    })

    it('throws AIRateLimitError on 429', async () => {
      vi.stubGlobal('fetch', createMockFetch(429, {
        error: { message: 'Rate limit exceeded', code: 'rate_limit_exceeded', type: 'rate_limit_error' },
      }))

      await expect(adapter.complete(request, config)).rejects.toThrow(AIRateLimitError)
    })

    it('includes provider error message on 400', async () => {
      vi.stubGlobal('fetch', createMockFetch(400, {
        error: { message: "'max_tokens' is not supported for this model", code: 'invalid_request_error', type: 'invalid_request_error' },
      }))

      await expect(adapter.complete(request, config)).rejects.toThrow(/max_tokens/)
    })

    it('distinguishes model-not-found (404) from endpoint errors', async () => {
      vi.stubGlobal('fetch', createMockFetch(404, {
        error: { message: 'The model `gpt-5-mini` does not exist', code: 'model_not_found', type: 'invalid_request_error' },
      }))

      try {
        await adapter.complete(request, config)
        expect.fail('Should have thrown')
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(AIError)
        const aiErr = err as AIError
        expect(aiErr.code).toBe('MODEL_NOT_FOUND')
        expect(aiErr.message).toContain('gpt-5-mini')
      }
    })

    it('includes model name in error message', async () => {
      vi.stubGlobal('fetch', createMockFetch(400, {
        error: { message: 'Bad request', code: 'bad_request' },
      }))

      try {
        await adapter.complete({ ...request, model: 'my-custom-model' }, config)
        expect.fail('Should have thrown')
      } catch (err: unknown) {
        expect(err).toBeInstanceOf(AIError)
        expect((err as AIError).message).toContain('my-custom-model')
      }
    })

    it('throws AIError with status on non-json error response', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        json: vi.fn().mockRejectedValue(new Error('Not JSON')),
      })
      vi.stubGlobal('fetch', mockFetch)

      await expect(adapter.complete(request, config)).rejects.toThrow(/HTTP 502/)
    })

    it('throws AIEmptyResponseError when content is empty', async () => {
      vi.stubGlobal('fetch', createMockFetch(200, {
        choices: [{ message: { content: '' } }],
        model: 'gpt-4',
      }))

      await expect(adapter.complete(request, config)).rejects.toThrow(AIEmptyResponseError)
    })

    it('throws AIEmptyResponseError when choices is empty', async () => {
      vi.stubGlobal('fetch', createMockFetch(200, {
        choices: [],
        model: 'gpt-4',
      }))

      await expect(adapter.complete(request, config)).rejects.toThrow(AIEmptyResponseError)
    })

    it('throws AINetworkError on network failure', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

      await expect(adapter.complete(request, config)).rejects.toThrow(AINetworkError)
    })

    it('throws AIError on other network errors', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Unknown network error')))

      await expect(adapter.complete(request, config)).rejects.toThrow(AIError)
    })

    it('throws on empty API key', async () => {
      await expect(adapter.complete(request, { ...config, apiKey: '' })).rejects.toThrow(/API key is empty/)
    })

    it('throws on empty model name', async () => {
      await expect(adapter.complete({ ...request, model: '' }, config)).rejects.toThrow(/Model name is empty/)
    })

    it('trims whitespace from model name', async () => {
      const mockFetch = createMockFetch(200, {
        choices: [{ message: { content: 'OK' } }],
        model: 'gpt-4',
      })
      vi.stubGlobal('fetch', mockFetch)

      await adapter.complete({ ...request, model: '  gpt-4  ' }, config)
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.model).toBe('gpt-4')
    })

    it('trims whitespace from API key', async () => {
      const mockFetch = createMockFetch(200, {
        choices: [{ message: { content: 'OK' } }],
        model: 'gpt-4',
      })
      vi.stubGlobal('fetch', mockFetch)

      await adapter.complete(request, { ...config, apiKey: '  my-key  ' })
      expect(mockFetch.mock.calls[0][1].headers['Authorization']).toBe('Bearer my-key')
    })

    it('handles trailing slash in base URL', async () => {
      const configWithSlash: AIAdapterConfig = { ...config, baseUrl: 'https://api.openai.com/v1/' }
      const mockFetch = createMockFetch(200, {
        choices: [{ message: { content: 'OK' } }],
        model: 'gpt-4',
      })
      vi.stubGlobal('fetch', mockFetch)

      await adapter.complete(request, configWithSlash)
      expect(mockFetch.mock.calls[0][0]).toBe('https://api.openai.com/v1/chat/completions')
    })

    it('uses config defaults for missing request values', async () => {
      const minimalRequest: CompletionRequest = {
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'Hi' }],
      }
      const mockFetch = createMockFetch(200, {
        choices: [{ message: { content: 'Response' } }],
        model: 'gpt-4',
      })
      vi.stubGlobal('fetch', mockFetch)

      await adapter.complete(minimalRequest, config)
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.temperature).toBe(0.5)
      expect(body.max_tokens).toBe(1000)
    })

    it('omits temperature and max_tokens when neither request nor config provide them', async () => {
      const minimalConfig: AIAdapterConfig = {
        apiKey: 'test-key',
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-4',
      }
      const minimalRequest: CompletionRequest = {
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'Hi' }],
      }
      const mockFetch = createMockFetch(200, {
        choices: [{ message: { content: 'Response' } }],
        model: 'gpt-4',
      })
      vi.stubGlobal('fetch', mockFetch)

      await adapter.complete(minimalRequest, minimalConfig)
      const body = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(body.temperature).toBeUndefined()
      expect(body.max_tokens).toBeUndefined()
    })

    it('does not log API key in error messages', async () => {
      vi.stubGlobal('fetch', createMockFetch(400, {
        error: { message: 'Bad request', code: 'bad_request' },
      }))

      try {
        await adapter.complete(request, { ...config, apiKey: 'sk-secret-key-12345' })
        expect.fail('Should have thrown')
      } catch (err: unknown) {
        expect((err as Error).message).not.toContain('sk-secret-key-12345')
        expect((err as Error).message).not.toContain('Bearer')
        expect((err as Error).message).not.toContain('Authorization')
      }
    })
  })

  describe('testConnection', () => {
    it('returns true on successful connection', async () => {
      vi.stubGlobal('fetch', createMockFetch(200, {
        choices: [{ message: { content: 'ok' } }],
        model: 'gpt-4',
      }))

      const result = await adapter.testConnection(config)
      expect(result).toBe(true)
    })

    it('returns false on failed connection', async () => {
      vi.stubGlobal('fetch', createMockFetch(401, {
        error: { message: 'Invalid API key', code: 'invalid_api_key' },
      }))

      const result = await adapter.testConnection(config)
      expect(result).toBe(false)
    })

    it('returns false on network error', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))

      const result = await adapter.testConnection(config)
      expect(result).toBe(false)
    })

    it('returns false on empty API key', async () => {
      const result = await adapter.testConnection({ ...config, apiKey: '' })
      expect(result).toBe(false)
    })

    it('returns false on empty model', async () => {
      const result = await adapter.testConnection({ ...config, model: '' })
      expect(result).toBe(false)
    })
  })
})
