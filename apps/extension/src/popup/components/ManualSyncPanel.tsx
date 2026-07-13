import { useEffect } from 'react'
import { useBidirectionalSync } from '../hooks/useBidirectionalSync'

function formatTime(iso: string | undefined): string {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Just now'
  if (m < 60) return `${m} min ago`
  return `${Math.floor(m / 60)}h ago`
}

export default function ManualSyncPanel({ onBack }: { onBack: () => void }) {
  const { state, result, checkWebsite, startSync, openWebsite } = useBidirectionalSync()

  useEffect(() => { checkWebsite() }, [checkWebsite])

  const isBusy = state === 'syncing' || state === 'checking'

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)',
      padding: 'var(--spacing-md)', width: 'var(--ext-width)', boxSizing: 'border-box',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
        <button onClick={onBack} style={{
          background: 'none', border: 'none', color: 'var(--color-muted)', cursor: 'pointer',
          padding: 'var(--spacing-2xs)', display: 'flex', alignItems: 'center', fontSize: 'var(--text-lg)',
        }} aria-label="Back">
          ←
        </button>
        <h2 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 'var(--weight-semibold)', color: 'var(--color-text)', fontFamily: 'var(--font-sans)' }}>
          Manual Data Sync
        </h2>
      </div>

      <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans)', lineHeight: 1.5 }}>
        Sync your IELTS Journey data between this extension and the web app. Sync only happens when you click the button.
      </p>

      {/* Status */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)',
        padding: 'var(--spacing-sm) var(--spacing-md)',
        borderRadius: 'var(--radius-lg)',
        background: state === 'website_not_open' ? 'var(--color-danger-light)' : 'var(--color-success-light)',
      }}>
        <span style={{
          width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
          background: state === 'checking' ? 'var(--color-muted)' :
                     state === 'website_connected' ? 'var(--color-success)' :
                     state === 'website_not_open' ? 'var(--color-danger)' :
                     state === 'syncing' ? 'var(--color-primary)' :
                     state === 'completed' ? 'var(--color-success)' : 'var(--color-danger)',
        }} />
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text)', fontFamily: 'var(--font-sans)' }}>
          {state === 'idle' && 'Ready'}
          {state === 'checking' && 'Checking website connection...'}
          {state === 'website_connected' && 'Website connected'}
          {state === 'website_not_open' && 'Website not open'}
          {state === 'syncing' && 'Syncing...'}
          {state === 'completed' && 'Sync completed'}
          {state === 'error' && 'Sync failed'}
        </span>
      </div>

      {/* Sync Now button */}
      {state === 'website_connected' && (
        <button onClick={startSync} disabled={isBusy} style={{
          width: '100%', padding: 'var(--spacing-sm) var(--spacing-md)',
          borderRadius: 'var(--radius-lg)', border: 'none',
          background: 'var(--color-primary)', color: '#fff',
          fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)',
          cursor: isBusy ? 'not-allowed' : 'pointer', opacity: isBusy ? 0.6 : 1,
          fontFamily: 'var(--font-sans)',
        }}>
          {isBusy ? 'Syncing...' : 'Sync Now'}
        </button>
      )}

      {/* Open Website button */}
      {state === 'website_not_open' && (
        <button onClick={openWebsite} style={{
          width: '100%', padding: 'var(--spacing-sm) var(--spacing-md)',
          borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-primary)',
          background: 'transparent', color: 'var(--color-primary)',
          fontSize: 'var(--text-sm)', fontWeight: 'var(--weight-semibold)',
          cursor: 'pointer', fontFamily: 'var(--font-sans)',
        }}>
          Open IELTS Journey Website
        </button>
      )}

      {/* Try again button */}
      {(state === 'website_not_open' || state === 'error') && (
        <button onClick={checkWebsite} disabled={isBusy} style={{
          width: '100%', padding: 'var(--spacing-xs) var(--spacing-sm)',
          borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)',
          background: 'transparent', color: 'var(--color-text-secondary)',
          fontSize: 'var(--text-xs)', cursor: isBusy ? 'not-allowed' : 'pointer',
          fontFamily: 'var(--font-sans)', marginTop: 'var(--spacing-2xs)',
        }}>
          Check again
        </button>
      )}

      {/* Result summary */}
      {result && result.state === 'completed' && (
        <div style={{
          padding: 'var(--spacing-sm) var(--spacing-md)',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--color-success-light)',
          fontSize: 'var(--text-xs)', fontFamily: 'var(--font-sans)',
          color: 'var(--color-success-dark)',
        }}>
          <div style={{ fontWeight: 'var(--weight-semibold)', marginBottom: 'var(--spacing-2xs)' }}>
            Sync completed
          </div>
          <div>Created: {result.created} · Updated: {result.updated}</div>
          {result.failed ? <div>Failed: {result.failed}</div> : null}
          {result.completedAt && <div style={{ marginTop: 'var(--spacing-2xs)', opacity: 0.7 }}>Completed {formatTime(result.completedAt)}</div>}
        </div>
      )}

      {result && result.state === 'error' && (
        <div style={{
          padding: 'var(--spacing-sm) var(--spacing-md)',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--color-danger-light)',
          fontSize: 'var(--text-xs)', fontFamily: 'var(--font-sans)',
          color: 'var(--color-danger)',
        }}>
          {result.error || 'Sync failed'}
        </div>
      )}
    </div>
  )
}
