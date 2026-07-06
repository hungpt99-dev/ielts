import { memo, type ReactNode } from 'react'

interface DashboardCardProps {
  label: string
  value: number
  icon: ReactNode
  accent?: boolean
}

function DashboardCard({ label, value, icon, accent }: DashboardCardProps) {
  return (
    <div
      style={{
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--spacing-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-2xs)',
        border: accent ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span style={{ fontSize: 'var(--text-xl)' }}>{icon}</span>
        <span
          style={{
            fontSize: 'var(--text-xl)',
            fontWeight: 'var(--weight-bold)',
            color: accent ? 'var(--color-primary)' : 'var(--color-text)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {value}
        </span>
      </div>
      <span
        style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--color-text-secondary)',
          fontWeight: 'var(--weight-medium)',
        }}
      >
        {label}
      </span>
    </div>
  )
}

export default memo(DashboardCard)
