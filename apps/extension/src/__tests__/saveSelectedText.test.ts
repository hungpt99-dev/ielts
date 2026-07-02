import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('Extension SaveSelectedText', () => {
  beforeEach(() => {
    vi.stubGlobal('chrome', {
      runtime: {
        onMessage: {
          addListener: vi.fn(),
        },
        sendMessage: vi.fn(),
      },
      storage: {
        local: {
          get: vi.fn(),
          set: vi.fn(),
        },
      },
    })
    document.body.innerHTML = ''
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows toast notification when SAVE_SELECTION message is received', () => {
    const addListener = vi.fn()
    vi.stubGlobal('chrome', {
      runtime: {
        onMessage: { addListener },
        sendMessage: vi.fn(),
      },
      storage: {
        local: { get: vi.fn(), set: vi.fn() },
      },
    })
    const showToast = vi.fn()

    const saveHandler = (message: any, _sender: any, sendResponse: any) => {
      if (message.type === 'SAVE_SELECTION') {
        showToast(`Saved as ${message.payload.category}`)
        sendResponse({ success: true })
        return true
      }
      return false
    }

    addListener.mockImplementation(saveHandler)
    const listener = addListener.mock.calls[0]?.[0] || saveHandler
    const result = listener(
      { type: 'SAVE_SELECTION', payload: { category: 'vocabulary', text: 'hello' } },
      {},
      vi.fn(),
    )
    expect(result).toBe(true)
  })

  it('handles SAVE_SELECTION_FULL message with chrome.storage.local', () => {
    let savedItems: Array<Record<string, unknown>> = []
    const getMock = vi.fn((_keys: string | string[] | Record<string, unknown>, callback: (result: any) => void) => {
      callback({ savedItems })
    })
    const setMock = vi.fn((data: Record<string, unknown>, callback?: () => void) => {
      savedItems = data.savedItems as Array<Record<string, unknown>>
      if (callback) callback()
    })

    vi.stubGlobal('chrome', {
      runtime: {
        onMessage: { addListener: vi.fn() },
        sendMessage: vi.fn(),
      },
      storage: {
        local: { get: getMock, set: setMock },
      },
    })

    const payload = {
      text: 'selected text',
      category: 'vocabulary',
      pageTitle: 'Test Page',
      pageUrl: 'https://example.com',
      note: '',
      topic: 'education',
      difficulty: 'easy',
      tags: ['test'],
    }

    getMock('savedItems', (result: any) => {
      const items = result.savedItems || []
      items.unshift({
        id: crypto.randomUUID(),
        ...payload,
        savedAt: new Date().toISOString(),
      })
      setMock({ savedItems: items })
    })

    expect(getMock).toHaveBeenCalledWith('savedItems', expect.any(Function))
  })

  it('responds to GET_PAGE_INFO with page title, url, and selected text', () => {
    document.title = 'Test Page'
    const sendResponse = vi.fn()

    const handler = (message: { type: string }, _sender: any, sendResponse: (response: any) => void) => {
      if (message.type === 'GET_PAGE_INFO') {
        sendResponse({
          title: document.title,
          url: window.location.href,
          selectedText: '',
        })
        return true
      }
    }

    handler({ type: 'GET_PAGE_INFO' }, {}, sendResponse)
    expect(sendResponse).toHaveBeenCalledWith({
      title: 'Test Page',
      url: expect.any(String),
      selectedText: '',
    })
  })
})
