import { useRef, useEffect } from 'react'
import { useVoice } from '../useVoice'

interface VoiceButtonProps {
  onTranscript?: (text: string) => void
  disabled?: boolean
  size?: number
  buttonHeight?: number
}

export default function VoiceButton({ onTranscript, disabled, size = 20, buttonHeight = 44 }: VoiceButtonProps) {
  const { state, startListening, stopListening, cancel, isSpeechSupported } = useVoice()
  const prevStatusRef = useRef(state.status)

  useEffect(() => {
    if (state.transcript && prevStatusRef.current === 'listening' && state.status === 'idle') {
      onTranscript?.(state.transcript)
    }
    prevStatusRef.current = state.status
  }, [state.status, state.transcript, onTranscript])

  if (!isSpeechSupported) return null

  const isActive = state.status === 'listening'
  const isProcessing = state.status === 'processing'
  const isSpeaking = state.status === 'speaking'

  function handleClick() {
    if (isActive || state.status === 'speaking') {
      cancel()
      stopListening()
    } else {
      startListening()
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isProcessing}
      title={
        isActive ? 'Stop listening' :
        isSpeaking ? 'Stop speaking' :
        'Start voice input'
      }
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: `${buttonHeight}px`,
        height: `${buttonHeight}px`,
        borderRadius: '12px',
        border: 'none',
        cursor: disabled || isProcessing ? 'not-allowed' : 'pointer',
        opacity: disabled || isProcessing ? 0.5 : 1,
        background: isActive
          ? 'var(--color-danger)'
          : isSpeaking
            ? 'var(--color-tutor-accent)'
            : 'var(--color-surface-alt)',
        color: isActive || isSpeaking ? 'var(--color-on-primary)' : 'var(--color-muted)',
        transition: 'all 0.2s ease',
        flexShrink: 0,
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = 'var(--color-border)'
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = 'var(--color-surface-alt)'
        }
      }}
      onFocus={(e) => {
        e.currentTarget.style.outline = '2px solid var(--color-primary)'
        e.currentTarget.style.outlineOffset = '2px'
      }}
      onBlur={(e) => {
        e.currentTarget.style.outline = 'none'
      }}
      aria-label={isActive ? 'Stop recording' : 'Start voice input'}
    >
      {isActive ? (
        <MicrophoneIconActive size={size} />
      ) : isSpeaking ? (
        <SpeakerIcon size={size} />
      ) : (
        <MicrophoneIcon size={size} />
      )}
    </button>
  )
}

function MicrophoneIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  )
}

function MicrophoneIconActive({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2" width="6" height="11" rx="3" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  )
}

function SpeakerIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  )
}
