import { DEFAULT_AI_MAX_RETRIES } from '@ielts/config'
import type { TutorError } from '../domain/errors/tutor-error'

export interface FallbackResult<T> {
  usedFallback: boolean
  data: T
  fallbackReason?: string
}

export class FallbackPolicy {
  private maxRetries: number

  constructor(maxRetries: number = DEFAULT_AI_MAX_RETRIES) {
    this.maxRetries = maxRetries
  }

  async execute<T>(
    primary: () => Promise<T>,
    fallback: () => Promise<T>,
    errorFilter?: (error: TutorError) => boolean,
  ): Promise<FallbackResult<T>> {
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const data = await primary()
        return { usedFallback: false, data }
      } catch (err) {
        console.error('packages/ai-tutor-engine/src/ai/fallback-policy.ts error:', err);
        const tutorError = err as TutorError
        if (attempt < this.maxRetries && errorFilter?.(tutorError) !== false) {
          continue
        }
        const fallbackData = await fallback()
        return {
          usedFallback: true,
          data: fallbackData,
          fallbackReason: tutorError?.message || 'Unknown error',
        }
      }
    }
    const fallbackData = await fallback()
    return { usedFallback: true, data: fallbackData, fallbackReason: 'Max retries exceeded' }
  }
}
