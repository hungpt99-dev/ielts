import { IconAITutor, IconStreak } from '@ielts/ui'

interface TeacherPageHeaderProps {
  streak?: number
  bandInfo?: string
  examCountdown?: number
}

export default function TeacherPageHeader({ streak, bandInfo, examCountdown }: TeacherPageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl"
          style={{ backgroundColor: 'var(--color-tutor-accent-light)' }}
        >
          <IconAITutor size={22} style={{ color: 'var(--color-tutor-accent)' }} />
        </div>
        <div>
          <h1 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
            AI Tutor
          </h1>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            {bandInfo || 'Your personal IELTS teacher'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {streak > 0 && (
          <div className="flex items-center gap-1 rounded-lg px-2.5 py-1.5" style={{ backgroundColor: 'var(--color-surface-alt)' }}>
            <IconStreak size={14} style={{ color: 'var(--color-warning)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>{streak}d</span>
          </div>
        )}
        {examCountdown !== undefined && examCountdown > 0 && (
          <div
            className="rounded-lg px-2.5 py-1.5"
            style={{
              backgroundColor: examCountdown <= 30 ? 'var(--color-danger-light)' : 'var(--color-surface-alt)',
            }}
          >
            <span className="text-xs font-medium" style={{
              color: examCountdown <= 30 ? 'var(--color-danger)' : 'var(--color-text-secondary)',
            }}>
              {examCountdown <= 30 ? `${examCountdown}d until exam` : `Exam: ${examCountdown}d`}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
