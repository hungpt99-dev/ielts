import { type HTMLAttributes, type ReactNode } from 'react'

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'tutor' | 'skill'
export type CardPadding = 'none' | 'xs' | 'sm' | 'md' | 'lg'
export type CardTint = 'none' | 'listening' | 'reading' | 'writing' | 'speaking' | 'grammar' | 'vocabulary' | 'tutor'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
  padding?: CardPadding
  header?: ReactNode
  footer?: ReactNode
  hoverable?: boolean
  accentLeft?: boolean
  tint?: CardTint
  children?: ReactNode
}

const variantStyle: Record<CardVariant, Record<string, string>> = {
  default: {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border-light)',
    boxShadow: 'var(--shadow-sm)',
  },
  elevated: {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border-light)',
    boxShadow: 'var(--shadow-md)',
  },
  outlined: {
    background: 'transparent',
    border: '1px solid var(--color-border)',
    boxShadow: 'none',
  },
  tutor: {
    background: 'var(--color-tutor-background)',
    border: '1px solid var(--color-tutor-border)',
    boxShadow: 'var(--shadow-tutor)',
  },
  skill: {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border-light)',
    boxShadow: 'var(--shadow-sm)',
  },
}

const paddingStyle: Record<CardPadding, Record<string, string>> = {
  none: { padding: '0' },
  xs: { padding: 'var(--spacing-xs)' },
  sm: { padding: 'var(--spacing-sm)' },
  md: { padding: 'var(--spacing-md)' },
  lg: { padding: 'var(--spacing-lg)' },
}

const tintColors: Record<CardTint, string | undefined> = {
  none: undefined,
  listening: 'var(--color-skill-listening)',
  reading: 'var(--color-skill-reading)',
  writing: 'var(--color-skill-writing)',
  speaking: 'var(--color-skill-speaking)',
  grammar: 'var(--color-success)',
  vocabulary: 'var(--color-info)',
  tutor: 'var(--color-tutor-accent)',
}

export function Card({
  variant = 'default',
  padding = 'md',
  header,
  footer,
  hoverable = false,
  accentLeft = false,
  tint = 'none',
  children,
  style,
  ...props
}: CardProps) {
  const tintColor = tintColors[tint]
  const baseStyle: Record<string, string> = {
    borderRadius: 'var(--radius-xl)',
    transition: 'all var(--transition-normal)',
    display: 'flex',
    flexDirection: 'column',
    ...(tint !== 'none' && tintColor ? {
      borderLeft: `3px solid ${tintColor}`,
    } : {}),
    ...variantStyle[variant],
    ...paddingStyle[padding],
  }

  return (
    <div
      style={{
        ...baseStyle,
        ...(hoverable
          ? {
              cursor: 'pointer',
            }
          : {}),
        ...(accentLeft && tintColor ? {
          borderLeft: `4px solid ${tintColor}`,
          borderTopLeftRadius: '0',
          borderBottomLeftRadius: '0',
        } : {}),
        ...style,
      } as Record<string, string>}
      onMouseEnter={(e) => {
        if (hoverable && variant !== 'tutor') {
          e.currentTarget.style.boxShadow = 'var(--shadow-md)'
        }
        props.onMouseEnter?.(e)
      }}
      onMouseLeave={(e) => {
        if (hoverable && variant !== 'tutor') {
          e.currentTarget.style.boxShadow = variantStyle[variant].boxShadow as string
        }
        props.onMouseLeave?.(e)
      }}
      {...props}
    >
      {header && (
        <div
          style={{
            paddingBottom: padding !== 'none' ? 'var(--spacing-sm)' : '0',
            borderBottom: '1px solid var(--color-border-light)',
            marginBottom: padding !== 'none' ? 'var(--spacing-sm)' : '0',
          }}
        >
          {header}
        </div>
      )}
      {children}
      {footer && (
        <div
          style={{
            paddingTop: padding !== 'none' ? 'var(--spacing-sm)' : '0',
            borderTop: '1px solid var(--color-border-light)',
            marginTop: padding !== 'none' ? 'var(--spacing-sm)' : '0',
          }}
        >
          {footer}
        </div>
      )}
    </div>
  )
}
