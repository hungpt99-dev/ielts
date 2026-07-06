import { forwardRef, type InputHTMLAttributes, useState, useCallback } from 'react'
import { IconSearch, IconClose } from '@ielts/ui'

interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  inputSize?: 'sm' | 'md' | 'lg'
  onClear?: () => void
}

const sizeStyles = {
  sm: { padding: 'var(--spacing-xs) var(--spacing-sm)', paddingLeft: 'calc(var(--spacing-xl) + var(--spacing-2xs))', fontSize: 'var(--text-xs)', borderRadius: 'var(--radius-lg)' },
  md: { padding: 'var(--spacing-sm) var(--spacing-md)', paddingLeft: 'calc(var(--spacing-2xl) + var(--spacing-xs))', fontSize: 'var(--text-sm)', borderRadius: 'var(--radius-xl)' },
  lg: { padding: 'var(--spacing-md) var(--spacing-lg)', paddingLeft: 'calc(var(--spacing-2xl) + var(--spacing-sm))', fontSize: 'var(--text-base)', borderRadius: 'var(--radius-xl)' },
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  { inputSize = 'md', onClear, onChange, value, ...props },
  ref,
) {
  const [internalValue, setInternalValue] = useState('')
  const isControlled = value !== undefined
  const currentValue = isControlled ? value : internalValue

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!isControlled) setInternalValue(e.target.value)
      onChange?.(e)
    },
    [isControlled, onChange],
  )

  const handleClear = useCallback(() => {
    if (!isControlled) setInternalValue('')
    onClear?.()
  }, [isControlled, onClear])

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <IconSearch
        size={inputSize === 'sm' ? 14 : 16}
        style={{
          position: 'absolute',
          left: 'var(--spacing-sm)',
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'var(--color-muted)',
          pointerEvents: 'none',
        }}
      />
      <input
        ref={ref}
        type="text"
        value={currentValue}
        onChange={handleChange}
        style={{
          width: '100%',
          fontFamily: 'var(--font-sans)',
          fontWeight: 'var(--weight-normal)',
          color: 'var(--color-text)',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          outline: 'none',
          transition: 'all var(--transition-fast)',
          lineHeight: 'var(--leading-normal)',
          boxSizing: 'border-box',
          ...sizeStyles[inputSize],
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-primary)'
          e.currentTarget.style.boxShadow = '0 0 0 2px var(--color-primary-light)'
          props.onFocus?.(e)
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-border)'
          e.currentTarget.style.boxShadow = 'none'
          props.onBlur?.(e)
        }}
        {...props}
      />
      {currentValue && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={handleClear}
          style={{
            position: 'absolute',
            right: 'var(--spacing-sm)',
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 'var(--spacing-lg)',
            height: 'var(--spacing-lg)',
            padding: '0',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--color-muted)',
            borderRadius: 'var(--radius-full)',
            transition: 'all var(--transition-fast)',
            fontSize: inputSize === 'sm' ? '12px' : '14px',
          }}
        >
          <IconClose size={inputSize === 'sm' ? 12 : 14} />
        </button>
      )}
    </div>
  )
})
