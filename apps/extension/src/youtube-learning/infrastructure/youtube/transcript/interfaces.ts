import type { CaptionTrack, Transcript, TranscriptOptions, TranscriptResult, TranscriptSegment, YouTubePlayerResponse } from './types'

export interface IMemoryTranscriptCache {
  get(videoId: string, language: string): Transcript | null
  set(videoId: string, language: string, transcript: Transcript): void
  clear(videoId?: string): void
}

export interface IPlayerResponseExtractor {
  extract(): YouTubePlayerResponse | null
}

export interface IPlayerResponseProvider {
  getFreshResponse(): Promise<YouTubePlayerResponse | null>
}

export interface ICaptionTrackSelector {
  select(tracks: readonly CaptionTrack[], preferredLanguage: string): CaptionTrack | null
}

export interface ICaptionDownloader {
  download(url: string, signal?: AbortSignal): Promise<string>
}

export interface ICaptionResolver {
  resolve(track: CaptionTrack, signal?: AbortSignal): Promise<string>
}

export interface ITranscriptParser {
  parse(xml: string, videoId: string): readonly TranscriptSegment[]
}

export interface IPlayerReadinessDetector {
  waitUntilReady(videoId: string, signal?: AbortSignal): Promise<void>
}

export interface IYoutubeTranscriptRepository {
  fetch(videoId: string, options?: TranscriptOptions): Promise<Transcript>
}

export interface ITranscriptService {
  getTranscript(videoId: string, options?: TranscriptOptions): Promise<TranscriptResult>
  clearCache(videoId?: string): void
}

export type { CaptionTrack, Transcript, TranscriptOptions, TranscriptResult, TranscriptSegment, YouTubePlayerResponse }
