import { type HTMLAttributes, type ReactNode } from 'react'
import type { SkillType } from './SkillCard'
import { IconCheck } from '../icons/IconMap'

export interface PracticeCardProps extends HTMLAttributes<HTMLDivElement> {
  label: string
  skill: SkillType
  description?: string
  icon?: ReactNode
  duration?: string
  difficulty?: 'easy' | 'medium' | 'hard'
  progress?: number
  action?: ReactNode
  completed?: boolean
}

const skillColorMap: Record<SkillType, string> = {
  listening: 'var(--color-skill-listening)',
  reading: 'var(--color-skill-reading)',
  writing: 'var(--color-skill-writing)',
  speaking: 'var(--color-skill-speaking)',
  grammar: 'var(--color-success)',
  vocabulary: 'var(--color-info)',
}

const skillLightMap: Record<SkillType, string> = {
  listening: 'var(--color-skill-listening-light)',
  reading: 'var(--color-skill-reading-light)',
  writing: 'var(--color-skill-writing-light)',
  speaking: 'var(--color-skill-speaking-light)',
  grammar: 'var(--color-success-light)',
  vocabulary: 'var(--color-info-light)',
}

const difficultyColor: Record<string, { bg: string; text: string }> = {
  easy: { bg: 'var(--color-success-light)', text: 'var(--color-success-dark)' },
  medium: { bg: 'var(--color-warning-light)', text: 'var(--color-warning-dark)' },
  hard: { bg: 'var(--color-danger-light)', text: 'var(--color-danger-dark)' },
}

export function PracticeCard({
  label,
  skill,
  description,
  icon,
  duration,
  difficulty,
  progress,
  action,
  completed = false,
  style,
  ...props
}: PracticeCardProps) {
  const color = skillColorMap[skill]
  const light = skillLightMap[skill]

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 'var(--spacing-sm)',
        padding: 'var(--spacing-md)',
        background: 'var(--color-surface)',
        border: `1px solid ${completed ? color : 'var(--color-border-light)'}`,
        borderLeft: `3px solid ${color}`,
        borderRadius: 'var(--radius-xl)',
        opacity: completed ? '0.75' : '1',
        transition: 'all var(--transition-fast)',
        ...(style as Record<string, string>),
      }}
      {...props}
    >
      <div
        style={{
          flexShrink: 0,
          width: 'var(--spacing-xl)',
          height: 'var(--spacing-xl)',
          borderRadius: 'var(--radius-lg)',
          background: light,
          color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 'var(--text-base)',
        }}
      >
        {icon || (
          <span style={{ fontWeight: 'var(--weight-bold)' }}>
            {completed ? <IconCheck size={14} /> : skill.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-xs)',
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--weight-semibold)',
              color: 'var(--color-text)',
              fontFamily: 'var(--font-sans)',
              lineHeight: 'var(--leading-tight)',
            }}
          >
            {label}
          </span>
          {difficulty && (
            <span
              style={{
                fontSize: 'var(--text-xs)',
                padding: '0 var(--spacing-2xs)',
                borderRadius: 'var(--radius-xs)',
                background: difficultyColor[difficulty].bg,
                color: difficultyColor[difficulty].text,
                fontWeight: 'var(--weight-medium)',
                fontFamily: 'var(--font-sans)',
              }}
            >
              {difficulty}
            </span>
          )}
        </div>
        {description && (
          <p
            style={{
              margin: 'var(--spacing-2xs) 0 0',
              fontSize: 'var(--text-xs)',
              color: 'var(--color-text-secondary)',
              fontFamily: 'var(--font-sans)',
              lineHeight: 'var(--leading-normal)',
              overflowWrap: 'break-word',
              wordBreak: 'break-word',
            }}
          >
            {description}
          </p>
        )}
        {progress !== undefined && (
          <div
            style={{
              marginTop: 'var(--spacing-xs)',
              width: '100%',
              height: '4px',
              background: 'var(--color-surface-alt)',
              borderRadius: 'var(--radius-full)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                borderRadius: 'var(--radius-full)',
                background: color,
                width: `${Math.min(100, Math.max(0, progress))}%`,
                transition: 'width var(--transition-slow)',
              }}
            />
          </div>
        )}
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 'var(--spacing-2xs)',
          flexShrink: 0,
        }}
      >
        {duration && (
          <span
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--color-muted)',
              fontFamily: 'var(--font-sans)',
              whiteSpace: 'nowrap',
            }}
          >
            {duration}
          </span>
        )}
        {action}
      </div>
    </div>
  )
}
