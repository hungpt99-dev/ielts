import { useState, useEffect, useCallback, useRef } from 'react'
import { useToast } from '../../../../packages/ui/src/components/Toast'
import {
  loadSettings,
  saveSettings,
  clearAllSettings,
  exportSettingsData,
  importSettingsData,
  type ExtensionSettings,
  DEFAULT_SETTINGS,
} from '../background/settingsStorage'
import AiSettingsForm from './components/AiSettingsForm'
import GeneralSettings from './components/GeneralSettings'
import { Section, buttonStyle } from './components/ui'

export default function SettingsPage() {
  const { showToast } = useToast()
  const [settings, setSettings] = useState<ExtensionSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [confirmClear, setConfirmClear] = useState(false)
  const settingsRef = useRef(settings)
  settingsRef.current = settings

  useEffect(() => {
    loadSettings().then((s) => {
      setSettings(s)
      settingsRef.current = s
      setLoading(false)
    })
  }, [])

  const handleSave = useCallback(async (patch: Partial<ExtensionSettings>) => {
    const next = { ...settingsRef.current, ...patch }
    settingsRef.current = next
    setSettings(next)
    await saveSettings(next)
  }, [])

  const handleExport = useCallback(async () => {
    try {
      const data = await exportSettingsData()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ielts-settings-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      showToast('success', 'Settings exported successfully')
    } catch (e) {
      showToast('error', `Export failed: ${e instanceof Error ? e.message : 'Unknown error'}`)
    }
  }, [showToast])

  const handleImport = useCallback(async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      try {
        const text = await file.text()
        const data = JSON.parse(text)
        if (!data.settings || !data.settings.aiProvider) {
          showToast('error', 'Invalid settings file format')
          return
        }
        await importSettingsData(data)
        const reloaded = await loadSettings()
        setSettings(reloaded)
        settingsRef.current = reloaded
        showToast('success', 'Settings imported successfully')
      } catch (e) {
        showToast('error', `Import failed: ${e instanceof Error ? e.message : 'Invalid file'}`)
      }
    }
    input.click()
  }, [showToast])

  const handleClear = useCallback(async () => {
    await clearAllSettings()
    setSettings(DEFAULT_SETTINGS)
    settingsRef.current = DEFAULT_SETTINGS
    setConfirmClear(false)
    showToast('info', 'All settings cleared')
  }, [showToast])

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-muted)' }}>
        Loading settings...
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <header>
        <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>Extension Settings</h1>
        <p style={{ color: 'var(--color-text-secondary)', marginTop: '4px', fontSize: '14px' }}>
          Configure your IELTS Journey extension
        </p>
      </header>

      <AiSettingsForm settings={settings} onSave={handleSave} />
      <GeneralSettings settings={settings} onSave={handleSave} />

      <Section title="Data Management">
        <p
          style={{
            fontSize: '13px',
            color: 'var(--color-text-secondary)',
            margin: '0 0 12px',
            lineHeight: '1.5',
          }}
        >
          Export your settings as a JSON file to back them up or transfer to another device.
          Import a previously exported settings file to restore your configuration.
        </p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleExport} style={buttonStyle}>
            Export Settings
          </button>
          <button onClick={handleImport} style={buttonStyle}>
            Import Settings
          </button>
        </div>
        <div
          style={{
            marginTop: '16px',
            borderTop: '1px solid var(--color-border)',
            paddingTop: '16px',
          }}
        >
          {confirmClear ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <p
                style={{
                  fontSize: '13px',
                  color: 'var(--color-danger)',
                  margin: 0,
                  fontWeight: 500,
                }}
              >
                Are you sure? This will reset all settings to defaults and remove your API key.
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleClear}
                  style={{
                    ...buttonStyle,
                    background: 'var(--color-danger)',
                    color: '#fff',
                    border: 'none',
                  }}
                >
                  Yes, Clear All
                </button>
                <button onClick={() => setConfirmClear(false)} style={buttonStyle}>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmClear(true)}
              style={{
                ...buttonStyle,
                color: 'var(--color-danger)',
                borderColor: 'var(--color-danger)',
              }}
            >
              Clear All Settings
            </button>
          )}
        </div>
      </Section>

      <Section title="Privacy">
        <div
          style={{
            background: 'var(--color-primary-light)',
            borderRadius: 'var(--radius-md)',
            padding: '12px',
            fontSize: '13px',
            lineHeight: '1.6',
            color: 'var(--color-text)',
          }}
        >
          <p style={{ margin: '0 0 8px', fontWeight: 600 }}>Your Data Stays Local</p>
          <ul style={{ margin: 0, paddingLeft: '16px' }}>
            <li>
              All data is stored locally in your browser. There is no backend server.
            </li>
            <li>
              Webpage content is never sent anywhere unless you explicitly use an AI feature.
            </li>
            <li>
              Your API key is stored in your browser's local storage, not in cloud sync. It is
              used only for AI requests you initiate.
            </li>
            <li>
              We do not collect browsing history, personal information, or usage analytics.
            </li>
            <li>
              You can export or delete all your data at any time from the Data Management
              section.
            </li>
          </ul>
        </div>
      </Section>
    </div>
  )
}
