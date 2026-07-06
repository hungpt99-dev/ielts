import { forwardRef, type SelectHTMLAttributes, type ReactNode } from 'react'
import { IconChevronDown } from '@ielts/ui'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: SelectOption[]
  placeholder?: string
  icon?: ReactNode
  selectSize?: 'sm' | 'md' | 'lg'
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, icon, selectSize = 'md', className, id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-')
    const sizeClasses = {
      sm: 'px-2.5 py-1.5 text-xs',
      md: 'px-3.5 py-2.5 text-sm',
      lg: 'px-4 py-3 text-base',
    }

    return (
      <div>
        {label && (
          <label
            htmlFor={selectId}
            className="mb-1.5 block text-sm font-medium"
            style={{ color: 'var(--color-text)' }}
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span
              className="absolute top-1/2 -translate-y-1/2 left-3 flex items-center justify-center pointer-events-none"
              style={{ color: 'var(--color-muted)' }}
            >
              {icon}
            </span>
          )}
          <select
            ref={ref}
            id={selectId}
            className={`w-full appearance-none rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 ${sizeClasses[selectSize]} ${icon ? 'pl-10' : ''} ${className ?? ''}`}
            style={{
              borderColor: error ? 'var(--color-danger)' : 'var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-text)',
              fontFamily: 'var(--font-sans)',
              cursor: 'pointer',
              paddingRight: 'var(--spacing-xl)',
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
          >
            {placeholder && <option value="" disabled>{placeholder}</option>}
            {options.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <IconChevronDown
            size={16}
            className="absolute top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ right: 'var(--spacing-sm)', color: 'var(--color-muted)' }}
          />
        </div>
        {error && (
          <p className="mt-1.5 text-xs" style={{ color: 'var(--color-danger)' }}>
            {error}
          </p>
        )}
      </div>
    )
  },
)

Select.displayName = 'Select'
export default Select
