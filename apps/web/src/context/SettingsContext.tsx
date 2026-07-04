import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { AppSettings } from '../models'
import { loadAppSettings, saveAppSettings, initSettingsBridge } from '../services/storage/SettingsStorage'
import { initVocabSync } from '../services/storage/VocabularySync'

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
  }, [])

  useEffect(() => {
    saveAppSettings(settings)
  }, [settings])

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
