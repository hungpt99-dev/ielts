import { safeStorageSet } from '../utils/safe-chrome'
import { STORAGE_KEYS as EXT_STORAGE_KEYS } from '@ielts/config'

export interface DailyProgress {
  wordsAdded: number
  notesAdded: number
  articlesSaved: number
  notesSaved: number
  reviewDue: number
  streak: number
}

export interface VideoPageInfo {
  isVideoPage: boolean
  platform: string
  videoTitle: string
  videoUrl: string
  videoId: string
}

export interface SyncStatus {
  lastSyncAt: string | null
  pendingItems: Array<{ id: string; type: string; savedAt: string }>
  lastSyncResult: 'success' | 'failed' | null
}

const LOCAL_KEYS = {
  DAILY_PROGRESS: 'dailyProgress',
  AI_API_KEY: 'aiApiKey',
  SAVED_ITEMS: 'savedItems',
  LAST_VIDEO_PAGE: 'lastVideoPage',
  PENDING_VIDEO_INFO: 'pendingVideoInfo',
  INSTALLED_AT: 'installedAt',
  SETTINGS_BACKUP: EXT_STORAGE_KEYS.extensionLocal.settingsBackup,
} as const

const DEFAULT_PROGRESS: DailyProgress = {
  wordsAdded: 0,
  notesAdded: 0,
  articlesSaved: 0,
  notesSaved: 0,
  reviewDue: 0,
  streak: 0,
}

function promisifyChromeStorage<K>(key: string): Promise<K | null>
function promisifyChromeStorage<K>(keys: string[]): Promise<Record<string, K>>
function promisifyChromeStorage<K>(keyOrKeys: string | string[]): Promise<K | null | Record<string, K>> {
  return new Promise((resolve) => {
    if (Array.isArray(keyOrKeys)) {
      chrome.storage.local.get(keyOrKeys, (result) => resolve(result as Record<string, K>))
    } else {
      chrome.storage.local.get([keyOrKeys], (result) => resolve((result[keyOrKeys] as K) ?? null))
    }
  })
}

export type StorageGet<T> = (key: string) => Promise<T | null>
export type StorageSet = (key: string, value: unknown) => Promise<void>

export const storageGet: StorageGet<unknown> = (key: string) =>
  promisifyChromeStorage(key)

export const storageSet: StorageSet = (key: string, value: unknown) =>
  safeStorageSet({ [key]: value })

export async function getDailyProgress(): Promise<DailyProgress> {
  const progress = await promisifyChromeStorage<DailyProgress>(LOCAL_KEYS.DAILY_PROGRESS)
  return progress ?? { ...DEFAULT_PROGRESS }
}

const pendingProgress: Partial<DailyProgress> = {}
let writeTimer: ReturnType<typeof setTimeout> | null = null
const FLUSH_DELAY_MS = 5000

async function flushProgress(): Promise<void> {
  writeTimer = null
  const patch = { ...pendingProgress }
  for (const key of Object.keys(patch) as (keyof DailyProgress)[]) {
    delete pendingProgress[key]
  }
  if (Object.keys(patch).length === 0) return

  try {
    const current = await getDailyProgress()
    const updated = { ...current }
    for (const [key, value] of Object.entries(patch) as [keyof DailyProgress, number][]) {
      updated[key] = (updated[key] || 0) + value
    }
    await storageSet(LOCAL_KEYS.DAILY_PROGRESS, updated)
  } catch (error) {
    console.error('apps/extension/src/services/storage.ts error:', error);
    // write failed — re-queue
    for (const [key, value] of Object.entries(patch) as [keyof DailyProgress, number][]) {
      pendingProgress[key] = (pendingProgress[key] || 0) + value
    }
  }
}

function scheduleFlush(): void {
  if (writeTimer) return
  writeTimer = setTimeout(flushProgress, FLUSH_DELAY_MS)
}

export async function updateDailyProgress(patch: Partial<DailyProgress>): Promise<DailyProgress> {
  for (const [key, value] of Object.entries(patch) as [keyof DailyProgress, number | undefined][]) {
    if (value !== undefined) {
      pendingProgress[key] = (pendingProgress[key] || 0) + value
    }
  }
  scheduleFlush()
  const current = await getDailyProgress()
  const merged = { ...current }
  for (const [key, value] of Object.entries(pendingProgress) as [keyof DailyProgress, number][]) {
    merged[key] = (merged[key] || 0) + value
  }
  return merged
}

export async function incrementDailyProgress(field: keyof DailyProgress, amount = 1): Promise<DailyProgress> {
  pendingProgress[field] = (pendingProgress[field] || 0) + amount
  scheduleFlush()
  const current = await getDailyProgress()
  const merged = { ...current }
  for (const [key, value] of Object.entries(pendingProgress) as [keyof DailyProgress, number][]) {
    merged[key] = (merged[key] || 0) + value
  }
  return merged
}

export async function getSavedItems<T>(): Promise<T[]> {
  const items = await promisifyChromeStorage<T[]>(LOCAL_KEYS.SAVED_ITEMS)
  return items ?? []
}

export async function addSavedItem<T extends Record<string, unknown>>(item: T): Promise<void> {
  const items = await getSavedItems<T>()
  items.unshift(item)
  await storageSet(LOCAL_KEYS.SAVED_ITEMS, items)
}

export async function getVideoPageInfo(): Promise<VideoPageInfo | null> {
  return promisifyChromeStorage<VideoPageInfo>(LOCAL_KEYS.LAST_VIDEO_PAGE)
}

export async function setVideoPageInfo(info: VideoPageInfo): Promise<void> {
  await storageSet(LOCAL_KEYS.LAST_VIDEO_PAGE, info)
}

export async function getPendingVideoInfo(): Promise<VideoPageInfo | null> {
  return promisifyChromeStorage<VideoPageInfo>(LOCAL_KEYS.PENDING_VIDEO_INFO)
}

export async function setPendingVideoInfo(info: VideoPageInfo): Promise<void> {
  await storageSet(LOCAL_KEYS.PENDING_VIDEO_INFO, info)
}

export async function getInstalledAt(): Promise<string | null> {
  return promisifyChromeStorage<string>(LOCAL_KEYS.INSTALLED_AT)
}

export async function initializeOnInstall(): Promise<void> {
  await storageSet(LOCAL_KEYS.DAILY_PROGRESS, { ...DEFAULT_PROGRESS })
  await storageSet(LOCAL_KEYS.INSTALLED_AT, new Date().toISOString())
}

export async function clearAllExtensionData(): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.local.clear(resolve)
  })
}

export function getSyncStatus(storageGet: StorageGet<SyncStatus>): Promise<SyncStatus | null> {
  return storageGet('syncStatus')
}

export async function markItemsSynced(
  ids: string[],
  storageGetFn: StorageGet<SyncStatus>,
  storageSetFn: StorageSet,
): Promise<void> {
  const status = await storageGetFn('syncStatus')
  if (status) {
    status.pendingItems = status.pendingItems.filter((item) => !ids.includes(item.id))
    status.lastSyncAt = new Date().toISOString()
    status.lastSyncResult = 'success'
    await storageSetFn('syncStatus', status)
  }
}

export { LOCAL_KEYS as STORAGE_KEYS, DEFAULT_PROGRESS }

/** Reset pending progress (used in tests) */
export function clearPendingProgress(): void {
  for (const key of Object.keys(pendingProgress) as (keyof DailyProgress)[]) {
    delete pendingProgress[key]
  }
}
