import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  DEFAULT_SETTINGS,
  SAVE_CATEGORIES,
  THEME_MODES,
  AI_PROVIDERS,
  loadSettings,
  saveSettings,
  patchSettings,
  syncFromWebsite,
  getOverlappingForWebsite,
  getApiKey,
  setApiKey,
  clearAllSettings,
  exportSettingsData,
  importSettingsData,
  addSettingsChangeListener,
  removeSettingsChangeListener,
} from '../settingsStorage'
import type { ExtensionSettings, WebsiteOverlappingSettings } from '../settingsStorage'

function createMockStore(): {
  get: ReturnType<typeof vi.fn>
  set: ReturnType<typeof vi.fn>
  remove: ReturnType<typeof vi.fn>
} {
  const store: Record<string, unknown> = {}
  return {
    get: vi.fn((keys: string | string[], cb?: (result: Record<string, unknown>) => void) => {
      const result: Record<string, unknown> = {}
      const keyList = Array.isArray(keys) ? keys : [keys]
      for (const k of keyList) {
        if (k in store) result[k] = store[k]
      }
      if (cb) { cb(result) }
    }),
    set: vi.fn((data: Record<string, unknown>, cb?: () => void) => {
      Object.assign(store, data)
      if (cb) cb()
    }),
    remove: vi.fn((_keys: string | string[], cb?: () => void) => {
      const keyList = Array.isArray(_keys) ? _keys : [_keys]
      for (const k of keyList) {
        delete store[k]
      }
      if (cb) cb()
    }),
  }
}

let syncStore: ReturnType<typeof createMockStore>
let localStore: ReturnType<typeof createMockStore>

