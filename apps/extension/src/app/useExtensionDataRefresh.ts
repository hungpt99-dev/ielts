import { useEffect, useCallback } from 'react'

export function useExtensionDataRefresh(onDataChanged?: (entity?: string) => void) {
  const handleRefresh = useCallback(() => {
    onDataChanged?.()
    window.dispatchEvent(new CustomEvent('ielts-data-changed'))
  }, [onDataChanged])

  useEffect(() => {
    const handleMessage = (message: Record<string, unknown>) => {
      if (message.type === 'DATA_CHANGED') {
        handleRefresh()
      }
    }

    if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
      chrome.runtime.onMessage.addListener(handleMessage)

      const handleStorageChange = (
        changes: Record<string, chrome.storage.StorageChange>,
        areaName: string,
      ) => {
        if (areaName === 'local' && changes._pendingSaves) {
          handleRefresh()
        }
      }

      chrome.storage.onChanged.addListener(handleStorageChange)

      return () => {
        chrome.runtime.onMessage.removeListener(handleMessage)
        chrome.storage.onChanged.removeListener(handleStorageChange)
      }
    }
  }, [handleRefresh])
}
