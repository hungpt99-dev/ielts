import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import type {
  ExtendedUserConfiguration,
  ConfigurationBasic,
  ConfigurationAdvanced,
  AiTutorConfig,
  AiProviderConfig,
} from './models'
import {
  createDefaultConfiguration,
  createDefaultProvider,
  loadConfiguration,
  saveConfiguration,
  migrateFromLegacySettings,
} from './storage'

export interface ConfigActions {
  updateBasic: (patch: Partial<ConfigurationBasic>) => void
  updateBasicField: <K extends keyof ConfigurationBasic>(
    field: K,
    value: ConfigurationBasic[K],
  ) => void
  updateAdvanced: (patch: Partial<ConfigurationAdvanced>) => void
  updateAdvancedField: <K extends keyof ConfigurationAdvanced>(
    field: K,
    value: ConfigurationAdvanced[K],
  ) => void
  updateTutorConfig: (patch: Partial<AiTutorConfig>) => void
  addProvider: (config: AiProviderConfig) => void
  updateProvider: (providerId: string, patch: Partial<AiProviderConfig>) => void
  removeProvider: (providerId: string) => void
  setActiveProvider: (providerId: string) => void
  resetConfig: () => void
}

interface ConfigContextValue {
  config: ExtendedUserConfiguration
  actions: ConfigActions
}

const ConfigContext = createContext<ConfigContextValue | null>(null)

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<ExtendedUserConfiguration>(() => {
    const existing = loadConfiguration()
    const defaults = createDefaultConfiguration()
    if (
      existing.basic.targetBand === defaults.basic.targetBand &&
      existing.basic.examDate === '' &&
      existing.advanced.providers['default-openai']?.apiKey === ''
    ) {
      const migrated = migrateFromLegacySettings()
      if (migrated) {
        saveConfiguration(migrated)
        return migrated
      }
    }
    return existing
  })

  useEffect(() => {
    saveConfiguration(config)
  }, [config])

  const updateBasic = useCallback((patch: Partial<ConfigurationBasic>) => {
    setConfig(prev => ({ ...prev, basic: { ...prev.basic, ...patch } }))
  }, [])

  const updateBasicField = useCallback(
    <K extends keyof ConfigurationBasic>(field: K, value: ConfigurationBasic[K]) => {
      setConfig(prev => ({ ...prev, basic: { ...prev.basic, [field]: value } }))
    },
    [],
  )

  const updateAdvanced = useCallback((patch: Partial<ConfigurationAdvanced>) => {
    setConfig(prev => ({ ...prev, advanced: { ...prev.advanced, ...patch } }))
  }, [])

  const updateAdvancedField = useCallback(
    <K extends keyof ConfigurationAdvanced>(field: K, value: ConfigurationAdvanced[K]) => {
      setConfig(prev => ({
        ...prev,
        advanced: { ...prev.advanced, [field]: value },
      }))
    },
    [],
  )

  const updateTutorConfig = useCallback((patch: Partial<AiTutorConfig>) => {
    setConfig(prev => ({
      ...prev,
      advanced: {
        ...prev.advanced,
        tutorConfig: { ...prev.advanced.tutorConfig, ...patch },
      },
    }))
  }, [])

  const addProvider = useCallback((providerConfig: AiProviderConfig) => {
    setConfig(prev => ({
      ...prev,
      advanced: {
        ...prev.advanced,
        providers: {
          ...prev.advanced.providers,
          [providerConfig.providerId]: providerConfig,
        },
      },
    }))
  }, [])

  const updateProvider = useCallback(
    (providerId: string, patch: Partial<AiProviderConfig>) => {
      setConfig(prev => {
        const existing = prev.advanced.providers[providerId]
        if (!existing) return prev
        return {
          ...prev,
          advanced: {
            ...prev.advanced,
            providers: {
              ...prev.advanced.providers,
              [providerId]: { ...existing, ...patch },
            },
          },
        }
      })
    },
    [],
  )

  const removeProvider = useCallback((providerId: string) => {
    setConfig(prev => {
      const { [providerId]: _removed, ...remaining } = prev.advanced.providers
      const next = { ...prev }
      // If we removed the active provider, switch to the first available
      if (providerId === prev.advanced.activeProviderId) {
        const firstId = Object.keys(remaining)[0]
        if (firstId) {
          next.advanced.activeProviderId = firstId
        } else {
          const newDefault = createDefaultProvider()
          remaining[newDefault.providerId] = newDefault
          next.advanced.activeProviderId = newDefault.providerId
        }
      }
      next.advanced = { ...next.advanced, providers: remaining }
      return next
    })
  }, [])

  const setActiveProvider = useCallback((providerId: string) => {
    setConfig(prev => {
      if (!prev.advanced.providers[providerId]) return prev
      return {
        ...prev,
        advanced: { ...prev.advanced, activeProviderId: providerId },
      }
    })
  }, [])

  const resetConfig = useCallback(() => {
    setConfig(createDefaultConfiguration())
  }, [])

  const actions: ConfigActions = {
    updateBasic,
    updateBasicField,
    updateAdvanced,
    updateAdvancedField,
    updateTutorConfig,
    addProvider,
    updateProvider,
    removeProvider,
    setActiveProvider,
    resetConfig,
  }

  return (
    <ConfigContext.Provider value={{ config, actions }}>
      {children}
    </ConfigContext.Provider>
  )
}

export function useConfiguration(): ConfigContextValue {
  const ctx = useContext(ConfigContext)
  if (!ctx) {
    throw new Error('useConfiguration must be used within a ConfigProvider')
  }
  return ctx
}
