import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { safeStorageGet, safeStorageSet, safeSyncGet, safeSyncSet, safeSendMessage } from '../safe-chrome'

function createMockChrome() {
  const localStore: Record<string, unknown> = {}
  const syncStore: Record<string, unknown> = {}
  let lastError: { message: string } | undefined

  return {
    runtime: {
      lastError,
      sendMessage: vi.fn(),
    },
    storage: {
      local: {
        get: vi.fn((keys: string | string[], cb: (r: Record<string, unknown>) => void) => {
          if (chrome.runtime.lastError) {
            cb({})
            return
          }
          if (Array.isArray(keys)) {
            const result: Record<string, unknown> = {}
            for (const k of keys) {
              if (k in localStore) result[k] = localStore[k]
            }
            cb(result)
          } else {
            cb(localStore)
          }
        }),
        set: vi.fn((data: Record<string, unknown>, cb?: () => void) => {
          Object.assign(localStore, data)
          cb?.()
        }),
      },
      sync: {
        get: vi.fn((keys: string | string[], cb: (r: Record<string, unknown>) => void) => {
          if (chrome.runtime.lastError) {
            cb({})
            return
          }
          if (Array.isArray(keys)) {
            const result: Record<string, unknown> = {}
            for (const k of keys) {
              if (k in syncStore) result[k] = syncStore[k]
            }
            cb(result)
          } else {
            cb(syncStore)
          }
        }),
        set: vi.fn((data: Record<string, unknown>, cb?: () => void) => {
          Object.assign(syncStore, data)
          cb?.()
        }),
      },
    },
  }
}

let mockChrome: ReturnType<typeof createMockChrome>

beforeEach(() => {
  mockChrome = createMockChrome()
  vi.stubGlobal('chrome', mockChrome)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('safeStorageGet', () => {
  it('returns stored value for single key', async () => {
    await new Promise<void>((resolve) => {
      chrome.storage.local.set({ testKey: 'testValue' }, resolve)
    })
    const result = await safeStorageGet<string>('testKey')
    expect(result.testKey).toBe('testValue')
  })

  it('returns empty object when key not found', async () => {
    const result = await safeStorageGet<string>('nonexistent')
    expect(result).toEqual({})
  })

  it('returns multiple stored values for array of keys', async () => {
    await new Promise<void>((resolve) => {
      chrome.storage.local.set({ a: '1', b: '2' }, resolve)
    })
    const result = await safeStorageGet<string>(['a', 'b'])
    expect(result.a).toBe('1')
    expect(result.b).toBe('2')
  })

  it('handles chrome.runtime.lastError gracefully', async () => {
    const getSpy = vi.spyOn(mockChrome.storage.local, 'get')
    getSpy.mockImplementation((_keys: string | string[], cb: (r: Record<string, unknown>) => void) => {
      Object.defineProperty(chrome.runtime, 'lastError', {
        value: { message: 'Extension context invalidated' },
        configurable: true,
      })
      cb({})
    })

    const result = await safeStorageGet<string>('any')
    expect(result).toEqual({})
  })

  it('handles thrown exceptions gracefully', async () => {
    const getSpy = vi.spyOn(mockChrome.storage.local, 'get')
    getSpy.mockImplementation(() => {
      throw new Error('Unexpected error')
    })

    const result = await safeStorageGet<string>('any')
    expect(result).toEqual({})
  })
})

describe('safeStorageSet', () => {
  it('stores data successfully', async () => {
    await safeStorageSet({ testKey: 'testValue' })

    const result = await new Promise<Record<string, unknown>>((resolve) => {
      chrome.storage.local.get('testKey', resolve)
    })
    expect(result.testKey).toBe('testValue')
  })

  it('stores multiple keys', async () => {
    await safeStorageSet({ a: '1', b: '2' })

    const result = await new Promise<Record<string, unknown>>((resolve) => {
      chrome.storage.local.get(['a', 'b'], resolve)
    })
    expect(result.a).toBe('1')
    expect(result.b).toBe('2')
  })

  it('does not throw on error', async () => {
    const setSpy = vi.spyOn(mockChrome.storage.local, 'set')
    setSpy.mockImplementation(() => {
      throw new Error('Storage error')
    })

    await expect(safeStorageSet({ key: 'value' })).resolves.toBeUndefined()
  })
})

describe('safeSyncGet', () => {
  it('returns stored value from sync storage', async () => {
    await new Promise<void>((resolve) => {
      chrome.storage.sync.set({ syncKey: 'syncValue' }, resolve)
    })
    const result = await safeSyncGet<string>('syncKey')
    expect(result.syncKey).toBe('syncValue')
  })

  it('returns empty object on error', async () => {
    const getSpy = vi.spyOn(mockChrome.storage.sync, 'get')
    getSpy.mockImplementation((_keys: string | string[], cb: (r: Record<string, unknown>) => void) => {
      Object.defineProperty(chrome.runtime, 'lastError', {
        value: { message: 'Sync error' },
        configurable: true,
      })
      cb({})
    })

    const result = await safeSyncGet<string>('any')
    expect(result).toEqual({})
  })
})

describe('safeSyncSet', () => {
  it('stores data to sync storage', async () => {
    await safeSyncSet({ syncKey: 'syncValue' })

    const result = await new Promise<Record<string, unknown>>((resolve) => {
      chrome.storage.sync.get('syncKey', resolve)
    })
    expect(result.syncKey).toBe('syncValue')
  })

  it('does not throw on error', async () => {
    const setSpy = vi.spyOn(mockChrome.storage.sync, 'set')
    setSpy.mockImplementation(() => {
      throw new Error('Sync error')
    })

    await expect(safeSyncSet({ key: 'value' })).resolves.toBeUndefined()
  })
})

describe('safeSendMessage', () => {
  it('sends message successfully', async () => {
    vi.mocked(chrome.runtime.sendMessage).mockImplementation(() => Promise.resolve())

    await safeSendMessage({ type: 'TEST', payload: 'data' })
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({ type: 'TEST', payload: 'data' })
  })

  it('handles extension context error gracefully', async () => {
    vi.mocked(chrome.runtime.sendMessage).mockRejectedValue(
      new Error('Extension context invalidated'),
    )

    await expect(safeSendMessage({ type: 'TEST' })).resolves.toBeUndefined()
  })

  it('handles receiving end does not exist error', async () => {
    vi.mocked(chrome.runtime.sendMessage).mockRejectedValue(
      new Error('Receiving end does not exist'),
    )

    await expect(safeSendMessage({ type: 'TEST' })).resolves.toBeUndefined()
  })

  it('handles could not establish connection error', async () => {
    vi.mocked(chrome.runtime.sendMessage).mockRejectedValue(
      new Error('Could not establish connection'),
    )

    await expect(safeSendMessage({ type: 'TEST' })).resolves.toBeUndefined()
  })
})
