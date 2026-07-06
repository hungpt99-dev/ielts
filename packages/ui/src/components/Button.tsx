import { type ButtonHTMLAttributes, type ReactNode } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'warning' | 'tutor'
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: ReactNode
  iconPosition?: 'left' | 'right'
  fullWidth?: boolean
  children?: ReactNode
}

const variantStyle: Record<ButtonVariant, Record<string, string>> = {
  primary: {
    background: 'var(--color-primary)',
    color: 'var(--color-on-primary)',
    border: '1px solid var(--color-primary)',
  },
  secondary: {
    background: 'var(--color-surface)',
    color: 'var(--color-text)',
    border: '1px solid var(--color-border)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--color-text-secondary)',
    border: '1px solid transparent',
  },
  danger: {
    background: 'var(--color-danger)',
    color: 'var(--color-on-primary)',
    border: '1px solid var(--color-danger)',
  },
  success: {
    background: 'var(--color-success)',
    color: 'var(--color-on-primary)',
    border: '1px solid var(--color-success)',
  },
  warning: {
    background: 'var(--color-warning)',
    color: 'var(--color-on-primary)',
    border: '1px solid var(--color-warning)',
  },
  tutor: {
    background: 'var(--color-tutor-accent)',
    color: 'var(--color-on-primary)',
    border: '1px solid var(--color-tutor-accent)',
  },
}

const sizeStyle: Record<ButtonSize, Record<string, string>> = {
  xs: {
    padding: 'var(--spacing-2xs) var(--spacing-xs)',
    fontSize: 'var(--text-xs)',
    borderRadius: 'var(--radius-md)',
    gap: 'var(--spacing-3xs)',
  },
  sm: {
    padding: 'var(--spacing-xs) var(--spacing-sm)',
    fontSize: 'var(--text-sm)',
    borderRadius: 'var(--radius-lg)',
    gap: 'var(--spacing-2xs)',
  },
  md: {
    padding: 'var(--spacing-sm) var(--spacing-md)',
    fontSize: 'var(--text-sm)',
    borderRadius: 'var(--radius-xl)',
    gap: 'var(--spacing-xs)',
  },
  lg: {
    padding: 'var(--spacing-md) var(--spacing-lg)',
    fontSize: 'var(--text-base)',
    borderRadius: 'var(--radius-xl)',
    gap: 'var(--spacing-xs)',
  },
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  children,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const baseStyle: Record<string, string> = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-sans)',
    fontWeight: 'var(--weight-semibold)',
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    opacity: disabled || loading ? '0.6' : '1',
    transition: 'all var(--transition-fast)',
    outline: 'none',
    whiteSpace: 'nowrap',
    lineHeight: 'var(--leading-normal)',
    userSelect: 'none',
    textDecoration: 'none',
    width: fullWidth ? '100%' : ('auto' as string),
    ...variantStyle[variant],
    ...sizeStyle[size],
  }

  const hoverStyle: Record<string, string> =
    variant === 'primary'
      ? { background: 'var(--color-primary-hover)', borderColor: 'var(--color-primary-hover)' }
      : variant === 'danger'
        ? { background: 'var(--color-danger-dark)' }
        : variant === 'success'
          ? { background: 'var(--color-success-dark)' }
          : variant === 'warning'
            ? { background: 'var(--color-warning-dark)' }
            : variant === 'tutor'
              ? { background: 'var(--color-tutor-border)', borderColor: 'var(--color-tutor-border)' }
              : variant === 'secondary'
                ? {
                    background: 'var(--color-background)',
                    borderColor: 'var(--color-primary)',
                    color: 'var(--color-primary)',
                  }
                : { background: 'var(--color-surface-alt)', color: 'var(--color-text)' }

  const focusStyle: Record<string, string> = {
    boxShadow: `0 0 0 2px var(--color-primary-light)`,
  }

  return (
    <button
      style={{
        ...baseStyle,
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          Object.assign(e.currentTarget.style, hoverStyle)
        }
        props.onMouseEnter?.(e)
      }}
      onMouseLeave={(e) => {
        if (!disabled && !loading) {
          Object.assign(e.currentTarget.style, baseStyle)
          if (style) Object.assign(e.currentTarget.style, style)
        }
        props.onMouseLeave?.(e)
      }}
      onFocus={(e) => {
        if (!disabled) {
          Object.assign(e.currentTarget.style, focusStyle)
        }
        props.onFocus?.(e)
      }}
      onBlur={(e) => {
        if (!disabled) {
          e.currentTarget.style.boxShadow = baseStyle.boxShadow || 'none'
        }
        props.onBlur?.(e)
      }}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span
          style={{
            width: '1em',
            height: '1em',
            border: '2px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: 'var(--radius-full)',
            animation: 'spin 0.6s linear infinite',
            flexShrink: 0,
          }}
        />
      )}
      {!loading && icon && iconPosition === 'left' && icon}
      {children && <span>{children}</span>}
      {!loading && icon && iconPosition === 'right' && icon}
    </button>
  )
}
