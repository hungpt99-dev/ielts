import type { OnboardingProfile } from '../../types'
import { BAND_OPTIONS } from '../../types'
import type { StepErrors } from '../../validation'

interface IeltsGoalStepProps {
  profile: OnboardingProfile
  update: (patch: Partial<OnboardingProfile>) => void
  errors: StepErrors
}

export default function IeltsGoalStep({ profile, update, errors }: IeltsGoalStepProps) {
  return (
    <div className="space-y-4">
      <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-xs)' }}>
        Target overall band
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))', gap: 'var(--spacing-xs)' }}>
        {BAND_OPTIONS.filter(b => b >= 4).map(band => {
          const isSelected = profile.targetBand === band
          return (
            <button
              key={band}
              type="button"
              onClick={() => update({ targetBand: band })}
              style={{
                padding: 'var(--spacing-sm)',
                borderRadius: 'var(--radius-lg)',
                border: `2px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                background: isSelected ? 'var(--color-primary-light)' : 'var(--color-surface)',
                cursor: 'pointer',
                fontFamily: 'var(--font-sans)',
                textAlign: 'center',
                fontWeight: isSelected ? 'var(--weight-bold)' : 'var(--weight-medium)',
                color: isSelected ? 'var(--color-primary-dark)' : 'var(--color-text)',
                fontSize: 'var(--text-base)',
                transition: 'all var(--transition-fast)',
                minHeight: '48px',
              }}
              aria-pressed={isSelected}
            >
              {band.toFixed(1)}
            </button>
          )
        })}
      </div>
      {errors.targetBand && (
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-danger)', textAlign: 'center' }}>{errors.targetBand}</p>
      )}
    </div>
  )
}
