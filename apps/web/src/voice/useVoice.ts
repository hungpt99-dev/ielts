import { useContext } from 'react'
import { VoiceContext } from './VoiceProvider'
import type { VoiceContextValue } from './types'

export function useVoice(): VoiceContextValue {
  const context = useContext(VoiceContext)
  if (!context) {
    throw new Error('useVoice must be used within a VoiceProvider')
  }
  return context
}
