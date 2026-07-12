import { AIAdapter } from '../../infrastructure/ai/AIAdapter'
import type { TranscriptSegmentData } from '../../domain/types'

interface TranslatedSegment {
  id: string
  translatedText: string
}

interface TranslationCacheEntry {
  targetLanguage: string
  segments: TranslatedSegment[]
  cachedAt: number
}

const CACHE_TTL_MS = 30 * 60 * 1000
const BATCH_SIZE = 10
const MAX_TOKENS_PER_BATCH = 2000

export interface TranslationResult {
  segments: TranslatedSegment[]
  error?: string
}

export class TranscriptTranslationService {
  private aiAdapter: AIAdapter
  private cache = new Map<string, TranslationCacheEntry>()

  constructor(aiAdapter: AIAdapter) {
    this.aiAdapter = aiAdapter
  }

  private segmentCacheKey(segments: TranscriptSegmentData[], language: string): string {
    const hash = segments
      .slice(0, 5)
      .map(s => `${s.id}:${s.text.slice(0, 20)}`)
      .join('|')
    return `${hash}:${language}`
  }

  private getFromCache(segments: TranscriptSegmentData[], language: string): TranslationCacheEntry | null {
    const key = this.segmentCacheKey(segments, language)
    const entry = this.cache.get(key)
    if (!entry) return null
    if (Date.now() - entry.cachedAt > CACHE_TTL_MS) {
      this.cache.delete(key)
      return null
    }
    return entry
  }

  private setCache(segments: TranscriptSegmentData[], language: string, result: TranslationCacheEntry): void {
    const key = this.segmentCacheKey(segments, language)
    this.cache.set(key, result)
    if (this.cache.size > 50) {
      const oldest = this.cache.keys().next().value
      if (oldest) this.cache.delete(oldest)
    }
  }

  private splitBatches(segments: TranscriptSegmentData[]): TranscriptSegmentData[][] {
    const batches: TranscriptSegmentData[][] = []
    for (let i = 0; i < segments.length; i += BATCH_SIZE) {
      batches.push(segments.slice(i, i + BATCH_SIZE))
    }
    return batches
  }

  private async translateBatch(
    batch: TranscriptSegmentData[],
    targetLanguage: string,
  ): Promise<TranslatedSegment[]> {
    const systemPrompt = `You are a translator for IELTS learners. Translate the given English text to ${targetLanguage}. Preserve meaning and natural flow. Return ONLY valid JSON, no markdown.`

    const userPrompt = `Translate these English segments to ${targetLanguage}. Return a JSON array of objects, each with keys "id" and "translatedText", one per segment.\n\nSegments:\n${JSON.stringify(batch.map(s => ({ id: s.id, text: s.text })))}`

    const result = await this.aiAdapter.request(systemPrompt, userPrompt, {
      temperature: 0.2,
      maxTokens: MAX_TOKENS_PER_BATCH,
    })

    if (result.error || !result.content) {
      throw new Error(result.error || 'Translation failed')
    }

    const clean = result.content.replace(/```json\s*/gi, '').replace(/```\s*$/g, '').trim()
    const parsed = JSON.parse(clean) as TranslatedSegment[]

    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error('Batch returned empty result')
    }

    return parsed
  }

  async translateSegments(
    segments: TranscriptSegmentData[],
    targetLanguage: string,
  ): Promise<TranslationResult> {
    const cached = this.getFromCache(segments, targetLanguage)
    if (cached) return { segments: cached.segments }

    const batches = this.splitBatches(segments)

    if (batches.length === 1) {
      try {
        const translated = await this.translateBatch(batches[0], targetLanguage)
        const entry: TranslationCacheEntry = {
          targetLanguage,
          segments: translated,
          cachedAt: Date.now(),
        }
        this.setCache(segments, targetLanguage, entry)
        return { segments: translated }
      } catch (err) {
        return { segments: [], error: err instanceof Error ? err.message : 'Translation failed' }
      }
    }

    const settled = await Promise.allSettled(
      batches.map(batch => this.translateBatch(batch, targetLanguage)),
    )

    const allSegments: TranslatedSegment[] = []
    const errors: string[] = []

    for (let i = 0; i < settled.length; i++) {
      const s = settled[i]
      if (s.status === 'fulfilled') {
        allSegments.push(...s.value)
      } else {
        const batchStart = i * BATCH_SIZE + 1
        const batchEnd = Math.min((i + 1) * BATCH_SIZE, segments.length)
        errors.push(`Batch ${i + 1} (segments ${batchStart}-${batchEnd}): ${s.reason instanceof Error ? s.reason.message : 'Unknown error'}`)
      }
    }

    if (allSegments.length === 0) {
      return { segments: [], error: errors.join('; ') }
    }

    const mergedEntry: TranslationCacheEntry = {
      targetLanguage,
      segments: allSegments,
      cachedAt: Date.now(),
    }
    this.setCache(segments, targetLanguage, mergedEntry)

    const partialError = errors.length > 0
      ? `${errors.length} of ${batches.length} batches failed: ${errors.join('; ')}`
      : undefined

    return { segments: allSegments, error: partialError }
  }
}
