import type { Transcript } from './types'
import type { IMemoryTranscriptCache } from './interfaces'

interface CacheEntry {
  readonly data: Transcript
  readonly timestamp: number
}

export class MemoryTranscriptCache implements IMemoryTranscriptCache {
  private readonly cache = new Map<string, CacheEntry>()
  private readonly ttlMs: number
  private readonly maxEntries: number

  constructor(ttlMs = 5 * 60 * 1000, maxEntries = 100) {
    this.ttlMs = ttlMs
    this.maxEntries = maxEntries
  }

  get(videoId: string, language: string): Transcript | null {
    const key = this.cacheKey(videoId, language)
    const entry = this.cache.get(key)
    if (!entry) return null

    if (Date.now() - entry.timestamp >= this.ttlMs) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  set(videoId: string, language: string, transcript: Transcript): void {
    const key = this.cacheKey(videoId, language)
    this.cache.set(key, { data: transcript, timestamp: Date.now() })

    if (this.cache.size > this.maxEntries) {
      const oldest = this.cache.keys().next().value
      if (oldest) this.cache.delete(oldest)
    }
  }

  clear(videoId?: string): void {
    if (videoId) {
      for (const key of this.cache.keys()) {
        if (key.startsWith(`${videoId}:`)) this.cache.delete(key)
      }
    } else {
      this.cache.clear()
    }
  }

  private cacheKey(videoId: string, language: string): string {
    return `${videoId}:${language}`
  }
}
