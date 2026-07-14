export type RecordingState = 'idle' | 'requesting' | 'recording' | 'paused' | 'stopped' | 'error'

export interface AudioRecorderCallbacks {
  onStateChange?: (state: RecordingState) => void
  onDataAvailable?: (blob: Blob) => void
  onRecordingComplete?: (blob: Blob, duration: number) => void
  onError?: (error: string) => void
  onPermissionDenied?: () => void
}

export class AudioRecorderAdapter {
  private mediaRecorder: MediaRecorder | null = null
  private stream: MediaStream | null = null
  private chunks: Blob[] = []
  private state: RecordingState = 'idle'
  private callbacks: AudioRecorderCallbacks
  private startTime: number = 0
  private maxDurationMs: number
  private maxDurationTimer: ReturnType<typeof setTimeout> | null = null

  constructor(callbacks: AudioRecorderCallbacks = {}, maxDurationMs: number = 120_000) {
    this.callbacks = callbacks
    this.maxDurationMs = maxDurationMs
  }

  getState(): RecordingState {
    return this.state
  }

  async requestPermission(): Promise<boolean> {
    this.setState('requesting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      this.stream = stream
      stream.getTracks().forEach(t => t.stop())
      this.setState('idle')
      return true
    } catch (err) {
      console.error('apps/extension/src/youtube-learning/infrastructure/audio/AudioRecorderAdapter.ts error:', err);
      this.setState('error')
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        this.callbacks.onPermissionDenied?.()
      } else {
        this.callbacks.onError?.('Microphone access denied or unavailable')
      }
      return false
    }
  }

  async start(): Promise<boolean> {
    if (this.state === 'recording') return true

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      this.chunks = []

      const mimeType = this.getSupportedMimeType()
      this.mediaRecorder = new MediaRecorder(this.stream, mimeType ? { mimeType } : undefined)

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.chunks.push(event.data)
          this.callbacks.onDataAvailable?.(event.data)
        }
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: mimeType || 'audio/webm' })
        const duration = (Date.now() - this.startTime) / 1000
        this.callbacks.onRecordingComplete?.(blob, duration)
        this.cleanup()
        this.setState('stopped')
      }

      this.mediaRecorder.onerror = () => {
        this.callbacks.onError?.('Recording error occurred')
        this.cleanup()
        this.setState('error')
      }

      this.mediaRecorder.start(100)
      this.startTime = Date.now()
      this.setState('recording')

      if (this.maxDurationMs > 0) {
        this.maxDurationTimer = setTimeout(() => {
          if (this.state === 'recording') this.stop()
        }, this.maxDurationMs)
      }

      return true
    } catch (err) {
      console.error('apps/extension/src/youtube-learning/infrastructure/audio/AudioRecorderAdapter.ts error:', err);
      this.setState('error')
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        this.callbacks.onPermissionDenied?.()
      } else {
        this.callbacks.onError?.('Could not start recording')
      }
      return false
    }
  }

  stop(): void {
    this.clearMaxDurationTimer()
    if (this.mediaRecorder && this.state === 'recording') {
      this.mediaRecorder.stop()
    }
  }

  cancel(): void {
    this.clearMaxDurationTimer()
    this.cleanup()
    this.chunks = []
    this.setState('idle')
  }

  getDuration(): number {
    if (this.state === 'recording') {
      return (Date.now() - this.startTime) / 1000
    }
    return 0
  }

  private clearMaxDurationTimer(): void {
    if (this.maxDurationTimer !== null) {
      clearTimeout(this.maxDurationTimer)
      this.maxDurationTimer = null
    }
  }

  private setState(state: RecordingState): void {
    this.state = state
    this.callbacks.onStateChange?.(state)
  }

  private cleanup(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop())
      this.stream = null
    }
    this.mediaRecorder = null
  }

  private getSupportedMimeType(): string | undefined {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
    ]
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) return type
    }
    return undefined
  }

  getBlob(): Blob | null {
    if (this.chunks.length === 0) return null
    return new Blob(this.chunks, { type: this.getSupportedMimeType() || 'audio/webm' })
  }

  destroy(): void {
    this.clearMaxDurationTimer()
    this.cancel()
    this.stream = null
    this.mediaRecorder = null
    this.callbacks = {}
  }

  static formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
}
