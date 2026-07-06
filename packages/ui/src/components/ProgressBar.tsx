import { type HTMLAttributes } from 'react'

export type ProgressBarVariant = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'listening' | 'reading' | 'writing' | 'speaking'
export type ProgressBarSize = 'xs' | 'sm' | 'md'

export interface ProgressBarProps extends HTMLAttributes<HTMLDivElement> {
  value: number
  max?: number
  variant?: ProgressBarVariant
  size?: ProgressBarSize
  showLabel?: boolean
  label?: string
  animated?: boolean
  indeterminate?: boolean
}

const variantStyle: Record<ProgressBarVariant, Record<string, string>> = {
  primary: { background: 'var(--color-primary)' },
  success: { background: 'var(--color-success)' },
  warning: { background: 'var(--color-warning)' },
  danger: { background: 'var(--color-danger)' },
  info: { background: 'var(--color-info)' },
  listening: { background: 'var(--color-skill-listening)' },
  reading: { background: 'var(--color-skill-reading)' },
  writing: { background: 'var(--color-skill-writing)' },
  speaking: { background: 'var(--color-skill-speaking)' },
}

const sizeStyle: Record<ProgressBarSize, Record<string, string>> = {
  xs: { height: '4px', borderRadius: 'var(--radius-full)' },
  sm: { height: '6px', borderRadius: 'var(--radius-full)' },
  md: { height: '10px', borderRadius: 'var(--radius-full)' },
}

export function ProgressBar({
  value,
  max = 100,
  variant = 'primary',
  size = 'sm',
  showLabel = false,
  label,
  animated = true,
  indeterminate = false,
  style,
  ...props
}: ProgressBarProps) {
  const clampedValue = Math.max(0, Math.min(value, max))
  const percentage = max > 0 ? Math.round((clampedValue / max) * 100) : 0

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-2xs)',
        width: '100%',
        ...(style as Record<string, string>),
      }}
      {...props}
    >
      {(showLabel || label) && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {label && (
            <span
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--color-text-secondary)',
                fontFamily: 'var(--font-sans)',
              }}
            >
              {label}
            </span>
          )}
          {!indeterminate && (
            <span
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--color-muted)',
                fontFamily: 'var(--font-sans)',
                fontWeight: 'var(--weight-medium)',
              }}
            >
              {percentage}%
            </span>
          )}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={indeterminate ? undefined : clampedValue}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={indeterminate ? 'Loading...' : undefined}
        style={{
          width: '100%',
          background: 'var(--color-surface-alt)',
          overflow: 'hidden',
          ...sizeStyle[size],
        }}
      >
        <div
          style={{
            height: '100%',
            borderRadius: sizeStyle[size].borderRadius,
            transition: animated && !indeterminate ? 'width var(--transition-slow)' : 'none',
            width: indeterminate ? '40%' : `${percentage}%`,
            ...variantStyle[variant],
            ...(indeterminate
              ? {
                  animation: 'indeterminateBar 1.5s ease-in-out infinite',
                  width: '40%',
                }
              : {}),
          }}
        />
      </div>
    </div>
  )
}
