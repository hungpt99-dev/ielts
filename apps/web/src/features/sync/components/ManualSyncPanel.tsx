import { useState } from 'react'
import { useExtensionBridgeStatus } from '../hooks/useExtensionBridgeStatus'
import { syncBidirectional } from '../services/SyncService'
import Card, { CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import Button from '../../../components/ui/Button'

function statusLabel(status: ReturnType<typeof useExtensionBridgeStatus>['status']): {
  text: string
  color: string
  dotColor: string
} {
  switch (status.state) {
    case 'checking':
      return { text: 'Checking extension...', color: 'var(--color-muted)', dotColor: 'var(--color-muted)' }
    case 'connected':
      return { text: `Extension connected v${status.version}`, color: 'var(--color-success-dark)', dotColor: 'var(--color-success)' }
    case 'not_detected':
      return { text: 'Extension not detected', color: 'var(--color-danger)', dotColor: 'var(--color-danger)' }
    case 'error':
      return { text: `Extension error: ${status.message}`, color: 'var(--color-danger)', dotColor: 'var(--color-danger)' }
  }
}

export default function ManualSyncPanel() {
  const { status, check } = useExtensionBridgeStatus()
  const [syncing, setSyncing] = useState(false)
  const [resultMessage, setResultMessage] = useState('')
  const [resultIsError, setResultIsError] = useState(false)

  const label = statusLabel(status)
  const isConnected = status.state === 'connected'
  const isBusy = syncing || status.state === 'checking'

  async function handleSync() {
    setSyncing(true)
    setResultMessage('')
    setResultIsError(false)
    try {
      const r = await syncBidirectional()
      if (!r.toExt.success && !r.fromExt.success) {
        setResultIsError(true)
        setResultMessage(r.toExt.error || 'Sync failed')
        return
      }
      const parts: string[] = []
      if (r.toExt.dataImported > 0) parts.push(`${r.toExt.dataImported} sent to extension`)
      if (r.toExt.dataUpdated > 0) parts.push(`${r.toExt.dataUpdated} updated in extension`)
      if (r.fromExt.dataImported > 0) parts.push(`${r.fromExt.dataImported} received from extension`)
      if (r.toExt.settingsUpdated || r.fromExt.settingsUpdated) parts.push('settings synced')
      setResultMessage(`Sync complete: ${parts.join(', ') || 'no changes'}`)
    } catch (err) {
      console.error('apps/web/src/features/sync/components/ManualSyncPanel.tsx error:', err);
      setResultIsError(true)
      setResultMessage(err instanceof Error ? err.message : 'Sync failed')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manual Data Sync</CardTitle>
      </CardHeader>
      <CardContent>
        <p style={{
          fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)',
          fontFamily: 'var(--font-sans)', marginBottom: 'var(--spacing-md)',
        }}>
          Syncs vocabulary, mistakes, and AI settings in both directions between the web app and browser extension. Only happens when you click the button.
        </p>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)',
          marginBottom: 'var(--spacing-md)',
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: label.dotColor, flexShrink: 0,
          }} />
          <span style={{
            fontSize: 'var(--text-sm)', color: label.color,
            fontFamily: 'var(--font-sans)',
          }}>
            {label.text}
          </span>
        </div>

        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
          <Button
            size="md"
            onClick={handleSync}
            loading={syncing}
            disabled={!isConnected || isBusy}
            aria-label="Sync data bidirectionally between web app and extension"
          >
            {syncing ? 'Syncing...' : 'Sync Now'}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={check}
            disabled={isBusy}
            aria-label="Check extension connection again"
          >
            Check again
          </Button>
        </div>

        {resultMessage && (
          <div style={{
            marginTop: 'var(--spacing-md)',
            padding: 'var(--spacing-sm) var(--spacing-md)',
            borderRadius: 'var(--radius-lg)',
            background: resultIsError ? 'var(--color-danger-light)' : 'var(--color-success-light)',
            border: `1px solid ${resultIsError ? 'var(--color-danger)' : 'var(--color-success)'}`,
            fontSize: 'var(--text-sm)',
            fontFamily: 'var(--font-sans)',
            color: resultIsError ? 'var(--color-danger)' : 'var(--color-success-dark)',
          }}>
            {resultMessage}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
