import { type ButtonHTMLAttributes, type ReactNode } from 'react'

export type IconButtonVariant = 'primary' | 'secondary' | 'ghost'
export type IconButtonSize = 'xs' | 'sm' | 'md'

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IconButtonVariant
  size?: IconButtonSize
  label: string
  icon: ReactNode
}

const variantStyle: Record<IconButtonVariant, Record<string, string>> = {
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
}

const sizeStyle: Record<IconButtonSize, Record<string, string>> = {
  xs: {
    width: 'var(--spacing-lg)',
    height: 'var(--spacing-lg)',
    fontSize: 'var(--text-sm)',
    borderRadius: 'var(--radius-md)',
  },
  sm: {
    width: 'var(--spacing-xl)',
    height: 'var(--spacing-xl)',
    fontSize: 'var(--text-base)',
    borderRadius: 'var(--radius-lg)',
  },
  md: {
    width: 'calc(var(--spacing-xl) + var(--spacing-xs))',
    height: 'calc(var(--spacing-xl) + var(--spacing-xs))',
    fontSize: 'var(--text-lg)',
    borderRadius: 'var(--radius-xl)',
  },
}

export function IconButton({
  variant = 'secondary',
  size = 'sm',
  label,
  icon,
  disabled,
  style,
  ...props
}: IconButtonProps) {
  const baseStyle: Record<string, string> = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0',
    fontFamily: 'var(--font-sans)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? '0.5' : '1',
    transition: 'all var(--transition-fast)',
    outline: 'none',
    flexShrink: '0',
    lineHeight: '1',
    userSelect: 'none',
    ...variantStyle[variant],
    ...sizeStyle[size],
  }

  return (
    <button
      aria-label={label}
      title={label}
      style={{ ...baseStyle, ...style } as Record<string, string>}
      onMouseEnter={(e) => {
        if (!disabled) {
          if (variant === 'secondary') {
            e.currentTarget.style.borderColor = 'var(--color-primary)'
            e.currentTarget.style.color = 'var(--color-primary)'
          } else if (variant === 'ghost') {
            e.currentTarget.style.background = 'var(--color-surface-alt)'
            e.currentTarget.style.color = 'var(--color-text)'
          }
        }
        props.onMouseEnter?.(e)
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          const base = { ...baseStyle, ...style } as Record<string, string>
          if (base.background) e.currentTarget.style.background = base.background
          if (base.color) e.currentTarget.style.color = base.color
          if (base.border) e.currentTarget.style.border = base.border
        }
        props.onMouseLeave?.(e)
      }}
      disabled={disabled}
      {...props}
    >
      {icon}
    </button>
  )
}
