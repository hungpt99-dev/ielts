import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createAIClient, callAI } from '../client/index'
import { AIConfigError } from '../errors/types'
import type { AIAdapter, CompletionRequest, AIAdapterConfig, CompletionResponse } from '../adapters/types'
import type { ProviderConfig } from '../client/types'

function createMockAdapter(): AIAdapter {
  return {
    complete: vi.fn(),
    testConnection: vi.fn(),
  }
}

describe('createAIClient', () => {
  let adapter: ReturnType<typeof createMockAdapter>
  let config: ProviderConfig

  beforeEach(() => {
    adapter = createMockAdapter()
    config = {
      apiKey: 'sk-test',
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4',
      temperature: 0.5,
      maxTokens: 1000,
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('complete', () => {
    it('returns content on successful completion', async () => {
      vi.mocked(adapter.complete).mockResolvedValue({
        content: 'Hello!',
        model: 'gpt-4',
      })

      const client = createAIClient(adapter)
      const result = await client.complete(
        [{ role: 'user', content: 'Hi' }],
        config,
      )

      expect(result.content).toBe('Hello!')
      expect(result.error).toBeNull()
    })

    it('returns error when adapter fails', async () => {
      vi.mocked(adapter.complete).mockRejectedValue(new Error('API failure'))

      const client = createAIClient(adapter)
      const result = await client.complete(
        [{ role: 'user', content: 'Hi' }],
        config,
      )

      expect(result.content).toBeNull()
      expect(result.error).toBe('API failure')
    })

    it('returns error when API key is empty', async () => {
      const client = createAIClient(adapter)
      const result = await client.complete(
        [{ role: 'user', content: 'Hi' }],
        { ...config, apiKey: '' },
      )

      expect(result.content).toBeNull()
      expect(result.error).toContain('API key not configured')
    })

    it('returns error with unknown error message', async () => {
      vi.mocked(adapter.complete).mockRejectedValue('string error')

      const client = createAIClient(adapter)
      const result = await client.complete(
        [{ role: 'user', content: 'Hi' }],
        config,
      )

      expect(result.content).toBeNull()
      expect(result.error).toContain('unknown error')
    })

    it('passes messages and config to adapter', async () => {
      vi.mocked(adapter.complete).mockResolvedValue({
        content: 'response',
        model: 'gpt-4',
      })

      const client = createAIClient(adapter)
      const messages = [{ role: 'user' as const, content: 'Hello' }]
      await client.complete(messages, config, { temperature: 0.7, maxTokens: 200 })

      expect(vi.mocked(adapter.complete).mock.calls[0][0].messages).toEqual(messages)
      expect(vi.mocked(adapter.complete).mock.calls[0][1].apiKey).toBe('sk-test')
    })

    it('passes temperature and maxTokens options', async () => {
      vi.mocked(adapter.complete).mockResolvedValue({
        content: 'response',
        model: 'gpt-4',
      })

      const client = createAIClient(adapter)
      await client.complete(
        [{ role: 'user', content: 'Hello' }],
        config,
        { temperature: 0.3, maxTokens: 500 },
      )

      const requestArg = vi.mocked(adapter.complete).mock.calls[0][0] as CompletionRequest
      expect(requestArg.temperature).toBe(0.3)
      expect(requestArg.max_tokens).toBe(500)
    })
  })

  describe('testConnection', () => {
    it('returns true when adapter succeeds', async () => {
      vi.mocked(adapter.testConnection).mockResolvedValue(true)

      const client = createAIClient(adapter)
      const result = await client.testConnection(config)

      expect(result).toBe(true)
    })

    it('returns false when adapter fails', async () => {
      vi.mocked(adapter.testConnection).mockResolvedValue(false)

      const client = createAIClient(adapter)
      const result = await client.testConnection(config)

      expect(result).toBe(false)
    })

    it('throws AIConfigError when API key is empty', async () => {
      const client = createAIClient(adapter)

      await expect(client.testConnection({ ...config, apiKey: '' })).rejects.toThrow(AIConfigError)
    })
  })
})

describe('callAI', () => {
  it('calls AI with system and user prompts', async () => {
    const result = await callAI(
      'You are a helpful assistant.',
      'What is IELTS?',
      () => ({
        apiKey: 'sk-test',
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-4',
      }),
    )

    expect(result).toBeDefined()
  })

  it('returns error for empty API key', async () => {
    const result = await callAI(
      'system',
      'user',
      () => ({
        apiKey: '',
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-4',
      }),
    )

    expect(result.content).toBeNull()
    expect(result.error).toBeTruthy()
  })

  it('passes temperature and maxTokens options', async () => {
    const result = await callAI(
      'system',
      'user',
      () => ({
        apiKey: 'sk-test',
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-4',
      }),
      { temperature: 0.2, maxTokens: 100 },
    )

    expect(result).toBeDefined()
  })
})
