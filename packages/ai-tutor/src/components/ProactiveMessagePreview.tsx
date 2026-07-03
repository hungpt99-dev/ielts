import type { ProactiveMessage } from '../types'

interface ProactiveMessagePreviewProps {
  message: ProactiveMessage
  onDismiss: () => void
  onAction: () => void
  onSnooze?: () => void
}

export function ProactiveMessagePreview({
  message,
  onDismiss,
  onAction,
  onSnooze,
}: ProactiveMessagePreviewProps) {
  return (
    <div
      className="rounded-xl border p-3 text-xs transition-all hover:opacity-90"
      style={{
        borderColor: message.priority === 'high' ? 'var(--color-warning)' : 'var(--color-border)',
        backgroundColor:
          message.priority === 'high'
            ? 'color-mix(in srgb, var(--color-warning) 8%, transparent)'
            : 'var(--color-surface-alt)',
        animation: 'chat-fade-in 0.3s ease-out',
      }}
    >
      <div className="mb-1 flex items-start justify-between gap-2">
        <p className="font-medium leading-tight" style={{ color: 'var(--color-text)' }}>
          {message.title}
        </p>
        <div className="flex shrink-0 gap-1">
          {onSnooze && (
            <button
              onClick={onSnooze}
              className="flex h-5 w-5 items-center justify-center rounded text-[10px] transition-colors hover:opacity-70"
              style={{ color: 'var(--color-muted)' }}
              aria-label="Snooze"
              title="Snooze 1 hour"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          )}
          <button
            onClick={onDismiss}
            className="flex h-5 w-5 items-center justify-center rounded text-[10px] transition-colors hover:opacity-70"
            style={{ color: 'var(--color-muted)' }}
            aria-label="Dismiss"
            title="Dismiss"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      <p className="mb-2 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
        {message.message}
      </p>
      {message.action && (
        <button
          onClick={onAction}
          className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors hover:opacity-80"
          style={{
            backgroundColor: 'var(--color-primary)',
            color: 'var(--color-on-primary)',
          }}
          type="button"
        >
          {message.action.label}
        </button>
      )}
    </div>
  )
}