beforeEach(() => {
  syncStore = createMockStore()
  localStore = createMockStore()

  vi.stubGlobal('chrome', {
    storage: {
      sync: syncStore,
      local: localStore,
    },
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('constants', () => {
  it('DEFAULT_SETTINGS has all required fields', () => {
    expect(DEFAULT_SETTINGS.floatingToolbar).toBe(true)
    expect(DEFAULT_SETTINGS.autoSaveSelected).toBe(false)
    expect(DEFAULT_SETTINGS.defaultTopic).toBe('general')
  })

  it('SAVE_CATEGORIES has expected values', () => {
    expect(SAVE_CATEGORIES).toEqual([
      'vocabulary', 'phrase', 'sentence', 'grammar',
      'reading', 'writing', 'speaking', 'mistake',
    ])
  })

  it('THEME_MODES has expected values', () => {
    expect(THEME_MODES).toEqual(['light', 'dark', 'system'])
  })

  it('AI_PROVIDERS has expected values', () => {
    expect(AI_PROVIDERS).toEqual(['openai', 'custom'])
  })
})

describe('getApiKey / setApiKey', () => {
  it('getApiKey returns empty string when no key stored', async () => {
    const key = await getApiKey()
    expect(key).toBe('')
  })

  it('setApiKey stores and getApiKey retrieves the key', async () => {
    await setApiKey('sk-test-123')
    const key = await getApiKey()
    expect(key).toBe('sk-test-123')
  })

  it('setApiKey with empty string clears the key', async () => {
    await setApiKey('sk-test-123')
    await setApiKey('')
    const key = await getApiKey()
    expect(key).toBe('')
  })
})

describe('loadSettings', () => {
  it('returns defaults when no settings stored', async () => {
    const settings = await loadSettings()
    expect(settings).toEqual(DEFAULT_SETTINGS)
  })

  it('returns stored local settings merged with defaults', async () => {
    localStore.set({
      extensionSettings: { aiProvider: 'custom', aiModel: 'gpt-4' },
    })

    const settings = await loadSettings()
    expect(settings.aiProvider).toBe('custom')
    expect(settings.aiModel).toBe('gpt-4')
    expect(settings.themeMode).toBe('system')
    expect(settings.floatingToolbar).toBe(true)
  })

  it('loads apiKey from local storage', async () => {
    localStore.set({ aiApiKey: 'sk-secret-456' })

    const settings = await loadSettings()
    expect(settings.aiApiKey).toBe('sk-secret-456')
  })

  it('merges stored data with defaults, preferring stored values', async () => {
    localStore.set({
      extensionSettings: { aiProvider: 'invalid-provider', aiModel: 'gpt-4' },
    })

    const settings = await loadSettings()
    // The engine faithfully returns whatever was stored,
    // merged over defaults — it does not validate field values
    expect(settings.aiProvider).toBe('invalid-provider')
    expect(settings.aiModel).toBe('gpt-4')
    expect(settings.themeMode).toBe('system')
  })
})

describe('saveSettings', () => {
  it('saves settings to local storage without apiKey', async () => {
    await saveSettings(DEFAULT_SETTINGS)

    expect(localStore.set).toHaveBeenCalled()
    const callArgs = (localStore.set as ReturnType<typeof vi.fn>).mock.calls
    const settingsCall = callArgs.find(
      (c: unknown[]) => c[0] && typeof c[0] === 'object' && 'extensionSettings' in c[0],
    )!
    const saved = settingsCall[0].extensionSettings
    expect(saved).toMatchObject({ aiProvider: 'openai', themeMode: 'system' })
    expect(saved.aiApiKey).toBeUndefined()
  })

  it('saves apiKey separately to local storage', async () => {
    const settings = { ...DEFAULT_SETTINGS, aiApiKey: 'sk-test-key' }
    await saveSettings(settings)

    expect(localStore.set).toHaveBeenCalledWith(
      { aiApiKey: 'sk-test-key' },
      expect.any(Function),
    )
  })

  it('saves backup to local storage', async () => {
    await saveSettings(DEFAULT_SETTINGS)

    const backupCall = (localStore.set as ReturnType<typeof vi.fn>).mock.calls.find(
      (c: unknown[]) => c[0] && typeof c[0] === 'object' && 'ielts-settings-backup' in c[0],
    )
    expect(backupCall).toBeDefined()
  })

  it('notifies listeners after saving', async () => {
    const listener = vi.fn()
    addSettingsChangeListener(listener)

    await saveSettings(DEFAULT_SETTINGS)

    expect(listener).toHaveBeenCalledWith(DEFAULT_SETTINGS)
  })
})

describe('patchSettings', () => {
  it('loads current settings, merges patch, and saves', async () => {
    const settings = await patchSettings({ themeMode: 'dark' })

    expect(settings.themeMode).toBe('dark')
    expect(settings.aiProvider).toBe('openai')
  })

  it('preserves existing field values not in the patch', async () => {
    localStore.set({ extensionSettings: { aiModel: 'gpt-4-turbo' } })
    const settings = await patchSettings({ themeMode: 'light' })

    expect(settings.aiModel).toBe('gpt-4-turbo')
    expect(settings.themeMode).toBe('light')
  })
})

describe('syncFromWebsite', () => {
  it('applies overlapping settings from website', async () => {
    const websiteSettings: WebsiteOverlappingSettings = {
      aiProvider: 'custom',
      aiModel: 'gpt-4o',
      aiBaseUrl: 'https://custom.ai',
      themeMode: 'dark',
    }

    const merged = await syncFromWebsite(websiteSettings)

    expect(merged.aiProvider).toBe('custom')
    expect(merged.aiModel).toBe('gpt-4o')
    expect(merged.aiBaseUrl).toBe('https://custom.ai')
    expect(merged.themeMode).toBe('dark')
  })

  it('saves apiKey from website to local storage', async () => {
    const websiteSettings: WebsiteOverlappingSettings = {
      aiApiKey: 'sk-website-key',
    }

    const merged = await syncFromWebsite(websiteSettings)

    expect(merged.aiApiKey).toBe('sk-website-key')
    const localKey = await getApiKey()
    expect(localKey).toBe('sk-website-key')
  })

  it('ignores undefined website settings', async () => {
    const merged = await syncFromWebsite({})

    expect(merged).toEqual(DEFAULT_SETTINGS)
  })
})

describe('getOverlappingForWebsite', () => {
  it('extracts only overlapping fields', () => {
    const overlapping = getOverlappingForWebsite(DEFAULT_SETTINGS)

    expect(overlapping).toEqual({
      aiProvider: 'openai',
      aiModel: 'gpt-4o-mini',
      aiBaseUrl: '',
      themeMode: 'system',
    })
  })

  it('does not include aiApiKey or extension-only fields', () => {
    const overlapping = getOverlappingForWebsite(DEFAULT_SETTINGS)

    expect(overlapping).not.toHaveProperty('aiApiKey')
    expect(overlapping).not.toHaveProperty('floatingToolbar')
    expect(overlapping).not.toHaveProperty('autoSaveSelected')
  })
})

describe('clearAllSettings', () => {
  it('removes settings from local storage', async () => {
    localStore.set({ extensionSettings: DEFAULT_SETTINGS })
    localStore.set({ aiApiKey: 'sk-key', 'ielts-settings-backup': DEFAULT_SETTINGS })

    await clearAllSettings()

    expect(localStore.remove).toHaveBeenCalledWith(
      ['extensionSettings', 'aiApiKey', 'ielts-settings-backup'],
      expect.any(Function),
    )
  })

  it('clears stored values', async () => {
    localStore.set({ extensionSettings: DEFAULT_SETTINGS })
    localStore.set({ aiApiKey: 'sk-key', 'ielts-settings-backup': DEFAULT_SETTINGS })

    await clearAllSettings()

    const localResult = await new Promise<Record<string, unknown>>((resolve) => {
      localStore.get('extensionSettings', resolve)
    })
    expect(localResult.extensionSettings).toBeUndefined()
  })
})

describe('exportSettingsData / importSettingsData', () => {
  it('exportSettingsData returns settings and timestamp', async () => {
    const data = await exportSettingsData()

    expect(data.settings).toEqual(DEFAULT_SETTINGS)
    expect(data.exportedAt).toBeDefined()
    expect(typeof data.exportedAt).toBe('string')
  })

  it('importSettingsData saves the provided settings', async () => {
    const customSettings: ExtensionSettings = {
      ...DEFAULT_SETTINGS,
      aiProvider: 'custom',
      aiModel: 'gpt-4',
      themeMode: 'dark',
    }

    await importSettingsData({ settings: customSettings })

    const loaded = await loadSettings()
    expect(loaded.aiProvider).toBe('custom')
    expect(loaded.aiModel).toBe('gpt-4')
    expect(loaded.themeMode).toBe('dark')
  })
})

describe('settings change listeners', () => {
  it('addSettingsChangeListener registers a listener', async () => {
    const listener = vi.fn()
    addSettingsChangeListener(listener)

    await saveSettings(DEFAULT_SETTINGS)

    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('removeSettingsChangeListener unregisters a listener', async () => {
    const listener = vi.fn()
    addSettingsChangeListener(listener)
    removeSettingsChangeListener(listener)

    await saveSettings(DEFAULT_SETTINGS)

    expect(listener).not.toHaveBeenCalled()
  })

  it('supports multiple listeners', async () => {
    const listener1 = vi.fn()
    const listener2 = vi.fn()
    addSettingsChangeListener(listener1)
    addSettingsChangeListener(listener2)

    await saveSettings(DEFAULT_SETTINGS)

    expect(listener1).toHaveBeenCalledTimes(1)
    expect(listener2).toHaveBeenCalledTimes(1)
  })

  it('does not throw when a listener throws', async () => {
    const throwingListener = vi.fn(() => { throw new Error('listener error') })
    addSettingsChangeListener(throwingListener)

    await expect(saveSettings(DEFAULT_SETTINGS)).resolves.toBeUndefined()

    expect(throwingListener).toHaveBeenCalledTimes(1)
  })
})
