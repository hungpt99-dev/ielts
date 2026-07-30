import type { CaptionTrack } from './types'

const DIAG = true
function dlog(...args: unknown[]): void { if (DIAG) console.log('[CaptionResolver]', ...args) }

export interface ICaptionResolver {
  resolve(track: CaptionTrack, signal?: AbortSignal): Promise<string>
}

export class CaptionResolver implements ICaptionResolver {

  async resolve(track: CaptionTrack, signal?: AbortSignal): Promise<string> {
    dlog('Resolving:', track.languageCode, track.kind)

    // Strategy 1: InnerTube API with ANDROID client (gets clean URL without exp=xpe)
    const r1 = await this.tryFetchViaInnerTube(track)
    if (r1) return r1

    // Strategy 2: MAIN world injection (inherits page's browser context)
    const r2 = await this.tryFetchInMainWorld(track.baseUrl)
    if (r2) return r2

    // Strategy 3: Direct fetch with browser-mimicking headers, no cookies
    const r3 = await this.tryFetch(track.baseUrl, false, signal)
    if (r3) return r3

    // Strategy 4: Background SW fetch (different execution context)
    const r4 = await this.tryFetchViaBackground(track.baseUrl)
    if (r4) return r4

    // Strategy 5: Direct fetch with cookies (same-origin browser context)
    const r5 = await this.tryFetch(track.baseUrl, true, signal)
    if (r5) return r5

    throw new Error(`No caption data for ${track.languageCode}`)
  }

  private async tryFetchViaInnerTube(track: CaptionTrack): Promise<string | null> {
    if (typeof globalThis.chrome?.runtime?.sendMessage !== 'function') return null

    const videoId = this.extractVideoId(track.baseUrl)
    if (!videoId) {
      dlog('  InnerTube: could not extract videoId from baseUrl')
      return null
    }

    try {
      const resp = await chrome.runtime.sendMessage({
        type: 'FETCH_TRANSCRIPT_INNERTUBE',
        payload: { videoId, languageCode: track.languageCode },
      }) as { success?: boolean; data?: { xml?: string }; error?: string; message?: string }

      if (resp?.success && resp?.data?.xml?.trim()) {
        const text = resp.data.xml
        dlog(`  InnerTube SUCCESS: ${text.length} bytes`)
        if (text.includes('<text ') || text.includes('<transcript') || text.includes('"events"') || text.includes('"actions"')) {
          return text
        }
      }

      dlog(`  InnerTube failed: success=${resp?.success} error=${resp?.error || 'none'} msg=${resp?.message || 'none'}`)
      return null
    } catch {
      return null
    }
  }

  private extractVideoId(baseUrl: string): string | null {
    const match = baseUrl.match(/[?&]v=([a-zA-Z0-9_-]+)/)
    return match?.[1] || null
  }

  private async tryFetchInMainWorld(url: string): Promise<string | null> {
    if (typeof globalThis.chrome?.runtime?.sendMessage !== 'function') return null
    try {
      const resp = await chrome.runtime.sendMessage({
        type: 'FETCH_CAPTION_XML',
        payload: { url },
      }) as { success?: boolean; data?: { diagnostics?: { ok: boolean; status: number; contentType: string; bodyLength: number; bodyPreview: string } } }

      if (!resp?.success || !resp?.data?.diagnostics) return null

      const diag = resp.data.diagnostics
      dlog(`  MAIN world fetch: HTTP ${diag.status} type=${diag.contentType} len=${diag.bodyLength}`)

      if (!diag.ok || !diag.bodyPreview?.trim()) return null

      const text = diag.bodyPreview
      if (text.includes('<text ') || text.includes('<transcript') || text.includes('"events"') || text.includes('"actions"')) {
        dlog(`  MAIN world SUCCESS: ${text.length} bytes`)
        return text
      }

      dlog(`  MAIN world unexpected format, preview:`, text.slice(0, 100))
      return null
    } catch {
      return null
    }
  }

  private async tryFetchViaBackground(url: string): Promise<string | null> {
    if (typeof globalThis.chrome?.runtime?.sendMessage !== 'function') return null
    try {
      const resp = await chrome.runtime.sendMessage({
        type: 'FETCH_TIMEDTEXT',
        payload: { url },
      }) as { success?: boolean; data?: { text?: string } }

      if (resp?.success && resp?.data?.text?.trim()) {
        const text = resp.data.text
        dlog(`  background fetch: ${text.length} bytes`)
        if (text.includes('<text ') || text.includes('<transcript') || text.includes('"events"')) {
          return text
        }
      }
      return null
    } catch {
      return null
    }
  }

  private async tryFetch(url: string, withCredentials: boolean, signal?: AbortSignal): Promise<string | null> {
    try {
      const response = await fetch(url, {
        signal,
        credentials: withCredentials ? 'include' : 'omit',
        headers: {
          'Accept-Language': 'en-US',
          'User-Agent': navigator.userAgent,
          'Origin': 'https://www.youtube.com',
          'Referer': 'https://www.youtube.com/',
        },
      })

      const body = await response.text()

      dlog(`  fetch(creds=${withCredentials}): HTTP ${response.status} type=${response.headers.get('content-type')} len=${body.length}`)

      if (!response.ok || !body.trim()) return null

      if (body.includes('<text ') || body.includes('<transcript')) {
        dlog(`  SUCCESS: ${body.length} bytes`)
        return body
      }

      if (body.includes('"events"') || body.includes('"actions"')) {
        dlog(`  JSON format detected`)
        return body
      }

      dlog(`  Unexpected format, preview:`, body.slice(0, 100))
      return null
    } catch (err) {
      dlog(`  Error:`, err)
      return null
    }
  }
}
