import type { ActivityItem } from '../types/aiTutor.types'
import { IconPlay } from '@ielts/ui'

interface RecentTeacherActivityCardProps {
  activities: ActivityItem[]
  onStartLesson: () => void
}

function formatTimestamp(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 60000) return 'Just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
  return `${Math.floor(diff / 86400000)}d ago`
}

export default function RecentTeacherActivityCard({ activities, onStartLesson }: RecentTeacherActivityCardProps) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      }}
    >
      <h2 className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
        Recent Activity
      </h2>
      {activities.length > 0 ? (
        <div className="mt-3 space-y-1">
          {activities.map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-lg px-2 py-1.5">
              <p className="truncate text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                {a.label}
              </p>
              <span className="shrink-0 text-[10px]" style={{ color: 'var(--color-muted)' }}>
                {formatTimestamp(a.timestamp)}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-3">
          <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
            No recent activity yet. Start a lesson to track your progress.
          </p>
          <button
            onClick={onStartLesson}
            className="mt-2 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition-all hover:brightness-110"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            <IconPlay size={12} />
            Start Lesson
          </button>
        </div>
      )}
    </div>
  )
}
