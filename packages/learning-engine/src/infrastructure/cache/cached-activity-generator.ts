import type { GenerateLearningActivityRequest, GenerateLearningActivityResult } from '../../domain/entities/learning-activity'
import type { GenerateActivityDependencies } from '../../application/activities/generate-learning-activity'
import { generateLearningActivity } from '../../application/activities/generate-learning-activity'
import { LocalCache, generateCacheKey } from './local-ttl-cache'

export class CachedActivityGenerator {
  private cache: LocalCache<GenerateLearningActivityResult>

  constructor(ttlMs = 120_000) {
    this.cache = new LocalCache<GenerateLearningActivityResult>({ ttlMs, maxSize: 30 })
  }

  async generate(
    request: GenerateLearningActivityRequest,
    deps: GenerateActivityDependencies,
  ): Promise<GenerateLearningActivityResult> {
    const cacheKey = generateCacheKey(
      'activity',
      request.skill,
      request.activityType,
      request.difficulty,
      request.sessionId,
    )
    return this.cache.getOrSet(cacheKey, () => generateLearningActivity(request, deps))
  }

  invalidate(sessionId: string): void {
    const prefix = generateCacheKey('activity')
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix) && key.includes(sessionId)) {
        this.cache.delete(key)
      }
    }
  }

  clearCache(): void {
    this.cache.clear()
  }
}
