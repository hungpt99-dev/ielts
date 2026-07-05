import { explain, type AiExplainType } from '@ielts/ai'
import { safeFetchProviderConfig } from '../utils/safe-chrome'
import { registerHandler } from './messaging'

interface AiExplainPayload {
  text: string
  action: string
  systemPrompt?: string
  userPrompt?: string
}

async function fetchProviderConfig(): Promise<{ apiKey: string; baseUrl: string; model: string }> {
  const config = await safeFetchProviderConfig()
  if (!config.apiKey) throw new Error('API key not configured. Add your AI API key in Settings.')
  return config
}

async function handleStandardExplain(text: string, action: string) {
  const config = await fetchProviderConfig()
  const result = await explain(action as AiExplainType, text, () => config)
  if (result.error) throw new Error(result.error)
  return result.data
}

async function handleCustomPrompt(systemPrompt: string, userMessage: string) {
  const config = await fetchProviderConfig()

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 1024,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error')
    throw new Error(`AI API error (${response.status}): ${errorText}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || 'No response from AI'
}

export function initAiService(): void {
  registerHandler('AI_EXPLAIN', async (message) => {
    const payload = message.payload as AiExplainPayload
    if (!payload.text) throw new Error('No text provided')

    console.log(`[ai-service] AI_EXPLAIN action=${payload.action} text.length=${payload.text.length}`)

    if (payload.systemPrompt && payload.userPrompt) {
      return await handleCustomPrompt(payload.systemPrompt, `${payload.userPrompt}\n\n${payload.text}`)
    }

    return await handleStandardExplain(payload.text, payload.action)
  })
}
