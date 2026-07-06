import { type HTMLAttributes, type ReactNode } from 'react'

export type SkillType = 'listening' | 'reading' | 'writing' | 'speaking' | 'grammar' | 'vocabulary'

export interface SkillCardProps extends HTMLAttributes<HTMLDivElement> {
  skill: SkillType
  label: string
  score: number
  maxScore?: number
  icon?: ReactNode
  trend?: 'up' | 'down' | 'stable'
  weak?: boolean
  children?: ReactNode
}

const skillColors: Record<SkillType, Record<string, string>> = {
  listening: {
    color: 'var(--color-skill-listening)',
    light: 'var(--color-skill-listening-light)',
    dark: 'var(--color-skill-listening-dark)',
  },
  reading: {
    color: 'var(--color-skill-reading)',
    light: 'var(--color-skill-reading-light)',
    dark: 'var(--color-skill-reading-dark)',
  },
  writing: {
    color: 'var(--color-skill-writing)',
    light: 'var(--color-skill-writing-light)',
    dark: 'var(--color-skill-writing-dark)',
  },
  speaking: {
    color: 'var(--color-skill-speaking)',
    light: 'var(--color-skill-speaking-light)',
    dark: 'var(--color-skill-speaking-dark)',
  },
  grammar: {
    color: 'var(--color-success)',
    light: 'var(--color-success-light)',
    dark: 'var(--color-success-dark)',
  },
  vocabulary: {
    color: 'var(--color-info)',
    light: 'var(--color-info-light)',
    dark: 'var(--color-info-dark)',
  },
}

const trendIcons = {
  up: '↑',
  down: '↓',
  stable: '→',
}

export function SkillCard({
  skill,
  label,
  score,
  maxScore = 9,
  icon,
  trend,
  weak = false,
  children,
  style,
  ...props
}: SkillCardProps) {
  const sc = skillColors[skill]
  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-sm)',
        padding: 'var(--spacing-md)',
        background: 'var(--color-surface)',
        border: `1px solid ${weak ? sc.color : 'var(--color-border-light)'}`,
        borderRadius: 'var(--radius-xl)',
        boxShadow: weak ? `0 0 0 1px ${sc.color}` : 'var(--shadow-sm)',
        transition: 'all var(--transition-normal)',
        ...(style as Record<string, string>),
      }}
      {...props}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
          {icon && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 'var(--spacing-xl)',
                height: 'var(--spacing-xl)',
                borderRadius: 'var(--radius-lg)',
                background: sc.light,
                color: sc.color,
                fontSize: 'var(--text-base)',
              }}
            >
              {icon}
            </span>
          )}
          <div>
            <span
              style={{
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--weight-semibold)',
                color: 'var(--color-text)',
                fontFamily: 'var(--font-sans)',
              }}
            >
              {label}
            </span>
            {weak && (
              <span
                style={{
                  fontSize: 'var(--text-xs)',
                  color: sc.color,
                  fontWeight: 'var(--weight-medium)',
                  fontFamily: 'var(--font-sans)',
                  marginLeft: 'var(--spacing-xs)',
                }}
              >
                Needs work
              </span>
            )}
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-2xs)',
          }}
        >
          <span
            style={{
              fontSize: 'var(--text-xl)',
              fontWeight: 'var(--weight-bold)',
              color: sc.color,
              fontFamily: 'var(--font-sans)',
              lineHeight: '1',
            }}
          >
            {score}
          </span>
          <span
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--color-muted)',
              fontFamily: 'var(--font-sans)',
            }}
          >
            /{maxScore}
          </span>
          {trend && (
            <span
              style={{
                fontSize: 'var(--text-sm)',
                color: trend === 'up' ? 'var(--color-success)' : trend === 'down' ? 'var(--color-danger)' : 'var(--color-muted)',
                marginLeft: 'var(--spacing-2xs)',
              }}
            >
              {trendIcons[trend]}
            </span>
          )}
        </div>
      </div>
      <div
        style={{
          width: '100%',
          height: '6px',
          background: 'var(--color-surface-alt)',
          borderRadius: 'var(--radius-full)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            borderRadius: 'var(--radius-full)',
            background: sc.color,
            width: `${percentage}%`,
            transition: 'width var(--transition-slow)',
          }}
        />
      </div>
      {children}
    </div>
  )
}
