import { useState, useEffect, useCallback } from 'react'
import { IconRefresh, IconWifi, IconWifiOff, IconAlertCircle } from '@ielts/ui'
import { safeStorageSet } from '../../utils/safe-chrome'

type SyncStatusType = 'synced' | 'syncing' | 'error' | 'disconnected'

interface SyncStatusBadgeProps {
  showTime?: boolean
  onRetry?: () => void
  compact?: boolean
}

function formatTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const mins = Math.floor(diff / 60000)

  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

const statusConfig: Record<SyncStatusType, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  synced: {
    label: 'Synced',
    icon: <IconWifi size={14} />,
    color: 'var(--color-success-dark)',
    bg: 'var(--color-success-light)',
  },
  syncing: {
    label: 'Syncing…',
    icon: <IconRefresh size={14} />,
    color: 'var(--color-primary-dark)',
    bg: 'var(--color-primary-light)',
  },
  error: {
    label: 'Sync error',
    icon: <IconAlertCircle size={14} />,
    color: 'var(--color-danger-dark)',
    bg: 'var(--color-danger-light)',
  },
  disconnected: {
    label: 'Offline',
    icon: <IconWifiOff size={14} />,
    color: 'var(--color-muted)',
    bg: 'var(--color-surface-alt)',
  },
}

export function SyncStatusBadge({ showTime = false, onRetry, compact = false }: SyncStatusBadgeProps) {
  const [status, setStatus] = useState<SyncStatusType>('synced')
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)

  const checkSync = useCallback(async () => {
    try {
      const result = await new Promise<any>((resolve, reject) => {
        chrome.storage.local.get(['lastSyncTime', 'lastSyncError'], (data) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message))
          } else {
            resolve(data)
          }
        })
      })

      if (result.lastSyncError) {
        setStatus('error')
        return
      }

      if (result.lastSyncTime) {
        const syncDate = new Date(result.lastSyncTime)
        setLastSyncTime(syncDate)

        const hoursSinceSync = (Date.now() - syncDate.getTime()) / (1000 * 60 * 60)
        if (hoursSinceSync > 48) {
          setStatus('disconnected')
        } else {
          setStatus('synced')
        }
      } else {
        setStatus('disconnected')
      }
    } catch {
      setStatus('disconnected')
    }
  }, [])

  useEffect(() => {
    checkSync()
    const interval = setInterval(checkSync, 30000)
    return () => clearInterval(interval)
  }, [checkSync])

  const handleRetry = useCallback(async () => {
    setStatus('syncing')
    try {
      await safeStorageSet({ lastSyncTime: new Date().toISOString() })
      setStatus('synced')
      setLastSyncTime(new Date())
      onRetry?.()
    } catch {
      setStatus('error')
    }
  }, [onRetry])

  const config = statusConfig[status]

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: compact ? 'var(--spacing-2xs)' : 'var(--spacing-xs)',
          padding: compact ? 'var(--spacing-3xs) var(--spacing-xs)' : 'var(--spacing-2xs) var(--spacing-sm)',
          borderRadius: 'var(--radius-full)',
          background: config.bg,
          color: config.color,
          fontSize: compact ? 'var(--text-xs)' : 'var(--text-sm)',
          fontWeight: 'var(--weight-medium)',
          fontFamily: 'var(--font-sans)',
          lineHeight: 'var(--leading-normal)',
          whiteSpace: 'nowrap',
          transition: 'all var(--transition-fast)',
        }}
        role="status"
        aria-label={`Sync status: ${config.label}`}
      >
        {config.icon}
        {!compact && <span>{config.label}</span>}
        {status === 'syncing' && (
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: 'var(--radius-full)',
              background: 'currentColor',
              animation: 'pulse 1.5s ease-in-out infinite',
              flexShrink: 0,
            }}
          />
        )}
      </span>

      {status === 'error' && (
        <button
          onClick={handleRetry}
          aria-label="Retry sync"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 'var(--spacing-2xs)',
            padding: 'var(--spacing-3xs) var(--spacing-xs)',
            background: 'none',
            border: 'none',
            borderRadius: 'var(--radius-full)',
            cursor: 'pointer',
            color: 'var(--color-danger)',
            fontSize: 'var(--text-xs)',
            fontWeight: 'var(--weight-medium)',
            fontFamily: 'var(--font-sans)',
            lineHeight: 1,
            transition: 'all var(--transition-fast)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-danger-light)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'none' }}
        >
          <IconRefresh size={12} />
          Retry
        </button>
      )}

      {showTime && lastSyncTime && status === 'synced' && (
        <span
          style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--color-muted)',
            fontFamily: 'var(--font-sans)',
            fontWeight: 'var(--weight-normal)',
            whiteSpace: 'nowrap',
          }}
        >
          {formatTime(lastSyncTime)}
        </span>
      )}
    </span>
  )
}
