import type { AIAdapter, Message } from '../adapters/types'
import { OpenAiCompatibleAdapter } from '../adapters/openai'
import { AIConfigError } from '../errors/types'
import type { AIClient, AICallResult, ProviderConfig } from './types'

export type { AIClient, AICallResult, ProviderConfig }

export function createAIClient(adapter?: AIAdapter): AIClient {
  const actual = adapter ?? new OpenAiCompatibleAdapter()

  return {
    async complete(
      messages: Message[],
      config: ProviderConfig,
      options?: { temperature?: number; maxTokens?: number },
    ): Promise<AICallResult> {
      if (!config.apiKey) {
        return { content: null, error: 'API key not configured. Add your AI API key in Settings.' }
      }

      try {
        const response = await actual.complete(
          {
            model: config.model,
            messages,
            temperature: options?.temperature ?? config.temperature,
            max_tokens: options?.maxTokens ?? config.maxTokens,
          },
          {
            apiKey: config.apiKey,
            baseUrl: config.baseUrl,
            model: config.model,
            temperature: options?.temperature ?? config.temperature,
            maxTokens: options?.maxTokens ?? config.maxTokens,
          },
        )

        return { content: response.content, error: null }
      } catch (err: unknown) {
        console.error('packages/ai/src/client/index.ts error:', err);
        if (err instanceof Error) {
          return { content: null, error: err.message }
        }
        return { content: null, error: 'AI request failed with an unknown error.' }
      }
    },

    async testConnection(config: ProviderConfig): Promise<boolean> {
      if (!config.apiKey) {
        throw new AIConfigError()
      }
      return actual.testConnection({
        apiKey: config.apiKey,
        baseUrl: config.baseUrl,
        model: config.model,
      })
    },
  }
}

const defaultClient = createAIClient()

export function callAI(
  systemPrompt: string,
  userPrompt: string,
  getConfig: () => ProviderConfig,
  options?: { temperature?: number; maxTokens?: number },
): Promise<AICallResult> {
  const config = getConfig()
  return defaultClient.complete(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    config,
    options,
  )
}
