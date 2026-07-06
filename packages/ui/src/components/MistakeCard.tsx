import { type HTMLAttributes, type ReactNode } from 'react'
import type { SkillType } from './SkillCard'

export interface MistakeCardProps extends HTMLAttributes<HTMLDivElement> {
  title: string
  skill: SkillType
  mistake: string
  correction?: string
  count?: number
  date?: string
  icon?: ReactNode
  action?: ReactNode
  resolved?: boolean
}

const skillColorMap: Record<SkillType, string> = {
  listening: 'var(--color-skill-listening)',
  reading: 'var(--color-skill-reading)',
  writing: 'var(--color-skill-writing)',
  speaking: 'var(--color-skill-speaking)',
  grammar: 'var(--color-success)',
  vocabulary: 'var(--color-info)',
}

export function MistakeCard({
  title,
  skill,
  mistake,
  correction,
  count,
  date,
  icon,
  action,
  resolved = false,
  style,
  ...props
}: MistakeCardProps) {
  const color = skillColorMap[skill]

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 'var(--spacing-sm)',
        padding: 'var(--spacing-sm) var(--spacing-md)',
        background: 'var(--color-surface)',
        border: `1px solid var(--color-border-light)`,
        borderLeft: `3px solid ${resolved ? 'var(--color-success)' : color}`,
        borderRadius: 'var(--radius-lg)',
        opacity: resolved ? '0.7' : '1',
        transition: 'all var(--transition-fast)',
        ...(style as Record<string, string>),
      }}
      {...props}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-xs)',
            flexWrap: 'wrap',
          }}
        >
          {icon && (
            <span
              style={{
                display: 'inline-flex',
                flexShrink: 0,
                color,
                fontSize: 'var(--text-base)',
              }}
            >
              {icon}
            </span>
          )}
          <span
            style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 'var(--weight-semibold)',
              color: 'var(--color-text)',
              fontFamily: 'var(--font-sans)',
              lineHeight: 'var(--leading-tight)',
            }}
          >
            {title}
          </span>
          <span
            style={{
              fontSize: 'var(--text-xs)',
              color,
              fontWeight: 'var(--weight-medium)',
              fontFamily: 'var(--font-sans)',
              textTransform: 'capitalize',
            }}
          >
            {skill}
          </span>
          {resolved && (
            <span
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--color-success)',
                fontWeight: 'var(--weight-medium)',
                fontFamily: 'var(--font-sans)',
              }}
            >
              Resolved
            </span>
          )}
          {count !== undefined && count > 1 && (
            <span
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--color-muted)',
                fontWeight: 'var(--weight-medium)',
                fontFamily: 'var(--font-sans)',
              }}
            >
              x{count}
            </span>
          )}
        </div>
        <p
          style={{
            margin: 'var(--spacing-2xs) 0 0',
            fontSize: 'var(--text-xs)',
            color: 'var(--color-danger)',
            fontFamily: 'var(--font-sans)',
            lineHeight: 'var(--leading-normal)',
            overflowWrap: 'break-word',
            wordBreak: 'break-word',
          }}
        >
          {mistake}
        </p>
        {correction && (
          <p
            style={{
              margin: 'var(--spacing-2xs) 0 0',
              fontSize: 'var(--text-xs)',
              color: 'var(--color-success)',
              fontFamily: 'var(--font-sans)',
              lineHeight: 'var(--leading-normal)',
              overflowWrap: 'break-word',
              wordBreak: 'break-word',
            }}
          >
            → {correction}
          </p>
        )}
        {date && (
          <span
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--color-muted)',
              fontFamily: 'var(--font-sans)',
              marginTop: 'var(--spacing-2xs)',
              display: 'inline-block',
            }}
          >
            {date}
          </span>
        )}
      </div>
      {action && (
        <div style={{ flexShrink: 0 }}>{action}</div>
      )}
    </div>
  )
}
