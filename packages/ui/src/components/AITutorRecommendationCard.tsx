import { type HTMLAttributes, type ReactNode } from 'react'

export interface AITutorRecommendationCardProps extends HTMLAttributes<HTMLDivElement> {
  title: string
  recommendation: string
  icon?: ReactNode
  action?: ReactNode
  reason?: string
  priority?: 'high' | 'medium' | 'low'
}

const priorityColors: Record<string, { bg: string; text: string; dot: string }> = {
  high: {
    bg: 'var(--color-danger-light)',
    text: 'var(--color-danger-dark)',
    dot: 'var(--color-danger)',
  },
  medium: {
    bg: 'var(--color-warning-light)',
    text: 'var(--color-warning-dark)',
    dot: 'var(--color-warning)',
  },
  low: {
    bg: 'var(--color-info-light)',
    text: 'var(--color-info-dark)',
    dot: 'var(--color-info)',
  },
}

export function AITutorRecommendationCard({
  title,
  recommendation,
  icon,
  action,
  reason,
  priority,
  style,
  ...props
}: AITutorRecommendationCardProps) {
  const pc = priority ? priorityColors[priority] : undefined

  return (
    <div
      style={{
        display: 'flex',
        gap: 'var(--spacing-sm)',
        padding: 'var(--spacing-md)',
        background: 'var(--color-tutor-background)',
        border: '1px solid var(--color-tutor-border)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-tutor)',
        transition: 'all var(--transition-normal)',
        ...(style as Record<string, string>),
      }}
      {...props}
    >
      {icon ? (
        <span
          style={{
            flexShrink: 0,
            width: 'var(--spacing-2xl)',
            height: 'var(--spacing-2xl)',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--color-tutor-accent-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-tutor-accent)',
            fontSize: 'var(--text-lg)',
          }}
        >
          {icon}
        </span>
      ) : (
        <span
          style={{
            flexShrink: 0,
            width: 'var(--spacing-xl)',
            height: 'var(--spacing-xl)',
            borderRadius: 'var(--radius-full)',
            background: 'var(--color-tutor-accent-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-tutor-accent)',
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--weight-bold)',
          }}
        >
          AI
        </span>
      )}
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
              color: 'var(--color-tutor-text)',
              fontFamily: 'var(--font-sans)',
              lineHeight: 'var(--leading-tight)',
            }}
          >
            {title}
          </span>
          {pc && (
            <span
              style={{
                fontSize: 'var(--text-xs)',
                padding: '0 var(--spacing-2xs)',
                borderRadius: 'var(--radius-xs)',
                background: pc.bg,
                color: pc.text,
                fontWeight: 'var(--weight-medium)',
                fontFamily: 'var(--font-sans)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--spacing-3xs)',
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: 'var(--radius-full)',
                  background: pc.dot,
                  display: 'inline-block',
                }}
              />
              {priority}
            </span>
          )}
        </div>
        <p
          style={{
            margin: 'var(--spacing-2xs) 0 0',
            fontSize: 'var(--text-xs)',
            color: 'var(--color-tutor-text)',
            fontFamily: 'var(--font-sans)',
            lineHeight: 'var(--leading-relaxed)',
            opacity: '0.85',
            overflowWrap: 'break-word',
            wordBreak: 'break-word',
          }}
        >
          {recommendation}
        </p>
        {reason && (
          <p
            style={{
              margin: 'var(--spacing-2xs) 0 0',
              fontSize: 'var(--text-xs)',
              color: 'var(--color-tutor-text)',
              fontFamily: 'var(--font-sans)',
              lineHeight: 'var(--leading-normal)',
              fontStyle: 'italic',
              opacity: '0.7',
              overflowWrap: 'break-word',
              wordBreak: 'break-word',
            }}
          >
            {reason}
          </p>
        )}
        {action && (
          <div style={{ marginTop: 'var(--spacing-xs)' }}>{action}</div>
        )}
      </div>
    </div>
  )
}
