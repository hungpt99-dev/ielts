import { forwardRef, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div>
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1 block text-sm font-medium"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-1 ${
            className ?? ''
          }`}
          style={{
            borderColor: error ? 'var(--color-danger)' : 'var(--color-border)',
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text)',
          }}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs" style={{ color: 'var(--color-danger)' }}>
            {error}
          </p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-xs" style={{ color: 'var(--color-muted)' }}>
            {helperText}
          </p>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'
export default Input
