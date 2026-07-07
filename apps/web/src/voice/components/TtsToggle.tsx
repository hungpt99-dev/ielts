import { useVoice } from '../useVoice'

export default function TtsToggle({ buttonHeight = 40 }: { buttonHeight?: number }) {
  const { ttsEnabled, setTtsEnabled, isSpeechSupported } = useVoice()

  if (!isSpeechSupported) return null

  return (
    <button
      onClick={() => setTtsEnabled(!ttsEnabled)}
      title={ttsEnabled ? 'AI voice on' : 'AI voice off'}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: `${buttonHeight}px`,
        height: `${buttonHeight}px`,
        borderRadius: '12px',
        border: 'none',
        cursor: 'pointer',
        background: ttsEnabled ? 'var(--color-tutor-accent)' : 'var(--color-surface-alt)',
        color: ttsEnabled ? 'var(--color-on-primary)' : 'var(--color-muted)',
        transition: 'all 0.2s ease',
        flexShrink: 0,
        outline: 'none',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = ttsEnabled ? 'var(--color-tutor-accent)' : 'var(--color-border)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = ttsEnabled ? 'var(--color-tutor-accent)' : 'var(--color-surface-alt)'
      }}
      aria-label={ttsEnabled ? 'Disable AI voice' : 'Enable AI voice'}
    >
      <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        {ttsEnabled ? (
          <>
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          </>
        ) : (
          <>
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </>
        )}
      </svg>
    </button>
  )
}
