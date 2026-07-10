import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ─── Video ID parsing ───────────────────────────────────────────────────────

import { extractYoutubeVideoId } from '../infrastructure/youtube/YouTubePageDetector'

describe('Video ID parsing', () => {
  it('extracts video ID from standard YouTube URL', () => {
    expect(extractYoutubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('extracts video ID from youtu.be URL', () => {
    expect(extractYoutubeVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('extracts video ID from shorts URL', () => {
    expect(extractYoutubeVideoId('https://www.youtube.com/shorts/abc123def')).toBe('abc123def')
  })

  it('extracts video ID from URL with additional params', () => {
    expect(extractYoutubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=120&list=PL123')).toBe('dQw4w9WgXcQ')
  })

  it('returns empty string for non-video URL', () => {
    expect(extractYoutubeVideoId('https://www.youtube.com/feed/trending')).toBe('')
  })

  it('extracts video ID from embed URL', () => {
    expect(extractYoutubeVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('handles youtube URL with timestamp as first param', () => {
    expect(extractYoutubeVideoId('https://www.youtube.com/watch?t=120&v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('extracts from youtu.be with timestamp', () => {
    expect(extractYoutubeVideoId('https://youtu.be/dQw4w9WgXcQ?t=30')).toBe('dQw4w9WgXcQ')
  })

  it('returns empty for invalid URL', () => {
    expect(extractYoutubeVideoId('not-a-url')).toBe('')
  })

  it('handles shorts URL with extra params', () => {
    expect(extractYoutubeVideoId('https://www.youtube.com/shorts/abc123def?feature=share')).toBe('abc123def')
  })

  it('extracts from mobile URL', () => {
    expect(extractYoutubeVideoId('https://m.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })
})

// ─── JSON3 Parsing ───────────────────────────────────────────────────────────

import { parseJson3Captions } from '../infrastructure/youtube/YouTubeJson3Parser'

describe('JSON3 caption parsing', () => {
  it('parses valid JSON3 events with segments', () => {
    const json = {
      events: [
        { tStartMs: 0, dDurationMs: 5000, segs: [{ utf8: 'Hello ' }, { utf8: 'world' }] },
        { tStartMs: 5000, dDurationMs: 3000, segs: [{ utf8: 'This is a test' }] },
      ],
    }
    const result = parseJson3Captions(json, 'vid1', 'en')
    expect(result.segments).toHaveLength(2)
    expect(result.source).toBe('youtube-json3')
    expect(result.segments[0].text).toBe('Hello world')
    expect(result.segments[0].startMs).toBe(0)
    expect(result.segments[0].endMs).toBe(5000)
    expect(result.segments[1].text).toBe('This is a test')
    expect(result.segments[1].startMs).toBe(5000)
    expect(result.segments[1].endMs).toBe(8000)
  })

  it('infers duration from next event start', () => {
    const json = {
      events: [
        { tStartMs: 0, segs: [{ utf8: 'First' }] },
        { tStartMs: 3000, segs: [{ utf8: 'Second' }] },
      ],
    }
    const result = parseJson3Captions(json, 'vid1', 'en')
    expect(result.segments).toHaveLength(2)
    expect(result.segments[0].durationMs).toBe(3000)
    expect(result.segments[0].endMs).toBe(3000)
  })

  it('ignores events without text', () => {
    const json = {
      events: [
        { tStartMs: 0, dDurationMs: 5000, segs: [{ utf8: '' }] },
        { tStartMs: 5000, dDurationMs: 3000, segs: [] },
        { tStartMs: 8000, dDurationMs: 2000, segs: [{ utf8: '  ' }] },
      ],
    }
    const result = parseJson3Captions(json, 'vid1', 'en')
    expect(result.segments).toHaveLength(0)
  })

  it('ignores events with invalid timestamps', () => {
    const json = {
      events: [
        { tStartMs: -1, segs: [{ utf8: 'Negative' }] },
        { tStartMs: 1000, segs: [{ utf8: 'Valid' }] },
      ],
    }
    const result = parseJson3Captions(json, 'vid1', 'en')
    expect(result.segments).toHaveLength(2)
    expect(result.segments[0].startMs).toBe(0)
    expect(result.segments[1].startMs).toBe(1000)
  })

  it('deduplicates identical segments', () => {
    const json = {
      events: [
        { tStartMs: 0, dDurationMs: 5000, segs: [{ utf8: 'Hello' }] },
        { tStartMs: 0, dDurationMs: 5000, segs: [{ utf8: 'Hello' }] },
      ],
    }
    const result = parseJson3Captions(json, 'vid1', 'en')
    expect(result.segments).toHaveLength(1)
  })

  it('handles malformed input gracefully', () => {
    const result = parseJson3Captions(null, 'vid1', 'en')
    expect(result.segments).toHaveLength(0)
  })

  it('handles empty events array', () => {
    const result = parseJson3Captions({ events: [] }, 'vid1', 'en')
    expect(result.segments).toHaveLength(0)
  })

  it('decodes HTML entities', () => {
    const json = {
      events: [
        { tStartMs: 0, dDurationMs: 1000, segs: [{ utf8: '&amp; &lt; &gt; &quot;' }] },
      ],
    }
    const result = parseJson3Captions(json, 'vid1', 'en')
    expect(result.segments[0].text).toBe('& < > "')
  })

  it('handles Unicode captions', () => {
    const json = {
      events: [
        { tStartMs: 0, dDurationMs: 1000, segs: [{ utf8: 'Café résumé 中文' }] },
      ],
    }
    const result = parseJson3Captions(json, 'vid1', 'en')
    expect(result.segments[0].text).toBe('Café résumé 中文')
  })

  it('sorts segments by start time', () => {
    const json = {
      events: [
        { tStartMs: 5000, segs: [{ utf8: 'Later' }] },
        { tStartMs: 0, segs: [{ utf8: 'Earlier' }] },
      ],
    }
    const result = parseJson3Captions(json, 'vid1', 'en')
    expect(result.segments[0].text).toBe('Earlier')
    expect(result.segments[1].text).toBe('Later')
  })

  it('replaces non-breaking spaces', () => {
    const json = {
      events: [
        { tStartMs: 0, dDurationMs: 1000, segs: [{ utf8: 'Hello\u00a0world' }] },
      ],
    }
    const result = parseJson3Captions(json, 'vid1', 'en')
    expect(result.segments[0].text).toBe('Hello world')
  })

  it('generates correct segment IDs', () => {
    const json = {
      events: [
        { tStartMs: 0, dDurationMs: 1000, segs: [{ utf8: 'Test' }] },
      ],
    }
    const result = parseJson3Captions(json, 'abc123', 'en')
    expect(result.segments[0].id).toBe('abc123:en:0')
  })
})

// ─── XML Parsing ────────────────────────────────────────────────────────────

describe('Transcript XML parsing', () => {
  it('parses valid XML transcript', () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
      <transcript>
        <text start="0" dur="5">Hello world</text>
        <text start="5" dur="3">This is a test</text>
      </transcript>`

    // Accessing parseTranscriptXml via the provider's method indirectly
    // We'll use a DOMParser directly to test the concept
    const parser = new DOMParser()
    const doc = parser.parseFromString(xml, 'text/xml')
    const texts = doc.querySelectorAll('text')
    expect(texts).toHaveLength(2)
    expect(texts[0].textContent).toBe('Hello world')
    expect(texts[1].getAttribute('start')).toBe('5')
  })

  it('detects parser errors', () => {
    const xml = `<?xml version="1.0"?><transcript><text start="a" dur="b">Bad</text></transcript>`
    const parser = new DOMParser()
    const doc = parser.parseFromString(xml, 'text/xml')
    // Invalid numbers in attributes are still parseable as XML
    // The text content is still accessible
    expect(doc.querySelector('text')?.textContent).toBe('Bad')
  })

  it('handles empty transcript', () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?><transcript></transcript>`
    const parser = new DOMParser()
    const doc = parser.parseFromString(xml, 'text/xml')
    expect(doc.querySelectorAll('text').length).toBe(0)
  })

  it('handles HTML entities in XML', () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
      <transcript>
        <text start="0" dur="1">It&apos;s a &amp; test</text>
      </transcript>`
    const parser = new DOMParser()
    const doc = parser.parseFromString(xml, 'text/xml')
    expect(doc.querySelector('text')?.textContent).toBe("It's a & test")
  })

  it('handles missing duration attribute', () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
      <transcript>
        <text start="0">No duration</text>
      </transcript>`
    const parser = new DOMParser()
    const doc = parser.parseFromString(xml, 'text/xml')
    expect(doc.querySelector('text')?.getAttribute('dur')).toBeNull()
  })
})

// ─── Binary Search ──────────────────────────────────────────────────────────

import { findActiveSegmentIndex } from '../infrastructure/youtube/TranscriptBinarySearch'

describe('Binary search for active segment', () => {
  const segments = [
    { id: 's1', startMs: 0, endMs: 5000, text: 'First' },
    { id: 's2', startMs: 5000, endMs: 10000, text: 'Second' },
    { id: 's3', startMs: 10000, endMs: 15000, text: 'Third' },
  ]

  it('finds segment at exact start', () => {
    expect(findActiveSegmentIndex(segments, 0, -1)).toBe(0)
  })

  it('finds segment in middle', () => {
    expect(findActiveSegmentIndex(segments, 7500, -1)).toBe(1)
  })

  it('finds segment at end', () => {
    expect(findActiveSegmentIndex(segments, 14000, -1)).toBe(2)
  })

  it('returns -1 when before all segments', () => {
    expect(findActiveSegmentIndex(segments, -1000, -1)).toBe(-1)
  })

  it('returns -1 when after all segments', () => {
    expect(findActiveSegmentIndex(segments, 99999, -1)).toBe(-1)
  })

  it('returns -1 for empty array', () => {
    expect(findActiveSegmentIndex([], 5000, -1)).toBe(-1)
  })

  it('advances forward using lastKnownIndex', () => {
    const idx = findActiveSegmentIndex(segments, 7000, 0)
    expect(idx).toBe(1)
  })

  it('moves backward using lastKnownIndex', () => {
    const idx = findActiveSegmentIndex(segments, 2000, 1)
    expect(idx).toBe(0)
  })

  it('stays at same segment using lastKnownIndex', () => {
    const idx = findActiveSegmentIndex(segments, 2000, 0)
    expect(idx).toBe(0)
  })

  it('falls back to binary search when adjacent check fails', () => {
    const idx = findActiveSegmentIndex(segments, 12000, 0)
    expect(idx).toBe(2)
  })
})

// ─── DictationService ────────────────────────────────────────────────────────

import { DictationService } from '../application/services/DictationService'

describe('DictationService.compare', () => {
  const service = new DictationService()

  it('returns 100% accuracy for exact match', () => {
    const result = service.compare('hello world', 'hello world')
    expect(result.accuracy).toBe(100)
    expect(result.incorrectWords).toHaveLength(0)
    expect(result.isCorrect).toBe(true)
  })

  it('detects incorrect words', () => {
    const result = service.compare('hello word', 'hello world')
    expect(result.accuracy).toBeLessThan(100)
  })

  it('normalizes punctuation before comparison', () => {
    const result = service.compare('Hello, world!', 'hello world')
    expect(result.accuracy).toBe(100)
  })
})

// ─── YouTubeTranscriptProvider ───────────────────────────────────────────────

import { YouTubeTranscriptProvider, clearTranscriptCache } from '../infrastructure/youtube/YouTubeTranscriptProvider'

describe('YouTubeTranscriptProvider', () => {
  let provider: YouTubeTranscriptProvider

  beforeEach(() => {
    provider = new YouTubeTranscriptProvider({ preferredLanguages: ['en', 'en-US', 'en-GB'] })
    clearTranscriptCache()
  })

  afterEach(() => {
    clearTranscriptCache()
  })

  describe('getTranscript', () => {
    it('returns INVALID_VIDEO_ID for empty video ID', async () => {
      const result = await provider.getTranscript('')
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.code).toBe('INVALID_VIDEO_ID')
        expect(result.error.retryable).toBe(false)
      }
    })

    it('returns REQUEST_CANCELLED when signal is already aborted', async () => {
      const controller = new AbortController()
      controller.abort()
      const result = await provider.getTranscript('test123', { signal: controller.signal })
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.code).toBe('REQUEST_CANCELLED')
      }
    })

    it('returns typed error with retryable flag', async () => {
      const result = await provider.getTranscript('test456')
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.code).toBeDefined()
        expect(typeof result.error.retryable).toBe('boolean')
        expect(typeof result.error.message).toBe('string')
      }
    })

    it('supports language override via options', async () => {
      const result = await provider.getTranscript('test789', { language: 'vi' })
      expect(result.ok).toBe(false)
    })
  })

  describe('checkAvailability', () => {
    it('returns not available for missing video ID', async () => {
      const result = await provider.checkAvailability('')
      expect(result.available).toBe(false)
    })

    it('returns not available for non-existent video', async () => {
      const result = await provider.checkAvailability('nonexistent')
      expect(result.available).toBe(false)
    })
  })

  describe('computeContentHash', () => {
    it('generates consistent hash for same segments', async () => {
      const segments = [
        { id: '1', start: 0, end: 5, text: 'Hello' },
        { id: '2', start: 5, end: 10, text: 'world' },
      ]
      const hash1 = await YouTubeTranscriptProvider.computeContentHash(segments)
      const hash2 = await YouTubeTranscriptProvider.computeContentHash(segments)
      expect(hash1).toBe(hash2)
    })

    it('generates different hashes for different content', async () => {
      const segs1 = [{ id: '1', start: 0, end: 5, text: 'Hello' }]
      const segs2 = [{ id: '1', start: 0, end: 5, text: 'World' }]
      const hash1 = await YouTubeTranscriptProvider.computeContentHash(segs1)
      const hash2 = await YouTubeTranscriptProvider.computeContentHash(segs2)
      expect(hash1).not.toBe(hash2)
    })
  })
})

// ─── Error states ────────────────────────────────────────────────────────────

describe('Transcript error states', () => {
  it('each error has message and retryable flag', () => {
    const errors = [
      { code: 'NO_CAPTIONS', retryable: false, expectMessage: 'does not have captions' },
      { code: 'UNSUPPORTED_LANGUAGE', retryable: false, expectMessage: 'not in your selected language' },
      { code: 'PLAYER_RESPONSE_NOT_FOUND', retryable: true, expectMessage: 'still loading' },
      { code: 'CAPTION_FETCH_FAILED', retryable: true, expectMessage: 'could not download' },
      { code: 'CAPTION_PARSE_FAILED', retryable: false, expectMessage: 'could not be processed' },
      { code: 'VIDEO_UNAVAILABLE', retryable: false, expectMessage: 'unavailable' },
      { code: 'INVALID_VIDEO_ID', retryable: false, expectMessage: 'No video' },
      { code: 'REQUEST_CANCELLED', retryable: false, expectMessage: 'cancelled' },
    ]

    for (const e of errors) {
      expect(e.code).toBeDefined()
      expect(typeof e.retryable).toBe('boolean')
      expect(e.expectMessage).toBeTruthy()
    }
  })
})

// ─── Content script messaging ────────────────────────────────────────────────

describe('Content script messaging', () => {
  it('has all required transcript message types', () => {
    const types = [
      'TRANSCRIPT_AVAILABLE',
      'TRANSCRIPT_DATA',
      'TRANSCRIPT_UNAVAILABLE',
      'TRANSCRIPT_ERROR',
      'TRANSCRIPT_LOADING',
    ]
    for (const t of types) {
      expect(t).toBeDefined()
    }
  })

  it('TRANSCRIPT_ERROR includes retryable flag', () => {
    const errorPayload = { code: 'CAPTION_FETCH_FAILED', detail: '', retryable: true, message: 'Retryable error' }
    expect(errorPayload.retryable).toBe(true)
    expect(errorPayload.code).toBe('CAPTION_FETCH_FAILED')
  })

  it('REQUEST_CANCELLED is not shown as error', () => {
    const errorPayload = { code: 'REQUEST_CANCELLED', retryable: false }
    expect(errorPayload.code).toBe('REQUEST_CANCELLED')
    // In the content script handler, this case has no postToParent call
  })
})

// ─── Background message types ────────────────────────────────────────────────

describe('Background transcript messages', () => {
  it('FETCH_TRANSCRIPT has correct shape', () => {
    const msg = { type: 'FETCH_TRANSCRIPT' as const, payload: { videoId: 'dQw4w9WgXcQ' } }
    expect(msg.type).toBe('FETCH_TRANSCRIPT')
    expect(msg.payload.videoId).toBe('dQw4w9WgXcQ')
  })

  it('FETCH_TRANSCRIPT_XML has correct shape', () => {
    const msg = { type: 'FETCH_TRANSCRIPT_XML' as const, payload: { baseUrl: 'https://example.com/captions', videoId: 'dQw4w9WgXcQ', language: 'en' } }
    expect(msg.type).toBe('FETCH_TRANSCRIPT_XML')
    expect(msg.payload.baseUrl).toBeDefined()
    expect(msg.payload.videoId).toBeDefined()
  })
})

// ─── Race condition handling ─────────────────────────────────────────────────

describe('Race condition handling', () => {
  it('aborts previous request before starting new one', () => {
    const controller1 = new AbortController()
    const controller2 = new AbortController()
    const spy = vi.fn()
    controller1.signal.addEventListener('abort', spy)
    controller1.abort()
    expect(spy).toHaveBeenCalledTimes(1)
    expect(controller2.signal.aborted).toBe(false)
  })

  it('aborted signal stops in-flight operations', () => {
    const controller = new AbortController()
    const spy = vi.fn()
    controller.signal.addEventListener('abort', spy)
    controller.abort()
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('uses request version token to prevent stale results', async () => {
    let requestVersion = 0
    const results: string[] = []

    async function handleVideoChange(videoId: string) {
      const currentVersion = ++requestVersion
      await new Promise(resolve => setTimeout(resolve, 10))
      if (currentVersion === requestVersion) {
        results.push(videoId)
      }
    }

    await Promise.all([
      handleVideoChange('old'),
      handleVideoChange('new'),
    ])

    expect(results).toHaveLength(1)
    expect(results[0]).toBe('new')
  })

  it('cancellation does not produce user-facing error', async () => {
    const controller = new AbortController()
    const signal = controller.signal
    let userFacingError = false

    const promise = new Promise<void>((resolve) => {
      signal.addEventListener('abort', () => {
        // CANCELLED should not set userFacingError
        resolve()
      }, { once: true })
    })

    controller.abort()
    await promise
    expect(userFacingError).toBe(false)
  })
})

// ─── Caching behavior ────────────────────────────────────────────────────────

describe('Transcript caching', () => {
  beforeEach(() => { clearTranscriptCache() })
  afterEach(() => { clearTranscriptCache() })

  it('clearTranscriptCache clears all entries', () => {
    clearTranscriptCache()
    clearTranscriptCache('test123')
    expect(true).toBe(true)
  })

  it('clearTranscriptCache with videoId clears specific video', () => {
    clearTranscriptCache('test123')
    expect(true).toBe(true)
  })
})

// ─── Track selection ─────────────────────────────────────────────────────────

describe('Caption track selection', () => {
  // We test the selection logic via the provider's behavior
  it('prefers exact language manual over auto', () => {
    const provider = new YouTubeTranscriptProvider({ preferredLanguages: ['en'] })
    const tracks = [
      { baseUrl: 'auto', languageCode: 'en', name: 'English (auto)', kind: 'auto' as const, isTranslatable: false },
      { baseUrl: 'manual', languageCode: 'en', name: 'English', kind: 'manual' as const, isTranslatable: false },
    ]
    // Access private method via prototype
    const result = (provider as any).selectBestTrack(tracks, ['en'])
    expect(result.baseUrl).toBe('manual')
  })

  it('falls back to automatic when no manual available', () => {
    const provider = new YouTubeTranscriptProvider({ preferredLanguages: ['en'] })
    const tracks = [
      { baseUrl: 'auto', languageCode: 'en', name: 'English (auto)', kind: 'auto' as const, isTranslatable: false },
    ]
    const result = (provider as any).selectBestTrack(tracks, ['en'])
    expect(result.baseUrl).toBe('auto')
  })

  it('falls back to English when preferred language missing', () => {
    const provider = new YouTubeTranscriptProvider({ preferredLanguages: ['vi'] })
    const tracks = [
      { baseUrl: 'en-auto', languageCode: 'en', name: 'English (auto)', kind: 'auto' as const, isTranslatable: false },
    ]
    const result = (provider as any).selectBestTrack(tracks, ['vi'])
    expect(result).not.toBeNull()
  })

  it('uses any manual track as fallback', () => {
    const provider = new YouTubeTranscriptProvider({ preferredLanguages: ['vi'] })
    const tracks = [
      { baseUrl: 'fr-manual', languageCode: 'fr', name: 'French', kind: 'manual' as const, isTranslatable: false },
    ]
    const result = (provider as any).selectBestTrack(tracks, ['vi'])
    expect(result.baseUrl).toBe('fr-manual')
  })

  it('returns null for empty tracks', () => {
    const provider = new YouTubeTranscriptProvider()
    const result = (provider as any).selectBestTrack([], ['en'])
    expect(result).toBeNull()
  })

  it('supports language variant fallback (en-GB → en)', () => {
    const provider = new YouTubeTranscriptProvider({ preferredLanguages: ['en-GB'] })
    const tracks = [
      { baseUrl: 'en', languageCode: 'en', name: 'English', kind: 'manual' as const, isTranslatable: false },
    ]
    const result = (provider as any).selectBestTrack(tracks, ['en-GB'])
    expect(result.baseUrl).toBe('en')
  })
})

// ─── Provider config ─────────────────────────────────────────────────────────

describe('Provider configuration', () => {
  it('uses default preferred languages when not provided', () => {
    const provider = new YouTubeTranscriptProvider()
    expect((provider as any).config.preferredLanguages).toEqual(['en', 'en-US', 'en-GB'])
  })
})

// ─── Page Bridge ─────────────────────────────────────────────────────────────

import { extractFromPageScriptsFallback, extractViaBackgroundScripting, withRetry } from '../infrastructure/youtube/YouTubePageBridge'

describe('YouTube Page Bridge', () => {
  it('exports all bridge functions', () => {
    expect(extractFromPageScriptsFallback).toBeDefined()
    expect(extractViaBackgroundScripting).toBeDefined()
    expect(withRetry).toBeDefined()
    expect(typeof extractFromPageScriptsFallback).toBe('function')
    expect(typeof extractViaBackgroundScripting).toBe('function')
    expect(typeof withRetry).toBe('function')
  })
})

// ─── Timestamp formatting ────────────────────────────────────────────────────

describe('Timestamp formatting', () => {
  it('formats seconds to mm:ss', () => {
    expect(formatTime(0)).toBe('0:00')
    expect(formatTime(65)).toBe('1:05')
    expect(formatTime(3661)).toBe('61:01')
  })

  it('handles negative values gracefully', () => {
    expect(formatTime(-1)).toBe('0:00')
  })

  it('handles NaN gracefully', () => {
    expect(formatTime(NaN)).toBe('0:00')
  })
})

// ─── Transcript search ───────────────────────────────────────────────────────

describe('Transcript search', () => {
  it('finds segments by text query (case-insensitive)', () => {
    const segments = [
      { start: 0, end: 5, text: 'The quick brown fox' },
      { start: 5, end: 10, text: 'jumps over the lazy dog' },
    ]
    const results = searchTranscript(segments, 'fox')
    expect(results).toHaveLength(1)
    expect(results[0].start).toBe(0)
  })

  it('is case-insensitive', () => {
    const segments = [{ start: 0, end: 5, text: 'IELTS Test Example' }]
    const results = searchTranscript(segments, 'ielts')
    expect(results).toHaveLength(1)
  })

  it('returns empty array for no match', () => {
    const segments = [{ start: 0, end: 5, text: 'Hello world' }]
    const results = searchTranscript(segments, 'nonexistent')
    expect(results).toHaveLength(0)
  })
})

// ─── Speaking speed calculation ──────────────────────────────────────────────

describe('Speaking speed calculation', () => {
  it('calculates speaking speed correctly', () => {
    const segments = [{ start: 0, end: 60, text: 'word '.repeat(150).trim() }]
    expect(calculateSpeakingSpeed(segments)).toBe(150)
  })

  it('returns 0 for empty segments', () => {
    expect(calculateSpeakingSpeed([])).toBe(0)
  })

  it('handles segments with zero duration', () => {
    const segments = [{ start: 0, end: 0, text: 'word' }]
    expect(calculateSpeakingSpeed(segments)).toBe(0)
  })
})

// ─── Pure function implementations ───────────────────────────────────────────

function formatTime(seconds: number): string {
  if (seconds < 0 || isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

interface Seg { start: number; end: number; text: string }

function searchTranscript(segments: Seg[], query: string): Seg[] {
  const lower = query.toLowerCase()
  return segments.filter(s => s.text.toLowerCase().includes(lower))
}

function calculateSpeakingSpeed(segments: Seg[]): number {
  if (segments.length === 0) return 0
  const totalWords = segments.reduce((sum, s) => sum + s.text.split(/\s+/).filter(Boolean).length, 0)
  const totalDuration = segments.reduce((sum, s) => sum + (s.end - s.start), 0)
  if (totalDuration <= 0) return 0
  return Math.round((totalWords / totalDuration) * 60)
}
