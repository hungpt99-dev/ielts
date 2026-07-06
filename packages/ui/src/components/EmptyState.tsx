import { type ReactNode } from 'react'

export interface EmptyStateProps {
  icon?: ReactNode
  illustration?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  compact?: boolean
  tip?: string
}

export function EmptyState({ icon, illustration, title, description, action, compact = false, tip }: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: compact ? 'var(--spacing-lg)' : 'var(--spacing-2xl)',
        gap: 'var(--spacing-sm)',
        minHeight: compact ? undefined : '200px',
        width: '100%',
      }}
    >
      {illustration ? (
        <div
          style={{
            marginBottom: 'var(--spacing-sm)',
            color: 'var(--color-muted)',
          }}
        >
          {illustration}
        </div>
      ) : icon ? (
        <div
          style={{
            color: 'var(--color-muted)',
            opacity: '0.5',
            marginBottom: 'var(--spacing-xs)',
            fontSize: compact ? 'var(--text-2xl)' : 'var(--text-4xl)',
            lineHeight: '1',
          }}
        >
          {icon}
        </div>
      ) : (
        <div
          style={{
            width: compact ? '48px' : '64px',
            height: compact ? '48px' : '64px',
            borderRadius: 'var(--radius-full)',
            background: 'var(--color-surface-alt)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-muted)',
            fontSize: compact ? 'var(--text-xl)' : 'var(--text-2xl)',
            marginBottom: 'var(--spacing-xs)',
          }}
        >
          ?
        </div>
      )}
      <h3
        style={{
          margin: 0,
          fontSize: compact ? 'var(--text-base)' : 'var(--text-lg)',
          fontWeight: 'var(--weight-semibold)',
          color: 'var(--color-text)',
          fontFamily: 'var(--font-sans)',
          lineHeight: 'var(--leading-tight)',
        }}
      >
        {title}
      </h3>
      {description && (
        <p
          style={{
            margin: 0,
            fontSize: 'var(--text-sm)',
            color: 'var(--color-text-secondary)',
            fontFamily: 'var(--font-sans)',
            lineHeight: 'var(--leading-relaxed)',
            maxWidth: '400px',
          }}
        >
          {description}
        </p>
      )}
      {tip && (
        <p
          style={{
            margin: 0,
            fontSize: 'var(--text-xs)',
            color: 'var(--color-muted)',
            fontFamily: 'var(--font-sans)',
            fontStyle: 'italic',
            maxWidth: '360px',
          }}
        >
          {tip}
        </p>
      )}
      {action && <div style={{ marginTop: 'var(--spacing-sm)' }}>{action}</div>}
    </div>
  )
}
