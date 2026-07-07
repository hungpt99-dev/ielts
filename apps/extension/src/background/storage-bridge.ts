const SYNC_STATUS_KEY = 'extension.syncStatus'
const DEBOUNCE_MS = 500
const STORAGE_KEYS = ['savedItems', 'vocabulary', 'mistakes', 'articles'] as const

interface SyncStatusItem {
  id: string
  type: string
  savedAt: string
}

export interface SyncStatus {
  lastSyncAt: string | null
  pendingItems: SyncStatusItem[]
  lastSyncResult: 'success' | 'partial' | 'failed' | null
}

import { openDB } from '../storage/db'

async function putInIDB<T>(storeName: string, entry: T): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)
    store.put(entry)
    tx.oncomplete = () => {
      db.close()
      resolve()
    }
    tx.onerror = () => {
      db.close()
      reject(tx.error)
    }
  })
}

async function getAllFromIDB<T>(storeName: string): Promise<T[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly')
    const store = tx.objectStore(storeName)
    const req = store.getAll()
    req.onsuccess = () => {
      db.close()
      resolve(req.result as T[])
    }
    req.onerror = () => {
      db.close()
      reject(req.error)
    }
  })
}

function chromeStorageGet<T>(key: string): Promise<T | null> {
  return new Promise((resolve) => {
    chrome.storage.local.get([key], (result) => {
      resolve((result[key] as T) ?? null)
    })
  })
}

import { safeStorageSet } from '../utils/safe-chrome'

function chromeStorageSet(key: string, value: unknown): Promise<void> {
  return safeStorageSet({ [key]: value })
}

function mapEntryToStore(entry: Record<string, unknown>): string {
  const category = entry.category as string | undefined
  switch (category) {
    case 'vocabulary':
    case 'phrase':
      return 'vocabulary'
    case 'mistake':
      return 'mistakes'
    case 'reading':
    case 'writing':
    case 'speaking':
    case 'grammar':
    case 'sentence':
      return 'learningEntries'
    default:
      return 'learningEntries'
  }
}

let syncTimer: ReturnType<typeof setTimeout> | null = null
let pendingChanges = 0

function debouncedSync(): void {
  pendingChanges++
  if (syncTimer) return
  syncTimer = setTimeout(async () => {
    syncTimer = null
    pendingChanges = 0
    try {
      await syncToIndexedDB()
      await updateSyncStatus({ lastSyncResult: 'success' })
    } catch (err) {
      console.error('[storage-bridge] Sync failed:', err)
      await updateSyncStatus({ lastSyncResult: 'failed' })
    }
  }, DEBOUNCE_MS)
}

async function updateSyncStatus(partial: Partial<SyncStatus>): Promise<void> {
  const existing = await chromeStorageGet<SyncStatus>(SYNC_STATUS_KEY)
  const updated: SyncStatus = {
    lastSyncAt: new Date().toISOString(),
    pendingItems: existing?.pendingItems ?? [],
    lastSyncResult: null,
    ...partial,
  }
  await chromeStorageSet(SYNC_STATUS_KEY, updated)
}

export async function markItemPending(id: string, type: string): Promise<void> {
  const status = await getSyncStatus()
  status.pendingItems.push({ id, type, savedAt: new Date().toISOString() })
  await chromeStorageSet(SYNC_STATUS_KEY, status)
}

export async function markItemsSynced(ids: string[]): Promise<void> {
  const status = await getSyncStatus()
  const idSet = new Set(ids)
  status.pendingItems = status.pendingItems.filter((item) => !idSet.has(item.id))
  status.lastSyncAt = new Date().toISOString()
  status.lastSyncResult = 'success'
  await chromeStorageSet(SYNC_STATUS_KEY, status)
}

export async function getSyncStatus(): Promise<SyncStatus> {
  const existing = await chromeStorageGet<SyncStatus>(SYNC_STATUS_KEY)
  return (
    existing ?? {
      lastSyncAt: null,
      pendingItems: [],
      lastSyncResult: null,
    }
  )
}

export async function getPendingItems(): Promise<SyncStatusItem[]> {
  const status = await getSyncStatus()
  return status.pendingItems
}

export async function syncToIndexedDB(): Promise<void> {
  const errors: string[] = []

  for (const key of STORAGE_KEYS) {
    try {
      const raw = await chromeStorageGet<Record<string, unknown>[]>(key)
      if (!raw || !Array.isArray(raw)) continue

      for (const entry of raw) {
        if (!entry || !entry.id) continue
        const storeName = mapEntryToStore(entry as Record<string, unknown>)

        try {
          const entryToSave: Record<string, unknown> = {
            ...entry,
            updatedAt: entry.updatedAt || new Date().toISOString(),
            createdAt: entry.createdAt || new Date().toISOString(),
          }
          await putInIDB(storeName, entryToSave)
        } catch (putErr) {
          errors.push(`Failed to save ${storeName}.${entry.id}: ${putErr}`)
        }
      }
    } catch (getErr) {
      errors.push(`Failed to read chrome.storage.local key ${key}: ${getErr}`)
    }
  }

  if (errors.length > 0) {
    console.warn('[storage-bridge] syncToIndexedDB completed with errors:', errors)
  }
}

export async function syncToChromeStorage(): Promise<void> {
  try {
    const entries = await getAllFromIDB<Record<string, unknown>>('learningEntries')
    if (entries.length > 0) {
      const existing = await chromeStorageGet<Record<string, unknown>[]>('savedItems')
      const existingMap = new Map((existing ?? []).map((e) => [e.id as string, e]))
      for (const entry of entries) {
        existingMap.set(entry.id as string, entry)
      }
      await chromeStorageSet('savedItems', Array.from(existingMap.values()))
    }
  } catch (err) {
    console.error('[storage-bridge] syncToChromeStorage failed:', err)
  }
}

export async function syncSingleEntry(entry: Record<string, unknown>): Promise<void> {
  if (!entry?.id) return
  const storeName = mapEntryToStore(entry)
  try {
    const toSave: Record<string, unknown> = {
      ...entry,
      createdAt: entry.createdAt || new Date().toISOString(),
      updatedAt: entry.updatedAt || new Date().toISOString(),
    }
    await putInIDB(storeName, toSave)
  } catch (err) {
    console.error(`[storage-bridge] Failed to sync entry ${entry.id}:`, err)
    throw err
  }
}

export function notifyStorageChange(): void {
  debouncedSync()
}

export async function broadcastToTabs(overlapping: Record<string, unknown>): Promise<void> {
  const tabs = await chrome.tabs.query({ url: '*://*/*' })
  const msg = { type: 'SETTINGS_SYNC', payload: overlapping }
  for (const tab of tabs) {
    if (!tab.id) continue
    chrome.tabs.sendMessage(tab.id, msg).catch(() => {
      // Content script not present on this tab — ignore
    })
  }
}

export async function initializeStorageBridge(): Promise<void> {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== 'local') return
    const relevantKeys = STORAGE_KEYS as readonly string[]
    const hasRelevantChange = Object.keys(changes).some((key) =>
      (relevantKeys as readonly string[]).includes(key),
    )
    if (hasRelevantChange) {
      notifyStorageChange()
    }
  })

  const { addSettingsChangeListener, getOverlappingForWebsite } = await import('./settingsStorage')
  addSettingsChangeListener((settings) => {
    const overlapping = getOverlappingForWebsite(settings)
    broadcastToTabs(overlapping as unknown as Record<string, unknown>)
  })

  const initialStatus = await getSyncStatus()
  if (!initialStatus.lastSyncAt) {
    debouncedSync()
  }
}
