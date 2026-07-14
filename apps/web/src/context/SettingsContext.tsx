import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { UserConfiguration } from '@ielts/settings'
import { loadUserConfiguration } from '@ielts/settings'
import { STORAGE_KEYS } from '@ielts/config'

function saveUserConfig(config: UserConfiguration): void {
  try {
    const json = JSON.stringify(config)
    console.log('[SettingsContext] Saving config:', json)
    localStorage.setItem(STORAGE_KEYS.localStorage.userSettings, json)
  } catch (e) { console.error('[SettingsContext] Save failed:', e) }
}

interface SettingsContextValue {
  settings: UserConfiguration
  updateSettings: (patch: Partial<UserConfiguration>) => void
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: loadUserConfiguration(),
  updateSettings: () => {},
})

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserConfiguration>(loadUserConfiguration)

  useEffect(() => {
    saveUserConfig(settings)
  }, [settings])

  useEffect(() => {
    function handleSettingsUpdate(e: Event) {
      const detail = (e as CustomEvent).detail as Partial<UserConfiguration> | undefined
      if (detail) {
        setSettings((prev) => ({ ...prev, ...detail }))
      } else {
        setSettings(loadUserConfiguration())
      }
    }
    window.addEventListener('ielts-settings-updated', handleSettingsUpdate)
    return () => window.removeEventListener('ielts-settings-updated', handleSettingsUpdate)
  }, [])

  const updateSettings = (patch: Partial<UserConfiguration>) => {
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
