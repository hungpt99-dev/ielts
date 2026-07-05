export interface SpeakOptions {
  rate?: number
  pitch?: number
  volume?: number
  lang?: string
  onStart?: () => void
  onEnd?: () => void
  onError?: (error: string) => void
}

export function speakText(text: string, options: SpeakOptions = {}): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    console.warn('[textToSpeech] Speech synthesis not available')
    return
  }

  window.speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = options.lang ?? 'en-US'
  utterance.rate = options.rate ?? 0.85
  utterance.pitch = options.pitch ?? 1
  utterance.volume = options.volume ?? 1

  utterance.onstart = () => options.onStart?.()
  utterance.onend = () => options.onEnd?.()
  utterance.onerror = (e) => {
    console.warn('[textToSpeech] Error:', e.error)
    options.onError?.(e.error)
  }

  window.speechSynthesis.speak(utterance)
}

export function stopSpeaking(): void {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel()
  }
}

export function isSpeaking(): boolean {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    return window.speechSynthesis.speaking
  }
  return false
}
