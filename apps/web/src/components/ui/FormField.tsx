import type { ReactNode } from 'react'
import type { FieldError } from 'react-hook-form'

interface FormFieldProps {
  label: string
  error?: FieldError
  required?: boolean
  children: ReactNode
  helperText?: string
}

export default function FormField({ label, error, required, children, helperText }: FormFieldProps) {
  const fieldId = label?.toLowerCase().replace(/\s+/g, '-')
  const errorId = fieldId ? `${fieldId}-error` : undefined

  return (
    <div role="group" aria-labelledby={fieldId ? `${fieldId}-label` : undefined}>
      <label id={fieldId ? `${fieldId}-label` : undefined} className="mb-1 block text-sm font-medium" style={{ color: 'var(--color-text)' }}>
        {label}
        {required && <span style={{ color: 'var(--color-danger)' }} aria-hidden="true"> *</span>}
      </label>
      {children}
      {error && (
        <p id={errorId} className="mt-1 text-xs" style={{ color: 'var(--color-danger-dark)' }} role="alert">
          {error.message}
        </p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          {helperText}
        </p>
      )}
    </div>
  )
}
