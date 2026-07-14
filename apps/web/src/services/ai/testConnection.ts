import { callAI } from '@ielts/ai'

export async function testConnection(config: { apiKey: string; baseUrl: string; model: string }): Promise<{ ok: boolean; message: string }> {
  try {
    const result = await callAI(
      'You are a test assistant. Reply with exactly "OK".',
      'Reply with exactly "OK".',
      () => config,
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
