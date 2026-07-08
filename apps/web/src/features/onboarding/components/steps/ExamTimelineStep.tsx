import type { OnboardingProfile } from '../../types'
import type { StepErrors } from '../../validation'

interface ExamTimelineStepProps {
  profile: OnboardingProfile
  update: (patch: Partial<OnboardingProfile>) => void
  errors: StepErrors
}

export default function ExamTimelineStep({ profile, update, errors }: ExamTimelineStepProps) {
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const examDateObj = profile.examDate ? new Date(profile.examDate) : null
  const daysUntilExam = examDateObj ? Math.ceil((examDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null

  const quickOptions = [
    { label: '1 month', days: 30 },
    { label: '3 months', days: 90 },
    { label: '6 months', days: 180 },
  ]

  function setQuickDate(daysFromNow: number) {
    const d = new Date(today)
    d.setDate(d.getDate() + daysFromNow)
    update({ examDate: d.toISOString().split('T')[0], hasExamDate: true })
  }

  return (
    <div className="space-y-5">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-xs)' }}>
        {quickOptions.map(opt => (
          <button
            key={opt.days}
            type="button"
            onClick={() => setQuickDate(opt.days)}
            style={{
              padding: 'var(--spacing-xs) var(--spacing-md)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              cursor: 'pointer',
              fontFamily: 'var(--font-sans)',
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--weight-medium)',
              color: 'var(--color-text)',
              transition: 'all var(--transition-fast)',
              flex: 1, minWidth: '80px', textAlign: 'center',
            }}
          >
            {opt.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => update({ examDate: '', hasExamDate: false })}
          style={{
            padding: 'var(--spacing-xs) var(--spacing-md)',
            borderRadius: 'var(--radius-lg)',
            border: `1px solid ${!profile.hasExamDate ? 'var(--color-primary)' : 'var(--color-border)'}`,
            background: !profile.hasExamDate ? 'var(--color-primary-light)' : 'var(--color-surface)',
            cursor: 'pointer',
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--weight-medium)',
            color: !profile.hasExamDate ? 'var(--color-primary-dark)' : 'var(--color-text-secondary)',
            transition: 'all var(--transition-fast)',
            flex: 1, minWidth: '80px', textAlign: 'center',
          }}
        >
          Not sure yet
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
        <label style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text-secondary)' }}>
          Or pick a custom date
        </label>
        <input
          type="date"
          value={profile.examDate}
          onChange={(e) => update({ examDate: e.target.value, hasExamDate: !!e.target.value })}
          min={todayStr}
          style={{
            padding: 'var(--spacing-sm) var(--spacing-md)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            background: 'var(--color-surface)',
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--text-base)',
            color: 'var(--color-text)',
            width: '100%', minHeight: '48px',
          }}
        />
      </div>

      {daysUntilExam && daysUntilExam > 0 && profile.hasExamDate && (
        <div style={{
          padding: 'var(--spacing-md)',
          borderRadius: 'var(--radius-lg)',
          background: daysUntilExam < 30 ? 'var(--color-danger-light)' : daysUntilExam < 90 ? 'var(--color-warning-light)' : 'var(--color-success-light)',
          textAlign: 'center',
        }}>
          <span style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--weight-bold)', color: daysUntilExam < 30 ? 'var(--color-danger-dark)' : daysUntilExam < 90 ? 'var(--color-warning-dark)' : 'var(--color-success-dark)' }}>
            {daysUntilExam} days away
          </span>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: 'var(--spacing-2xs)' }}>
            {daysUntilExam < 30
              ? 'Your exam is soon — focus on high-impact areas'
              : `You have about ${Math.floor(daysUntilExam / 7)} weeks to prepare`}
          </p>
        </div>
      )}

      {!profile.hasExamDate && (
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)', textAlign: 'center' }}>
          No problem — you can set it later and AI will adjust your plan
        </p>
      )}

      {errors.examDate && (
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-danger)', textAlign: 'center' }}>{errors.examDate}</p>
      )}
    </div>
  )
}
