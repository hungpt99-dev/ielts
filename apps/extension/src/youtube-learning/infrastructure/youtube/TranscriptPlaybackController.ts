import type { TranscriptSegmentData } from '../../domain/types'
import type { YouTubePlayerController } from './YouTubePlayerController'

export type PlaybackMode = 'segment' | 'continuous'

export interface TranscriptPlaybackCallbacks {
  onActiveSegmentChange: (index: number) => void
  onModeChange: (mode: PlaybackMode) => void
}

export class TranscriptPlaybackController {
  private player: YouTubePlayerController
  private segments: TranscriptSegmentData[] = []
  private activeSegmentIndex = -1
  private mode: PlaybackMode = 'segment'
  private rafId: number | null = null
  private callbacks: TranscriptPlaybackCallbacks
  private lastCheckTime = 0
  private autoStopSegment: TranscriptSegmentData | null = null
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

  getMode(): PlaybackMode {
    return this.mode
  }

  setMode(mode: PlaybackMode): void {
    if (this.mode === mode) return
    this.cleanup()
    this.mode = mode
    this.callbacks.onModeChange(mode)
    if (mode === 'continuous' && this.player.getState().isPlaying) {
      this.startContinuousTracking()
    }
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
    this.callbacks.onModeChange('segment')

    const idx = index ?? this.activeSegmentIndex
    if (idx < 0 || idx >= this.segments.length) return

    this.setActiveSegmentIndex(idx)
    const segment = this.segments[idx]
    this.player.seek(segment.start)
    this.player.play()
    this.autoStopSegment = segment
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
    this.callbacks.onModeChange('continuous')
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
    if (this.mode === 'continuous') {
      this.syncActiveSegmentToTime()
      return
    }

    if (!this.autoStopSegment) {
      this.autoStopSegment = null
      this.cleanup()
      this.syncActiveSegmentToTime()
      return
    }

    const currentTime = this.player.getCurrentTime()
    const endTime = this.resolveEndTime(this.autoStopSegment)
    if (currentTime < this.autoStopSegment.start || currentTime >= endTime) {
      this.cleanup()
      this.syncActiveSegmentToTime()
    }
  }

  private syncActiveSegmentToTime(): void {
    const idx = this.findSegmentAtTime(this.player.getCurrentTime())
    if (idx >= 0) {
      this.setActiveSegmentIndex(idx)
    }
  }

  disconnect(): void {
    this.cleanup()
    this.segments = []
    this.activeSegmentIndex = -1
  }

  stop(): void {
    this.cleanup()
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
        this.player.pause()
        this.rafId = null
        return
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
    let bestIdx = -1
    for (let i = 0; i < this.segments.length; i++) {
      const seg = this.segments[i]
      if (time < seg.start) continue
      const end = this.resolveEndTime(seg)
      if (time < end) {
        if (bestIdx === -1 || seg.start > this.segments[bestIdx].start) {
          bestIdx = i
        }
      }
    }
    return bestIdx
  }

  private cleanup(): void {
    this.autoStopSegment = null
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }
}
