import type { OnboardingProfile } from '../../types'
import { BAND_OPTIONS } from '../../types'
import type { StepErrors } from '../../validation'

interface CurrentLevelStepProps {
  profile: OnboardingProfile
  update: (patch: Partial<OnboardingProfile>) => void
  errors: StepErrors
}

export default function CurrentLevelStep({ profile, update, errors }: CurrentLevelStepProps) {
  return (
    <div className="space-y-5">
      <div
        style={{
          padding: 'var(--spacing-md)',
          borderRadius: 'var(--radius-xl)',
          border: `2px solid ${profile.currentLevelKnown ? 'var(--color-primary)' : 'var(--color-border)'}`,
          background: profile.currentLevelKnown ? 'var(--color-primary-light)' : 'var(--color-surface)',
          cursor: 'pointer',
        }}
        onClick={() => update({ currentLevelKnown: true, currentBand: profile.currentBand || 5 })}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); update({ currentLevelKnown: true, currentBand: profile.currentBand || 5 }) } }}
        aria-pressed={profile.currentLevelKnown}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
          <div style={{
            width: '20px', height: '20px',
            borderRadius: 'var(--radius-full)',
            border: `2px solid ${profile.currentLevelKnown ? 'var(--color-primary)' : 'var(--color-border)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: profile.currentLevelKnown ? 'var(--color-primary)' : 'transparent',
            flexShrink: 0,
          }}>
            {profile.currentLevelKnown && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
            )}
          </div>
          <div>
            <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)', margin: 0 }}>
              I know my current level
            </p>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 'var(--spacing-2xs) 0 0' }}>
              Select your estimated band score
            </p>
          </div>
        </div>
      </div>

      {profile.currentLevelKnown && (
        <div>
          <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-xs)' }}>
            Current overall band
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))', gap: 'var(--spacing-xs)' }}>
            {BAND_OPTIONS.filter(b => b <= profile.targetBand || profile.targetBand === 0).map(band => {
              const isSelected = profile.currentBand === band
              return (
                <button
                  key={band}
                  type="button"
                  onClick={() => update({ currentBand: band })}
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
        </div>
      )}

      <div
        style={{
          padding: 'var(--spacing-md)',
          borderRadius: 'var(--radius-xl)',
          border: `2px solid ${!profile.currentLevelKnown ? 'var(--color-primary)' : 'var(--color-border)'}`,
          background: !profile.currentLevelKnown ? 'var(--color-primary-light)' : 'var(--color-surface)',
          cursor: 'pointer',
        }}
        onClick={() => update({ currentLevelKnown: false, currentBand: 0 })}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); update({ currentLevelKnown: false, currentBand: 0 }) } }}
        aria-pressed={!profile.currentLevelKnown}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
          <div style={{
            width: '20px', height: '20px',
            borderRadius: 'var(--radius-full)',
            border: `2px solid ${!profile.currentLevelKnown ? 'var(--color-primary)' : 'var(--color-border)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: !profile.currentLevelKnown ? 'var(--color-primary)' : 'transparent',
            flexShrink: 0,
          }}>
            {!profile.currentLevelKnown && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
            )}
          </div>
          <div>
            <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)', margin: 0 }}>
              I don&apos;t know my level
            </p>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 'var(--spacing-2xs) 0 0' }}>
              AI Tutor can help estimate your level later
            </p>
          </div>
        </div>
      </div>

      {errors.currentBand && (
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-danger)', textAlign: 'center' }}>{errors.currentBand}</p>
      )}
    </div>
  )
}
