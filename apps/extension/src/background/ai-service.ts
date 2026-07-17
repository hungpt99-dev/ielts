import { createAIClient } from '@ielts/ai'
import type { AICallResult } from '@ielts/ai'
import { safeFetchProviderConfig } from '../utils/safe-chrome'

const aiClient = createAIClient()

export async function handleCustomPrompt(
  systemPrompt: string,
  userMessage: string,
): Promise<AICallResult> {
  const providerConfig = await safeFetchProviderConfig()
  return aiClient.complete(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    providerConfig,
    { temperature: 0.7, maxTokens: 1024 },
  )
}

export function initAiService(): void {
  // AI service initialized through @ielts/ai delegation
}

export { explain } from '@ielts/ai'
