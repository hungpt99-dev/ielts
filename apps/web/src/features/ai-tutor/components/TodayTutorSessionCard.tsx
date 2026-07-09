import type { TutorSession } from '../types/aiTutor.types'
import { IconPlay, IconClock } from '@ielts/ui'

interface TodayTutorSessionCardProps {
  session: TutorSession
  onStartSession: () => void
  onViewDetails: () => void
  streak?: number
  todayUnfinished?: number
}

export default function TodayTutorSessionCard({
  session, onStartSession, onViewDetails, streak, todayUnfinished,
}: TodayTutorSessionCardProps) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        backgroundColor: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--color-tutor-accent)' }}>
              {session.focus}
            </p>
            {todayUnfinished && todayUnfinished > 0 && (
              <span
                className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                style={{ backgroundColor: 'var(--color-warning-light, #fef3c7)', color: 'var(--color-warning, #d97706)' }}
              >
                {todayUnfinished} pending
              </span>
            )}
          </div>
          <h3 className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>
            {session.lessonTitle}
          </h3>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {session.reason}
          </p>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex items-center gap-1">
              <IconClock size={12} style={{ color: 'var(--color-muted)' }} />
              <span className="text-xs" style={{ color: 'var(--color-muted)' }}>{session.estimatedTime}</span>
            </div>
            {streak && streak > 0 && (
              <span className="text-xs" style={{ color: 'var(--color-muted)' }}>
                Streak: {streak}d
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onStartSession}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white transition-all hover:brightness-110"
          style={{ backgroundColor: 'var(--color-primary)' }}
          aria-label="Start session"
        >
          <IconPlay size={18} />
        </button>
      </div>
      <button
        onClick={onViewDetails}
        className="mt-3 text-xs font-medium transition-colors hover:opacity-80"
        style={{ color: 'var(--color-tutor-accent)', background: 'none', border: 'none', cursor: 'pointer' }}
      >
        View details &rarr;
      </button>
    </div>
  )
}
