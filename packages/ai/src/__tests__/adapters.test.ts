import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { OpenAIAdapter } from '../adapters/openai'
import type { AIAdapterConfig, CompletionRequest } from '../adapters/types'
import { AIAuthError, AIRateLimitError, AINetworkError, AIEmptyResponseError, AIError } from '../errors/types'

const createMockFetch = (status: number, body: unknown) => {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
  })
}

describe('OpenAIAdapter', () => {
  let adapter: OpenAIAdapter
  let config: AIAdapterConfig
  let request: CompletionRequest

  beforeEach(() => {
    adapter = new OpenAIAdapter()
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
      vi.stubGlobal('fetch', createMockFetch(401, {}))

      await expect(adapter.complete(request, config)).rejects.toThrow(AIAuthError)
    })

    it('throws AIRateLimitError on 429', async () => {
      vi.stubGlobal('fetch', createMockFetch(429, {}))

      await expect(adapter.complete(request, config)).rejects.toThrow(AIRateLimitError)
    })

    it('throws AIError on other errors', async () => {
      vi.stubGlobal('fetch', createMockFetch(500, {}))

      await expect(adapter.complete(request, config)).rejects.toThrow(AIError)
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
      expect(body.temperature).toBeUndefined()
      expect(body.max_tokens).toBeUndefined()
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
      vi.stubGlobal('fetch', createMockFetch(401, {}))

      const result = await adapter.testConnection(config)
      expect(result).toBe(false)
    })

    it('returns false on network error', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))

      const result = await adapter.testConnection(config)
      expect(result).toBe(false)
    })
  })
})
