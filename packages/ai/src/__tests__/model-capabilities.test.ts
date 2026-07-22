import { describe, it, expect } from 'vitest'
import { getModelCapabilities, buildRequestBody, getProviderCapabilities } from '../adapters/model-capabilities'

describe('ModelCapabilities', () => {
  describe('getModelCapabilities', () => {
    it('GPT-4.1-mini supports temperature and max_tokens', () => {
      const caps = getModelCapabilities('gpt-4.1-mini')
      expect(caps.supportsTemperature).toBe(true)
      expect(caps.supportsMaxTokens).toBe(true)
      expect(caps.supportsMaxCompletionTokens).toBe(false)
    })

    it('GPT-5-mini uses max_completion_tokens not max_tokens', () => {
      const caps = getModelCapabilities('gpt-5-mini')
      expect(caps.supportsTemperature).toBe(false)
      expect(caps.supportsMaxTokens).toBe(false)
      expect(caps.supportsMaxCompletionTokens).toBe(true)
    })

    it('GPT-5 uses max_completion_tokens not max_tokens', () => {
      const caps = getModelCapabilities('gpt-5')
      expect(caps.supportsMaxTokens).toBe(false)
      expect(caps.supportsMaxCompletionTokens).toBe(true)
    })

    it('o1 does not support temperature', () => {
      const caps = getModelCapabilities('o1')
      expect(caps.supportsTemperature).toBe(false)
      expect(caps.supportsMaxCompletionTokens).toBe(true)
    })

    it('o3-mini supports reasoning_effort', () => {
      const caps = getModelCapabilities('o3-mini')
      expect(caps.supportsReasoningEffort).toBe(true)
      expect(caps.supportsTemperature).toBe(false)
    })

    it('o4-mini supports reasoning_effort', () => {
      const caps = getModelCapabilities('o4-mini')
      expect(caps.supportsReasoningEffort).toBe(true)
    })

    it('handles whitespace in model name', () => {
      const caps = getModelCapabilities('  gpt-5-mini  ')
      expect(caps.supportsMaxCompletionTokens).toBe(true)
      expect(caps.supportsMaxTokens).toBe(false)
    })

    it('handles uppercase model name', () => {
      const caps = getModelCapabilities('GPT-5-MINI')
      expect(caps.supportsMaxCompletionTokens).toBe(true)
    })

    it('defaults to standard capabilities for unknown models', () => {
      const caps = getModelCapabilities('unknown-model')
      expect(caps.supportsTemperature).toBe(true)
      expect(caps.supportsMaxTokens).toBe(true)
      expect(caps.supportsMaxCompletionTokens).toBe(false)
    })

    it('gpt-4o has standard capabilities', () => {
      const caps = getModelCapabilities('gpt-4o')
      expect(caps.supportsTemperature).toBe(true)
      expect(caps.supportsMaxTokens).toBe(true)
    })

    it('claude-3-5-sonnet default capabilities', () => {
      const caps = getModelCapabilities('claude-3-5-sonnet')
      expect(caps.supportsTemperature).toBe(true)
      expect(caps.supportsMaxTokens).toBe(true)
      expect(caps.supportsMaxCompletionTokens).toBe(false)
    })

    it('gemini-2.0-flash default capabilities', () => {
      const caps = getModelCapabilities('gemini-2.0-flash')
      expect(caps.supportsTemperature).toBe(true)
      expect(caps.supportsMaxTokens).toBe(true)
    })

    it('deepseek-chat default capabilities', () => {
      const caps = getModelCapabilities('deepseek-chat')
      expect(caps.supportsTemperature).toBe(true)
      expect(caps.supportsMaxTokens).toBe(true)
    })

    it('llama-3.3-70b default capabilities', () => {
      const caps = getModelCapabilities('llama-3.3-70b')
      expect(caps.supportsTemperature).toBe(true)
      expect(caps.supportsMaxTokens).toBe(true)
    })

    it('mixtral-8x7b default capabilities', () => {
      const caps = getModelCapabilities('mixtral-8x7b')
      expect(caps.supportsTemperature).toBe(true)
      expect(caps.supportsMaxTokens).toBe(true)
    })
  })

  describe('getProviderCapabilities', () => {
    it('openai-compatible returns default capabilities', () => {
      const caps = getProviderCapabilities('openai-compatible')
      expect(caps.supportsTemperature).toBe(true)
      expect(caps.supportsMaxTokens).toBe(true)
      expect(caps.supportsMaxCompletionTokens).toBe(false)
      expect(caps.supportsReasoningEffort).toBe(false)
    })

    it('unknown provider returns default capabilities', () => {
      const caps = getProviderCapabilities('unknown-provider')
      expect(caps.supportsTemperature).toBe(true)
      expect(caps.supportsMaxTokens).toBe(true)
    })
  })

  describe('buildRequestBody', () => {
    const messages = [{ role: 'user' as const, content: 'Hello' }]

    it('GPT-4.1-mini uses max_tokens', () => {
      const body = buildRequestBody('gpt-4.1-mini', messages, { temperature: 0.5, maxTokens: 100 })
      expect(body.model).toBe('gpt-4.1-mini')
      expect(body.temperature).toBe(0.5)
      expect(body.max_tokens).toBe(100)
      expect(body.max_completion_tokens).toBeUndefined()
    })

    it('GPT-5-mini uses max_completion_tokens instead of max_tokens', () => {
      const body = buildRequestBody('gpt-5-mini', messages, { maxTokens: 100 })
      expect(body.model).toBe('gpt-5-mini')
      expect(body.max_tokens).toBeUndefined()
      expect(body.max_completion_tokens).toBe(100)
    })

    it('GPT-5-mini uses max_completion_tokens directly when provided', () => {
      const body = buildRequestBody('gpt-5-mini', messages, { maxCompletionTokens: 200 })
      expect(body.max_completion_tokens).toBe(200)
    })

    it('o3-mini omits temperature', () => {
      const body = buildRequestBody('o3-mini', messages, { temperature: 0.7, maxTokens: 50 })
      expect(body.temperature).toBeUndefined()
      expect(body.max_completion_tokens).toBe(50)
    })

    it('o3-mini includes reasoning_effort when provided', () => {
      const body = buildRequestBody('o3-mini', messages, { maxTokens: 50, reasoningEffort: 'medium' })
      expect(body.reasoning_effort).toBe('medium')
    })

    it('omits undefined parameters', () => {
      const body = buildRequestBody('gpt-4o', messages, {})
      expect(body.temperature).toBeUndefined()
      expect(body.max_tokens).toBeUndefined()
      expect(body.model).toBe('gpt-4o')
      expect(body.messages).toEqual(messages)
    })

    it('trims model name', () => {
      const body = buildRequestBody('  gpt-5-mini  ', messages, { maxTokens: 10 })
      expect(body.model).toBe('gpt-5-mini')
    })

    it('does not add reasoning_effort for non-reasoning models', () => {
      const body = buildRequestBody('gpt-5-mini', messages, { reasoningEffort: 'high' })
      expect(body.reasoning_effort).toBeUndefined()
    })
  })
})
