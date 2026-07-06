import { createContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import { VoiceService } from './VoiceService'
import type { VoiceContextValue, VoiceState, VoiceStatus } from './types'

export const VoiceContext = createContext<VoiceContextValue | null>(null)

const initialState: VoiceState = {
  status: 'idle',
  isSupported: VoiceService.isSupported(),
  transcript: '',
  interimTranscript: '',
  error: null,
}

export function VoiceProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<VoiceState>(initialState)
  const [ttsEnabled, setTtsEnabled] = useState(false)
  const serviceRef = useRef<VoiceService | null>(null)
  const service = serviceRef.current ?? new VoiceService()

  if (!serviceRef.current) {
    serviceRef.current = service
  }

  useEffect(() => {
    const s = service
    s.setHandlers({
      onStatusChange: (status: VoiceStatus) => {
        setState(prev => ({ ...prev, status }))
      },
      onTranscript: (text: string, isFinal: boolean) => {
        setState(prev => ({
          ...prev,
          transcript: isFinal ? text : prev.transcript,
          interimTranscript: isFinal ? '' : text,
        }))
      },
      onError: (error: string) => {
        setState(prev => ({ ...prev, error, status: 'error' }))
      },
    })
    return () => {
      s.destroy()
    }
  }, [service])

  const startListening = useCallback(() => {
    setState(prev => ({ ...prev, transcript: '', interimTranscript: '', error: null }))
    service.startListening()
  }, [service])

  const stopListening = useCallback(() => {
    service.stopListening()
  }, [service])

  const speak = useCallback(async (text: string) => {
    await service.speak(text)
  }, [service])

  const cancel = useCallback(() => {
    service.cancel()
    setState(prev => ({ ...prev, status: 'idle' }))
  }, [service])

  return (
      <VoiceContext.Provider
        value={{
          state,
          startListening,
          stopListening,
          speak,
          cancel,
          isSpeechSupported: state.isSupported,
          ttsEnabled,
          setTtsEnabled,
        }}
      >
        {children}
      </VoiceContext.Provider>
  )
}
