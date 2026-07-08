import type { OnboardingProfile } from '../../types'
import { LANGUAGE_OPTIONS, EXPLANATION_STYLE_OPTIONS, TUTOR_TONE_OPTIONS, CORRECTION_DETAIL_OPTIONS } from '../../types'
import type { StepErrors } from '../../validation'

interface LearningPreferencesStepProps {
  profile: OnboardingProfile
  update: (patch: Partial<OnboardingProfile>) => void
  errors: StepErrors
}

function SelectCard<T extends string>({ value, label, description, isSelected, onSelect }: {
  value: T; label: string; description: string; isSelected: boolean; onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        padding: 'var(--spacing-sm) var(--spacing-md)',
        borderRadius: 'var(--radius-xl)',
        border: `2px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
        background: isSelected ? 'var(--color-primary-light)' : 'var(--color-surface)',
        cursor: 'pointer',
        fontFamily: 'var(--font-sans)',
        textAlign: 'left',
        transition: 'all var(--transition-fast)',
      }}
      aria-pressed={isSelected}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)', margin: 0 }}>{label}</p>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 'var(--spacing-2xs) 0 0' }}>{description}</p>
        </div>
        {isSelected && <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--color-primary)"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>}
      </div>
    </button>
  )
}

export default function LearningPreferencesStep({ profile, update }: LearningPreferencesStepProps) {
  return (
    <div className="space-y-5">
      <div>
        <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-xs)' }}>
          Preferred language
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-xs)' }}>
          {LANGUAGE_OPTIONS.map(lang => {
            const isSelected = profile.preferredLanguage === lang.value
            return (
              <button
                key={lang.value}
                type="button"
                onClick={() => update({ preferredLanguage: lang.value })}
                style={{
                  padding: 'var(--spacing-xs) var(--spacing-sm)',
                  borderRadius: 'var(--radius-lg)',
                  border: `2px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  background: isSelected ? 'var(--color-primary-light)' : 'var(--color-surface)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 'var(--text-xs)',
                  fontWeight: isSelected ? 'var(--weight-semibold)' : 'var(--weight-medium)',
                  color: isSelected ? 'var(--color-primary-dark)' : 'var(--color-text)',
                  transition: 'all var(--transition-fast)',
                  minHeight: '44px',
                }}
                aria-pressed={isSelected}
              >
                {lang.nativeLabel}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-xs)' }}>
          Explanation style
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
          {EXPLANATION_STYLE_OPTIONS.map(opt => (
            <SelectCard key={opt.value} {...opt} isSelected={profile.explanationStyle === opt.value} onSelect={() => update({ explanationStyle: opt.value })} />
          ))}
        </div>
      </div>

      <div>
        <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-xs)' }}>
          Tutor tone
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
          {TUTOR_TONE_OPTIONS.map(opt => (
            <SelectCard key={opt.value} {...opt} isSelected={profile.tutorTone === opt.value} onSelect={() => update({ tutorTone: opt.value })} />
          ))}
        </div>
      </div>

      <div>
        <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-xs)' }}>
          Correction detail
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
          {CORRECTION_DETAIL_OPTIONS.map(opt => (
            <SelectCard key={opt.value} {...opt} isSelected={profile.correctionDetail === opt.value} onSelect={() => update({ correctionDetail: opt.value })} />
          ))}
        </div>
      </div>
    </div>
  )
}
