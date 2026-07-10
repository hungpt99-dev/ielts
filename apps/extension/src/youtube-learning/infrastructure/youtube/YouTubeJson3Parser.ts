export interface Json3Event {
  tStartMs: number
  dDurationMs?: number
  segs?: Array<{ utf8?: string }>
}

export interface Json3CaptionData {
  events?: Json3Event[]
}

export interface ParsedJson3Segment {
  id: string
  text: string
  startMs: number
  durationMs: number
  endMs: number
}

export interface Json3ParseResult {
  segments: ParsedJson3Segment[]
  source: 'youtube-json3'
}

function normalizeText(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function parseJson3Captions(
  json: unknown,
  videoId: string,
  languageCode: string,
): Json3ParseResult {
  const data = json as Json3CaptionData
  if (!data || !Array.isArray(data.events)) {
    return { segments: [], source: 'youtube-json3' }
  }

  const seen = new Set<string>()
  const segments: ParsedJson3Segment[] = []

  for (let i = 0; i < data.events.length; i++) {
    const event = data.events[i]
    if (!event || typeof event.tStartMs !== 'number') continue

    const startMs = Math.max(0, Math.round(event.tStartMs))
    const segs = event.segs
    if (!Array.isArray(segs) || segs.length === 0) continue

    const text = segs
      .map(s => (typeof s.utf8 === 'string' ? s.utf8 : ''))
      .join('')
      .trim()

    if (!text) continue

    const normalized = normalizeText(text)
    if (!normalized) continue

    let durationMs = 0
    if (typeof event.dDurationMs === 'number' && event.dDurationMs > 0) {
      durationMs = Math.round(event.dDurationMs)
    } else {
      const next = data.events[i + 1]
      if (next && typeof next.tStartMs === 'number') {
        durationMs = Math.round(next.tStartMs) - startMs
      }
    }

    const endMs = startMs + Math.max(durationMs, 0)

    const seg: ParsedJson3Segment = {
      id: `${videoId}:${languageCode}:${startMs}`,
      text: normalized,
      startMs,
      durationMs,
      endMs,
    }

    const dedupKey = `${startMs}:${normalized}`
    if (seen.has(dedupKey)) continue
    seen.add(dedupKey)

    segments.push(seg)
  }

  segments.sort((a, b) => a.startMs - b.startMs)

  return { segments, source: 'youtube-json3' }
}
