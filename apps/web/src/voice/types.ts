export type VoiceStatus = 'idle' | 'listening' | 'processing' | 'speaking' | 'unsupported' | 'error'

export interface VoiceState {
  status: VoiceStatus
  isSupported: boolean
  transcript: string
  interimTranscript: string
  error: string | null
}

export interface VoiceContextValue {
  state: VoiceState
  startListening: () => void
  stopListening: () => void
  speak: (text: string) => Promise<void>
  cancel: () => void
  isSpeechSupported: boolean
  ttsEnabled: boolean
  setTtsEnabled: (enabled: boolean) => void
}
