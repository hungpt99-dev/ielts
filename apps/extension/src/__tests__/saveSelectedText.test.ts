import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest'

let mockSendMessage: ReturnType<typeof vi.fn>

function setupChromeMock() {
  const store: Record<string, unknown> = {}
  mockSendMessage = vi.fn().mockResolvedValue(undefined)

  const mockChrome = {
    runtime: {
      lastError: undefined,
      onMessage: {
        addListener: vi.fn(),
      },
      sendMessage: mockSendMessage,
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
      },
    },
  }

  vi.stubGlobal('chrome', mockChrome)
  return mockChrome
}

function getListeners(): Array<(message: any, sender: any, sendResponse: any) => void> {
  const calls = (chrome.runtime.onMessage.addListener as ReturnType<typeof vi.fn>).mock.calls
  return (calls || []).map((c: unknown[]) => c[0] as (message: any, sender: any, sendResponse: any) => void)
}

let listener: ((message: any, sender: any, sendResponse: any) => void) | null = null

beforeAll(async () => {
  setupChromeMock()
  await import('../content-script/saveSelectedText')

  const listeners = getListeners()
  listener = listeners[0] || null
})

beforeEach(() => {
  setupChromeMock()
  document.body.innerHTML = ''
  document.title = ''
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('Extension SaveSelectedText', () => {
  it('imports the module and registers the message listener', () => {
    expect(listener).toBeDefined()
  })

  it('shows toast and responds to SAVE_SELECTION message', () => {
    const sendResponse = vi.fn()
    listener!({ type: 'SAVE_SELECTION', payload: { category: 'vocabulary', text: 'hello' } }, {}, sendResponse)
    expect(sendResponse).toHaveBeenCalledWith({ success: true })
    const toast = document.querySelector('#ielts-toast')
    expect(toast).not.toBeNull()
    expect(toast!.textContent).toBe('Saved as vocabulary')
  })

  it('responds to GET_PAGE_INFO with page title, url, and selected text', () => {
    document.title = 'Test Page'
    const sendResponse = vi.fn()
    listener!({ type: 'GET_PAGE_INFO' }, {}, sendResponse)
    expect(sendResponse).toHaveBeenCalledWith({
      title: 'Test Page',
      url: expect.any(String),
      selectedText: '',
    })
  })

  it('responds to GET_PAGE_INFO with selected text when text is highlighted', () => {
    document.title = 'Test Page'
    const div = document.createElement('div')
    div.textContent = 'highlighted selected text'
    document.body.appendChild(div)

    const sel = window.getSelection()
    const range = document.createRange()
    range.selectNodeContents(div)
    sel?.removeAllRanges()
    sel?.addRange(range)

    const sendResponse = vi.fn()
    listener!({ type: 'GET_PAGE_INFO' }, {}, sendResponse)
    expect(sendResponse).toHaveBeenCalledWith({
      title: 'Test Page',
      url: expect.any(String),
      selectedText: 'highlighted selected text',
    })

    sel?.removeAllRanges()
  })

  it('sends SAVE_SELECTION_FULL message to background on SAVE_SELECTION_FULL', () => {
    const payload = {
      text: 'selected text content',
      category: 'vocabulary' as const,
      pageTitle: 'Test Page',
      pageUrl: 'https://example.com',
      topic: 'education',
      difficulty: 'easy',
      tags: ['test'],
      note: 'a note',
    }

    const sendResponse = vi.fn()
    listener!({ type: 'SAVE_SELECTION_FULL', payload }, {}, sendResponse)

    expect(mockSendMessage).toHaveBeenCalledWith({
      type: 'SAVE_SELECTION_FULL',
      payload: {
        text: 'selected text content',
        category: 'vocabulary',
        pageTitle: 'Test Page',
        pageUrl: 'https://example.com',
        topic: 'education',
        difficulty: 'easy',
        note: 'a note',
        tags: ['test'],
      },
    })

    expect(sendResponse).toHaveBeenCalledWith({ success: true })
    const toast = document.querySelector('#ielts-toast')
    expect(toast).not.toBeNull()
    expect(toast!.textContent).toBe('Saved as vocabulary')
  })

  it('handles SAVE_ARTIFACT message and shows toast', () => {
    const payload = {
      url: 'https://example.com/article',
      title: 'An Article',
      description: 'Article description',
      tags: ['ielts', 'reading'],
      category: 'article',
      favicon: '',
    }

    const sendResponse = vi.fn()
    listener!({ type: 'SAVE_ARTIFACT', payload }, {}, sendResponse)
    expect(sendResponse).toHaveBeenCalledWith({ success: true })
    const toast = document.querySelector('#ielts-toast')
    expect(toast).not.toBeNull()
    expect(toast!.textContent).toBe('Page saved as Artifact')
  })

  it('removes existing toast before showing a new one', () => {
    const oldToast = document.createElement('div')
    oldToast.id = 'ielts-toast'
    oldToast.textContent = 'old'
    document.body.appendChild(oldToast)

    const sendResponse = vi.fn()
    listener!({ type: 'SAVE_SELECTION', payload: { category: 'vocabulary', text: 'new' } }, {}, sendResponse)

    const toasts = document.querySelectorAll('#ielts-toast')
    expect(toasts).toHaveLength(1)
    expect(toasts[0].textContent).toBe('Saved as vocabulary')
  })

  it('has correct toast styling', () => {
    const sendResponse = vi.fn()
    listener!({ type: 'SAVE_SELECTION', payload: { category: 'vocabulary', text: 'test' } }, {}, sendResponse)

    const toast = document.querySelector('#ielts-toast') as HTMLElement
    expect(toast.style.position).toBe('fixed')
    expect(toast.style.zIndex).toBe('2147483647')
    expect(toast.style.pointerEvents).toBe('none')
  })
})
