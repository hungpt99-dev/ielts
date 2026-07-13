import { AiGenerateResultCache } from '@ielts/ai'
import type { ProactiveEvaluationRequest, ProactiveEvaluationResult } from '../domain/entities/proactive-message'
import { generateProactiveMessages } from '../application/proactive/generate-proactive-messages'
import type { ProactiveMessageSettings } from '../domain/entities/proactive-message'

export class CachedProactiveEvaluator {
  private cache: AiGenerateResultCache<ProactiveEvaluationResult>

  constructor(ttlMs = 300_000) {
    this.cache = new AiGenerateResultCache<ProactiveEvaluationResult>({ ttlMs, maxSize: 20 })
  }

  async evaluate(
    request: ProactiveEvaluationRequest,
    settings: ProactiveMessageSettings,
    cooldownState: Array<{ triggerType: string; lastFiredAt: string }>,
  ): Promise<ProactiveEvaluationResult> {
    const cacheKey = AiGenerateResultCache.generateKey(
      'proactive',
      request.triggerEvent ?? 'manual',
      String(request.learnerState.generatedAt),
    )
    return this.cache.getOrSet(cacheKey, () =>
      generateProactiveMessages(request, settings, cooldownState),
    )
  }

  clearCache(): void {
    this.cache.clear()
  }
}
