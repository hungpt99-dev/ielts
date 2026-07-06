import { useVoice } from '../useVoice'

export default function RecordingIndicator() {
  const { state } = useVoice()
  const isRecording = state.status === 'listening' || state.status === 'speaking'

  if (!isRecording) return null

  return (
    <div
      className="flex items-center gap-2 rounded-xl px-3 py-1.5"
      style={{
        backgroundColor: state.status === 'listening' ? 'var(--color-danger-light)' : 'var(--color-tutor-background)',
      }}
    >
      <span
        className="relative flex h-2.5 w-2.5"
      >
        <span
          className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
          style={{
            backgroundColor: state.status === 'listening' ? 'var(--color-danger)' : 'var(--color-tutor-accent)',
          }}
        />
        <span
          className="relative inline-flex h-2.5 w-2.5 rounded-full"
          style={{
            backgroundColor: state.status === 'listening' ? 'var(--color-danger)' : 'var(--color-tutor-accent)',
          }}
        />
      </span>
      <span
        className="text-[11px] font-medium"
        style={{
          color: state.status === 'listening' ? 'var(--color-danger)' : 'var(--color-tutor-accent)',
        }}
      >
        {state.status === 'listening' ? 'Recording...' : 'Speaking...'}
      </span>
    </div>
  )
}
