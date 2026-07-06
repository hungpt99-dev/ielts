import { type HTMLAttributes, type ReactNode } from 'react'
import { IconClose } from '../icons/IconMap'

export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'listening'
  | 'reading'
  | 'writing'
  | 'speaking'
  | 'grammar'
  | 'vocabulary'
export type BadgeSize = 'xs' | 'sm' | 'md'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  size?: BadgeSize
  icon?: ReactNode
  removable?: boolean
  onRemove?: () => void
  children?: ReactNode
}

const variantStyle: Record<BadgeVariant, Record<string, string>> = {
  default: {
    background: 'var(--color-surface-alt)',
    color: 'var(--color-text-secondary)',
    border: '1px solid var(--color-border)',
  },
  primary: {
    background: 'var(--color-primary-light)',
    color: 'var(--color-primary-dark)',
    border: '1px solid var(--color-primary-light)',
  },
  success: {
    background: 'var(--color-success-light)',
    color: 'var(--color-success-dark)',
    border: '1px solid var(--color-success-light)',
  },
  warning: {
    background: 'var(--color-warning-light)',
    color: 'var(--color-warning-dark)',
    border: '1px solid var(--color-warning-light)',
  },
  danger: {
    background: 'var(--color-danger-light)',
    color: 'var(--color-danger-dark)',
    border: '1px solid var(--color-danger-light)',
  },
  info: {
    background: 'var(--color-info-light)',
    color: 'var(--color-info-dark)',
    border: '1px solid var(--color-info-light)',
  },
  listening: {
    background: 'var(--color-skill-listening-light)',
    color: 'var(--color-skill-listening-dark)',
    border: '1px solid var(--color-skill-listening-light)',
  },
  reading: {
    background: 'var(--color-skill-reading-light)',
    color: 'var(--color-skill-reading-dark)',
    border: '1px solid var(--color-skill-reading-light)',
  },
  writing: {
    background: 'var(--color-skill-writing-light)',
    color: 'var(--color-skill-writing-dark)',
    border: '1px solid var(--color-skill-writing-light)',
  },
  speaking: {
    background: 'var(--color-skill-speaking-light)',
    color: 'var(--color-skill-speaking-dark)',
    border: '1px solid var(--color-skill-speaking-light)',
  },
  grammar: {
    background: 'var(--color-success-light)',
    color: 'var(--color-success-dark)',
    border: '1px solid var(--color-success-light)',
  },
  vocabulary: {
    background: 'var(--color-info-light)',
    color: 'var(--color-info-dark)',
    border: '1px solid var(--color-info-light)',
  },
}

const sizeStyle: Record<BadgeSize, Record<string, string>> = {
  xs: {
    padding: 'var(--spacing-3xs) var(--spacing-2xs)',
    fontSize: 'var(--text-xs)',
    borderRadius: 'var(--radius-sm)',
    gap: 'var(--spacing-3xs)',
  },
  sm: {
    padding: '0 var(--spacing-xs)',
    fontSize: 'var(--text-xs)',
    borderRadius: 'var(--radius-md)',
    gap: 'var(--spacing-2xs)',
    height: 'var(--spacing-lg)',
  },
  md: {
    padding: 'var(--spacing-2xs) var(--spacing-sm)',
    fontSize: 'var(--text-sm)',
    borderRadius: 'var(--radius-lg)',
    gap: 'var(--spacing-2xs)',
  },
}

export function Badge({
  variant = 'default',
  size = 'sm',
  icon,
  removable = false,
  onRemove,
  children,
  style,
  ...props
}: BadgeProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontFamily: 'var(--font-sans)',
        fontWeight: 'var(--weight-medium)',
        lineHeight: 'var(--leading-normal)',
        whiteSpace: 'nowrap',
        userSelect: 'none',
        ...variantStyle[variant],
        ...sizeStyle[size],
        ...(style as Record<string, string>),
      } as Record<string, string>}
      {...props}
    >
      {icon && <span style={{ display: 'inline-flex', flexShrink: 0 }}>{icon}</span>}
      {children}
      {removable && (
        <button
          type="button"
          aria-label="Remove"
          onClick={(e) => {
            e.stopPropagation()
            onRemove?.()
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0',
            marginLeft: 'var(--spacing-2xs)',
            fontSize: 'inherit',
            color: 'inherit',
            opacity: '0.6',
            lineHeight: '1',
          }}
          >
            <IconClose size={10} />
          </button>
      )}
    </span>
  )
}
