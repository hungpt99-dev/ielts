import type { OnboardingProfile } from '../../types'
import type { StepErrors } from '../../validation'

interface AiTutorSetupStepProps {
  profile: OnboardingProfile
  update: (patch: Partial<OnboardingProfile>) => void
  errors: StepErrors
}

const CAPABILITIES = [
  'Study plan guidance',
  'Vocabulary explanation',
  'Writing feedback',
  'Speaking practice',
  'Mistake review',
  'Progress review',
  'Daily recommendations',
  'Proactive learning reminders',
]

export default function AiTutorSetupStep({ profile, update }: AiTutorSetupStepProps) {
  return (
    <div className="space-y-5">
      <div style={{
        padding: 'var(--spacing-md)',
        borderRadius: 'var(--radius-xl)',
        background: 'var(--color-tutor-background)',
        border: '1px solid var(--color-tutor-border)',
      }}>
        <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-tutor-text)', margin: 0 }}>
          Your AI Tutor is a personal IELTS tutor that knows your goals, weak areas, and progress.
        </p>
      </div>

      <div>
        <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-xs)' }}>
          What AI Tutor can help with:
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-xs)' }}>
          {CAPABILITIES.map(cap => (
            <div
              key={cap}
              style={{
                padding: 'var(--spacing-2xs) var(--spacing-sm)',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--color-surface-alt)',
                fontSize: 'var(--text-xs)',
                color: 'var(--color-text)',
                display: 'flex', alignItems: 'center', gap: 'var(--spacing-2xs)',
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--color-primary)"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
              {cap}
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          padding: 'var(--spacing-md)',
          borderRadius: 'var(--radius-xl)',
          border: `2px solid ${profile.aiTutorPersonalizationEnabled ? 'var(--color-tutor-accent)' : 'var(--color-border)'}`,
          background: profile.aiTutorPersonalizationEnabled ? 'var(--color-tutor-accent-light)' : 'var(--color-surface)',
          cursor: 'pointer',
        }}
        onClick={() => update({ aiTutorPersonalizationEnabled: !profile.aiTutorPersonalizationEnabled })}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); update({ aiTutorPersonalizationEnabled: !profile.aiTutorPersonalizationEnabled }) } }}
        aria-pressed={profile.aiTutorPersonalizationEnabled}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
          <div style={{
            width: '20px', height: '20px',
            borderRadius: 'var(--radius-full)',
            border: `2px solid ${profile.aiTutorPersonalizationEnabled ? 'var(--color-tutor-accent)' : 'var(--color-border)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: profile.aiTutorPersonalizationEnabled ? 'var(--color-tutor-accent)' : 'transparent',
            flexShrink: 0,
          }}>
            {profile.aiTutorPersonalizationEnabled && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
            )}
          </div>
          <div>
            <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-tutor-text)', margin: 0 }}>
              Enable AI Tutor personalization
            </p>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 'var(--spacing-2xs) 0 0' }}>
              AI Tutor will use your profile to give personalized guidance
            </p>
          </div>
        </div>
      </div>

      <div
        style={{
          padding: 'var(--spacing-md)',
          borderRadius: 'var(--radius-xl)',
          border: `2px solid ${profile.proactiveTutorEnabled ? 'var(--color-tutor-accent)' : 'var(--color-border)'}`,
          background: profile.proactiveTutorEnabled ? 'var(--color-tutor-accent-light)' : 'var(--color-surface)',
          cursor: 'pointer',
        }}
        onClick={() => update({ proactiveTutorEnabled: !profile.proactiveTutorEnabled })}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); update({ proactiveTutorEnabled: !profile.proactiveTutorEnabled }) } }}
        aria-pressed={profile.proactiveTutorEnabled}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
          <div style={{
            width: '20px', height: '20px',
            borderRadius: 'var(--radius-full)',
            border: `2px solid ${profile.proactiveTutorEnabled ? 'var(--color-tutor-accent)' : 'var(--color-border)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: profile.proactiveTutorEnabled ? 'var(--color-tutor-accent)' : 'transparent',
            flexShrink: 0,
          }}>
            {profile.proactiveTutorEnabled && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
            )}
          </div>
          <div>
            <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-tutor-text)', margin: 0 }}>
              Enable proactive AI Tutor messages
            </p>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 'var(--spacing-2xs) 0 0' }}>
              AI Tutor can send helpful study suggestions based on your activity
            </p>
          </div>
        </div>
      </div>

      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-muted)', textAlign: 'center' }}>
        You can configure your AI provider later in Settings
      </p>
    </div>
  )
}
