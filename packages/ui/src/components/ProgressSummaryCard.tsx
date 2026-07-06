import { type HTMLAttributes, type ReactNode } from 'react'

export interface ProgressSummaryCardProps extends HTMLAttributes<HTMLDivElement> {
  label: string
  value: string | number
  subtitle?: string
  icon?: ReactNode
  trend?: 'up' | 'down' | 'stable'
  color?: string
  children?: ReactNode
}

const trendColors: Record<string, string> = {
  up: 'var(--color-success)',
  down: 'var(--color-danger)',
  stable: 'var(--color-muted)',
}

const trendIcons: Record<string, string> = {
  up: '↑',
  down: '↓',
  stable: '→',
}

export function ProgressSummaryCard({
  label,
  value,
  subtitle,
  icon,
  trend,
  color = 'var(--color-primary)',
  children,
  style,
  ...props
}: ProgressSummaryCardProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-xs)',
        padding: 'var(--spacing-md)',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border-light)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-sm)',
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
                background: `color-mix(in srgb, ${color} 15%, transparent)`,
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
              fontWeight: 'var(--weight-medium)',
              color: 'var(--color-text-secondary)',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {label}
          </span>
        </div>
        {trend && (
          <span
            style={{
              fontSize: 'var(--text-sm)',
              color: trendColors[trend],
              fontWeight: 'var(--weight-semibold)',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {trendIcons[trend]}
          </span>
        )}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 'var(--spacing-2xs)',
        }}
      >
        <span
          style={{
            fontSize: 'var(--text-2xl)',
            fontWeight: 'var(--weight-bold)',
            color,
            fontFamily: 'var(--font-sans)',
            lineHeight: 'var(--leading-tight)',
          }}
        >
          {value}
        </span>
        {subtitle && (
          <span
            style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--color-muted)',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {subtitle}
          </span>
        )}
      </div>
      {children}
    </div>
  )
}
