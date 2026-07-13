import { useState, useEffect } from 'react'
import { useToast } from '../../../../../packages/ui/src/components/Toast'
import type { ExtensionSettings } from '@/background/settingsStorage'
import { Section, Field, inputStyle, selectStyle, buttonStyle } from './ui'

interface AiSettingsFormProps {
  settings: ExtensionSettings
  onChange: (patch: Partial<ExtensionSettings>) => void
  errors: {
    aiProvider?: string
    aiBaseUrl?: string
    aiApiKey?: string
    aiModel?: string
  }
  setErrors: (e: { aiProvider?: string; aiBaseUrl?: string; aiApiKey?: string; aiModel?: string }) => void
}

export default function AiSettingsForm({ settings, onChange, errors, setErrors }: AiSettingsFormProps) {
  const { showToast } = useToast()
  const [local, setLocal] = useState({
    aiProvider: settings.aiProvider,
    aiBaseUrl: settings.aiBaseUrl,
    aiApiKey: settings.aiApiKey,
    aiModel: settings.aiModel,
  })
  const [showApiKey, setShowApiKey] = useState(false)
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    setLocal({
      aiProvider: settings.aiProvider,
      aiBaseUrl: settings.aiBaseUrl,
      aiApiKey: settings.aiApiKey,
      aiModel: settings.aiModel,
    })
  }, [settings.aiProvider, settings.aiBaseUrl, settings.aiApiKey, settings.aiModel])

  const handleProviderChange = (value: string) => {
    const provider = value as 'openai' | 'custom'
    setLocal((prev) => ({ ...prev, aiProvider: provider }))
    setErrors({})
    onChange({ aiProvider: provider })
  }

  const handleTextChange = (field: 'aiBaseUrl' | 'aiApiKey' | 'aiModel', value: string) => {
    setLocal((prev) => ({ ...prev, [field]: value }))
    setErrors({ ...errors, [field]: '' })
    onChange({ [field]: value })
  }

  const handleTestConnection = async () => {
    const vals = local
    if (vals.aiProvider === 'custom' && !vals.aiBaseUrl.trim()) {
      showToast('error', 'Enter a Base URL before testing')
      return
    }
    if (!vals.aiModel.trim()) {
      showToast('error', 'Enter a Model name before testing')
      return
    }
    if (!vals.aiApiKey.trim()) {
      showToast('error', 'API key is required to test the connection')
      return
    }
    setTesting(true)
    try {
      const baseUrl = (vals.aiBaseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '')
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${vals.aiApiKey}`,
        },
        body: JSON.stringify({
          model: vals.aiModel,
          messages: [{ role: 'user', content: 'Respond with one word: ok' }],
          max_tokens: 10,
        }),
      })
      if (!res.ok) {
        const body = await res.text().catch(() => '')
        throw new Error(res.status === 401 ? 'Invalid API key' : `HTTP ${res.status}: ${body.slice(0, 80)}`)
      }
      showToast('success', 'Connection successful')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Connection failed'
      showToast('error', `Connection failed: ${msg}`)
    } finally {
      setTesting(false)
    }
  }

  return (
    <Section title="AI Provider">
      <Field label="Provider">
        <select
          value={local.aiProvider}
          onChange={(e) => handleProviderChange(e.target.value)}
          style={selectStyle}
        >
          <option value="openai">OpenAI</option>
          <option value="custom">Custom (OpenAI-compatible)</option>
        </select>
      </Field>
      <Field label="Base URL" error={errors.aiBaseUrl} required={local.aiProvider === 'custom'}>
        <input
          type="url"
          value={local.aiBaseUrl}
          onChange={(e) => handleTextChange('aiBaseUrl', e.target.value)}
          placeholder="https://api.openai.com/v1"
          style={inputStyle}
        />
      </Field>
      <Field label="API Key" error={errors.aiApiKey} required>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type={showApiKey ? 'text' : 'password'}
            value={local.aiApiKey}
            onChange={(e) => handleTextChange('aiApiKey', e.target.value)}
            placeholder="sk-..."
            style={{ ...inputStyle, flex: 1 }}
            autoComplete="off"
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
      <Field label="Model" error={errors.aiModel} required>
        <input
          type="text"
          value={local.aiModel}
          onChange={(e) => handleTextChange('aiModel', e.target.value)}
          placeholder="gpt-4o-mini"
          style={inputStyle}
        />
      </Field>

      <button
        onClick={handleTestConnection}
        disabled={testing}
        style={{
          ...buttonStyle,
          background: 'var(--color-primary)',
          color: '#fff',
          border: 'none',
          opacity: testing ? 0.6 : 1,
        }}
        aria-label="Test AI provider connection"
      >
        {testing ? 'Testing...' : 'Test Connection'}
      </button>
    </Section>
  )
}
