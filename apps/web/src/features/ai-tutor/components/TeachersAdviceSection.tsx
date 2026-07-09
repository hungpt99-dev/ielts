import type { TeacherAdviceItem } from '../types/aiTutor.types'
import TeacherAdviceCard from './TeacherAdviceCard'

interface TeachersAdviceSectionProps {
  items: TeacherAdviceItem[]
  onAction: (key: string) => void
}

export default function TeachersAdviceSection({ items, onAction }: TeachersAdviceSectionProps) {
  if (items.length === 0) return null

  return (
    <div
      className="rounded-2xl p-5"
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      }}
    >
      <h2 className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>
        Teacher's Advice
      </h2>
      <p className="mt-0.5 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        Personalized recommendations from your AI Teacher.
      </p>
      <div className="mt-4 space-y-2">
        {items.map((item) => (
          <TeacherAdviceCard key={item.key} item={item} onAction={onAction} />
        ))}
      </div>
    </div>
  )
}
