import { callAI } from '@ielts/ai'
import type { AICallResult, ProviderConfig } from '@ielts/ai'
import { safeFetchProviderConfig } from '../../../utils/safe-chrome'

export interface AIAdapterRequest {
  systemPrompt: string
  userMessage: string
  temperature?: number
  maxTokens?: number
}

export class AIAdapter {
  private cachedConfig: ProviderConfig | null = null

  private async getProviderConfig(): Promise<ProviderConfig> {
    if (!this.cachedConfig) {
      this.cachedConfig = await safeFetchProviderConfig()
    }
    return this.cachedConfig
  }

  async request(params: AIAdapterRequest): Promise<AICallResult> {
    const providerConfig = await this.getProviderConfig()
    const result = await callAI(params.systemPrompt, params.userMessage, () => providerConfig, {
      temperature: params.temperature ?? 0.7,
      maxTokens: params.maxTokens ?? 2048,
    })
    return result
  }

  async requestJSON<T>(params: AIAdapterRequest): Promise<T | null> {
    const providerConfig = await this.getProviderConfig()
    const result = await callAI(params.systemPrompt, `${params.userMessage}\n\nReturn valid JSON only.`, () => providerConfig, {
      temperature: params.temperature ?? 0.3,
      maxTokens: params.maxTokens ?? 2048,
    })
    if (result.error || !result.content) return null
    try { return JSON.parse(result.content) as T }
    catch { return null }
  }
}
