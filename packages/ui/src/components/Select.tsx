import { type SelectHTMLAttributes, type ReactNode, forwardRef } from 'react'
import { IconChevronDown } from '../icons/IconMap'

export type SelectSize = 'sm' | 'md' | 'lg'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  selectSize?: SelectSize
  label?: string
  helperText?: string
  error?: string
  options: SelectOption[]
  placeholder?: string
  fullWidth?: boolean
  icon?: ReactNode
}

const sizeStyle: Record<SelectSize, Record<string, string>> = {
  sm: {
    padding: 'var(--spacing-xs) var(--spacing-sm)',
    fontSize: 'var(--text-sm)',
    borderRadius: 'var(--radius-lg)',
  },
  md: {
    padding: 'var(--spacing-sm) var(--spacing-md)',
    fontSize: 'var(--text-sm)',
    borderRadius: 'var(--radius-xl)',
  },
  lg: {
    padding: 'var(--spacing-md) var(--spacing-lg)',
    fontSize: 'var(--text-base)',
    borderRadius: 'var(--radius-xl)',
  },
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { selectSize = 'md', label, helperText, error, options, placeholder, fullWidth = true, icon, style, ...props },
  ref,
) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-2xs)',
        width: fullWidth ? '100%' : 'auto',
      }}
    >
      {label && (
        <label
          style={{
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--weight-medium)',
            color: 'var(--color-text)',
            fontFamily: 'var(--font-sans)',
          }}
        >
          {label}
        </label>
      )}
      <div style={{ position: 'relative', width: fullWidth ? '100%' : undefined }}>
        {icon && (
          <span
            style={{
              position: 'absolute',
              top: '50%',
              transform: 'translateY(-50%)',
              left: 'var(--spacing-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-muted)',
              pointerEvents: 'none',
              fontSize: sizeStyle[selectSize].fontSize,
            }}
          >
            {icon}
          </span>
        )}
        <select
          ref={ref}
          style={{
            width: '100%',
            fontFamily: 'var(--font-sans)',
            fontWeight: 'var(--weight-normal)',
            color: 'var(--color-text)',
            background: 'var(--color-surface)',
            border: `1px solid ${error ? 'var(--color-danger)' : 'var(--color-border)'}`,
            outline: 'none',
            transition: 'all var(--transition-fast)',
            lineHeight: 'var(--leading-normal)',
            boxSizing: 'border-box',
            cursor: 'pointer',
            appearance: 'none',
            WebkitAppearance: 'none',
            MozAppearance: 'none',
            paddingRight: 'var(--spacing-xl)',
            ...sizeStyle[selectSize],
            ...(icon ? { paddingLeft: 'calc(var(--spacing-xl) + var(--spacing-xs))' } : {}),
            ...(style as Record<string, string>),
          } as Record<string, string>}
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
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        <IconChevronDown
          size={16}
          style={{
            position: 'absolute',
            right: 'var(--spacing-sm)',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--color-muted)',
            pointerEvents: 'none',
          }}
        />
      </div>
      {(helperText || error) && (
        <span
          style={{
            fontSize: 'var(--text-xs)',
            color: error ? 'var(--color-danger)' : 'var(--color-text-secondary)',
            fontFamily: 'var(--font-sans)',
            lineHeight: 'var(--leading-normal)',
          }}
        >
          {error || helperText}
        </span>
      )}
    </div>
  )
})
