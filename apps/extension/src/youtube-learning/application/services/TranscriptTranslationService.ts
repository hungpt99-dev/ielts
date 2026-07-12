import { AIAdapter } from '../../infrastructure/ai/AIAdapter'
import type { TranscriptSegmentData } from '../../domain/types'

interface TranslationCacheEntry {
  targetLanguage: string
  segments: Array<{ id: string; translatedText: string }>
  cachedAt: number
}

const CACHE_TTL_MS = 30 * 60 * 1000

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

  async translateSegments(
    segments: TranscriptSegmentData[],
    targetLanguage: string,
  ): Promise<Array<{ id: string; translatedText: string }>> {
    const cached = this.getFromCache(segments, targetLanguage)
    if (cached) return cached.segments

    const fullText = segments.map(s => s.text).join(' ')
    const systemPrompt = `You are a translator for IELTS learners. Translate the given English transcript to ${targetLanguage}. Preserve the meaning and natural flow. Return ONLY valid JSON, no markdown.`
    const userPrompt = `Translate this English transcript to ${targetLanguage}. Return an array of objects with keys "id" and "translatedText", one per segment.\n\nSegments:\n${JSON.stringify(segments.map(s => ({ id: s.id, text: s.text })))}`

    const result = await this.aiAdapter.request(systemPrompt, userPrompt, { temperature: 0.2, maxTokens: 4000 })

    if (result.error || !result.content) {
      throw new Error(result.error || 'Translation failed')
    }

    const clean = result.content.replace(/```json\s*/gi, '').replace(/```\s*$/g, '').trim()
    const parsed = JSON.parse(clean) as Array<{ id: string; translatedText: string }>

    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error('Translation returned empty result')
    }

    const entry: TranslationCacheEntry = {
      targetLanguage,
      segments: parsed,
      cachedAt: Date.now(),
    }
    this.setCache(segments, targetLanguage, entry)

    return parsed
  }
}
