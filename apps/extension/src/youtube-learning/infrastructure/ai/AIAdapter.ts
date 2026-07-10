import { safeFetchProviderConfig } from '../../../utils/safe-chrome'

export interface AIRequestOptions {
  maxTokens?: number
  temperature?: number
}

export interface AIResult {
  content: string
  error: string | null
}

export class AIAdapter {
  async request(systemPrompt: string, userPrompt: string, options?: AIRequestOptions): Promise<AIResult> {
    try {
      const config = await safeFetchProviderConfig()
      if (!config.apiKey) {
        return { content: '', error: 'AI API key not configured. Add your key in Settings.' }
      }

      const baseUrl = config.baseUrl.replace(/\/+$/, '')
      const url = `${baseUrl}/chat/completions`
      const temperature = options?.temperature ?? 0.4
      const maxTokens = options?.maxTokens ?? 2000

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature,
          max_tokens: maxTokens,
        }),
      })

      if (!response.ok) {
        const errBody = await response.text().catch(() => '')
        if (response.status === 401) {
          return { content: '', error: 'Invalid API key. Check your key in Settings.' }
        }
        if (response.status === 429) {
          return { content: '', error: 'Rate limit exceeded. Wait and try again.' }
        }
        return { content: '', error: `AI API error (${response.status}): ${errBody || response.statusText}` }
      }

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content || ''
      if (!content) {
        return { content: '', error: 'AI returned an empty response.' }
      }
      return { content, error: null }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
        return { content: '', error: 'Network error. Check your internet connection.' }
      }
      return { content: '', error: `AI request failed: ${message}` }
    }
  }

  async isConfigured(): Promise<boolean> {
    try {
      const config = await safeFetchProviderConfig()
      return !!config.apiKey
    } catch {
      return false
    }
  }

  async getConfiguration(): Promise<{ apiKey: string; baseUrl: string; model: string }> {
    return safeFetchProviderConfig()
  }
}
