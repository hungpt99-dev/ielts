import type { CaptionTrack, Transcript, TranscriptOptions } from './types'
import {
  PlayerResponseNotFoundError,
  CaptionTrackNotFoundError,
  TranscriptDownloadError,
  TranscriptParseError,
  VideoChangedError,
  NoCaptionDataForLanguageError,
} from './types'
import type {
  IYoutubeTranscriptRepository,
  IPlayerResponseProvider,
  ICaptionTrackSelector,
  ICaptionResolver,
  ITranscriptParser,
  IPlayerReadinessDetector,
} from './interfaces'

const DEBUG = true

function dlog(...args: unknown[]): void {
  if (DEBUG) console.log('[TranscriptRepo]', ...args)
}

export class YoutubeTranscriptRepository implements IYoutubeTranscriptRepository {
  constructor(
    private readonly readinessDetector: IPlayerReadinessDetector,
    private readonly responseProvider: IPlayerResponseProvider,
    private readonly captionSelector: ICaptionTrackSelector,
    private readonly resolver: ICaptionResolver,
    private readonly parser: ITranscriptParser,
  ) {}

  async fetch(videoId: string, options?: TranscriptOptions): Promise<Transcript> {
    const t0 = performance.now()

    dlog('========================================')
    dlog('FETCH START videoId:', videoId, 'lang:', options?.language || 'en')
    dlog('========================================')

    if (!videoId) {
      throw new PlayerResponseNotFoundError('No video ID provided')
    }

    const signal = options?.signal
    if (signal?.aborted) {
      throw new VideoChangedError('Request was cancelled')
    }

    const preferredLanguage = options?.language || 'en'

    // Step 0: Wait for player readiness (skip ads)
    dlog('[0/4] Waiting for player readiness...')
    await this.readinessDetector.waitUntilReady(videoId, signal)
    const t1 = (performance.now() - t0).toFixed(0)
    dlog(`[0/4] Player ready at ${t1}ms`)

    if (signal?.aborted) {
      throw new VideoChangedError('Request was cancelled')
    }

    // Step 1: Get LIVE player response from MAIN world
    dlog('[1/4] Requesting LIVE player response via MAIN world injection...')
    const t1a = performance.now()
    const playerResponse = await this.responseProvider.getFreshResponse()
    const t1b = (performance.now() - t1a).toFixed(0)
    dlog(`[1/4] Response received in ${t1b}ms`)

    if (!playerResponse || !playerResponse.captionTracks.length) {
      dlog('[1/4] FAIL: no caption tracks in response')
      throw new PlayerResponseNotFoundError('No caption tracks found in live player response')
    }

    dlog(`[1/4] Found ${playerResponse.captionTracks.length} caption track(s):`)
    for (let i = 0; i < playerResponse.captionTracks.length; i++) {
      const t = playerResponse.captionTracks[i]
      dlog(`  Track[${i}]: lang=${t.languageCode} kind=${t.kind} name="${t.name}" translatable=${t.isTranslatable}`)
      dlog(`  Track[${i}] baseUrl=${t.baseUrl}`)
    }

    if (signal?.aborted) {
      throw new VideoChangedError('Request was cancelled')
    }

    // Step 2: Select caption track
    dlog(`[2/4] Selecting track for preferred language: ${preferredLanguage}`)
    const selectedTrack = this.captionSelector.select(playerResponse.captionTracks, preferredLanguage)
    if (!selectedTrack) {
      dlog('[2/4] FAIL: no track selected')
      throw new CaptionTrackNotFoundError()
    }

    dlog(`[2/4] SELECTED TRACK:`)
    dlog(`  languageCode: ${selectedTrack.languageCode}`)
    dlog(`  kind: ${selectedTrack.kind}`)
    dlog(`  name: "${selectedTrack.name}"`)
    dlog(`  isTranslatable: ${selectedTrack.isTranslatable}`)
    dlog(`  baseUrl (full): ${selectedTrack.baseUrl}`)
    dlog(`  baseUrl length: ${selectedTrack.baseUrl.length}`)

    // Step 3: Resolve and download — try InnerTube first, then timedtext fallback
    dlog('[3/4] Resolving caption track...')
    let xml: string
    try {
      xml = await this.resolver.resolve(selectedTrack, signal)
      dlog(`[3/4] CaptionResolver returned: ${xml.length} bytes (${(performance.now() - t0).toFixed(0)}ms)`)
    } catch (err) {
      dlog(`[3/4] CaptionResolver FAILED: ${err instanceof Error ? err.message : String(err)}`)
      throw new TranscriptDownloadError(
        `Failed (lang=${selectedTrack.languageCode}): ${err instanceof Error ? err.message : String(err)}`,
      )
    }

    if (signal?.aborted) {
      throw new VideoChangedError('Request was cancelled')
    }

    // Step 4: Parse
    const segments = this.parser.parse(xml, videoId)
    dlog(`[4/4] Parsed: ${segments.length} segments (${(performance.now() - t0).toFixed(0)}ms)`)

    if (!segments.length) {
      dlog('[4/4] FAIL: parser returned 0 segments')
      throw new TranscriptParseError(`No segments parsed. Response preview: ${xml.slice(0, 200)}`)
    }

    const fullText = segments.map(s => s.text).join(' ')
    dlog(`[DONE] ${videoId} lang=${selectedTrack.languageCode} auto=${selectedTrack.kind === 'auto'} ${segments.length} segs (${(performance.now() - t0).toFixed(0)}ms)`)
    dlog('========================================')

    return {
      videoId,
      language: selectedTrack.languageCode,
      isAutoGenerated: selectedTrack.kind === 'auto',
      segments,
      fullText,
    }
  }
}
