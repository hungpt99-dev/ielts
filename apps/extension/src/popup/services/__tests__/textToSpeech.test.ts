import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { speakText, stopSpeaking, isSpeaking } from '../textToSpeech'

function createMockSpeechSynthesis() {
  let speaking = false
  let currentUtterance: Record<string, unknown> | null = null
  const onStartCallbacks: Array<() => void> = []
  const onEndCallbacks: Array<() => void> = []

  const mock: Record<string, unknown> = {
    get speaking() { return speaking },
    pending: false,
    paused: false,
    onvoiceschanged: null,

    speak: vi.fn((utterance: Record<string, unknown>) => {
      speaking = true
      currentUtterance = utterance
      if (typeof utterance.onstart === 'function') {
        onStartCallbacks.push(utterance.onstart as () => void)
        utterance.onstart()
      }
    }),

    cancel: vi.fn(() => {
      speaking = false
      if (currentUtterance && typeof currentUtterance.onend === 'function') {
        onEndCallbacks.push(currentUtterance.onend as () => void)
        ;(currentUtterance.onend as () => void)()
      }
      currentUtterance = null
    }),

    pause: vi.fn(),
    resume: vi.fn(),
    getVoices: vi.fn(() => []),
  }

  return mock
}

beforeEach(() => {
  const mockSpeech = createMockSpeechSynthesis()

  Object.defineProperty(window, 'speechSynthesis', {
    value: mockSpeech,
    writable: true,
    configurable: true,
  })

  vi.stubGlobal('SpeechSynthesisUtterance', vi.fn((text: string) => ({
    text,
    lang: 'en-US',
    rate: 0.85,
    pitch: 1,
    volume: 1,
    onstart: null,
    onend: null,
    onerror: null,
  })))
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('speakText', () => {
  it('cancels any ongoing speech before speaking', () => {
    speakText('hello')
    expect(window.speechSynthesis.cancel).toHaveBeenCalled()
    expect(window.speechSynthesis.speak).toHaveBeenCalled()
  })

  it('creates utterance with correct text and default options', () => {
    speakText('hello world')
    expect(window.speechSynthesis.speak).toHaveBeenCalledOnce()

    const utterance = (window.speechSynthesis.speak as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as Record<string, unknown>
    expect(utterance.text).toBe('hello world')
    expect(utterance.lang).toBe('en-US')
    expect(utterance.rate).toBe(0.85)
    expect(utterance.pitch).toBe(1)
    expect(utterance.volume).toBe(1)
  })

  it('accepts custom speak options', () => {
    speakText('hello', { rate: 1.5, pitch: 1.2, lang: 'en-GB' })
    const utterance = (window.speechSynthesis.speak as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as Record<string, unknown>
    expect(utterance.rate).toBe(1.5)
    expect(utterance.pitch).toBe(1.2)
    expect(utterance.lang).toBe('en-GB')
  })

  it('calls onStart and onEnd callbacks', () => {
    const onStart = vi.fn()
    const onEnd = vi.fn()

    speakText('hello', { onStart, onEnd })

    expect(onStart).toHaveBeenCalledOnce()

    window.speechSynthesis.cancel()
    expect(onEnd).toHaveBeenCalledOnce()
  })

  it('calls onError callback when speech errors', () => {
    const onError = vi.fn()

    speakText('hello', { onError })

    const utterance = (window.speechSynthesis.speak as ReturnType<typeof vi.fn>).mock
      .calls[0][0] as Record<string, unknown>

    const errorEvent = { error: 'synthesis-failed' }
    ;(utterance.onerror as (e: typeof errorEvent) => void)?.(errorEvent)
    expect(onError).toHaveBeenCalledWith('synthesis-failed')
  })

  it('does nothing when speechSynthesis is not available', () => {
    Object.defineProperty(window, 'speechSynthesis', { value: undefined, configurable: true })

    expect(() => speakText('hello')).not.toThrow()
  })
})

describe('stopSpeaking', () => {
  it('cancels speech synthesis', () => {
    const cancelSpy = vi.fn()
    Object.defineProperty(window, 'speechSynthesis', {
      value: { cancel: cancelSpy },
      writable: true,
      configurable: true,
    })

    stopSpeaking()
    expect(cancelSpy).toHaveBeenCalled()
  })

  it('does not throw when speechSynthesis is not available', () => {
    Object.defineProperty(window, 'speechSynthesis', { value: undefined, configurable: true })
    expect(() => stopSpeaking()).not.toThrow()
  })
})

describe('isSpeaking', () => {
  it('returns true when speaking', () => {
    const mockSpeech = { speaking: true, cancel: vi.fn() }
    Object.defineProperty(window, 'speechSynthesis', {
      value: mockSpeech,
      writable: true,
      configurable: true,
    })

    expect(isSpeaking()).toBe(true)
  })

  it('returns false when not speaking', () => {
    const mockSpeech = { speaking: false, cancel: vi.fn() }
    Object.defineProperty(window, 'speechSynthesis', {
      value: mockSpeech,
      writable: true,
      configurable: true,
    })

    expect(isSpeaking()).toBe(false)
  })

  it('returns false when speechSynthesis is not available', () => {
    Object.defineProperty(window, 'speechSynthesis', { value: undefined, configurable: true })
    expect(isSpeaking()).toBe(false)
  })
})
