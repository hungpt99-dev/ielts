import type { OnboardingProfile } from '../../types'
import { WEAK_SKILL_OPTIONS, PRIORITY_GOAL_OPTIONS } from '../../types'
import type { StepErrors } from '../../validation'

interface WeakSkillsStepProps {
  profile: OnboardingProfile
  update: (patch: Partial<OnboardingProfile>) => void
  errors: StepErrors
}

export default function WeakSkillsStep({ profile, update, errors }: WeakSkillsStepProps) {
  function toggleWeakSkill(value: string) {
    const set = new Set(profile.weakSkills)
    if (set.has(value)) set.delete(value)
    else set.add(value)
    update({ weakSkills: Array.from(set) })
  }

  function togglePriorityGoal(value: string) {
    const set = new Set(profile.priorityGoals)
    if (set.has(value)) set.delete(value)
    else set.add(value)
    update({ priorityGoals: Array.from(set) })
  }

  return (
    <div className="space-y-5">
      <div>
        <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-medium)', color: 'var(--color-text-secondary)', marginBottom: 'var(--spacing-xs)' }}>
          Which skills need the most work?
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
          {WEAK_SKILL_OPTIONS.map(skill => {
            const isSelected = profile.weakSkills.includes(skill.value)
            return (
              <button
                key={skill.value}
                type="button"
                onClick={() => toggleWeakSkill(skill.value)}
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
                    <p style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)', margin: 0 }}>
                      {skill.label}
                    </p>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', margin: 'var(--spacing-2xs) 0 0' }}>
                      {skill.description}
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
          What do you want to improve most?
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-xs)' }}>
          {PRIORITY_GOAL_OPTIONS.map(goal => {
            const isSelected = profile.priorityGoals.includes(goal.value)
            return (
              <button
                key={goal.value}
                type="button"
                onClick={() => togglePriorityGoal(goal.value)}
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
                {goal.label}
              </button>
            )
          })}
        </div>
      </div>

      {errors.weakSkills && (
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-danger)', textAlign: 'center' }}>{errors.weakSkills}</p>
      )}
    </div>
  )
}
