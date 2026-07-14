const DEBUG = process.env.NODE_ENV === 'development'

function log(...args: unknown[]): void {
  if (DEBUG) console.debug('[YT PageBridge]', ...args)
}

export interface BridgeCaptionTrack {
  baseUrl: string
  languageCode: string
  name: string
  kind: 'manual' | 'auto'
  isTranslatable: boolean
  vssId?: string
}

export interface PlayerResponseResult {
  videoId: string | null
  playabilityStatus: string | null
  captionTracks: BridgeCaptionTrack[]
}

// This function is serialized and injected into the MAIN world via chrome.scripting.executeScript
function extractCaptionTracksFromPage(): PlayerResponseResult | null {
  try {
    let data: any = (window as any).ytInitialPlayerResponse

    if (!data && (window as any).ytplayer?.config?.args?.player_response) {
      const raw = (window as any).ytplayer.config.args.player_response
      data = typeof raw === 'string' ? JSON.parse(raw) : raw
    }

    if (!data) return null

    const captionTracks = data.captions?.playerCaptionsTracklistRenderer?.captionTracks
    if (!captionTracks?.length) return null

    return {
      videoId: data.videoDetails?.videoId || null,
      playabilityStatus: data.playabilityStatus?.status || null,
      captionTracks: captionTracks.map((t: any) => ({
        baseUrl: t.baseUrl || '',
        languageCode: t.languageCode || '',
        name: (t.name?.simpleText) || t.languageCode || '',
        kind: t.kind === 'asr' ? 'auto' : 'manual',
        isTranslatable: !!t.isTranslatable,
        vssId: t.vssId || undefined,
      })),
    }
  } catch (error) {
    console.error('apps/extension/src/youtube-learning/infrastructure/youtube/YouTubePageBridge.ts error:', error);
    return null
  }
}

export async function extractViaBackgroundScripting(
  tabId: number,
  signal?: AbortSignal,
): Promise<PlayerResponseResult | null> {
  if (signal?.aborted) return null

  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      world: 'MAIN',
      func: extractCaptionTracksFromPage,
    })

    if (signal?.aborted) return null

    const result = results?.[0]?.result as PlayerResponseResult | null
    if (result?.captionTracks?.length) {
      log('Found caption tracks via chrome.scripting MAIN world')
      return result
    }
    return null
  } catch (e) {
    console.error('apps/extension/src/youtube-learning/infrastructure/youtube/YouTubePageBridge.ts error:', e);
    log('extractViaBackgroundScripting error:', e)
    return null
  }
}

export async function withRetry(
  tabId: number,
  signal?: AbortSignal,
): Promise<PlayerResponseResult | null> {
  const delays = [0, 200, 500, 1000]
  for (const delay of delays) {
    if (signal?.aborted) return null
    if (delay > 0) await new Promise(resolve => setTimeout(resolve, delay))
    if (signal?.aborted) return null

    const result = await extractViaBackgroundScripting(tabId, signal)
    if (result?.captionTracks?.length) {
      return result
    }
  }
  return null
}

// Fallback: parse ytInitialPlayerResponse from <script> tag text content (ISOLATED world)
export function extractFromPageScriptsFallback(): PlayerResponseResult | null {
  try {
    const scripts = document.querySelectorAll('script')
    for (const s of scripts) {
      const text = s.textContent || ''
      const markerIdx = text.indexOf('ytInitialPlayerResponse')
      if (markerIdx === -1) continue
      const eqIdx = text.indexOf('=', markerIdx + 'ytInitialPlayerResponse'.length)
      if (eqIdx === -1) continue
      const bracePos = text.indexOf('{', eqIdx + 1)
      if (bracePos === -1) continue
      let depth = 0
      let inString = false
      let escape = false
      for (let i = bracePos; i < text.length; i++) {
        if (escape) { escape = false; continue }
        const ch = text[i]
        if (ch === '\\') { escape = true; continue }
        if (ch === '"') { inString = !inString; continue }
        if (inString) continue
        if (ch === '{') depth++
        if (ch === '}') depth--
        if (depth === 0) {
          try {
            const data = JSON.parse(text.slice(bracePos, i + 1)) as Record<string, unknown>
            const tracks = (data as any)?.captions?.playerCaptionsTracklistRenderer?.captionTracks
            if (!tracks?.length) continue
            return {
              videoId: (data as any)?.videoDetails?.videoId || null,
              playabilityStatus: (data as any)?.playabilityStatus?.status || null,
              captionTracks: tracks.map((t: { baseUrl: string; languageCode: string; name?: { simpleText?: string }; kind?: string; isTranslatable?: boolean; vssId?: string }) => ({
                baseUrl: t.baseUrl || '',
                languageCode: t.languageCode || '',
                name: (t.name?.simpleText) || t.languageCode || '',
                kind: t.kind === 'asr' ? 'auto' : 'manual',
                isTranslatable: !!t.isTranslatable,
                vssId: t.vssId || undefined,
              })),
            }
          } catch (error) {
 console.error('apps/extension/src/youtube-learning/infrastructure/youtube/YouTubePageBridge.ts error:', error);
 continue }
          break
        }
      }
    }
  } catch (error) {
    console.error('apps/extension/src/youtube-learning/infrastructure/youtube/YouTubePageBridge.ts error:', error);
    // fallback failed
  }
  return null
}
