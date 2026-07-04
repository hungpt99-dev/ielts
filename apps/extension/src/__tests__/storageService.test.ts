import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getDailyProgress,
  updateDailyProgress,
  incrementDailyProgress,
  getSavedItems,
  addSavedItem,
  getVideoPageInfo,
  setVideoPageInfo,
  getPendingVideoInfo,
  setPendingVideoInfo,
  getInstalledAt,
  initializeOnInstall,
  clearAllExtensionData,
  getSyncStatus,
  markItemsSynced,
} from '../services/storage'
import type { StorageGet, StorageSet } from '../services/storage'

function createMockChrome() {
  const store: Record<string, unknown> = {}
  return {
    runtime: {
      onMessage: { addListener: vi.fn() },
      sendMessage: vi.fn(),
    },
    storage: {
      local: {
        get: vi.fn((keys: string | string[], cb: (r: Record<string, unknown>) => void) => {
          if (Array.isArray(keys)) {
            const result: Record<string, unknown> = {}
            for (const k of keys) {
              if (k in store) result[k] = store[k]
            }
            cb(result)
          } else {
            cb(store)
          }
        }),
        set: vi.fn((data: Record<string, unknown>, cb?: () => void) => {
          Object.assign(store, data)
          cb?.()
        }),
        clear: vi.fn((cb?: () => void) => {
          Object.keys(store).forEach((k) => delete store[k])
          cb?.()
        }),
      },
    },
  }
}

beforeEach(() => {
  vi.stubGlobal('chrome', createMockChrome())
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('getDailyProgress', () => {
  it('returns default progress when nothing stored', async () => {
    const result = await getDailyProgress()
    expect(result).toEqual({ wordsAdded: 0, notesAdded: 0, articlesSaved: 0, reviewDue: 0, streak: 0 })
  })

  it('returns stored progress', async () => {
    const stored = { wordsAdded: 3, notesAdded: 2, articlesSaved: 1, reviewDue: 0, streak: 5 }
    await chrome.storage.local.set({ dailyProgress: stored })
    const result = await getDailyProgress()
    expect(result).toEqual(stored)
  })
})

describe('updateDailyProgress', () => {
  it('merges patch with existing progress', async () => {
    await chrome.storage.local.set({ dailyProgress: { wordsAdded: 3, notesAdded: 2, articlesSaved: 1, reviewDue: 0, streak: 5 } })
    const result = await updateDailyProgress({ wordsAdded: 10 })
    expect(result.wordsAdded).toBe(10)
    expect(result.notesAdded).toBe(2)
  })

  it('creates from defaults when nothing stored', async () => {
    const result = await updateDailyProgress({ streak: 3 })
    expect(result.streak).toBe(3)
    expect(result.wordsAdded).toBe(0)
  })
})

describe('incrementDailyProgress', () => {
  it('increments a field by default amount', async () => {
    await chrome.storage.local.set({ dailyProgress: { wordsAdded: 3, notesAdded: 0, articlesSaved: 1, reviewDue: 0, streak: 0 } })
    const result = await incrementDailyProgress('wordsAdded')
    expect(result.wordsAdded).toBe(4)
  })

  it('increments a field by custom amount', async () => {
    await chrome.storage.local.set({ dailyProgress: { wordsAdded: 0, notesAdded: 0, articlesSaved: 0, reviewDue: 0, streak: 0 } })
    const result = await incrementDailyProgress('articlesSaved', 3)
    expect(result.articlesSaved).toBe(3)
  })

  it('starts from zero when no stored progress', async () => {
    const result = await incrementDailyProgress('notesAdded', 2)
    expect(result.notesAdded).toBe(2)
  })
})

describe('getSavedItems / addSavedItem', () => {
  it('returns empty array when nothing stored', async () => {
    const items = await getSavedItems()
    expect(items).toEqual([])
  })

  it('adds and retrieves saved items', async () => {
    await addSavedItem({ id: '1', text: 'hello' })
    await addSavedItem({ id: '2', text: 'world' })
    const items = await getSavedItems()
    expect(items).toHaveLength(2)
    expect(items[0].text).toBe('world')
  })
})

describe('video page info', () => {
  const info = { isVideoPage: true, platform: 'youtube', videoTitle: 'Test', videoUrl: 'https://youtube.com/watch?v=123', videoId: '123' }

  it('setVideoPageInfo stores and getVideoPageInfo retrieves', async () => {
    await setVideoPageInfo(info)
    const result = await getVideoPageInfo()
    expect(result).toEqual(info)
  })

  it('getVideoPageInfo returns null when not set', async () => {
    const result = await getVideoPageInfo()
    expect(result).toBeNull()
  })

  it('setPendingVideoInfo stores and getPendingVideoInfo retrieves', async () => {
    await setPendingVideoInfo(info)
    const result = await getPendingVideoInfo()
    expect(result).toEqual(info)
  })
})

describe('getInstalledAt / initializeOnInstall', () => {
  it('returns null before install', async () => {
    const result = await getInstalledAt()
    expect(result).toBeNull()
  })

  it('sets progress and install timestamp', async () => {
    await initializeOnInstall()
    const progress = await getDailyProgress()
    expect(progress).toEqual({ wordsAdded: 0, notesAdded: 0, articlesSaved: 0, reviewDue: 0, streak: 0 })
    const installedAt = await getInstalledAt()
    expect(installedAt).not.toBeNull()
    expect(typeof installedAt).toBe('string')
  })
})

describe('clearAllExtensionData', () => {
  it('clears all stored data', async () => {
    await chrome.storage.local.set({ dailyProgress: { wordsAdded: 3, notesAdded: 0, articlesSaved: 0, reviewDue: 0, streak: 1 } })
    await clearAllExtensionData()
    const progress = await getDailyProgress()
    expect(progress.wordsAdded).toBe(0)
  })
})

describe('getSyncStatus / markItemsSynced', () => {
  it('returns null when no status stored', async () => {
    const storageGet: StorageGet<unknown> = () => Promise.resolve(null)
    const result = await getSyncStatus(storageGet)
    expect(result).toBeNull()
  })

  it('removes pending items and updates sync status', async () => {
    const store: Record<string, unknown> = {
      syncStatus: {
        lastSyncAt: null,
        pendingItems: [{ id: '1', type: 'vocabulary', timestamp: '2025-01-01T00:00:00Z' }],
        lastSyncResult: null,
      },
    }
    const storageGetFn = vi.fn((key: string) => Promise.resolve(store[key] as never ?? null))
    const storageSetFn = vi.fn((key: string, value: unknown) => {
      store[key] = value
      return Promise.resolve()
    })

    await markItemsSynced(['1'], storageGetFn, storageSetFn)
    const updated = await storageGetFn('syncStatus') as { pendingItems: Array<unknown>; lastSyncResult: string; lastSyncAt: string }
    expect(updated.pendingItems).toHaveLength(0)
    expect(updated.lastSyncResult).toBe('success')
    expect(updated.lastSyncAt).not.toBeNull()
  })

  it('is a no-op when no sync status exists', async () => {
    const storageGetFn = vi.fn(() => Promise.resolve(null))
    const storageSetFn = vi.fn(() => Promise.resolve())
    await markItemsSynced(['1'], storageGetFn, storageSetFn)
    expect(storageSetFn).not.toHaveBeenCalled()
  })
})
