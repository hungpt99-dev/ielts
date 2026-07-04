import { useState, useEffect, useCallback } from 'react'
import { useToast } from '../../../../packages/ui/src/components/Toast'
import {
  loadSettings,
  saveSettings,
  clearAllSettings,
  exportSettingsData,
  importSettingsData,
  type ExtensionSettings,
  DEFAULT_SETTINGS,
  THEME_MODES,
  SAVE_CATEGORIES,
} from '../background/settingsStorage'

const CATEGORY_LABELS: Record<string, string> = {
  vocabulary: 'Vocabulary',
  phrase: 'Useful Phrase',
  sentence: 'Example Sentence',
  grammar: 'Grammar Note',
  reading: 'Reading Material',
  writing: 'Writing Idea',
  speaking: 'Speaking Idea',
  mistake: 'Mistake Note',
}

const THEME_LABELS: Record<string, string> = {
  light: 'Light',
  dark: 'Dark',
  system: 'System (follow device)',
}

export default function SettingsPage() {
  const { showToast } = useToast()
  const [settings, setSettings] = useState<ExtensionSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [showApiKey, setShowApiKey] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)

  useEffect(() => {
    loadSettings().then((s) => {
      setSettings(s)
      setLoading(false)
    })
  }, [])

  const update = async (patch: Partial<ExtensionSettings>) => {
    const next = { ...settings, ...patch }
    setSettings(next)
    await saveSettings(next)
  }

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
    setConfirmClear(false)
    showToast('info', 'All settings cleared')
  }, [showToast])

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-muted)' }}>Loading settings...</div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <header>
        <h1 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>Extension Settings</h1>
        <p style={{ color: 'var(--color-text-secondary)', marginTop: '4px', fontSize: '14px' }}>
          Configure your IELTS Learning Journey extension
        </p>
      </header>

      {/* AI Provider */}
      <Section title="AI Provider">
        <Field label="Provider">
          <select
            value={settings.aiProvider}
            onChange={(e) => update({ aiProvider: e.target.value as 'openai' | 'custom' })}
            style={selectStyle}
          >
            <option value="openai">OpenAI</option>
            <option value="custom">Custom (OpenAI-compatible)</option>
          </select>
        </Field>
        <Field label="Base URL">
          <input
            type="url"
            value={settings.aiBaseUrl}
            onChange={(e) => update({ aiBaseUrl: e.target.value })}
            placeholder="https://api.openai.com/v1"
            style={inputStyle}
          />
        </Field>
        <Field label="API Key">
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type={showApiKey ? 'text' : 'password'}
              value={settings.aiApiKey}
              onChange={(e) => update({ aiApiKey: e.target.value })}
              placeholder="sk-..."
              style={{ ...inputStyle, flex: 1 }}
            />
            <button
              onClick={() => setShowApiKey((v) => !v)}
              style={{
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                color: 'var(--color-text-secondary)',
                cursor: 'pointer',
                fontSize: '13px',
                whiteSpace: 'nowrap',
              }}
              aria-label={showApiKey ? 'Hide API key' : 'Show API key'}
            >
              {showApiKey ? 'Hide' : 'Show'}
            </button>
          </div>
        </Field>
        <Field label="Model">
          <input
            type="text"
            value={settings.aiModel}
            onChange={(e) => update({ aiModel: e.target.value })}
            placeholder="gpt-4o-mini"
            style={inputStyle}
          />
        </Field>
      </Section>

      {/* Appearance */}
      <Section title="Appearance">
        <Field label="Theme Mode">
          <select
            value={settings.themeMode}
            onChange={(e) => update({ themeMode: e.target.value as 'light' | 'dark' | 'system' })}
            style={selectStyle}
          >
            {THEME_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {THEME_LABELS[mode] || mode}
              </option>
            ))}
          </select>
        </Field>
      </Section>

      {/* Behavior */}
      <Section title="Behavior">
        <ToggleField
          label="Floating Toolbar"
          description="Show a floating toolbar when selecting text on webpages"
          checked={settings.floatingToolbar}
          onChange={(v) => update({ floatingToolbar: v })}
        />
        <ToggleField
          label="Auto-save Selected Text"
          description="Automatically save selected text without showing the save dialog"
          checked={settings.autoSaveSelected}
          onChange={(v) => update({ autoSaveSelected: v })}
        />
        <ToggleField
          label="Auto-highlight Saved Vocabulary"
          description="Automatically highlight your saved vocabulary words and phrases on every webpage you visit"
          checked={settings.autoHighlightSavedVocabulary}
          onChange={(v) => update({ autoHighlightSavedVocabulary: v })}
        />
      </Section>

      {/* Defaults */}
      <Section title="Defaults">
        <Field label="Default Save Category">
          <select
            value={settings.defaultCategory}
            onChange={(e) => update({ defaultCategory: e.target.value as typeof SAVE_CATEGORIES[number] })}
            style={selectStyle}
          >
            {SAVE_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_LABELS[cat] || cat}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Default IELTS Topic">
          <input
            type="text"
            value={settings.defaultTopic}
            onChange={(e) => update({ defaultTopic: e.target.value })}
            placeholder="general"
            style={inputStyle}
          />
        </Field>
      </Section>

      {/* Data Management */}
      <Section title="Data Management">
        <p style={{ fontSize: '13px', color: 'var(--color-text-secondary)', margin: '0 0 12px', lineHeight: '1.5' }}>
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
        <div style={{ marginTop: '16px', borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
          {confirmClear ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <p style={{ fontSize: '13px', color: 'var(--color-danger)', margin: 0, fontWeight: 500 }}>
                Are you sure? This will reset all settings to defaults and remove your API key.
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handleClear} style={{ ...buttonStyle, background: 'var(--color-danger)', color: '#fff', border: 'none' }}>
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
              style={{ ...buttonStyle, color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
            >
              Clear All Settings
            </button>
          )}
        </div>
      </Section>

      {/* Privacy */}
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
            <li>All data is stored locally in your browser. There is no backend server.</li>
            <li>Webpage content is never sent anywhere unless you explicitly use an AI feature.</li>
            <li>Your API key is stored in your browser's local storage, not in cloud sync. It is used only for AI requests you initiate.</li>
            <li>We do not collect browsing history, personal information, or usage analytics.</li>
            <li>You can export or delete all your data at any time from the Data Management section.</li>
          </ul>
        </div>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
      }}
    >
      <h2
        style={{
          fontSize: '13px',
          fontWeight: 600,
          color: 'var(--color-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          margin: '0 0 16px',
        }}
      >
        {title}
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {children}
      </div>
    </section>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function ToggleField({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description?: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text)' }}>{label}</span>
        {description && (
          <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--color-text-secondary)', lineHeight: '1.4' }}>
            {description}
          </p>
        )}
      </div>
      <button
        onClick={() => onChange(!checked)}
        style={{
          width: '44px',
          height: '24px',
          borderRadius: '12px',
          border: 'none',
          background: checked ? 'var(--color-primary)' : 'var(--color-border)',
          cursor: 'pointer',
          position: 'relative',
          transition: 'background 0.2s',
          flexShrink: 0,
          marginTop: '2px',
        }}
        role="switch"
        aria-checked={checked}
      >
        <span
          style={{
            position: 'absolute',
            top: '2px',
            left: checked ? '22px' : '2px',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: '#ffffff',
            transition: 'left 0.2s',
          }}
        />
      </button>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border)',
  background: 'var(--color-background)',
  color: 'var(--color-text)',
  fontSize: '14px',
  outline: 'none',
}

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: 'auto',
}

const buttonStyle: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--color-border)',
  background: 'var(--color-background)',
  color: 'var(--color-text)',
  fontSize: '13px',
  fontWeight: 500,
  cursor: 'pointer',
}
