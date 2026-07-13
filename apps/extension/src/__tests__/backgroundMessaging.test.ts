import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  registerHandler,
  unregisterHandler,
  handleMessage,
  initMessaging,
} from '../background/messaging'
const SENDER: chrome.runtime.MessageSender = { tab: { id: 1 } as chrome.tabs.Tab } as chrome.runtime.MessageSender

const MOCK_DAILY_PROGRESS = {
  wordsAdded: 5,
  notesAdded: 3,
  articlesSaved: 1,
  notesSaved: 0,
  reviewDue: 2,
  streak: 7,
}

function createMockStore(): {
  get: ReturnType<typeof vi.fn>
  set: ReturnType<typeof vi.fn>
} {
  const store: Record<string, unknown> = {}
  return {
    get: vi.fn((keys: string | string[], cb?: (result: Record<string, unknown>) => void) => {
      const result: Record<string, unknown> = {}
      const keyList = Array.isArray(keys) ? keys : [keys]
      for (const k of keyList) {
        if (k in store) result[k] = store[k]
      }
      if (cb) { cb(result); return undefined }
      return Promise.resolve(result)
    }),
    set: vi.fn((data: Record<string, unknown>, cb?: () => void) => {
      Object.assign(store, data)
      if (cb) cb()
      else return Promise.resolve()
    }),
  }
}

let mockStorage: ReturnType<typeof createMockStore>

beforeEach(() => {
  mockStorage = createMockStore()

  vi.stubGlobal('chrome', {
    runtime: {
      onMessage: {
        addListener: vi.fn(),
      },
      sendMessage: vi.fn(),
      openOptionsPage: vi.fn(),
    },
    storage: {
      local: mockStorage,
    },
    tabs: {
      query: vi.fn(() => Promise.resolve([{ id: 1 }])),
      sendMessage: vi.fn(),
    },
  })

  mockStorage.set({ dailyProgress: { ...MOCK_DAILY_PROGRESS } })
})

afterEach(() => {
  vi.restoreAllMocks()
  ;(['GET_DAILY_PROGRESS', 'UPDATE_PROGRESS', 'OPEN_OPTIONS', 'VIDEO_PAGE_DETECTED'] as const).forEach((type) => {
    unregisterHandler(type)
  })
})

describe('registerHandler / unregisterHandler', () => {
  it('registers and invokes a handler', () => {
    const handler = vi.fn(() => 'ok')
    registerHandler('TEST_ACTION', handler)

    const sendResponse = vi.fn()
    handleMessage({ type: 'TEST_ACTION', payload: undefined }, SENDER, sendResponse)

    expect(handler).toHaveBeenCalledOnce()
    expect(sendResponse).toHaveBeenCalledWith({ success: true, data: 'ok' })
  })

  it('unregisters a handler', () => {
    const handler = vi.fn()
    registerHandler('TEST_ACTION', handler)
    unregisterHandler('TEST_ACTION')

    const sendResponse = vi.fn()
    handleMessage({ type: 'TEST_ACTION', payload: undefined }, SENDER, sendResponse)

    expect(handler).not.toHaveBeenCalled()
    expect(sendResponse).not.toHaveBeenCalled()
  })
})

describe('handleMessage', () => {
  it('rejects unknown message types', () => {
    const sendResponse = vi.fn()
    const result = handleMessage({ type: 'UNKNOWN', payload: undefined }, SENDER, sendResponse)

    expect(result).toBe(false)
    expect(sendResponse).not.toHaveBeenCalled()
  })

  it('handles null/undefined message', () => {
    const sendResponse = vi.fn()
    const result = handleMessage(null, SENDER, sendResponse)

    expect(result).toBe(false)
    expect(sendResponse).not.toHaveBeenCalled()
  })

  it('handles non-object message', () => {
    const sendResponse = vi.fn()
    const result = handleMessage('string', SENDER, sendResponse)

    expect(result).toBe(false)
    expect(sendResponse).not.toHaveBeenCalled()
  })

  it('handles sync handler returning data', () => {
    registerHandler('PING', () => 'pong')

    const sendResponse = vi.fn()
    const result = handleMessage({ type: 'PING', payload: undefined }, SENDER, sendResponse)

    expect(result).toBe(false)
    expect(sendResponse).toHaveBeenCalledWith({ success: true, data: 'pong' })
  })

  it('handles async handler that resolves', async () => {
    registerHandler('PING', async () => 'pong-async')

    const sendResponse = vi.fn()
    const result = handleMessage({ type: 'PING', payload: undefined }, SENDER, sendResponse)

    expect(result).toBe(true)
    await vi.waitFor(() => {
      expect(sendResponse).toHaveBeenCalledWith({ success: true, data: 'pong-async' })
    })
  })

  it('handles async handler that rejects', async () => {
    registerHandler('FAIL', async () => {
      throw new Error('something went wrong')
    })

    const sendResponse = vi.fn()
    const result = handleMessage({ type: 'FAIL', payload: undefined }, SENDER, sendResponse)

    expect(result).toBe(true)
    await vi.waitFor(() => {
      expect(sendResponse).toHaveBeenCalledWith({
        success: false,
        error: 'HANDLER_ERROR',
        message: 'something went wrong',
      })
    })
  })

  it('handles sync handler that throws', () => {
    registerHandler('FAIL', () => {
      throw new Error('sync error')
    })

    const sendResponse = vi.fn()
    const result = handleMessage({ type: 'FAIL', payload: undefined }, SENDER, sendResponse)

    expect(result).toBe(false)
    expect(sendResponse).toHaveBeenCalledWith({
      success: false,
      error: 'HANDLER_ERROR',
      message: 'sync error',
    })
  })
})

