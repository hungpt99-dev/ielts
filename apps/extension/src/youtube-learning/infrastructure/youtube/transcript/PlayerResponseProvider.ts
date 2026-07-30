import type { CaptionTrack, YouTubePlayerResponse } from './types'
import type { IPlayerResponseExtractor } from './interfaces'

const DIAG = true

function dlog(...args: unknown[]): void {
  if (DIAG) console.log('[PlayerResponseProvider]', ...args)
}

export interface IPlayerResponseProvider {
  getFreshResponse(): Promise<YouTubePlayerResponse | null>
}

export class PlayerResponseProvider implements IPlayerResponseProvider {
  constructor(private readonly extractor: IPlayerResponseExtractor) {}

  async getFreshResponse(): Promise<YouTubePlayerResponse | null> {
    dlog('Requesting fresh player response...')

    if (typeof globalThis.chrome?.runtime?.sendMessage === 'function') {
      dlog('Using MAIN world injection (via background SW → GET_PLAYER_RESPONSE handler)')
      const t0 = performance.now()

      const resp = await chrome.runtime.sendMessage({
        type: 'GET_PLAYER_RESPONSE',
      }) as { success?: boolean; data?: {
        captionTracks?: CaptionTrack[];
        videoId?: string;
        source?: string;
        moviePlayerTracksCount?: number;
        captionsSection?: string[];
        tracklistRenderer?: boolean;
        captionsAvailable?: boolean;
      } }

      const ms = (performance.now() - t0).toFixed(0)

      if (resp?.success && resp?.data?.captionTracks?.length) {
        dlog(`MAIN world injection SUCCESS: ${resp.data.captionTracks.length} tracks in ${ms}ms`)
        dlog(`  source: ${resp.data.source || 'unknown'}`)
        dlog(`  videoId: ${resp.data.videoId || 'unknown'}`)
        dlog(`  moviePlayer tracks: ${resp.data.moviePlayerTracksCount}`)
        dlog(`  captions section keys: [${(resp.data.captionsSection || []).join(', ')}]`)
        dlog(`  tracklistRenderer: ${resp.data.tracklistRenderer}`)

        // Log first track's vssId for debugging
        const t0 = resp.data.captionTracks[0]
        dlog(`  Track[0] vssId: "${t0.vssId}" lang=${t0.languageCode}`)
        dlog(`  Track[0] baseUrl: ${t0.baseUrl}`)

        return { captionTracks: resp.data.captionTracks }
      }

      dlog(`MAIN world injection FAILED or no tracks. success=${resp?.success} tracks=${resp?.data?.captionTracks?.length} (${ms}ms)`)
    }

    dlog('Falling back to ISOLATED-world script-tag parsing (may be stale on SPA pages)')
    const result = this.extractor.extract()
    if (result) {
      dlog(`ISOLATED-world fallback: ${result.captionTracks.length} tracks`)
    } else {
      dlog('ISOLATED-world fallback: null (no player response found in script tags)')
    }
    return result
  }
}
