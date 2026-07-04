export interface DailyProgress {
  wordsAdded: number
  notesAdded: number
  articlesSaved: number
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

const STORAGE_KEYS = {
  DAILY_PROGRESS: 'dailyProgress',
  AI_API_KEY: 'aiApiKey',
  SAVED_ITEMS: 'savedItems',
  LAST_VIDEO_PAGE: 'lastVideoPage',
  PENDING_VIDEO_INFO: 'pendingVideoInfo',
  INSTALLED_AT: 'installedAt',
  SETTINGS_BACKUP: 'ielts-settings-backup',
} as const

const DEFAULT_PROGRESS: DailyProgress = {
  wordsAdded: 0,
  notesAdded: 0,
  articlesSaved: 0,
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
  new Promise((resolve) => {
    chrome.storage.local.set({ [key]: value }, resolve)
  })

export async function getDailyProgress(): Promise<DailyProgress> {
  const progress = await promisifyChromeStorage<DailyProgress>(STORAGE_KEYS.DAILY_PROGRESS)
  return progress ?? { ...DEFAULT_PROGRESS }
}

export async function updateDailyProgress(patch: Partial<DailyProgress>): Promise<DailyProgress> {
  const current = await getDailyProgress()
  const updated = { ...current, ...patch }
  await storageSet(STORAGE_KEYS.DAILY_PROGRESS, updated)
  return updated
}

export async function incrementDailyProgress(field: keyof DailyProgress, amount = 1): Promise<DailyProgress> {
  const current = await getDailyProgress()
  const updated = { ...current, [field]: current[field] + amount }
  await storageSet(STORAGE_KEYS.DAILY_PROGRESS, updated)
  return updated
}

export async function getSavedItems<T>(): Promise<T[]> {
  const items = await promisifyChromeStorage<T[]>(STORAGE_KEYS.SAVED_ITEMS)
  return items ?? []
}

export async function addSavedItem<T extends Record<string, unknown>>(item: T): Promise<void> {
  const items = await getSavedItems<T>()
  items.unshift(item)
  await storageSet(STORAGE_KEYS.SAVED_ITEMS, items)
}

export async function getVideoPageInfo(): Promise<VideoPageInfo | null> {
  return promisifyChromeStorage<VideoPageInfo>(STORAGE_KEYS.LAST_VIDEO_PAGE)
}

export async function setVideoPageInfo(info: VideoPageInfo): Promise<void> {
  await storageSet(STORAGE_KEYS.LAST_VIDEO_PAGE, info)
}

export async function getPendingVideoInfo(): Promise<VideoPageInfo | null> {
  return promisifyChromeStorage<VideoPageInfo>(STORAGE_KEYS.PENDING_VIDEO_INFO)
}

export async function setPendingVideoInfo(info: VideoPageInfo): Promise<void> {
  await storageSet(STORAGE_KEYS.PENDING_VIDEO_INFO, info)
}

export async function getInstalledAt(): Promise<string | null> {
  return promisifyChromeStorage<string>(STORAGE_KEYS.INSTALLED_AT)
}

export async function initializeOnInstall(): Promise<void> {
  await storageSet(STORAGE_KEYS.DAILY_PROGRESS, { ...DEFAULT_PROGRESS })
  await storageSet(STORAGE_KEYS.INSTALLED_AT, new Date().toISOString())
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

export { STORAGE_KEYS, DEFAULT_PROGRESS }
