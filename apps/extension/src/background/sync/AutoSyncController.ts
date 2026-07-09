import { syncLock } from './SyncLock'
import { SyncScheduler } from './SyncScheduler'
import { syncBidirectional } from './bidirectionalSyncController'
import { findWebAppTab } from './webTabConnection'

const SETTINGS_KEY = 'ielts-auto-sync-settings'

export interface AutoSyncSettings {
  enabled: boolean
  syncOnWebsiteOpen: boolean
  syncOnExtensionOpen: boolean
  syncDebounceMs: number
}

export const DEFAULT_SETTINGS: AutoSyncSettings = {
  enabled: false,
  syncOnWebsiteOpen: true,
  syncOnExtensionOpen: true,
  syncDebounceMs: 3000,
}

export type SyncStatus =
  | { state: 'idle' }
  | { state: 'syncing' }
  | { state: 'success'; at: string }
  | { state: 'failed'; at: string; error?: string }

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

export function getSyncStatus(): SyncStatus {
  return syncStatus
}

function setSyncStatus(s: SyncStatus): void {
  syncStatus = s
}

const scheduler = new SyncScheduler()

scheduler.setCallback(async () => {
  if (!(await syncLock.acquire())) return
  try {
    setSyncStatus({ state: 'syncing' })
    const result = await syncBidirectional()
    if (result.failed) {
      setSyncStatus({ state: 'failed', at: new Date().toISOString(), error: 'Sync completed with errors' })
    } else {
      setSyncStatus({ state: 'success', at: new Date().toISOString() })
    }
  } catch (err) {
    setSyncStatus({ state: 'failed', at: new Date().toISOString(), error: err instanceof Error ? err.message : 'Sync failed' })
  } finally {
    syncLock.release()
  }
})

export async function triggerAutoSync(): Promise<void> {
  const settings = await loadSettings()
  scheduler.schedule(settings.syncDebounceMs)
}

export async function onWebTabAvailable(): Promise<void> {
  if (!(await loadSettings()).enabled) return
  triggerAutoSync()
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
    scheduler.cancel()
    await triggerAutoSync()
    return
  }
  if (!(await loadSettings()).enabled) return
  await triggerAutoSync()
}
