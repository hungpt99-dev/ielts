import type { TranscriptSegmentData } from '../../domain/types'
import type { YouTubePlayerController } from './YouTubePlayerController'

export type PlaybackMode = 'segment' | 'continuous'

export interface TranscriptPlaybackCallbacks {
  onActiveSegmentChange: (index: number) => void
}

export class TranscriptPlaybackController {
  private player: YouTubePlayerController
  private segments: TranscriptSegmentData[] = []
  private activeSegmentIndex = -1
  private mode: PlaybackMode = 'segment'
  private rafId: number | null = null
  private callbacks: TranscriptPlaybackCallbacks
  private lastCheckTime = 0
  private readonly STOP_TOLERANCE_MS = 150

  constructor(
    player: YouTubePlayerController,
    callbacks: TranscriptPlaybackCallbacks,
  ) {
    this.player = player
    this.callbacks = callbacks
  }

  setSegments(segments: TranscriptSegmentData[]): void {
    this.segments = segments
  }

  getActiveSegmentIndex(): number {
    return this.activeSegmentIndex
  }

  setActiveSegmentIndex(index: number): void {
    const clamped = Math.max(0, Math.min(index, this.segments.length - 1))
    if (clamped !== this.activeSegmentIndex) {
      this.activeSegmentIndex = clamped
      this.callbacks.onActiveSegmentChange(clamped)
    }
  }

  playSegment(index?: number): void {
    this.cleanup()
    this.mode = 'segment'

    const idx = index ?? this.activeSegmentIndex
    if (idx < 0 || idx >= this.segments.length) return

    this.setActiveSegmentIndex(idx)
    const segment = this.segments[idx]
    this.player.seek(segment.start)
    this.player.play()
    this.startAutoStop(segment)
  }

  previous(): void {
    if (this.activeSegmentIndex <= 0) return
    this.playSegment(this.activeSegmentIndex - 1)
  }

  next(): void {
    if (this.activeSegmentIndex >= this.segments.length - 1) return
    this.playSegment(this.activeSegmentIndex + 1)
  }

  continuePlayback(): void {
    this.cleanup()
    this.mode = 'continuous'
    const currentTime = this.player.getCurrentTime()
    this.player.play()
    this.lastCheckTime = currentTime

    const idx = this.findSegmentAtTime(currentTime)
    if (idx >= 0) {
      this.setActiveSegmentIndex(idx)
    }
    this.startContinuousTracking()
  }

  togglePlayPause(): void {
    if (this.player.getState().isPlaying) {
      this.cleanup()
      this.player.pause()
    } else {
      if (this.mode === 'segment') {
        const currentSeg = this.segments[this.activeSegmentIndex]
        if (currentSeg) {
          this.playSegment(this.activeSegmentIndex)
        } else {
          this.player.play()
        }
      } else {
        this.continuePlayback()
      }
    }
  }

  handlePlayerPause(): void {
    if (this.mode === 'segment') {
      this.cleanup()
    }
  }

  handlePlayerSeek(): void {
    if (this.mode === 'segment') {
      this.cleanup()
      this.mode = 'continuous'
    }
  }

  disconnect(): void {
    this.cleanup()
    this.segments = []
    this.activeSegmentIndex = -1
  }

  private startAutoStop(segment: TranscriptSegmentData): void {
    const endTime = this.resolveEndTime(segment)
    if (endTime <= segment.start) {
      this.player.play()
      return
    }

    const check = (): void => {
      const currentTime = this.player.getCurrentTime()
      this.lastCheckTime = currentTime

      const activeIdx = this.findSegmentAtTime(currentTime)
      if (activeIdx >= 0 && activeIdx !== this.activeSegmentIndex) {
        this.setActiveSegmentIndex(activeIdx)
      }

      if (currentTime >= endTime - this.STOP_TOLERANCE_MS / 1000) {
        this.player.pause()
        this.rafId = null
        return
      }

      this.rafId = requestAnimationFrame(check)
    }

    this.lastCheckTime = this.player.getCurrentTime()
    this.rafId = requestAnimationFrame(check)
  }

  private startContinuousTracking(): void {
    const track = (): void => {
      const currentTime = this.player.getCurrentTime()
      if (Math.abs(currentTime - this.lastCheckTime) > 0.3) {
        this.lastCheckTime = currentTime
        const idx = this.findSegmentAtTime(currentTime)
        if (idx >= 0 && idx !== this.activeSegmentIndex) {
          this.setActiveSegmentIndex(idx)
        }
      }
      this.rafId = requestAnimationFrame(track)
    }
    this.rafId = requestAnimationFrame(track)
  }

  private resolveEndTime(segment: TranscriptSegmentData): number {
    if (segment.end > segment.start) return segment.end

    const idx = this.segments.findIndex(s => s.id === segment.id)
    if (idx >= 0 && idx < this.segments.length - 1) {
      return this.segments[idx + 1].start
    }

    const duration = this.player.getDuration()
    if (isFinite(duration) && duration > segment.start) return duration

    return segment.start + 5
  }

  private findSegmentAtTime(time: number): number {
    for (let i = 0; i < this.segments.length; i++) {
      const seg = this.segments[i]
      const end = this.resolveEndTime(seg)
      if (time >= seg.start && time < end) return i
    }
    return -1
  }

  private cleanup(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }
}
