import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { AppSettings } from '../models'
import { loadAppSettings, saveAppSettings, initSettingsBridge } from '../services/storage/SettingsStorage'
import { initVocabSync } from '../services/storage/VocabularySync'
import { initExtensionEventBridge } from '../services/storage/ExtensionEventBridge'

interface SettingsContextValue {
  settings: AppSettings
  updateSettings: (patch: Partial<AppSettings>) => void
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: loadAppSettings(),
  updateSettings: () => {},
})

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(loadAppSettings)

  useEffect(() => {
    initSettingsBridge()
    initVocabSync()
    initExtensionEventBridge()
  }, [])

  useEffect(() => {
    saveAppSettings(settings)
  }, [settings])

  useEffect(() => {
    function handleSettingsUpdate(e: Event) {
      const detail = (e as CustomEvent).detail as Partial<AppSettings> | undefined
      if (detail) {
        setSettings((prev) => ({ ...prev, ...detail }))
      } else {
        setSettings(loadAppSettings())
      }
    }
    window.addEventListener('ielts-settings-updated', handleSettingsUpdate)
    return () => window.removeEventListener('ielts-settings-updated', handleSettingsUpdate)
  }, [])

  const updateSettings = (patch: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...patch }))
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  return useContext(SettingsContext)
}
