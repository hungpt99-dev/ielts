import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockTabsCreate = vi.fn()
const mockTabsQuery = vi.fn()
const mockTabsUpdate = vi.fn()
const mockWindowsUpdate = vi.fn()
const mockGetURL = vi.fn()

const mockChrome = {
  runtime: { getURL: mockGetURL },
  tabs: { create: mockTabsCreate, query: mockTabsQuery, update: mockTabsUpdate },
  windows: { update: mockWindowsUpdate },
}

vi.stubGlobal('chrome', mockChrome)

async function openMainApp(route?: string): Promise<void> {
  const MAIN_APP_PATH = 'app/index.html'
  const targetUrl = route
    ? mockChrome.runtime.getURL(`${MAIN_APP_PATH}#${route}`)
    : mockChrome.runtime.getURL(`${MAIN_APP_PATH}#/dashboard`)

  try {
    const existingTabs = await mockChrome.tabs.query({ url: mockChrome.runtime.getURL(`${MAIN_APP_PATH}*`) })

    if (existingTabs.length > 0) {
      const tab = existingTabs[0]
      if (tab?.id != null && tab?.windowId != null) {
        await mockChrome.tabs.update(tab.id, { active: true })
        await mockChrome.windows.update(tab.windowId, { focused: true })
      } else if (tab?.id != null) {
        await mockChrome.tabs.update(tab.id, { active: true })
      }
    } else {
      await mockChrome.tabs.create({ url: targetUrl })
    }
  } catch {
    await mockChrome.tabs.create({ url: targetUrl })
  }
}

describe('openMainApp', () => {
  beforeEach(() => {
    mockTabsCreate.mockReset()
    mockTabsQuery.mockReset()
    mockTabsUpdate.mockReset()
    mockWindowsUpdate.mockReset()
    mockGetURL.mockReset()
    mockGetURL.mockImplementation((path: string) => `chrome-extension://test-id/${path}`)
  })

  it('creates a new tab when no existing IELTS Journey tab is found', async () => {
    mockTabsQuery.mockResolvedValue([])
    mockTabsCreate.mockResolvedValue({ id: 1 })

    await openMainApp()

    expect(mockTabsCreate).toHaveBeenCalledWith({
      url: 'chrome-extension://test-id/app/index.html#/dashboard',
    })
    expect(mockTabsUpdate).not.toHaveBeenCalled()
  })

  it('focuses existing tab instead of creating a new one', async () => {
    mockTabsQuery.mockResolvedValue([{ id: 5, windowId: 1 }])
    mockTabsUpdate.mockResolvedValue({})

    await openMainApp()

    expect(mockTabsUpdate).toHaveBeenCalledWith(5, { active: true })
    expect(mockWindowsUpdate).toHaveBeenCalledWith(1, { focused: true })
    expect(mockTabsCreate).not.toHaveBeenCalled()
  })

  it('opens with a specific route', async () => {
    mockTabsQuery.mockResolvedValue([])
    mockTabsCreate.mockResolvedValue({ id: 2 })

    await openMainApp('/vocabulary')

    expect(mockTabsCreate).toHaveBeenCalledWith({
      url: 'chrome-extension://test-id/app/index.html#/vocabulary',
    })
  })

  it('opens dashboard by default when no route specified', async () => {
    mockTabsQuery.mockResolvedValue([])
    mockTabsCreate.mockResolvedValue({ id: 3 })

    await openMainApp()

    expect(mockTabsCreate).toHaveBeenCalledWith({
      url: 'chrome-extension://test-id/app/index.html#/dashboard',
    })
  })

  it('falls back to creating tab when query fails', async () => {
    mockTabsQuery.mockRejectedValue(new Error('Extension context invalidated'))
    mockTabsCreate.mockResolvedValue({ id: 4 })

    await openMainApp()

    expect(mockTabsCreate).toHaveBeenCalled()
  })
})
