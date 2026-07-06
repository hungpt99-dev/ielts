import type { ReactNode, HTMLAttributes } from 'react'

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'tutor'
export type CardPadding = 'none' | 'xs' | 'sm' | 'md' | 'lg'
export type CardTint = 'none' | 'listening' | 'reading' | 'writing' | 'speaking' | 'grammar' | 'vocabulary' | 'tutor'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  variant?: CardVariant
  padding?: CardPadding
  header?: ReactNode
  footer?: ReactNode
  hoverable?: boolean
  accentLeft?: boolean
  tint?: CardTint
}

const variantClasses: Record<CardVariant, string> = {
  default: 'bg-[var(--color-surface)] border border-[var(--color-border-light)] shadow-sm',
  elevated: 'bg-[var(--color-surface)] border border-[var(--color-border-light)] shadow-md',
  outlined: 'bg-transparent border border-[var(--color-border)]',
  tutor: 'bg-[var(--color-tutor-background)] border border-[var(--color-tutor-border)] shadow-[var(--shadow-tutor)]',
}

const paddingClasses: Record<CardPadding, string> = {
  none: '',
  xs: 'p-2',
  sm: 'p-3',
  md: 'p-4 sm:p-6',
  lg: 'p-6 sm:p-8',
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

export default function Card({
  children,
  variant = 'default',
  padding = 'md',
  header,
  footer,
  hoverable = false,
  accentLeft = false,
  tint = 'none',
  className,
  style,
  ...props
}: CardProps) {
  const tintColor = tintColors[tint]
  const tintStyle = tint !== 'none' && tintColor
    ? { borderLeft: `3px solid ${tintColor}` }
    : {}
  const accentStyle = accentLeft && tintColor
    ? { borderLeft: `4px solid ${tintColor}`, borderTopLeftRadius: '0', borderBottomLeftRadius: '0' }
    : {}

  return (
    <div
      className={`flex flex-col rounded-2xl transition-all ${variantClasses[variant]} ${paddingClasses[padding]} ${hoverable ? 'cursor-pointer hover:shadow-md' : ''} ${className ?? ''}`}
      style={{
        ...tintStyle,
        ...accentStyle,
        ...(style as Record<string, string>),
      }}
      {...props}
    >
      {header && (
        <div className="border-b border-[var(--color-border-light)] pb-3 mb-3">
          {header}
        </div>
      )}
      {children}
      {footer && (
        <div className="border-t border-[var(--color-border-light)] pt-3 mt-3">
          {footer}
        </div>
      )}
    </div>
  )
}

export function CardHeader({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`flex items-center justify-between ${className ?? ''}`} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={`text-lg font-semibold text-[var(--color-text)] ${className ?? ''}`} {...props}>
      {children}
    </h3>
  )
}

export function CardContent({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={className ?? ''} {...props}>
      {children}
    </div>
  )
}
