import { createAIClient as createBaseAIClient } from '@ielts/ai'
import { readConfigFromSettings } from './createAiInfrastructure'

const aiClient = createBaseAIClient()

export async function generateEducationalContent(request: any) {
  const cfg = await readConfigFromSettings()
  console.log('[AiTutorPort] generateEducationalContent apiKey:', !!cfg.apiKey, 'baseUrl:', cfg.baseUrl)
  if (!cfg.apiKey) return { success: false, error: { code: 'ai_not_configured', message: 'No AI API key', recoverable: true } }
  try {
    const raw = await aiClient.complete(
      [
        { role: 'system', content: request.systemPrompt ?? '' },
        { role: 'user', content: request.userMessage ?? '' },
      ],
      {
        apiKey: cfg.apiKey,
        baseUrl: cfg.baseUrl,
        model: cfg.model,
        temperature: request.temperature ?? 0.5,
        maxTokens: request.maxTokens ?? 2000,
      },
      { temperature: request.temperature ?? 0.5, maxTokens: request.maxTokens ?? 2000 },
    )
    if (raw.error) return { success: false, error: { code: 'ai_failed', message: raw.error, recoverable: true } }
    try { return { success: true, data: JSON.parse(raw.content ?? '{}') } }
    catch (error) {
 console.error('bootstrap/createAiPorts.ts error:', error);
 return { success: true, data: { text: raw.content } } }
  } catch (error) {
 console.error('bootstrap/createAiPorts.ts error:', error);
 return { success: false, error: { code: 'ai_unavailable', message: 'AI unavailable', recoverable: true } } }
}

export async function evaluateOpenResponse(request: any) {
  const cfg = await readConfigFromSettings()
  if (!cfg.apiKey) return { success: false, error: { code: 'ai_not_configured', message: 'No AI API key', recoverable: true } }
  try {
    const raw = await aiClient.complete(
      [
        { role: 'system', content: `Evaluate this ${request.rubric?.join(', ') ?? 'response'}.\nReturn JSON.` },
        { role: 'user', content: request.response ?? '' },
      ],
      {
        apiKey: cfg.apiKey,
        baseUrl: cfg.baseUrl,
        model: cfg.model,
        temperature: 0.3,
        maxTokens: 1500,
      },
      { temperature: 0.3, maxTokens: 1500 },
    )
    if (raw.error) return { success: false, error: { code: 'ai_failed', message: raw.error, recoverable: true } }
    try { return { success: true, data: JSON.parse(raw.content ?? '{}') } }
    catch (error) {
 console.error('bootstrap/createAiPorts.ts error:', error);
 return { success: true, data: { feedback: raw.content } } }
  } catch (error) {
 console.error('bootstrap/createAiPorts.ts error:', error);
 return { success: false, error: { code: 'ai_unavailable', message: 'AI unavailable', recoverable: true } } }
}
