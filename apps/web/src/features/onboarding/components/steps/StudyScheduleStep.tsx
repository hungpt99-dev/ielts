import type { OnboardingProfile, Intensity } from '../../types'
import { INTENSITY_OPTIONS, STUDY_DAY_LABELS } from '../../types'
import type { StepErrors } from '../../validation'

interface StudyScheduleStepProps {
  profile: OnboardingProfile
  update: (patch: Partial<OnboardingProfile>) => void
  errors: StepErrors
}

export default function StudyScheduleStep({ profile, update, errors }: StudyScheduleStepProps) {
  const allDays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const

  function toggleDay(day: typeof allDays[number]) {
    const set = new Set(profile.preferredSchedule)
    if (set.has(day)) set.delete(day)
    else set.add(day)
    update({ preferredSchedule: Array.from(set), studyDaysPerWeek: set.size })
  }

  return (
    <div className="space-y-5">
      <div>
        <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-xs)' }}>
          Study intensity
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
          {INTENSITY_OPTIONS.map(opt => {
            const isSelected = profile.intensity === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  const minutesMap: Record<Intensity, number> = { light: 30, balanced: 60, intensive: 120 }
                  update({ intensity: opt.value, studyMinutesPerDay: minutesMap[opt.value] })
                }}
                style={{
                  padding: 'var(--spacing-md)',
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
                    <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)', margin: 0 }}>
                      {opt.label}
                    </p>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 'var(--spacing-2xs) 0 0' }}>
                      {opt.description}
                    </p>
                  </div>
                  {isSelected && (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--color-primary)"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-xs)' }}>
          Study days per week ({profile.preferredSchedule.length} selected)
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-xs)' }}>
          {allDays.map(day => {
            const isSelected = profile.preferredSchedule.includes(day)
            return (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(day)}
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
                {STUDY_DAY_LABELS[day].slice(0, 3)}
              </button>
            )
          })}
        </div>
      </div>

      {profile.studyMinutesPerDay > 0 && (
        <div style={{
          padding: 'var(--spacing-md)',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--color-surface-alt)',
          textAlign: 'center',
        }}>
          <span style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--weight-bold)', color: 'var(--color-primary)' }}>
            ~{profile.studyMinutesPerDay * profile.studyDaysPerWeek}
          </span>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginLeft: 'var(--spacing-xs)' }}>
            minutes / week
          </span>
        </div>
      )}

      {errors.studyMinutesPerDay && (
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-danger)', textAlign: 'center' }}>{errors.studyMinutesPerDay}</p>
      )}
    </div>
  )
}
