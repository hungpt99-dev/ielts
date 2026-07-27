import { MAIN_APP_PATH, MAIN_APP_DASHBOARD_URL } from './messages'

export async function openMainApp(route?: string): Promise<void> {
  const targetUrl = route
    ? chrome.runtime.getURL(`${MAIN_APP_PATH}#${route}`)
    : chrome.runtime.getURL(MAIN_APP_DASHBOARD_URL)

  try {
    const existingTabs = await chrome.tabs.query({ url: chrome.runtime.getURL(`${MAIN_APP_PATH}*`) })

    if (existingTabs.length > 0) {
      const tab = existingTabs[0]
      if (tab?.id != null && tab?.windowId != null) {
        await chrome.tabs.update(tab.id, { active: true, url: targetUrl })
        await chrome.windows.update(tab.windowId, { focused: true })
      } else if (tab?.id != null) {
        await chrome.tabs.update(tab.id, { active: true, url: targetUrl })
      }
    } else {
      await chrome.tabs.create({ url: targetUrl })
    }
  } catch {
    await chrome.tabs.create({ url: targetUrl })
  }
}

export async function isMainAppOpen(): Promise<boolean> {
  try {
    const tabs = await chrome.tabs.query({ url: chrome.runtime.getURL(`${MAIN_APP_PATH}*`) })
    return tabs.length > 0
  } catch {
    return false
  }
}

export async function focusMainApp(): Promise<void> {
  try {
    const tabs = await chrome.tabs.query({ url: chrome.runtime.getURL(`${MAIN_APP_PATH}*`) })
    if (tabs.length > 0) {
      const tab = tabs[0]
      if (tab?.id != null && tab?.windowId != null) {
        await chrome.tabs.update(tab.id, { active: true })
        await chrome.windows.update(tab.windowId, { focused: true })
      } else if (tab?.id != null) {
        await chrome.tabs.update(tab.id, { active: true })
      }
    }
  } catch { /* ignore */ }
}
