interface TeacherActionCardProps {
  icon: React.ReactNode
  title: string
  description: string
  actionLabel: string
  onAction: () => void
}

export default function TeacherActionCard({ icon, title, description, actionLabel, onAction }: TeacherActionCardProps) {
  return (
    <div
      className="flex items-center gap-3 rounded-xl p-3 transition-colors hover:opacity-90"
      style={{ backgroundColor: 'var(--color-surface-alt)' }}
    >
      <div className="shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{title}</p>
        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{description}</p>
      </div>
      <button
        onClick={onAction}
        className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-all hover:brightness-110"
        style={{ backgroundColor: 'var(--color-primary)' }}
      >
        {actionLabel}
      </button>
    </div>
  )
}
