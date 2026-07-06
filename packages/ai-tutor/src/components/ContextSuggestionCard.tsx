import type { ContextSuggestion } from '../types'
import { IconExplain, IconClose } from '../../../ui/src/icons/IconMap'

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
      className="mx-4 w-full max-w-xs rounded-xl border p-3 text-left text-xs"
      style={{
        borderColor: 'var(--color-tutor-border)',
        backgroundColor: 'var(--color-tutor-background)',
        boxShadow: 'var(--shadow-tutor)',
        animation: 'chat-fade-in 0.3s ease-out',
      }}
    >
      <div className="mb-1.5 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className="flex h-6 w-6 items-center justify-center rounded-full text-[10px]"
            style={{ backgroundColor: 'var(--color-tutor-accent-light)', color: 'var(--color-tutor-accent)' }}
          >
            <IconExplain size={12} />
          </span>
          <p className="text-xs font-semibold" style={{ color: 'var(--color-tutor-text)' }}>
            {suggestion.title}
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] transition-colors hover:opacity-70"
          style={{ color: 'var(--color-muted)' }}
          aria-label="Dismiss suggestion"
        >
          <IconClose size={12} />
        </button>
      </div>
      <p className="mb-2 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
        {suggestion.message}
      </p>
      <button
        onClick={onAction}
        className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors hover:opacity-80"
        style={{
          backgroundColor: 'var(--color-tutor-accent)',
          color: 'var(--color-on-primary)',
        }}
        type="button"
      >
        {suggestion.actionLabel}
      </button>
    </div>
  )
}
