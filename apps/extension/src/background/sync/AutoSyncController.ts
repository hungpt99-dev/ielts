import { syncLock } from './SyncLock'
import { SyncScheduler } from './SyncScheduler'
import { syncBidirectional } from './bidirectionalSyncController'
import { findWebAppTab } from './webTabConnection'

const SETTINGS_KEY = 'ielts-auto-sync-settings'

export interface AutoSyncSettings {
  enabled: boolean
  syncOnWebsiteOpen: boolean
  syncOnExtensionOpen: boolean
  syncOnReconnect: boolean
  syncDebounceMs: number
  syncRetryLimit: number
}

export const DEFAULT_SETTINGS: AutoSyncSettings = {
  enabled: false,
  syncOnWebsiteOpen: true,
  syncOnExtensionOpen: true,
  syncOnReconnect: true,
  syncDebounceMs: 3000,
  syncRetryLimit: 3,
}

export type SyncStatus =
  | { state: 'idle' }
  | { state: 'syncing' }
  | { state: 'success'; at: string }
  | { state: 'failed'; at: string; error?: string }
  | { state: 'waiting_for_web' }
  | { state: 'offline' }

export function loadSettings(): Promise<AutoSyncSettings> {
  return new Promise((resolve) => {
    chrome.storage.local.get([SETTINGS_KEY], (result) => {
      resolve({ ...DEFAULT_SETTINGS, ...(result[SETTINGS_KEY] || {}) } as AutoSyncSettings)
    })
  })
}

export function saveSettings(settings: AutoSyncSettings): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [SETTINGS_KEY]: settings }, resolve)
  })
}

let syncStatus: SyncStatus = { state: 'idle' }
const statusListeners = new Set<(s: SyncStatus) => void>()

export function getSyncStatus(): SyncStatus {
  return syncStatus
}

export function onSyncStatusChange(fn: (s: SyncStatus) => void): () => void {
  statusListeners.add(fn)
  return () => statusListeners.delete(fn)
}

function setSyncStatus(s: SyncStatus): void {
  syncStatus = s
  for (const fn of statusListeners) { try { fn(s) } catch {} }
}

const scheduler = new SyncScheduler()

scheduler.setCallback(async () => {
  if (!(await syncLock.acquire())) return
  try {
    setSyncStatus({ state: 'syncing' })
    const result = await syncBidirectional()
    if (result.failed) {
      setSyncStatus({ state: 'failed', at: new Date().toISOString(), error: 'Sync completed with errors' })
      if (result.failed > 0) scheduler.scheduleRetry()
    } else {
      setSyncStatus({ state: 'success', at: new Date().toISOString() })
      scheduler.resetRetry()
    }
  } catch (err) {
    setSyncStatus({ state: 'failed', at: new Date().toISOString(), error: err instanceof Error ? err.message : 'Sync failed' })
    scheduler.scheduleRetry()
  } finally {
    syncLock.release()
  }
})

export function triggerAutoSync(): void {
  scheduler.scheduleDebounce(3000)
}

export async function onWebTabAvailable(): Promise<void> {
  const settings = await loadSettings()
  if (!settings.enabled) return
  if (settings.syncOnWebsiteOpen) triggerAutoSync()
}

export async function onExtensionPopupOpen(): Promise<void> {
  const settings = await loadSettings()
  if (!settings.enabled) return
  if (settings.syncOnExtensionOpen) {
    const tab = await findWebAppTab()
    if (tab) triggerAutoSync()
  }
}

export async function checkAndSync(options?: { force?: boolean }): Promise<void> {
  if (options?.force) {
    scheduler.resetRetry()
    triggerAutoSync()
    return
  }
  const settings = await loadSettings()
  if (!settings.enabled) return
  triggerAutoSync()
}