describe('initMessaging', () => {
  it('registers default handlers and sets up listener', () => {
    initMessaging()

    expect(chrome.runtime.onMessage.addListener).toHaveBeenCalledOnce()
    expect(typeof (chrome.runtime.onMessage.addListener as ReturnType<typeof vi.fn>).mock.calls[0][0]).toBe('function')
  })

  it('GET_DAILY_PROGRESS returns progress from storage', async () => {
    initMessaging()

    const sendResponse = vi.fn()
    const listener = (chrome.runtime.onMessage.addListener as ReturnType<typeof vi.fn>).mock.calls[0][0]
    listener({ type: 'GET_DAILY_PROGRESS', payload: undefined }, SENDER, sendResponse)

    await vi.waitFor(() => {
      expect(sendResponse).toHaveBeenCalledWith({ success: true, data: MOCK_DAILY_PROGRESS })
    })
  })

  it('GET_DAILY_PROGRESS returns defaults when nothing stored', async () => {
    mockStorage.set({ dailyProgress: undefined })
    initMessaging()

    const sendResponse = vi.fn()
    const listener = (chrome.runtime.onMessage.addListener as ReturnType<typeof vi.fn>).mock.calls[0][0]
    listener({ type: 'GET_DAILY_PROGRESS', payload: undefined }, SENDER, sendResponse)

    await vi.waitFor(() => {
      expect(sendResponse).toHaveBeenCalledWith({
        success: true,
        data: { wordsAdded: 0, notesAdded: 0, articlesSaved: 0, notesSaved: 0, reviewDue: 0, streak: 0 },
      })
    })
  })

  it('OPEN_OPTIONS calls chrome.runtime.openOptionsPage', () => {
    initMessaging()

    const sendResponse = vi.fn()
    const listener = (chrome.runtime.onMessage.addListener as ReturnType<typeof vi.fn>).mock.calls[0][0]
    listener({ type: 'OPEN_OPTIONS', payload: undefined }, SENDER, sendResponse)

    expect(chrome.runtime.openOptionsPage).toHaveBeenCalledOnce()
  })

  it('VIDEO_PAGE_DETECTED ignores payload when isVideoPage is false', async () => {
    initMessaging()

    const sendResponse = vi.fn()
    const listener = (chrome.runtime.onMessage.addListener as ReturnType<typeof vi.fn>).mock.calls[0][0]
    const setSpy = vi.spyOn(mockStorage, 'set')
    await listener(
      { type: 'VIDEO_PAGE_DETECTED', payload: { isVideoPage: false, platform: '', videoTitle: '', videoUrl: '', videoId: '' } },
      SENDER,
      sendResponse,
    )

    expect(setSpy).not.toHaveBeenCalled()
    expect(sendResponse).toHaveBeenCalledWith({ success: true, data: undefined })
  })

  it('VIDEO_HELPER_OPEN sends toggle message to tab', async () => {
    initMessaging()

    const sendResponse = vi.fn()
    const listener = (chrome.runtime.onMessage.addListener as ReturnType<typeof vi.fn>).mock.calls[0][0]
    const payload = { isVideoPage: true, platform: 'youtube', videoTitle: 'Test', videoUrl: 'https://youtube.com/watch?v=123', videoId: '123' }
    listener({ type: 'VIDEO_HELPER_OPEN', payload }, SENDER, sendResponse)

    await vi.waitFor(() => {
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(1, { type: 'TOGGLE_YOUTUBE_LEARNING', payload: true })
    })

    await vi.waitFor(() => {
      expect(sendResponse).toHaveBeenCalledWith({ success: true, data: undefined })
    })
  })

  it('MINI_TUTOR_OPEN_PAGE sends message to active tab', async () => {
    initMessaging()

    const sendResponse = vi.fn()
    const listener = (chrome.runtime.onMessage.addListener as ReturnType<typeof vi.fn>).mock.calls[0][0]
    listener(
      { type: 'MINI_TUTOR_OPEN_PAGE', payload: { action: 'explain', text: 'hello' } },
      SENDER,
      sendResponse,
    )

    expect(chrome.tabs.query).toHaveBeenCalledWith({ active: true, currentWindow: true })

    await vi.waitFor(() => {
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(1, {
        type: 'MINI_TUTOR_TRIGGER',
        payload: { action: 'explain', text: 'hello' },
      })
    })

    await vi.waitFor(() => {
      expect(sendResponse).toHaveBeenCalledWith({ success: true, data: undefined })
    })
  })
})
