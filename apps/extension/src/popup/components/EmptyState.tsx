import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  compact?: boolean
}

export default function EmptyState({ icon, title, description, action, compact }: EmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: compact ? '24px 16px' : '48px 24px',
        gap: '8px',
        textAlign: 'center',
        flex: 1,
        minHeight: compact ? 'auto' : '300px',
      }}
    >
      {icon ? (
        <div style={{ fontSize: '28px', opacity: 0.4, lineHeight: 1 }}>
          {icon}
        </div>
      ) : (
        <svg
          style={{ width: '36px', height: '36px', color: 'var(--color-muted)', opacity: 0.4 }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
      )}
      <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--color-muted)' }}>
        {title}
      </p>
      {description && (
        <p style={{ margin: 0, fontSize: '12px', color: 'var(--color-muted)', lineHeight: 1.5, maxWidth: '280px' }}>
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          style={{
            marginTop: '4px',
            padding: '8px 16px',
            borderRadius: 'var(--radius-md)',
            border: 'none',
            background: 'var(--color-primary)',
            color: '#fff',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
