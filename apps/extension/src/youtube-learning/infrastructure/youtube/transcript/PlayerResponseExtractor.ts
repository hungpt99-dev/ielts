import type { CaptionTrack, YouTubePlayerResponse } from './types'
import type { IPlayerResponseExtractor } from './interfaces'

export class PlayerResponseExtractor implements IPlayerResponseExtractor {
  extract(): YouTubePlayerResponse | null {
    if (typeof document === 'undefined') return null

    try {
      const scripts = document.querySelectorAll('script')
      for (const script of scripts) {
        const text = script.textContent || ''
        const idx = text.indexOf('ytInitialPlayerResponse')
        if (idx === -1) continue

        const bracePos = text.indexOf('{', idx)
        if (bracePos === -1) continue

        const json = this.extractBoundedJson(text, bracePos)
        if (!json) continue

        const parsed = JSON.parse(json) as Record<string, unknown>
        const tracks = (parsed as any)?.captions?.playerCaptionsTracklistRenderer?.captionTracks
        if (!tracks?.length) continue

        return {
          captionTracks: tracks.map((t: any): CaptionTrack => ({
            baseUrl: t.baseUrl || '',
            languageCode: t.languageCode || '',
            kind: t.kind === 'asr' ? 'auto' : 'manual',
            name: (t.name?.simpleText) || t.languageCode || '',
            vssId: t.vssId || '',
            isTranslatable: !!t.isTranslatable,
          })),
        }
      }
      return null
    } catch {
      return null
    }
  }

  private extractBoundedJson(source: string, startIndex: number): string | null {
    let depth = 0
    let inString = false
    let escape = false

    for (let i = startIndex; i < source.length; i++) {
      const ch = source[i]
      if (escape) { escape = false; continue }
      if (ch === '\\') { escape = true; continue }
      if (ch === '"') { inString = !inString; continue }
      if (inString) continue
      if (ch === '{') depth++
      if (ch === '}') depth--
      if (depth === 0) {
        return source.slice(startIndex, i + 1)
      }
    }
    return null
  }
}
