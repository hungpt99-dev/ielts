import type { TeacherAdviceItem } from '../types/aiTutor.types'
import { IconTarget, IconGrammar, IconVocabulary, IconSpeaking } from '@ielts/ui'

const ICON_MAP: Record<string, React.ReactNode> = {
  target: <IconTarget size={16} />,
  grammar: <IconGrammar size={16} />,
  vocabulary: <IconVocabulary size={16} />,
  speaking: <IconSpeaking size={16} />,
}

interface TeacherAdviceCardProps {
  item: TeacherAdviceItem
  onAction: (key: string) => void
}

export default function TeacherAdviceCard({ item, onAction }: TeacherAdviceCardProps) {
  return (
    <div
      className="flex items-start gap-3 rounded-xl p-3 transition-colors hover:opacity-90"
      style={{ backgroundColor: 'var(--color-surface-alt)' }}
    >
      <div className="mt-0.5 shrink-0" style={{ color: 'var(--color-tutor-accent)' }}>
        {ICON_MAP[item.iconName] ?? <IconTarget size={16} />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{item.title}</p>
        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{item.description}</p>
      </div>
      <button
        onClick={() => onAction(item.key)}
        className="shrink-0 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors hover:opacity-80"
        style={{
          backgroundColor: 'var(--color-primary)',
          color: 'var(--color-on-primary, #fff)',
        }}
      >
        {item.actionLabel}
      </button>
    </div>
  )
}
