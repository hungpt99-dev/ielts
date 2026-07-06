import { type HTMLAttributes } from 'react'

export type SyncStatus = 'synced' | 'syncing' | 'error' | 'disconnected'

export interface ExtensionSyncStatusBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  status: SyncStatus
  size?: 'sm' | 'md'
}

const statusConfig: Record<SyncStatus, { label: string; color: string; bg: string }> = {
  synced: {
    label: 'Synced',
    color: 'var(--color-success-dark)',
    bg: 'var(--color-success-light)',
  },
  syncing: {
    label: 'Syncing…',
    color: 'var(--color-primary-dark)',
    bg: 'var(--color-primary-light)',
  },
  error: {
    label: 'Sync error',
    color: 'var(--color-danger-dark)',
    bg: 'var(--color-danger-light)',
  },
  disconnected: {
    label: 'Disconnected',
    color: 'var(--color-muted)',
    bg: 'var(--color-surface-alt)',
  },
}

export function ExtensionSyncStatusBadge({
  status,
  size = 'sm',
  style,
  ...props
}: ExtensionSyncStatusBadgeProps) {
  const config = statusConfig[status]
  const isCompact = size === 'sm'

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--spacing-2xs)',
        padding: isCompact ? 'var(--spacing-3xs) var(--spacing-xs)' : 'var(--spacing-2xs) var(--spacing-sm)',
        borderRadius: 'var(--radius-full)',
        background: config.bg,
        color: config.color,
        fontSize: isCompact ? 'var(--text-xs)' : 'var(--text-sm)',
        fontWeight: 'var(--weight-medium)',
        fontFamily: 'var(--font-sans)',
        lineHeight: 'var(--leading-normal)',
        whiteSpace: 'nowrap',
        ...(style as Record<string, string>),
      }}
      role="status"
      aria-label={`Sync status: ${config.label}`}
      {...props}
    >
      <span
        style={{
          width: isCompact ? '6px' : '8px',
          height: isCompact ? '6px' : '8px',
          borderRadius: 'var(--radius-full)',
          background: 'currentColor',
          flexShrink: 0,
          animation: status === 'syncing' ? 'pulse 1.5s ease-in-out infinite' : 'none',
        }}
      />
      {config.label}
    </span>
  )
}
