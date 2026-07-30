import { VideoChangedError, PlayerInitTimeoutError } from './types'

const DIAG = true

function dlog(...args: unknown[]): void {
  if (DIAG) console.log('[PlayerReadiness]', ...args)
}

export type TranscriptFetchState =
  | 'INITIALIZING'
  | 'WAITING_FOR_PLAYER'
  | 'WAITING_FOR_AD'
  | 'WAITING_FOR_CAPTIONS'
  | 'READY'
  | 'FETCHING'
  | 'COMPLETED'
  | 'FAILED'

export interface PlayerReadinessConfig {
  readonly pollIntervalMs: number
  readonly timeoutMs: number
}

const DEFAULT_CONFIG: PlayerReadinessConfig = {
  pollIntervalMs: 300,
  timeoutMs: 30_000,
}

export interface IPlayerReadinessDetector {
  waitUntilReady(videoId: string, signal?: AbortSignal): Promise<void>
}

export class PlayerReadinessDetector implements IPlayerReadinessDetector {
  private readonly config: PlayerReadinessConfig
  private state: TranscriptFetchState = 'INITIALIZING'
  private isAdPlaying = false

  constructor(config: Partial<PlayerReadinessConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  async waitUntilReady(videoId: string, signal?: AbortSignal): Promise<void> {
    const t0 = performance.now()
    this.transition('WAITING_FOR_PLAYER')
    const timeoutAt = Date.now() + this.config.timeoutMs

    while (Date.now() < timeoutAt) {
      if (signal?.aborted) {
        this.transition('FAILED')
        throw new VideoChangedError('Request was cancelled')
      }

      if (this.detectAdvertisement()) {
        if (!this.isAdPlaying) {
          this.isAdPlaying = true
          this.transition('WAITING_FOR_AD')
          dlog(`Ad detected, waiting... (${(performance.now() - t0).toFixed(0)}ms)`)
        }
        await this.sleep(this.config.pollIntervalMs)
        continue
      }

      if (this.isAdPlaying) {
        this.isAdPlaying = false
        dlog(`Ad finished after ${(performance.now() - t0).toFixed(0)}ms`)
      }

      if (signal?.aborted) {
        this.transition('FAILED')
        throw new VideoChangedError('Request was cancelled')
      }

      if (!this.hasPlayerResponse()) {
        this.transition('WAITING_FOR_PLAYER')
        await this.sleep(this.config.pollIntervalMs)
        continue
      }

      this.transition('READY')
      return
    }

    this.transition('FAILED')
    throw new PlayerInitTimeoutError(
      `Player did not become ready within ${this.config.timeoutMs}ms. ` +
      `Last state: ${this.state}, ad was playing: ${this.isAdPlaying}`,
    )
  }

  getState(): TranscriptFetchState {
    return this.state
  }

  isCurrentlyInAd(): boolean {
    return this.isAdPlaying
  }

  private transition(newState: TranscriptFetchState): void {
    if (this.state !== newState) {
      dlog(`State: ${this.state} → ${newState}`)
    }
    this.state = newState
  }

  private detectAdvertisement(): boolean {
    if (typeof document === 'undefined') return false
    try {
      const video = document.querySelector<HTMLVideoElement>('video.html5-main-video')
      if (video?.classList.contains('ad-showing')) return true
      if (document.querySelector('.ytp-ad-player-overlay')) return true
      if (document.querySelector('.ytp-ad-text')) return true
      if (document.querySelector('.video-ads .ytp-ad-module')) return true
      return false
    } catch {
      return false
    }
  }

  private hasPlayerResponse(): boolean {
    if (typeof document === 'undefined') return false
    try {
      const scripts = document.querySelectorAll('script')
      for (const script of scripts) {
        if (script.textContent?.includes('ytInitialPlayerResponse')) return true
      }
      return false
    } catch {
      return false
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
