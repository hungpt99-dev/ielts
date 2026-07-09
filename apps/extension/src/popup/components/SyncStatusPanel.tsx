import { useState, useEffect } from 'react'

interface AutoSyncSettings {
  enabled: boolean
  syncDebounceMs: number
}

interface SyncStatus {
  state: string
  at?: string
  error?: string
}

function formatTime(iso: string | undefined): string {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Just now'
  if (m < 60) return `${m} min ago`
  return `${Math.floor(m / 60)}h ago`
}

async function fetchSettings(): Promise<AutoSyncSettings> {
  const res = await chrome.runtime.sendMessage({ type: 'GET_AUTO_SYNC_SETTINGS' })
  return res?.data || { enabled: false, syncDebounceMs: 3000 }
}

async function fetchStatus(): Promise<SyncStatus> {
  const res = await chrome.runtime.sendMessage({ type: 'GET_SYNC_STATUS' })
  return res?.data || { state: 'idle' }
}

export default function SyncStatusPanel({ onBack }: { onBack?: () => void }) {
  const [settings, setSettings] = useState<AutoSyncSettings>({ enabled: false, syncDebounceMs: 3000 })
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({ state: 'idle' })

  const refresh = () => {
    fetchSettings().then(setSettings)
    fetchStatus().then(setSyncStatus)
  }

  useEffect(() => { refresh() }, [])

  const isBusy = syncStatus.state === 'syncing'
  const isOnline = navigator.onLine

  async function toggleAutoSync() {
    const updated = { ...settings, enabled: !settings.enabled }
    await chrome.runtime.sendMessage({ type: 'SAVE_AUTO_SYNC_SETTINGS', payload: updated })
    setSettings(updated)
  }

  async function handleSyncNow() {
    await chrome.runtime.sendMessage({ type: 'TRIGGER_AUTO_SYNC' })
    refresh()
    setTimeout(refresh, 3000)
  }

  return (
    <div style={{ padding: 'var(--spacing-md)', width: 'var(--ext-width)', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
        {onBack && (
          <button onClick={onBack} style={{
            background: 'none', border: 'none', color: 'var(--color-muted)', cursor: 'pointer',
            padding: 'var(--spacing-2xs)', display: 'flex', alignItems: 'center', fontSize: 'var(--text-lg)',
          }} aria-label="Back">
            ←
          </button>
        )}
        <h2 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)', fontFamily: 'var(--font-sans)' }}>
          Data Sync
        </h2>
      </div>
      <p style={{ margin: '0 0 var(--spacing-md)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans)' }}>
        Keep your data up to date between the extension and web app.
      </p>

      {/* Auto sync toggle */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: 'var(--spacing-sm) var(--spacing-md)',
        borderRadius: 'var(--radius-lg)', background: 'var(--color-surface)',
        border: '1px solid var(--color-border)', marginBottom: 'var(--spacing-sm)',
      }}>
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text)', fontFamily: 'var(--font-sans)' }}>
          Auto sync
        </span>
        <button
          onClick={toggleAutoSync}
          aria-label={settings.enabled ? 'Disable auto sync' : 'Enable auto sync'}
          style={{
            width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
            background: settings.enabled ? 'var(--color-primary)' : 'var(--color-border)',
            position: 'relative', transition: 'background 0.2s', flexShrink: 0,
          }}
        >
          <span style={{
            position: 'absolute', top: 2, width: 20, height: 20, borderRadius: '50%',
            background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            left: settings.enabled ? 22 : 2,
          }} />
        </button>
      </div>

      {/* Status */}
      <div style={{
        padding: 'var(--spacing-sm) var(--spacing-md)',
        borderRadius: 'var(--radius-lg)',
        background: syncStatus.state === 'success' ? 'var(--color-success-light)' :
                    syncStatus.state === 'failed' ? 'var(--color-danger-light)' : 'var(--color-surface-alt)',
        marginBottom: 'var(--spacing-sm)',
        fontSize: 'var(--text-sm)', fontFamily: 'var(--font-sans)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%',
            background: syncStatus.state === 'syncing' ? 'var(--color-primary)' :
                        syncStatus.state === 'success' ? 'var(--color-success)' :
                        syncStatus.state === 'failed' ? 'var(--color-danger)' :
                        !isOnline ? 'var(--color-muted)' : 'var(--color-muted)',
          }} />
          <span style={{ fontWeight: 'var(--weight-medium)' }}>
            {!isOnline ? 'Offline — will sync when online' :
             syncStatus.state === 'syncing' ? 'Syncing...' :
             syncStatus.state === 'success' ? 'Synced successfully' :
             syncStatus.state === 'failed' ? `Sync failed${syncStatus.error ? `: ${syncStatus.error}` : ''}` :
             settings.enabled ? 'Auto sync is on' : 'Auto sync is off'}
          </span>
        </div>
        {syncStatus.at && (
          <div style={{ marginTop: 'var(--spacing-2xs)', fontSize: 'var(--text-xs)', opacity: 0.7 }}>
            Last synced {formatTime(syncStatus.at)}
          </div>
        )}
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
        <button onClick={handleSyncNow} disabled={isBusy || !isOnline} style={{
          flex: 1, padding: 'var(--spacing-sm)',
          borderRadius: 'var(--radius-lg)', border: 'none',
          background: isBusy ? 'var(--color-surface-alt)' : 'var(--color-primary)',
          color: isBusy ? 'var(--color-text-secondary)' : '#fff',
          fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)',
          cursor: isBusy ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-sans)',
        }}>
          {isBusy ? 'Syncing...' : 'Sync Now'}
        </button>
      </div>

      {syncStatus.state === 'failed' && (
        <button onClick={handleSyncNow} style={{
          width: '100%', marginTop: 'var(--spacing-xs)',
          padding: 'var(--spacing-2xs) var(--spacing-sm)',
          borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)',
          background: 'transparent', color: 'var(--color-text-secondary)',
          fontSize: 'var(--text-xs)', cursor: 'pointer', fontFamily: 'var(--font-sans)',
        }}>
          Retry Sync
        </button>
      )}
    </div>
  )
}
