import type { VoiceStatus } from './types'

export type VoiceEventHandler = {
  onStatusChange: (status: VoiceStatus) => void
  onTranscript: (text: string, isFinal: boolean) => void
  onError: (error: string) => void
}

export class VoiceService {
  private recognition: SpeechRecognition | null = null
  private status: VoiceStatus = 'idle'
  private handlers: VoiceEventHandler | null = null

  static isSupported(): boolean {
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window
  }

  static isSynthesisSupported(): boolean {
    return 'speechSynthesis' in window
  }

  getStatus(): VoiceStatus {
    return this.status
  }

  setHandlers(handlers: VoiceEventHandler): void {
    this.handlers = handlers
  }

  private setStatus(status: VoiceStatus): void {
    this.status = status
    this.handlers?.onStatusChange(status)
  }

  startListening(): void {
    if (!VoiceService.isSupported()) {
      this.handlers?.onError('Speech recognition is not supported in this browser')
      return
    }

    if (this.status === 'listening') return

    try {
      const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition
      this.recognition = new SpeechRecognitionAPI()
      this.recognition.continuous = true
      this.recognition.interimResults = true
      this.recognition.lang = 'en-US'

      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interim = ''
        let final = ''

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i]
          if (result.isFinal) {
            final += result[0].transcript
          } else {
            interim += result[0].transcript
          }
        }

        if (final) {
          this.handlers?.onTranscript(final, true)
        }
        if (interim) {
          this.handlers?.onTranscript(interim, false)
        }
      }

      this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        if (event.error === 'no-speech') return
        if (event.error === 'aborted') return
        this.setStatus('error')
        this.handlers?.onError(`Recognition error: ${event.error}`)
      }

      this.recognition.onend = () => {
        if (this.status === 'listening') {
          this.setStatus('idle')
        }
      }

      this.recognition.start()
      this.setStatus('listening')
    } catch (err) {
      this.setStatus('error')
      this.handlers?.onError(err instanceof Error ? err.message : 'Failed to start speech recognition')
    }
  }

  stopListening(): string | null {
    if (this.recognition && this.status === 'listening') {
      try {
        this.recognition.stop()
      } catch { }
    }
    const prevStatus = this.status
    this.setStatus('idle')
    return prevStatus === 'listening' ? 'stopped' : null
  }

  speak(text: string): Promise<void> {
    return new Promise((resolve) => {
      if (!VoiceService.isSynthesisSupported()) {
        this.handlers?.onError('Speech synthesis is not supported in this browser')
        resolve()
        return
      }

      window.speechSynthesis.cancel()

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'en-GB'
      utterance.rate = 0.9
      utterance.pitch = 1.0
      utterance.volume = 1.0

      const voices = window.speechSynthesis.getVoices()
      const preferred = voices.find(
        v => v.lang.startsWith('en-GB') && v.name.includes('Female')
      ) || voices.find(
        v => v.lang.startsWith('en-GB')
      ) || voices.find(
        v => v.lang.startsWith('en')
      )
      if (preferred) utterance.voice = preferred

      this.setStatus('speaking')

      utterance.onend = () => {
        this.setStatus('idle')
        resolve()
      }

      utterance.onerror = () => {
        this.setStatus('idle')
        resolve()
      }

      window.speechSynthesis.speak(utterance)
    })
  }

  cancel(): void {
    if (this.recognition && this.status === 'listening') {
      try {
        this.recognition.abort()
      } catch { }
    }
    if (VoiceService.isSynthesisSupported()) {
      window.speechSynthesis.cancel()
    }
    this.setStatus('idle')
  }

  destroy(): void {
    this.cancel()
    this.recognition = null
    this.handlers = null
  }
}
