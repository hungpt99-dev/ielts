import type { TranscriptData } from '../../domain/types'
import { TranscriptCacheService } from '../persistence/TranscriptCacheService'

export type { TranscriptData }

export interface TranscriptProviderConfig {
  preferredLanguages: string[]
}

export type TranscriptErrorCode =
  | 'INVALID_VIDEO_ID'
  | 'VIDEO_UNAVAILABLE'
  | 'NO_CAPTIONS'
  | 'UNSUPPORTED_LANGUAGE'
  | 'PLAYER_RESPONSE_NOT_FOUND'
  | 'CAPTION_TRACK_NOT_FOUND'
  | 'CAPTION_FETCH_FAILED'
  | 'CAPTION_PARSE_FAILED'
  | 'EXTENSION_COMMUNICATION_FAILED'
  | 'REQUEST_CANCELLED'
  | 'UNKNOWN'
  | 'NO_VIDEO_ID'
  | 'CANCELLED'
  | 'VIDEO_LIVE'

export interface TranscriptError {
  code: TranscriptErrorCode
  message: string
  retryable: boolean
  detail?: string
}

export type TranscriptResult =
  | { ok: true; data: TranscriptData; source: 'cache' | 'network' }
  | { ok: false; error: TranscriptError }

const DEBUG = process.env.NODE_ENV === 'development'

function log(...args: unknown[]): void {
  if (DEBUG) console.debug('[YT Transcript]', ...args)
}

const CACHE_TTL_MS = 5 * 60 * 1000

interface CacheEntry {
  data: TranscriptData
  timestamp: number
}

const memoryCache = new Map<string, CacheEntry>()

function memoryCacheKey(videoId: string, language: string): string {
  return `${videoId}:${language}`
}

function getMemoryCache(videoId: string, language: string): TranscriptData | null {
  const key = memoryCacheKey(videoId, language)
  const entry = memoryCache.get(key)
  if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) {
    log('Memory cache hit for', key)
    return entry.data
  }
  if (entry) memoryCache.delete(key)
  return null
}

function setMemoryCache(videoId: string, language: string, data: TranscriptData): void {
  const key = memoryCacheKey(videoId, language)
  memoryCache.set(key, { data, timestamp: Date.now() })
  if (memoryCache.size > 100) {
    const oldest = memoryCache.keys().next().value
    if (oldest) memoryCache.delete(oldest)
  }
}

export function clearTranscriptCache(videoId?: string): void {
  if (videoId) {
    for (const key of memoryCache.keys()) {
      if (key.startsWith(`${videoId}:`)) memoryCache.delete(key)
    }
  } else {
    memoryCache.clear()
  }
  log('Memory cache cleared', videoId || 'all')
}

function makeError(code: TranscriptErrorCode, message: string, retryable: boolean, detail?: string): TranscriptError {
  return { code, message, retryable, detail }
}

// -- Primary fetch strategy: YouTube internal API via background script --

