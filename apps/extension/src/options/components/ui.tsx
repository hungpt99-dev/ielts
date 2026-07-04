import type { ReactNode } from 'react'

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
      }}
    >
      <h2
        style={{
          fontSize: '13px',
          fontWeight: 600,
          color: 'var(--color-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          margin: '0 0 16px',
        }}
      >
        {title}
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>{children}</div>
    </section>
  )
}

export function Field({ label, error, required, children }: { label: string; error?: string; required?: boolean; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
        {label}
        {required && <span style={{ color: 'var(--color-danger)', marginLeft: '2px' }}>*</span>}
      </label>
      {children}
      {error && (
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-danger)', lineHeight: '1.4' }}>{error}</p>
      )}
    </div>
  )
}

export function ToggleField({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description?: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '16px',
      }}
    >
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text)' }}>{label}</span>
        {description && (
          <p
            style={{
              margin: '2px 0 0',
              fontSize: '12px',
              color: 'var(--color-text-secondary)',
              lineHeight: '1.4',
            }}
          >
            {description}
          </p>
        )}
      </div>
      <button
        onClick={() => onChange(!checked)}
        style={{
          width: '44px',
          height: '24px',
          borderRadius: '12px',
          border: 'none',
          background: checked ? 'var(--color-primary)' : 'var(--color-border)',
          cursor: 'pointer',
          position: 'relative',
          transition: 'background 0.2s',
          flexShrink: 0,
          marginTop: '2px',
        }}
        role="switch"
        aria-checked={checked}
      >
        <span
          style={{
            position: 'absolute',
            top: '2px',
            left: checked ? '22px' : '2px',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: '#ffffff',
            transition: 'left 0.2s',
          }}
        />
      </button>
    </div>
  )
}

export const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border)',
  background: 'var(--color-background)',
  color: 'var(--color-text)',
  fontSize: '14px',
  outline: 'none',
}

export const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: 'auto',
}

export const buttonStyle: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border)',
  background: 'var(--color-background)',
  color: 'var(--color-text)',
  fontSize: '13px',
  fontWeight: 500,
  cursor: 'pointer',
}
