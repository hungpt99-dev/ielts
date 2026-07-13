import { type ReactNode } from 'react'
import type { QuickAction } from '@ielts/ai-tutor-engine'
import { IconVocabulary, IconTarget, IconWriting, IconExplain, IconTimer } from '@ielts/ui'

const ACTION_ICONS: Record<string, ReactNode> = {
  '📚': <IconVocabulary size={12} />,
  '🧠': <IconExplain size={12} />,
  '🎯': <IconTarget size={12} />,
  '✍️': <IconWriting size={12} />,
  '💡': <IconExplain size={12} />,
  '⏰': <IconTimer size={12} />,
}

interface QuickActionsProps {
  actions: QuickAction[]
  onAction: (type: string) => void
}

export function QuickActions({ actions, onAction }: QuickActionsProps) {
  if (actions.length === 0) return null

  return (
    <div className="flex shrink-0 flex-nowrap gap-1.5">
      {actions.map((action) => (
        <button
          key={action.type}
          onClick={() => onAction(action.type)}
          className="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors hover:opacity-80"
          style={{
            backgroundColor: 'var(--color-primary-light)',
            color: 'var(--color-primary)',
            border: '1px solid var(--color-border)',
          }}
          type="button"
        >
          <span aria-hidden="true">{ACTION_ICONS[action.icon] ?? action.icon}</span>
          {action.label}
        </button>
      ))}
    </div>
  )
}
