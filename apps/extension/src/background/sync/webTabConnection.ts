const TRUSTED_WEB_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
  'https://ieltsjourney.dev',
  'https://www.ieltsjourney.dev',
]

export interface WebTabInfo {
  tabId: number
  url: string
  connected: boolean
}

export async function findWebAppTab(): Promise<WebTabInfo | null> {
  try {
    const tabs = await chrome.tabs.query({})
    // First pass: look for localhost (dev)
    for (const tab of tabs) {
      if (!tab.id || !tab.url) continue
      try {
        const url = new URL(tab.url)
        if (url.origin.includes('localhost') || url.origin.includes('127.0.0.1')) {
          if (TRUSTED_WEB_ORIGINS.includes(url.origin)) {
            return { tabId: tab.id, url: tab.url, connected: true }
          }
        }
      } catch {}
    }
    // Second pass: look for production
    for (const tab of tabs) {
      if (!tab.id || !tab.url) continue
      try {
        const url = new URL(tab.url)
        if (TRUSTED_WEB_ORIGINS.includes(url.origin)) {
          return { tabId: tab.id, url: tab.url, connected: true }
        }
      } catch {}
    }
  } catch {}
  return null
}

export async function ensureWebAppTab(): Promise<WebTabInfo | null> {
  const existing = await findWebAppTab()
  if (existing) return existing
  try {
    const tab = await chrome.tabs.create({ url: 'https://ieltsjourney.dev' })
    return { tabId: tab.id!, url: tab.url || 'https://ieltsjourney.dev', connected: true }
  } catch {
    return null
  }
}
