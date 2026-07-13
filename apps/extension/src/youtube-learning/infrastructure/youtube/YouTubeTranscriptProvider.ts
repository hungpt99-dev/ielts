import type { TranscriptSegmentData, TranscriptData } from '../../domain/types'
import { TranscriptCacheService } from '../persistence/TranscriptCacheService'

export type { TranscriptSegmentData, TranscriptData }

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
const FETCH_TIMEOUT_MS = 10_000

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

// -- Fetch helpers --

function combineAbortSignals(...signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController()
  for (const sig of signals) {
    if (sig.aborted) {
      controller.abort(sig.reason)
      return controller.signal
    }
    sig.addEventListener('abort', () => controller.abort(sig.reason), { once: true })
  }
  return controller.signal
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeout?: number },
  signal?: AbortSignal,
): Promise<Response> {
  const timeoutMs = options.timeout ?? FETCH_TIMEOUT_MS
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  const combinedSignal = signal ? combineAbortSignals(signal, controller.signal) : controller.signal
  try {
    return await fetch(url, { ...options, signal: combinedSignal })
  } finally {
    clearTimeout(timeoutId)
  }
}

// -- Direct third-party API (primary method) --

async function fetchDirect(videoId: string, language: string, signal?: AbortSignal): Promise<TranscriptData | null> {
  if (signal?.aborted) return null

  const urls = [
    `https://youtubetranscript.com/?v=${videoId}`,
    `https://youtubetranscriptapi.vercel.app/api/transcript?videoId=${videoId}`,
  ]

  // Try direct fetch from content script
  for (const url of urls) {
    if (signal?.aborted) return null
    try {
      const response = await fetchWithTimeout(
        url,
        { headers: { 'Accept': 'application/json,text/xml,*/*' } },
        signal,
      )
      if (!response.ok) continue
      const text = await response.text()
      if (!text || text.length < 20) continue

      if (text.trim().startsWith('<')) {
        try {
          const parser = new DOMParser()
          const xmlDoc = parser.parseFromString(text, 'text/xml')
          const textElements = xmlDoc.querySelectorAll('text')
          if (!textElements.length) continue
          const segments: TranscriptSegmentData[] = []
          textElements.forEach((el, index) => {
            const start = parseFloat(el.getAttribute('start') || '0')
            const dur = parseFloat(el.getAttribute('dur') || '0')
            const t = el.textContent?.trim() || ''
            if (!t) return
            segments.push({ id: `${videoId}-${language}-xml-${index}`, start, end: start + dur, text: t })
          })
          if (segments.length) {
            return {
              videoId, language, source: 'unknown',
              segments, fullText: segments.map(s => s.text).join(' '),
            }
          }
        } catch { continue }
      }

      try {
        const json = JSON.parse(text)
        const rawSegments = Array.isArray(json) ? json : (json as any).segments || (json as any).captions || (json as any).transcript || []
        if (!rawSegments.length) continue
        const segments = rawSegments
          .map((s: any, i: number) => {
            const start = typeof s.start === 'number' ? s.start : parseFloat(s.start || s.offset || '0')
            const dur = typeof s.duration === 'number' ? s.duration : parseFloat(s.duration || '0')
            return { id: `${videoId}-${language}-direct-${i}`, start, end: start + dur, text: (s.text || '').trim() }
          })
          .filter((s: TranscriptSegmentData) => s.text)
        if (segments.length) {
          const detectedLang = (json as any).language || language
          return { videoId, language: detectedLang, source: 'auto-generated', segments, fullText: segments.map((s: TranscriptSegmentData) => s.text).join(' ') }
        }
      } catch { continue }
    } catch { continue }
  }

  // Fallback: fetch via background script (bypasses CORS restrictions)
  if (signal?.aborted) return null
  try {
    const raw = await chrome.runtime.sendMessage({
      type: 'FETCH_TRANSCRIPT_DIRECT',
      payload: { videoId, language },
    })
    if (signal?.aborted) return null
    const result = raw?.data
    if (result?.success && result.data) {
      return result.data as TranscriptData
    }
  } catch { /* background fetch failed */ }
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
        error: makeError('CAPTION_FETCH_FAILED', 'Captions were found, but IELTS Journey could not download them. Try again.', true),
      }
    } catch (e) {
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
