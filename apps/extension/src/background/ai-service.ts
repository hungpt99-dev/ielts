import { callAI } from '@ielts/ai'
import type { AICallResult } from '@ielts/ai'
import { safeFetchProviderConfig } from '../utils/safe-chrome'

export async function handleCustomPrompt(
  systemPrompt: string,
  userMessage: string,
): Promise<AICallResult> {
  const providerConfig = await safeFetchProviderConfig()
  return callAI(systemPrompt, userMessage, () => providerConfig, { temperature: 0.7, maxTokens: 1024 })
}

export function initAiService(): void {
  // AI service initialized through @ielts/ai delegation
}

export { explain } from '@ielts/ai'
