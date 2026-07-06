import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  icon?: ReactNode
  iconPosition?: 'left' | 'right'
  inputSize?: 'sm' | 'md' | 'lg'
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, icon, iconPosition = 'left', inputSize = 'md', className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    const sizeClasses = {
      sm: 'px-2.5 py-1.5 text-xs',
      md: 'px-3.5 py-2.5 text-sm',
      lg: 'px-4 py-3 text-base',
    }
    const iconPaddingLeft = {
      sm: 'pl-8',
      md: 'pl-10',
      lg: 'pl-12',
    }
    const iconPaddingRight = {
      sm: 'pr-8',
      md: 'pr-10',
      lg: 'pr-12',
    }
    const iconLeftOffset = { sm: 'left-2.5', md: 'left-3', lg: 'left-3.5' }
    const iconRightOffset = { sm: 'right-2.5', md: 'right-3', lg: 'right-3.5' }

    const paddingClass = icon
      ? iconPosition === 'left' ? iconPaddingLeft[inputSize] : iconPaddingRight[inputSize]
      : ''

    return (
      <div>
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-sm font-medium"
            style={{ color: 'var(--color-text)' }}
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span
              className={`absolute top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none ${iconPosition === 'left' ? iconLeftOffset[inputSize] : iconRightOffset[inputSize]}`}
              style={{ color: 'var(--color-muted)' }}
            >
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`w-full rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 ${sizeClasses[inputSize]} ${paddingClass} ${className ?? ''}`}
            style={{
              borderColor: error ? 'var(--color-danger)' : 'var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text)',
              fontFamily: 'var(--font-sans)',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = error ? 'var(--color-danger)' : 'var(--color-primary)'
              e.currentTarget.style.boxShadow = error
                ? '0 0 0 2px var(--color-danger-light)'
                : '0 0 0 2px var(--color-primary-light)'
              props.onFocus?.(e)
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = error ? 'var(--color-danger)' : 'var(--color-border)'
              e.currentTarget.style.boxShadow = 'none'
              props.onBlur?.(e)
            }}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1.5 text-xs" style={{ color: 'var(--color-danger)' }}>
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="mt-1.5 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            {helperText}
          </p>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'
export default Input
