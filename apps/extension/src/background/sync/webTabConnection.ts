const TRUSTED_WEB_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
  'https://ieltsjourney.dev',
  'https://www.ieltsjourney.dev',
]

const LOCAL_ORIGINS = new Set(TRUSTED_WEB_ORIGINS.filter(o => o.includes('localhost') || o.includes('127.0.0.1')))

export interface WebTabInfo {
  tabId: number
  url: string
}

export async function findWebAppTab(): Promise<WebTabInfo | null> {
  try {
    const tabs = await chrome.tabs.query({})
    let productionTab: WebTabInfo | null = null

    for (const tab of tabs) {
      if (!tab.id || !tab.url) continue
      try {
        const origin = new URL(tab.url).origin
        if (LOCAL_ORIGINS.has(origin)) {
          return { tabId: tab.id, url: tab.url }
        }
        if (TRUSTED_WEB_ORIGINS.includes(origin)) {
          productionTab = { tabId: tab.id, url: tab.url }
        }
      } catch {}
    }
    return productionTab
  } catch {}
  return null
}
