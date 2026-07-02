import type { QuickAction } from '../types'

interface QuickActionsProps {
  actions: QuickAction[]
  onAction: (type: string) => void
}

export function QuickActions({ actions, onAction }: QuickActionsProps) {
  if (actions.length === 0) return null

  return (
    <div className="flex shrink-0 flex-wrap gap-1.5 px-4 py-3">
      {actions.map((action) => (
        <button
          key={action.type}
          onClick={() => onAction(action.type)}
          className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors hover:opacity-80"
          style={{
            backgroundColor: 'var(--color-primary-light)',
            color: 'var(--color-primary)',
          }}
          type="button"
        >
          <span aria-hidden="true">{action.icon}</span>
          {action.label}
        </button>
      ))}
    </div>
  )
}