function parseTimedtextXml(xml: string): TranscriptSegmentData[] {
  const segments: TranscriptSegmentData[] = []
  const regex = /<text\b[^>]*start="([^"]*)"[^>]*dur="([^"]*)"[^>]*>([^<]*)<\/text>/g
  let match
  while ((match = regex.exec(xml)) !== null) {
    const start = parseFloat(match[1] || '0')
    const dur = parseFloat(match[2] || '0')
    const text = (match[3] || '').trim()
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
    if (text) {
      segments.push({ id: `seg-${segments.length}`, start, end: start + dur, text })
    }
  }
  return segments
}

async function tryFetchTimedtext(videoId: string, lang: string, signal?: AbortSignal): Promise<TranscriptData | null> {
  try {
    const url = `https://www.youtube.com/api/timedtext?v=${encodeURIComponent(videoId)}&lang=${encodeURIComponent(lang)}&fmt=srv3`
    const resp = await fetch(url, { signal })
    if (!resp.ok) return null
    const text = await resp.text()
    if (!text || text.length < 50) return null

    const segments = parseTimedtextXml(text)
    if (!segments.length) return null

    return {
      videoId,
      language: lang,
      source: 'auto-generated',
      segments,
      fullText: segments.map(s => s.text).join(' '),
    }
  } catch {
    return null
  }
}

async function fetchViaYoutubeInternalApi(
  videoId: string,
  language: string,
  signal?: AbortSignal,
): Promise<TranscriptData | null> {
  try {
    const languages = [language, 'en', 'en-US', 'en-GB', 'en-GB-x-0', 'vi']
    const uniqueLangs = [...new Set(languages)]

    for (const lang of uniqueLangs) {
      if (signal?.aborted) return null
      const result = await tryFetchTimedtext(videoId, lang, signal)
      if (result) return result
    }

    return null
  } catch {
    return null
  }
}

async function fetchDirect(videoId: string, language: string, signal?: AbortSignal): Promise<TranscriptData | null> {
  if (signal?.aborted) return null

  if (typeof chrome?.runtime?.sendMessage === 'function') {
    const viaYoutube = await fetchViaYoutubeInternalApi(videoId, language, signal)
    if (viaYoutube) return viaYoutube
  }

  return null
}

const persistentCache = new TranscriptCacheService()

export class YouTubeTranscriptProvider {
  private config: TranscriptProviderConfig

  constructor(config: Partial<TranscriptProviderConfig> = {}) {
    this.config = {
      preferredLanguages: ['en', 'en-US', 'en-GB'],
      ...config,
    }
  }

  async getTranscript(
    videoId: string,
    options?: { signal?: AbortSignal; language?: string; forceRefresh?: boolean },
  ): Promise<TranscriptResult> {
    try {
      const signal = options?.signal
      const forceRefresh = options?.forceRefresh ?? false

      if (!videoId) {
        return { ok: false, error: makeError('INVALID_VIDEO_ID', 'No video ID provided', false) }
      }

      if (signal?.aborted) {
        return { ok: false, error: makeError('REQUEST_CANCELLED', 'Request was cancelled', false) }
      }

      const preferredLangs = options?.language
        ? [options.language, ...this.config.preferredLanguages.filter(l => l !== options.language)]
        : this.config.preferredLanguages

      const lang = preferredLangs[0] || 'en'

      // 1. Check memory cache (fastest)
      if (!forceRefresh) {
        for (const l of preferredLangs) {
          if (signal?.aborted) return { ok: false, error: makeError('REQUEST_CANCELLED', 'Request was cancelled', false) }
          const cached = getMemoryCache(videoId, l)
          if (cached) return { ok: true, data: cached, source: 'cache' }
        }
      }

      // 2. Check persistent cache (IndexedDB via chrome.storage)
      if (!forceRefresh) {
        const persistentCached = await persistentCache.get(videoId, lang)
        if (persistentCached && !signal?.aborted) {
          setMemoryCache(videoId, lang, persistentCached)
          return { ok: true, data: persistentCached, source: 'cache' }
        }
      }
      if (signal?.aborted) return { ok: false, error: makeError('REQUEST_CANCELLED', 'Request was cancelled', false) }

      // 3. Fetch from network
      const directResult = await fetchDirect(videoId, lang, signal)
      if (signal?.aborted) return { ok: false, error: makeError('REQUEST_CANCELLED', 'Request was cancelled', false) }

      if (directResult) {
        setMemoryCache(videoId, lang, directResult)
        persistentCache.set(videoId, lang, directResult).catch(() => {})
        return { ok: true, data: directResult, source: 'network' }
      }

      return {
        ok: false,
        error: makeError('CAPTION_FETCH_FAILED', 'Could not load transcript. The video may not have captions, or the download failed. Try again.', true),
      }
    } catch (e) {
      console.error('apps/extension/src/youtube-learning/infrastructure/youtube/YouTubeTranscriptProvider.ts error:', e);
      log('getTranscript UNCAUGHT error:', e)
      return {
        ok: false,
        error: makeError('UNKNOWN', `Internal error: ${e instanceof Error ? e.message : String(e)}`, false),
      }
    }
  }

  async checkAvailability(): Promise<{ available: boolean; hasManual: boolean; hasAutoGenerated: boolean; languages: string[] }> {
    return { available: false, hasManual: false, hasAutoGenerated: false, languages: [] }
  }
}
