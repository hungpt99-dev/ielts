import { createAIClient } from '@ielts/ai'

const aiClient = createAIClient()

export async function testConnection(config: { apiKey: string; baseUrl: string; model: string }): Promise<{ ok: boolean; message: string }> {
  try {
    const result = await aiClient.complete(
      [
        { role: 'system', content: 'You are a test assistant. Reply with exactly "OK".' },
        { role: 'user', content: 'Reply with exactly "OK".' },
      ],
      { apiKey: config.apiKey, baseUrl: config.baseUrl, model: config.model, temperature: 0, maxTokens: 10 },
      { temperature: 0, maxTokens: 10 },
    )
    if (result.error) {
      return { ok: false, message: result.error }
    }
    return { ok: true, message: 'Connection successful' }
  } catch (error) {
    console.error('apps/web/src/services/ai/testConnection.ts error:', error);
    return { ok: false, message: 'Connection test failed. Check your settings.' }
  }
}
