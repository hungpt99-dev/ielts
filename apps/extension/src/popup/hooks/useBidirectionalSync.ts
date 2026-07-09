import { useState, useCallback } from 'react'

export type SyncState = 'idle' | 'checking' | 'website_not_open' | 'website_connected' | 'syncing' | 'completed' | 'error'

export interface SyncResult {
  state: SyncState
  created?: number
  updated?: number
  failed?: number
  completedAt?: string
  error?: string
}

export function useBidirectionalSync(): {
  state: SyncState
  result: SyncResult | null
  checkWebsite: () => Promise<void>
  startSync: () => Promise<void>
  openWebsite: () => void
  reset: () => void
} {
  const [state, setState] = useState<SyncState>('idle')
  const [result, setResult] = useState<SyncResult | null>(null)

  const checkWebsite = useCallback(async () => {
    setState('checking')
    try {
      const response = await chrome.runtime.sendMessage({ type: 'CHECK_WEB_CONNECTION' })
      if (response?.connected) {
        setState('website_connected')
      } else {
        setState('website_not_open')
      }
    } catch {
      setState('website_not_open')
    }
  }, [])

  const startSync = useCallback(async () => {
    setState('syncing')
    setResult(null)
    try {
      const response = await chrome.runtime.sendMessage({ type: 'BIDIRECTIONAL_SYNC' })
      if (response?.failed) {
        setState('error')
        setResult({ state: 'error', error: response.error || 'Sync failed' })
      } else {
        setState('completed')
        setResult({
          state: 'completed',
          created: response.created ?? 0,
          updated: response.updated ?? 0,
          failed: response.failed ?? 0,
          completedAt: response.completedAt,
        })
      }
    } catch (err) {
      setState('error')
      setResult({ state: 'error', error: err instanceof Error ? err.message : 'Sync failed' })
    }
  }, [])

  const openWebsite = useCallback(() => {
    chrome.tabs.create({ url: 'https://ieltsjourney.dev' })
    setState('checking')
  }, [])

  const reset = useCallback(() => {
    setState('idle')
    setResult(null)
  }, [])

  return { state, result, checkWebsite, startSync, openWebsite, reset }
}
