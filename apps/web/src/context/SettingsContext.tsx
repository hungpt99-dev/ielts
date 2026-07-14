import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { UserConfiguration } from '@ielts/settings'
import { STORAGE_KEYS } from '@ielts/config'

function loadUserConfig(): UserConfiguration {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.localStorage.userSettings)
    return raw ? JSON.parse(raw) : { version: 1 }
  } catch {
    return { version: 1 }
  }
}

function saveUserConfig(config: UserConfiguration): void {
  try {
    localStorage.setItem(STORAGE_KEYS.localStorage.userSettings, JSON.stringify(config))
  } catch { /* ignore */ }
}

interface SettingsContextValue {
  settings: UserConfiguration
  updateSettings: (patch: Partial<UserConfiguration>) => void
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: loadUserConfig(),
  updateSettings: () => {},
})

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserConfiguration>(loadUserConfig)

  useEffect(() => {
    saveUserConfig(settings)
  }, [settings])

  useEffect(() => {
    function handleSettingsUpdate(e: Event) {
      const detail = (e as CustomEvent).detail as Partial<UserConfiguration> | undefined
      if (detail) {
        setSettings((prev) => ({ ...prev, ...detail }))
      } else {
        setSettings(loadUserConfig())
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
