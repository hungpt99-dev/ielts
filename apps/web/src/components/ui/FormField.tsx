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
  return (
    <div>
      <label className="mb-1 block text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
        {label}
        {required && <span style={{ color: 'var(--color-danger)' }}> *</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-xs" style={{ color: 'var(--color-danger)' }}>
          {error.message}
        </p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-xs" style={{ color: 'var(--color-muted)' }}>
          {helperText}
        </p>
      )}
    </div>
  )
}
