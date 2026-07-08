import type { OnboardingProfile, StudyDay } from '../../types'
import { INTENSITY_OPTIONS, STUDY_DAY_LABELS } from '../../types'
import type { StepErrors } from '../../validation'

interface ReviewStepProps {
  profile: OnboardingProfile
  errors: StepErrors
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--spacing-xs) 0', borderBottom: '1px solid var(--color-border-light)' }}>
      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{label}</span>
      <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text)', textAlign: 'right' }}>{value}</span>
    </div>
  )
}

export default function ReviewStep({ profile }: ReviewStepProps) {
  const intensityLabel = INTENSITY_OPTIONS.find(i => i.value === profile.intensity)?.label || profile.intensity
  const dayLabels = profile.preferredSchedule.map(d => STUDY_DAY_LABELS[d as StudyDay]?.slice(0, 3)).join(', ')

  return (
    <div className="space-y-4">
      <div style={{ padding: 'var(--spacing-md)', borderRadius: 'var(--radius-xl)', background: 'var(--color-surface-alt)' }}>
        <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-bold)', color: 'var(--color-text)', marginBottom: 'var(--spacing-sm)' }}>
          Your IELTS Profile
        </p>

        <Row label="Target Band" value={profile.targetBand > 0 ? profile.targetBand.toFixed(1) : 'Not set'} />
        <Row label="Current Level" value={profile.currentLevelKnown && profile.currentBand > 0 ? profile.currentBand.toFixed(1) : 'To be estimated'} />
        <Row label="Exam Date" value={profile.hasExamDate && profile.examDate ? new Date(profile.examDate).toLocaleDateString() : 'Not set'} />
        <Row label="Study Intensity" value={intensityLabel} />
        <Row label="Study Days" value={`${profile.preferredSchedule.length} days (${dayLabels})`} />
        <Row label="Weekly Total" value={`~${profile.studyMinutesPerDay * profile.preferredSchedule.length} min`} />
        <Row label="Weak Skills" value={profile.weakSkills.length > 0 ? profile.weakSkills.join(', ') : 'None selected'} />
        <Row label="Language" value={profile.preferredLanguage === 'en' ? 'English' : profile.preferredLanguage} />
        <Row label="AI Personalization" value={profile.aiTutorPersonalizationEnabled ? 'Enabled' : 'Disabled'} />
        <Row label="Proactive Tutor" value={profile.proactiveTutorEnabled ? 'Enabled' : 'Disabled'} />
      </div>

      {!profile.aiTutorPersonalizationEnabled && (
        <div style={{
          padding: 'var(--spacing-sm) var(--spacing-md)',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--color-info-light)',
          fontSize: 'var(--text-xs)',
          color: 'var(--color-info-dark)',
          lineHeight: 'var(--leading-relaxed)',
        }}>
          You can enable AI Tutor personalization anytime in Settings.
        </div>
      )}

      {profile.proactiveTutorEnabled && (
        <div style={{
          padding: 'var(--spacing-sm) var(--spacing-md)',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--color-tutor-background)',
          fontSize: 'var(--text-xs)',
          color: 'var(--color-tutor-text)',
          lineHeight: 'var(--leading-relaxed)',
        }}>
          AI Tutor will send helpful study suggestions based on your activity.
        </div>
      )}

      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)', textAlign: 'center' }}>
        Your data stays on your device · No account needed
      </p>
    </div>
  )
}
