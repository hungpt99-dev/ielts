import { safeStorageGet, safeStorageSet, safeSyncGet } from '../utils/safe-chrome'
import type { ExtensionSettings } from '../background/settingsStorage'

const SYNC_STATUS_KEY = 'extension.syncStatus'
const AUTH_USER_KEY = 'ieltsUser'
const SETTINGS_SYNC_KEY = 'extensionSettings'

export interface SyncStatus {
  lastSyncAt: string | null
  pendingItems: Array<{ id: string; type: string; savedAt: string }>
  lastSyncResult: 'success' | 'partial' | 'failed' | null
}

export interface AuthState {
  isLoggedIn: boolean
  name: string
  email: string
  avatar: string
}

export interface SettingsSyncState {
  status: 'idle' | 'syncing' | 'success' | 'error'
  error: string | null
  lastSyncedAt: string | null
}

type AuthStateListener = (state: AuthState) => void
type SyncStateListener = (state: SettingsSyncState) => void

const authListeners: Set<AuthStateListener> = new Set()
const syncListeners: Set<SyncStateListener> = new Set()

let currentSyncState: SettingsSyncState = {
  status: 'idle',
  error: null,
  lastSyncedAt: null,
}

function notifySyncListeners(state: SettingsSyncState): void {
  currentSyncState = state
  for (const listener of syncListeners) {
    try { listener(state) } catch (error) {
 console.error('apps/extension/src/services/storage-bridge.ts error:', error);
 /* ignore listener error */ }
  }
}

function notifyAuthListeners(state: AuthState): void {
  for (const listener of authListeners) {
    try { listener(state) } catch (error) {
 console.error('apps/extension/src/services/storage-bridge.ts error:', error);
 /* ignore listener error */ }
  }
}

export function getSyncState(): SettingsSyncState {
  return currentSyncState
}

export function onSyncStateChange(listener: SyncStateListener): () => void {
  syncListeners.add(listener)
  return () => { syncListeners.delete(listener) }
}

export function onAuthStateChange(listener: AuthStateListener): () => void {
  authListeners.add(listener)
  return () => { authListeners.delete(listener) }
}

export async function getPendingItemsCount(): Promise<number> {
  try {
    const result = await safeStorageGet<SyncStatus>([SYNC_STATUS_KEY])
    const status = result[SYNC_STATUS_KEY]
    if (status && Array.isArray(status.pendingItems)) {
      return status.pendingItems.length
    }
  } catch (error) {
 console.error('apps/extension/src/services/storage-bridge.ts error:', error);
 /* ignore */ }
  return 0
}

export async function getSyncStatus(): Promise<SyncStatus> {
  try {
    const result = await safeStorageGet<SyncStatus>([SYNC_STATUS_KEY])
    return result[SYNC_STATUS_KEY] ?? {
      lastSyncAt: null,
      pendingItems: [],
      lastSyncResult: null,
    }
  } catch (error) {
    console.error('apps/extension/src/services/storage-bridge.ts error:', error);
    return { lastSyncAt: null, pendingItems: [], lastSyncResult: null }
  }
}

export async function getAuthState(): Promise<AuthState> {
  try {
    const result = await safeStorageGet<{ isLoggedIn: boolean; name: string; email: string; avatar: string }>([AUTH_USER_KEY])
    const user = result[AUTH_USER_KEY]
    if (user?.isLoggedIn) {
      return {
        isLoggedIn: true,
        name: user.name || '',
        email: user.email || '',
        avatar: user.avatar || '',
      }
    }
  } catch (error) {
 console.error('apps/extension/src/services/storage-bridge.ts error:', error);
 /* ignore */ }
  return { isLoggedIn: false, name: '', email: '', avatar: '' }
}

export async function setAuthState(user: { name?: string; email?: string; avatar?: string; isLoggedIn: boolean }): Promise<void> {
  try {
    await safeStorageSet({
      [AUTH_USER_KEY]: {
        name: user.name || '',
        email: user.email || '',
        avatar: user.avatar || '',
        isLoggedIn: user.isLoggedIn,
      },
    })
    notifyAuthListeners({
      isLoggedIn: user.isLoggedIn,
      name: user.name || '',
      email: user.email || '',
      avatar: user.avatar || '',
    })
  } catch (err) {
    console.error('[storage-bridge] Failed to set auth state:', err)
  }
}

export async function clearAuthState(): Promise<void> {
  try {
    await safeStorageSet({
      [AUTH_USER_KEY]: { isLoggedIn: false, name: '', email: '', avatar: '' },
    })
    notifyAuthListeners({ isLoggedIn: false, name: '', email: '', avatar: '' })
  } catch (err) {
    console.error('[storage-bridge] Failed to clear auth state:', err)
  }
}

export async function forceSyncSettings(): Promise<SettingsSyncState> {
  notifySyncListeners({ status: 'syncing', error: null, lastSyncedAt: currentSyncState.lastSyncedAt })
  try {
    const syncResult = await safeSyncGet<ExtensionSettings>([SETTINGS_SYNC_KEY])
    const localResult = await safeStorageGet<string>(['aiApiKey'])
    const settings = syncResult[SETTINGS_SYNC_KEY]
    if (settings) {
      const merged = { ...settings, aiApiKey: localResult.aiApiKey || settings.aiApiKey || '' }
      await safeStorageSet({ [SETTINGS_SYNC_KEY]: merged })
    }
    const now = new Date().toISOString()
    await safeStorageSet({ [SYNC_STATUS_KEY]: { lastSyncAt: now, pendingItems: [], lastSyncResult: 'success' } })
    const newState: SettingsSyncState = { status: 'success', error: null, lastSyncedAt: now }
    notifySyncListeners(newState)
    return newState
  } catch (err) {
    console.error('apps/extension/src/services/storage-bridge.ts error:', err);
    const errorMsg = err instanceof Error ? err.message : 'Sync failed'
    const newState: SettingsSyncState = { status: 'error', error: errorMsg, lastSyncedAt: currentSyncState.lastSyncedAt }
    notifySyncListeners(newState)
    return newState
  }
}

export function initStorageBridge(): void {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local') {
      if (changes[AUTH_USER_KEY]) {
        const newUser = changes[AUTH_USER_KEY].newValue as { isLoggedIn?: boolean; name?: string; email?: string; avatar?: string } | undefined
        notifyAuthListeners({
          isLoggedIn: newUser?.isLoggedIn ?? false,
          name: newUser?.name ?? '',
          email: newUser?.email ?? '',
          avatar: newUser?.avatar ?? '',
        })
      }
    }
  })

  getSyncStatus().then((status) => {
    if (status.lastSyncAt) {
      notifySyncListeners({
        status: 'success',
        error: null,
        lastSyncedAt: status.lastSyncAt,
      })
    }
  })
}
