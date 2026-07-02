import type { ContextSuggestion } from '../types'

interface ContextSuggestionCardProps {
  suggestion: ContextSuggestion
  onDismiss: () => void
  onAction: () => void
}

export function ContextSuggestionCard({
  suggestion,
  onDismiss,
  onAction,
}: ContextSuggestionCardProps) {
  return (
    <div
      className="mx-4 mt-2 w-full max-w-xs rounded-xl border p-3 text-left text-xs"
      style={{
        borderColor: 'var(--color-primary-light)',
        backgroundColor: 'color-mix(in srgb, var(--color-primary) 6%, transparent)',
        animation: 'chat-fade-in 0.3s ease-out',
      }}
    >
      <div className="mb-1.5 flex items-start justify-between gap-2">
        <p className="text-xs font-semibold" style={{ color: 'var(--color-text)' }}>
          {suggestion.title}
        </p>
        <button
          onClick={onDismiss}
          className="flex h-4 w-4 shrink-0 items-center justify-center rounded text-[10px] transition-colors hover:opacity-70"
          style={{ color: 'var(--color-muted)' }}
          aria-label="Dismiss suggestion"
        >
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <p className="mb-2 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
        {suggestion.message}
      </p>
      <button
        onClick={onAction}
        className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors hover:opacity-80"
        style={{
          backgroundColor: 'var(--color-primary)',
          color: '#fff',
        }}
        type="button"
      >
        {suggestion.actionLabel}
      </button>
    </div>
  )
}
