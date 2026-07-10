import type { TranscriptData, TranscriptSegmentData } from '../../domain/types'

const CACHE_PREFIX = 'yt-transcript-cache-v1'
const CACHE_MAX_ENTRIES = 50
const CACHE_TTL_MS = 24 * 60 * 60 * 1000

interface CacheEntry {
  videoId: string
  language: string
  data: TranscriptData
  contentHash: string
  fetchedAt: number
  expiresAt: number
  lastAccessedAt: number
}

export class TranscriptCacheService {
  private cache: Map<string, CacheEntry> = new Map()
  private loaded = false

  async get(videoId: string, language: string): Promise<TranscriptData | null> {
    await this.ensureLoaded()
    const key = cacheKey(videoId, language)
    const entry = this.cache.get(key)
    if (!entry) return null
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      this.persist().catch(() => {})
      return null
    }
    entry.lastAccessedAt = Date.now()
    this.persist().catch(() => {})
    return entry.data
  }

  async set(videoId: string, language: string, data: TranscriptData): Promise<void> {
    await this.ensureLoaded()
    const key = cacheKey(videoId, language)
    const contentHash = computeHash(data.segments)
    const now = Date.now()
    this.cache.set(key, {
      videoId,
      language,
      data,
      contentHash,
      fetchedAt: now,
      expiresAt: now + CACHE_TTL_MS,
      lastAccessedAt: now,
    })
    this.evictIfNeeded()
    await this.persist()
  }

  async remove(videoId: string, language?: string): Promise<void> {
    await this.ensureLoaded()
    if (language) {
      this.cache.delete(cacheKey(videoId, language))
    } else {
      for (const [key, entry] of this.cache) {
        if (entry.videoId === videoId) this.cache.delete(key)
      }
    }
    await this.persist()
  }

  async clear(): Promise<void> {
    this.cache.clear()
    await this.persist()
  }

  private async ensureLoaded(): Promise<void> {
    if (this.loaded) return
    try {
      const result = await chrome.storage.local.get(CACHE_PREFIX)
      const raw = result[CACHE_PREFIX] as Array<[string, CacheEntry]> | undefined
      if (raw) {
        for (const [key, entry] of raw) {
          if (Date.now() < entry.expiresAt) {
            this.cache.set(key, entry)
          }
        }
      }
    } catch { /* cache unavailable */ }
    this.loaded = true
  }

  private async persist(): Promise<void> {
    const entries: Array<[string, CacheEntry]> = []
    for (const [key, entry] of this.cache) {
      if (Date.now() < entry.expiresAt) {
        entries.push([key, entry])
      }
    }
    await chrome.storage.local.set({ [CACHE_PREFIX]: entries })
  }

  private evictIfNeeded(): void {
    if (this.cache.size <= CACHE_MAX_ENTRIES) return
    const sorted = [...this.cache.entries()].sort(
      (a, b) => a[1].lastAccessedAt - b[1].lastAccessedAt,
    )
    const toRemove = sorted.slice(0, this.cache.size - CACHE_MAX_ENTRIES)
    for (const [key] of toRemove) {
      this.cache.delete(key)
    }
  }
}

function cacheKey(videoId: string, language: string): string {
  return `${videoId}:${language}`
}

function computeHash(segments: TranscriptSegmentData[]): string {
  const text = segments.map(s => `${s.start}-${s.end}-${s.text}`).join('|')
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i)
    hash |= 0
  }
  return `h_${Math.abs(hash).toString(36)}`
}
