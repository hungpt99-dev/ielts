import { type InputHTMLAttributes, type ReactNode, forwardRef } from 'react'

export type InputSize = 'sm' | 'md' | 'lg'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  inputSize?: InputSize
  label?: string
  helperText?: string
  error?: string
  icon?: ReactNode
  iconPosition?: 'left' | 'right'
  fullWidth?: boolean
  inputStyle?: Record<string, string>
}

const sizeStyle: Record<InputSize, Record<string, string>> = {
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

const iconSizeStyle: Record<InputSize, Record<string, string>> = {
  sm: { paddingLeft: 'calc(var(--spacing-xl) + var(--spacing-2xs))' },
  md: { paddingLeft: 'calc(var(--spacing-xl) + var(--spacing-xs))' },
  lg: { paddingLeft: 'calc(var(--spacing-2xl) + var(--spacing-xs))' },
}

const iconRightSizeStyle: Record<InputSize, Record<string, string>> = {
  sm: { paddingRight: 'calc(var(--spacing-xl) + var(--spacing-2xs))' },
  md: { paddingRight: 'calc(var(--spacing-xl) + var(--spacing-xs))' },
  lg: { paddingRight: 'calc(var(--spacing-2xl) + var(--spacing-xs))' },
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { inputSize = 'md', label, helperText, error, icon, iconPosition = 'left', fullWidth = true, style, ...props },
  ref,
) {
  const isLeftIcon = icon && iconPosition === 'left'
  const isRightIcon = icon && iconPosition === 'right'

  const inputStyle: Record<string, string> = {
    width: fullWidth ? '100%' : ('auto' as string),
    fontFamily: 'var(--font-sans)',
    fontWeight: 'var(--weight-normal)',
    color: 'var(--color-text)',
    background: 'var(--color-surface)',
    border: `1px solid ${error ? 'var(--color-danger)' : 'var(--color-border)'}`,
    outline: 'none',
    transition: 'all var(--transition-fast)',
    lineHeight: 'var(--leading-normal)',
    display: 'block',
    boxSizing: 'border-box',
    ...sizeStyle[inputSize],
    ...(isLeftIcon ? iconSizeStyle[inputSize] : {}),
    ...(isRightIcon ? iconRightSizeStyle[inputSize] : {}),
  }
  const inputWidthStyle: Record<string, string> = {
    width: fullWidth ? '100%' : ('auto' as string),
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-2xs)',
        ...inputWidthStyle,
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
              [iconPosition === 'left' ? 'left' : 'right']: 'var(--spacing-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-muted)',
              pointerEvents: 'none',
              fontSize: sizeStyle[inputSize].fontSize,
            }}
          >
            {icon}
          </span>
        )}
        <input
          ref={ref}
          style={{ ...inputStyle, ...(style as Record<string, string>) } as Record<string, string>}
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
