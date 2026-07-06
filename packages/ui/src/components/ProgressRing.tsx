import { type SVGAttributes, type ReactNode } from 'react'

export type ProgressRingVariant = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'listening' | 'reading' | 'writing' | 'speaking'

export interface ProgressRingProps extends SVGAttributes<SVGSVGElement> {
  value: number
  max?: number
  size?: number
  strokeWidth?: number
  variant?: ProgressRingVariant
  showLabel?: boolean
  label?: string | ReactNode
}

const variantColors: Record<ProgressRingVariant, string> = {
  primary: 'var(--color-primary)',
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  danger: 'var(--color-danger)',
  info: 'var(--color-info)',
  listening: 'var(--color-skill-listening)',
  reading: 'var(--color-skill-reading)',
  writing: 'var(--color-skill-writing)',
  speaking: 'var(--color-skill-speaking)',
}

export function ProgressRing({
  value,
  max = 100,
  size = 48,
  strokeWidth = 4,
  variant = 'primary',
  showLabel = true,
  label,
  style,
  ...props
}: ProgressRingProps) {
  const clampedValue = Math.max(0, Math.min(value, max))
  const percentage = max > 0 ? Math.round((clampedValue / max) * 100) : 0
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percentage / 100) * circumference

  return (
    <div
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        gap: 'var(--spacing-2xs)',
        ...(style as Record<string, string>),
      }}
    >
      <div
        style={{
          position: 'relative',
          width: size,
          height: size,
        }}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          role="progressbar"
          aria-valuenow={clampedValue}
          aria-valuemin={0}
          aria-valuemax={max}
          {...props}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--color-surface-alt)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={variantColors[variant]}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{
              transition: 'stroke-dashoffset var(--transition-slow)',
            }}
          />
        </svg>
        {showLabel && !label && (
          <span
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: size > 40 ? 'var(--text-sm)' : 'var(--text-xs)',
              fontWeight: 'var(--weight-semibold)',
              color: 'var(--color-text)',
              fontFamily: 'var(--font-sans)',
              lineHeight: '1',
            }}
          >
            {percentage}
          </span>
        )}
      </div>
      {label && (
        <span
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--color-text-secondary)',
            fontFamily: 'var(--font-sans)',
            textAlign: 'center',
          }}
        >
          {label}
        </span>
      )}
    </div>
  )
}
