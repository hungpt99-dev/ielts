import type { ReactNode } from 'react'
import { IconClose } from '@ielts/ui'

interface BadgeProps {
  children: ReactNode
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'listening' | 'reading' | 'writing' | 'speaking' | 'grammar' | 'vocabulary'
  size?: 'xs' | 'sm' | 'md'
  icon?: ReactNode
  removable?: boolean
  onRemove?: () => void
}

const variantStyles: Record<string, string> = {
  default: 'bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)] border border-[var(--color-border)]',
  primary: 'bg-[var(--color-primary-light)] text-[var(--color-primary-dark)] border border-[var(--color-primary-light)]',
  success: 'bg-[var(--color-success-light)] text-[var(--color-success-dark)] border border-[var(--color-success-light)]',
  warning: 'bg-[var(--color-warning-light)] text-[var(--color-warning-dark)] border border-[var(--color-warning-light)]',
  danger: 'bg-[var(--color-danger-light)] text-[var(--color-danger-dark)] border border-[var(--color-danger-light)]',
  info: 'bg-[var(--color-info-light)] text-[var(--color-info-dark)] border border-[var(--color-info-light)]',
  listening: 'bg-[var(--color-skill-listening-light)] text-[var(--color-skill-listening-dark)] border border-[var(--color-skill-listening-light)]',
  reading: 'bg-[var(--color-skill-reading-light)] text-[var(--color-skill-reading-dark)] border border-[var(--color-skill-reading-light)]',
  writing: 'bg-[var(--color-skill-writing-light)] text-[var(--color-skill-writing-dark)] border border-[var(--color-skill-writing-light)]',
  speaking: 'bg-[var(--color-skill-speaking-light)] text-[var(--color-skill-speaking-dark)] border border-[var(--color-skill-speaking-light)]',
  grammar: 'bg-[var(--color-success-light)] text-[var(--color-success-dark)] border border-[var(--color-success-light)]',
  vocabulary: 'bg-[var(--color-info-light)] text-[var(--color-info-dark)] border border-[var(--color-info-light)]',
}

const sizeStyles: Record<string, string> = {
  xs: 'px-1.5 py-0.5 text-xs gap-0.5',
  sm: 'px-2 py-0.5 text-xs gap-1',
  md: 'px-2.5 py-1 text-sm gap-1',
}

export default function Badge({ children, variant = 'default', size = 'sm', icon, removable, onRemove }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium leading-none select-none ${variantStyles[variant]} ${sizeStyles[size]}`}
    >
      {icon && <span className="inline-flex shrink-0">{icon}</span>}
      {children}
      {removable && (
        <button
          type="button"
          aria-label="Remove"
          onClick={(e) => {
            e.stopPropagation()
            onRemove?.()
          }}
          className="inline-flex items-center justify-center p-0 ml-1 bg-none border-none cursor-pointer opacity-60 hover:opacity-100 leading-none"
          style={{ background: 'none', border: 'none', color: 'inherit', fontSize: 'inherit' }}
        >
          <IconClose size={size === 'xs' ? 8 : 10} />
        </button>
      )}
    </span>
  )
}
