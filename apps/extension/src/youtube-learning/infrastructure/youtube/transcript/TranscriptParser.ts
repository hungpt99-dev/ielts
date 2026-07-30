import type { TranscriptSegment } from './types'
import type { ITranscriptParser } from './interfaces'

export class TranscriptParser implements ITranscriptParser {
  parse(xml: string, videoId: string): readonly TranscriptSegment[] {
    const parser = new DOMParser()
    const xmlDoc = parser.parseFromString(xml, 'text/xml')

    const parseError = xmlDoc.querySelector('parsererror')
    if (parseError) return []

    const textElements = xmlDoc.querySelectorAll('text')
    if (!textElements.length) return []

    const segments: TranscriptSegment[] = []

    textElements.forEach((el, index) => {
      const start = parseFloat(el.getAttribute('start') || '0')
      const dur = parseFloat(el.getAttribute('dur') || '0')
      const rawText = el.textContent?.trim() || ''
      if (!rawText) return

      const text = this.decodeHtmlEntities(rawText)
      const end = start + dur

      segments.push({
        text,
        start,
        end,
        duration: dur,
      })
    })

    return segments
  }

  private decodeHtmlEntities(text: string): string {
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
  }
}
