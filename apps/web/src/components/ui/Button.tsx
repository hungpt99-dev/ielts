import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'success' | 'warning' | 'tutor'
type Size = 'xs' | 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: ReactNode
  iconPosition?: 'left' | 'right'
  fullWidth?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] focus-visible:ring-[var(--color-primary)] disabled:opacity-60',
  secondary:
    'bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] focus-visible:ring-[var(--color-muted)] disabled:opacity-60',
  danger:
    'bg-[var(--color-danger)] text-white hover:brightness-110 focus-visible:ring-[var(--color-danger)] disabled:opacity-60',
  ghost:
    'bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] focus-visible:ring-[var(--color-muted)]',
  outline:
    'border border-[var(--color-border)] bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] focus-visible:ring-[var(--color-muted)]',
  success:
    'bg-[var(--color-success)] text-white hover:brightness-110 focus-visible:ring-[var(--color-success)] disabled:opacity-60',
  warning:
    'bg-[var(--color-warning)] text-white hover:brightness-110 focus-visible:ring-[var(--color-warning)] disabled:opacity-60',
  tutor:
    'bg-[var(--color-tutor-accent)] text-white hover:brightness-110 focus-visible:ring-[var(--color-tutor-accent)] disabled:opacity-60',
}

const sizeClasses: Record<Size, string> = {
  xs: 'px-2.5 py-1 text-xs gap-1',
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, disabled, icon, iconPosition = 'left', fullWidth, className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`inline-flex items-center justify-center font-semibold rounded-xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed ${fullWidth ? 'w-full' : ''} ${variantClasses[variant]} ${sizeClasses[size]} ${className ?? ''}`}
        {...props}
      >
        {loading && (
          <svg
            className="h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {!loading && icon && iconPosition === 'left' && <span className="flex shrink-0">{icon}</span>}
        {children && <span>{children}</span>}
        {!loading && icon && iconPosition === 'right' && <span className="flex shrink-0">{icon}</span>}
      </button>
    )
  },
)

Button.displayName = 'Button'

export default Button
