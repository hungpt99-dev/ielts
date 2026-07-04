import { memo } from 'react'

interface DashboardCardProps {
  label: string
  value: number
  icon: string
  accent?: boolean
}

function DashboardCard({ label, value, icon, accent }: DashboardCardProps) {
  return (
    <div
      style={{
        background: 'var(--color-surface)',
        borderRadius: 'var(--radius-lg)',
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
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
        <span style={{ fontSize: '20px' }}>{icon}</span>
        <span
          style={{
            fontSize: '20px',
            fontWeight: 700,
            color: accent ? 'var(--color-primary)' : 'var(--color-text)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {value}
        </span>
      </div>
      <span
        style={{
          fontSize: '11px',
          color: 'var(--color-text-secondary)',
          fontWeight: 500,
        }}
      >
        {label}
      </span>
    </div>
  )
}

export default memo(DashboardCard)
