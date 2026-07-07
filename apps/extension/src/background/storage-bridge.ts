export async function broadcastToTabs(payload: Record<string, unknown>): Promise<void> {
  const tabs = await chrome.tabs.query({ url: '*://*/*' })
  for (const tab of tabs) {
    if (!tab.id) continue
    chrome.tabs.sendMessage(tab.id, { type: 'SETTINGS_SYNC', payload }).catch(() => {})
  }
}

export async function initializeStorageBridge(): Promise<void> {
  const { addSettingsChangeListener, getOverlappingForWebsite } = await import('./settingsStorage')
  addSettingsChangeListener((settings) => {
    const overlapping = getOverlappingForWebsite(settings)
    broadcastToTabs(overlapping as unknown as Record<string, unknown>)
  })
}
