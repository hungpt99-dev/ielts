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

function applyTheme(mode: 'light' | 'dark' | 'system'): void {
  const isDark =
    mode === 'dark' ||
    (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', isDark)
}

const REQUIRED_SETTINGS_KEYS: (keyof ExtensionSettings)[] = [
  'aiProvider',
  'aiBaseUrl',
  'aiModel',
  'themeMode',
  'floatingToolbar',
]

const SAVE_BAR_HEIGHT = 64

export default function SettingsPage() {
  const { showToast } = useToast()
  const [settings, setSettings] = useState<ExtensionSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)

  // Track pending changes via ref to avoid stale closures in event handlers
  const pendingRef = useRef<Partial<ExtensionSettings> | null>(null)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [aiErrors, setAiErrors] = useState<{
    aiProvider?: string
    aiBaseUrl?: string
    aiApiKey?: string
    aiModel?: string
  }>({})

  const savedRef = useRef(settings)
  savedRef.current = settings

  // ── Load ──
  useEffect(() => {
    loadSettings()
      .then((s) => {
        setSettings(s)
        savedRef.current = s
        setLoading(false)
      })
      .catch((err) => {
        showToast('error', `Failed to load settings: ${err instanceof Error ? err.message : 'Unknown error'}`)
        setLoading(false)
      })
  }, [showToast])

  // ── Theme — apply on every render that changes the effective themeMode ──
  const merged = pendingRef.current ? { ...settings, ...pendingRef.current } : settings
  // Sync theme to DOM whenever merged.themeMode changes
  useEffect(() => {
    applyTheme(merged.themeMode)
  }, [merged.themeMode])
  // Listen for system preference changes when in 'system' mode
  useEffect(() => {
    if (merged.themeMode !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => applyTheme('system')
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [merged.themeMode])

  // ── Accumulate changes & update dirty flag ──
  const handleChange = useCallback((patch: Partial<ExtensionSettings>) => {
    pendingRef.current = { ...pendingRef.current, ...patch }
    setDirty(true)
    // If caller needs the merged values for display, React re-render picks it up
    setSettings((prev) => ({ ...prev })) // force re-render to refresh merged
  }, [])

  // ── Validation (reads ref, always fresh) ──
  function hasErrors(): boolean {
    const merged = { ...savedRef.current, ...pendingRef.current } as ExtensionSettings
    const e: typeof aiErrors = {}
    if (merged.aiProvider === 'custom' && !merged.aiBaseUrl.trim()) {
      e.aiBaseUrl = 'Base URL is required when using a custom provider'
    }
    if (!merged.aiModel.trim()) {
      e.aiModel = 'Model name is required'
    }
    setAiErrors(e)
    return Object.keys(e).length > 0
  }

  // ── Save (reads ref, always fresh) ──
  const handleSave = useCallback(async () => {
    if (!pendingRef.current || Object.keys(pendingRef.current).length === 0) return
    if (hasErrors()) {
      showToast('error', 'Fix validation errors before saving')
      return
    }
    setSaving(true)
    try {
      const next = { ...savedRef.current, ...pendingRef.current }
      await saveSettings(next)
      savedRef.current = next
      setSettings(next)
      pendingRef.current = null
      setDirty(false)
      setAiErrors({})
      showToast('success', 'Settings saved')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      showToast('error', `Failed to save: ${msg}`)
    } finally {
      setSaving(false)
    }
  }, [showToast])

  // ── Keyboard shortcut ──
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        handleSave()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleSave])

  // ── Discard ──
  const handleDiscard = useCallback(() => {
    pendingRef.current = null
    setDirty(false)
    setAiErrors({})
    setSettings({ ...savedRef.current })
  }, [])

  // ── Export ──
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
      showToast('success', 'Settings exported')
    } catch (e) {
      showToast('error', `Export failed: ${e instanceof Error ? e.message : 'Unknown error'}`)
    }
  }, [showToast])

  // ── Import ──
  const handleImport = useCallback(async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      setImporting(true)
      try {
        const text = await file.text()
        let parsed: Record<string, unknown>
        try { parsed = JSON.parse(text) } catch { showToast('error', 'File is not valid JSON'); return }
        const rawSettings = parsed?.settings as Record<string, unknown> | undefined
        if (!rawSettings || typeof rawSettings !== 'object') {
          showToast('error', 'Invalid settings file: missing "settings" object')
          return
        }
        for (const key of REQUIRED_SETTINGS_KEYS) {
          if (!(key in rawSettings)) { showToast('error', `Invalid settings file: missing required field "${key}"`); return }
        }
        await importSettingsData(parsed as { settings: ExtensionSettings })
        const reloaded = await loadSettings()
        setSettings(reloaded)
        savedRef.current = reloaded
        pendingRef.current = null
        setDirty(false)
        showToast('success', 'Settings imported')
      } catch (e) {
        showToast('error', `Import failed: ${e instanceof Error ? e.message : 'Invalid file'}`)
      } finally { setImporting(false) }
    }
    input.click()
  }, [showToast])

  // ── Clear ──
  const handleClear = useCallback(async () => {
    await clearAllSettings()
    setSettings(DEFAULT_SETTINGS)
    savedRef.current = DEFAULT_SETTINGS
    pendingRef.current = null
    setDirty(false)
    setConfirmClear(false)
    showToast('info', 'All settings cleared')
  }, [showToast])

  // ── Loading ──
  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-muted)' }} role="status" aria-live="polite">
        Loading settings...
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: SAVE_BAR_HEIGHT + 24 }} role="region" aria-label="Extension settings">
      <header>
        <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>Extension Settings</h1>
        <p style={{ color: 'var(--color-text-secondary)', marginTop: '4px', fontSize: '14px' }}>
          Configure your IELTS Journey extension
        </p>
      </header>

      <AiSettingsForm settings={merged} onChange={handleChange} errors={aiErrors} setErrors={setAiErrors} />
      <GeneralSettings settings={merged} onChange={handleChange} />

      <Section title="Data Management">
        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: '0 0 12px', lineHeight: '1.5' }}>
          Export your settings as a JSON file to back them up or transfer to another device.
          Import a previously exported settings file to restore your configuration.
        </p>
        <div style={{ display: 'flex', gap: '8px' }} role="group" aria-label="Data management actions">
          <button onClick={handleExport} style={buttonStyle} aria-label="Export settings to JSON file">Export Settings</button>
          <button onClick={handleImport} style={{ ...buttonStyle, opacity: importing ? 0.6 : 1 }} disabled={importing} aria-label="Import settings from JSON file">
            {importing ? 'Importing...' : 'Import Settings'}
          </button>
        </div>
        <div style={{ marginTop: '16px', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
          {confirmClear ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }} role="alertdialog" aria-label="Confirm clear settings">
              <p style={{ fontSize: '13px', color: 'var(--color-danger)', margin: 0, fontWeight: 500 }}>
                Are you sure? This will reset all settings to defaults and remove your API key.
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handleClear} style={{ ...buttonStyle, background: 'var(--color-danger)', color: '#fff', border: 'none' }} aria-label="Confirm clear all settings">Yes, Clear All</button>
                <button onClick={() => setConfirmClear(false)} style={buttonStyle} aria-label="Cancel clear settings">Cancel</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setConfirmClear(true)} style={{ ...buttonStyle, color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }} aria-label="Clear all settings">Clear All Settings</button>
          )}
        </div>
      </Section>

      <Section title="Privacy">
        <div style={{ background: 'var(--color-primary-light)', borderRadius: 'var(--radius-md)', padding: '12px', fontSize: '13px', lineHeight: '1.6', color: 'var(--color-text)' }}>
          <p style={{ margin: '0 0 8px', fontWeight: 600 }}>Your Data Stays Local</p>
          <ul style={{ margin: 0, paddingLeft: '16px' }}>
            <li>All data is stored locally in your browser. There is no backend server.</li>
            <li>Webpage content is never sent anywhere unless you explicitly use an AI feature.</li>
            <li>Your API key is stored in your browser's local storage, not in cloud sync. It is used only for AI requests you initiate.</li>
            <li>We do not collect browsing history, personal information, or usage analytics.</li>
            <li>You can export or delete all your data at any time from the Data Management section.</li>
          </ul>
        </div>
      </Section>

      {/* ── Sticky save bar ── */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: SAVE_BAR_HEIGHT,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          background: 'var(--color-surface)',
          borderTop: '1px solid var(--color-border)',
          padding: '0 16px',
          zIndex: 100,
        }}
      >
        {dirty && (
          <span style={{ fontSize: '12px', color: 'var(--color-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-warning)', display: 'inline-block' }} />
            Unsaved changes
          </span>
        )}

        <button
          onClick={handleDiscard}
          style={{
            ...buttonStyle,
            opacity: dirty ? 1 : 0.4,
            pointerEvents: dirty ? 'auto' : 'none',
          }}
          disabled={!dirty}
          aria-label="Discard unsaved changes"
        >
          Discard
        </button>

        <button
          onClick={handleSave}
          disabled={!dirty || saving}
          style={{
            ...buttonStyle,
            background: dirty ? 'var(--color-primary)' : 'var(--color-border)',
            color: dirty ? '#fff' : 'var(--color-muted)',
            border: 'none',
            cursor: dirty && !saving ? 'pointer' : 'default',
            opacity: saving ? 0.6 : 1,
          }}
          aria-label="Save settings"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
