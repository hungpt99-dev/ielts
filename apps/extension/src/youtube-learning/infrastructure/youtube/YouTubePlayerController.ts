import { getVideoElement } from './YouTubeSelectors'

export interface PlayerState {
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  playbackRate: number
  isMuted: boolean
  isFullscreen: boolean
  isTheatreMode: boolean
}

export interface PlayerControllerCallbacks {
  onTimeUpdate?: (time: number) => void
  onPlay?: () => void
  onPause?: () => void
  onEnded?: () => void
  onRateChange?: (rate: number) => void
  onSeek?: (time: number) => void
  onStateChange?: (state: PlayerState) => void
}

export class YouTubePlayerController {
  private video: HTMLVideoElement | null = null
  private callbacks: PlayerControllerCallbacks
  private animationFrameId: number | null = null
  private lastReportedTime: number = -1

  constructor(callbacks: PlayerControllerCallbacks = {}) {
    this.callbacks = callbacks
  }

  connect(): boolean {
    this.video = getVideoElement()
    if (!this.video) return false
    this.attachListeners()
    this.startTimeTracking()
    return true
  }

  disconnect(): void {
    this.detachListeners()
    this.stopTimeTracking()
    this.video = null
  }

  reconnect(): boolean {
    this.disconnect()
    return this.connect()
  }

  private attachListeners(): void {
    if (!this.video) return
    this.video.addEventListener('play', this.handlePlay)
    this.video.addEventListener('pause', this.handlePause)
    this.video.addEventListener('ended', this.handleEnded)
    this.video.addEventListener('ratechange', this.handleRateChange)
    this.video.addEventListener('seeked', this.handleSeeked)
    this.video.addEventListener('loadedmetadata', this.handleLoadedMetadata)
  }

  private detachListeners(): void {
    if (!this.video) return
    this.video.removeEventListener('play', this.handlePlay)
    this.video.removeEventListener('pause', this.handlePause)
    this.video.removeEventListener('ended', this.handleEnded)
    this.video.removeEventListener('ratechange', this.handleRateChange)
    this.video.removeEventListener('seeked', this.handleSeeked)
    this.video.removeEventListener('loadedmetadata', this.handleLoadedMetadata)
  }

  private handlePlay = (): void => {
    this.callbacks.onPlay?.()
    this.reportState()
  }

  private handlePause = (): void => {
    this.callbacks.onPause?.()
    this.reportState()
  }

  private handleEnded = (): void => {
    this.callbacks.onEnded?.()
    this.reportState()
  }

  private handleRateChange = (): void => {
    if (this.video) {
      this.callbacks.onRateChange?.(this.video.playbackRate)
    }
  }

  private handleSeeked = (): void => {
    if (this.video) {
      this.callbacks.onSeek?.(this.video.currentTime)
      this.lastReportedTime = this.video.currentTime
    }
  }

  private handleLoadedMetadata = (): void => {
    this.reportState()
  }

  private startTimeTracking(): void {
    const track = (): void => {
      if (!this.video) return
      const currentTime = this.video.currentTime
      if (Math.abs(currentTime - this.lastReportedTime) >= 0.25) {
        this.lastReportedTime = currentTime
        this.callbacks.onTimeUpdate?.(currentTime)
      }
      this.animationFrameId = requestAnimationFrame(track)
    }
    this.animationFrameId = requestAnimationFrame(track)
  }

  private stopTimeTracking(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  private reportState(): void {
    if (!this.video) return
    this.callbacks.onStateChange?.(this.getState())
  }

  getState(): PlayerState {
    const video = this.video
    return {
      isPlaying: video ? !video.paused : false,
      currentTime: video?.currentTime ?? 0,
      duration: video?.duration ?? 0,
      volume: video?.volume ?? 1,
      playbackRate: video?.playbackRate ?? 1,
      isMuted: video?.muted ?? false,
      isFullscreen: !!document.fullscreenElement,
      isTheatreMode: !!document.querySelector('.ytp-theater-mode'),
    }
  }

  play(): void {
    this.video?.play().catch(() => {})
  }

  pause(): void {
    this.video?.pause()
  }

  togglePlay(): void {
    if (this.video?.paused) {
      this.play()
    } else {
      this.pause()
    }
  }

  seek(time: number): void {
    if (this.video) {
      this.video.currentTime = Math.max(0, Math.min(time, this.video.duration || 0))
    }
  }

  setPlaybackRate(rate: number): void {
    if (this.video) {
      this.video.playbackRate = Math.max(0.25, Math.min(rate, 4))
    }
  }

  setVolume(volume: number): void {
    if (this.video) {
      this.video.volume = Math.max(0, Math.min(volume, 1))
    }
  }

  toggleMute(): void {
    if (this.video) {
      this.video.muted = !this.video.muted
    }
  }

  getCurrentTime(): number {
    return this.video?.currentTime ?? 0
  }

  getDuration(): number {
    return this.video?.duration ?? 0
  }

  destroy(): void {
    this.disconnect()
    this.callbacks = {}
  }
}
