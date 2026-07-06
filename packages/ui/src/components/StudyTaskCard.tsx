import { type HTMLAttributes, type ReactNode } from 'react'
import type { SkillType } from './SkillCard'
import {
  IconCircle,
  IconClock,
  IconCheckCircle,
  IconClose,
} from '../icons/IconMap'

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'skipped'

export interface StudyTaskCardProps extends HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  skill?: SkillType
  status?: TaskStatus
  duration?: string
  icon?: ReactNode
  action?: ReactNode
}

const skillColorMap: Record<SkillType, string> = {
  listening: 'var(--color-skill-listening)',
  reading: 'var(--color-skill-reading)',
  writing: 'var(--color-skill-writing)',
  speaking: 'var(--color-skill-speaking)',
  grammar: 'var(--color-success)',
  vocabulary: 'var(--color-info)',
}

const statusIconComponent: Record<TaskStatus, () => ReactNode> = {
  pending: () => <IconCircle size={16} />,
  in_progress: () => <IconClock size={16} />,
  completed: () => <IconCheckCircle size={16} />,
  skipped: () => <IconClose size={16} />,
}

const statusColor: Record<TaskStatus, string> = {
  pending: 'var(--color-muted)',
  in_progress: 'var(--color-primary)',
  completed: 'var(--color-success)',
  skipped: 'var(--color-text-secondary)',
}

export function StudyTaskCard({
  title,
  description,
  skill,
  status = 'pending',
  duration,
  icon,
  action,
  style,
  ...props
}: StudyTaskCardProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 'var(--spacing-sm)',
        padding: 'var(--spacing-sm) var(--spacing-md)',
        background: 'var(--color-surface)',
        border: `1px solid ${skill ? skillColorMap[skill] : 'var(--color-border-light)'}`,
        borderLeft: skill ? `3px solid ${skillColorMap[skill]}` : '3px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        transition: 'all var(--transition-fast)',
        ...(style as Record<string, string>),
      }}
      {...props}
    >
      <div
        style={{
          flexShrink: 0,
          width: 'var(--spacing-lg)',
          height: 'var(--spacing-lg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: statusColor[status],
          fontSize: 'var(--text-base)',
          fontWeight: 'var(--weight-bold)',
        }}
      >
        {icon || <span style={{ display: 'inline-flex', alignItems: 'center' }}>{statusIconComponent[status]()}</span>}
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
            {title}
          </span>
          {skill && (
            <span
              style={{
                fontSize: 'var(--text-xs)',
                color: skillColorMap[skill],
                fontWeight: 'var(--weight-medium)',
                fontFamily: 'var(--font-sans)',
                textTransform: 'capitalize',
              }}
            >
              {skill}
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
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-xs)',
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
