import { AiGenerateResultCache } from '@ielts/ai'
import type { LearnerContextBuilder, LearnerContextDependencies } from './learner-context-builder'
import type { LearnerStateSnapshot } from '../domain/entities/learner-context'
import type { TutorContextScope } from '../domain/entities/learner-context'

export class CachedContextBuilder {
  private inner: LearnerContextBuilder
  private cache: AiGenerateResultCache<LearnerStateSnapshot>

  constructor(
    inner: LearnerContextBuilder,
    ttlMs = 30_000,
  ) {
    this.inner = inner
    this.cache = new AiGenerateResultCache<LearnerStateSnapshot>({ ttlMs, maxSize: 50 })
  }

  get deps(): LearnerContextDependencies {
    return (this.inner as any).deps
  }

  async build(scope: TutorContextScope): Promise<LearnerStateSnapshot> {
    const cacheKey = AiGenerateResultCache.generateKey('learner-context', scope, new Date().toISOString().slice(0, 16))
    return this.cache.getOrSet(cacheKey, () => this.inner.build(scope))
  }

  clearCache(): void {
    this.cache.clear()
  }

  invalidate(scope?: TutorContextScope): void {
    if (scope) {
      const prefix = AiGenerateResultCache.generateKey('learner-context', scope)
      for (const key of this.cache.keys()) {
        if (key.startsWith(prefix)) {
          this.cache.delete(key)
        }
      }
    } else {
      this.cache.clear()
    }
  }
}
