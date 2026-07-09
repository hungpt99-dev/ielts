import { loadSettings, saveSettings, getSyncStatus, checkAndSync, onWebTabAvailable } from './AutoSyncController'
import type { AutoSyncSettings } from './AutoSyncController'

export function registerSyncMessageHandlers(): void {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (!message || typeof message !== 'object') return false
    const msg = message as Record<string, unknown>

    if (msg.type === 'GET_AUTO_SYNC_SETTINGS') {
      loadSettings().then((s) => sendResponse({ success: true, data: s }))
      return true
    }

    if (msg.type === 'SAVE_AUTO_SYNC_SETTINGS') {
      const s = msg.payload as Partial<AutoSyncSettings>
      loadSettings().then((current) => saveSettings({ ...current, ...s })).then(() => sendResponse({ success: true }))
      return true
    }

    if (msg.type === 'GET_AUTO_SYNC_STATUS') {
      sendResponse({ success: true, data: getSyncStatus() })
      return false
    }

    if (msg.type === 'TRIGGER_AUTO_SYNC') {
      checkAndSync({ force: true }).then(() => sendResponse({ success: true }))
      return true
    }

    if (msg.type === 'WEB_TAB_OPENED') {
      onWebTabAvailable().then(() => sendResponse({ success: true }))
      return true
    }

    return false
  })
}
