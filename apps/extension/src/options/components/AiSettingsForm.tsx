import { useState, useEffect } from 'react'
import { useToast } from '../../../../../packages/ui/src/components/Toast'
import type { ExtensionSettings } from '@/background/settingsStorage'
import { getVisibleProviders, getProviderById, type AiProviderId } from '@ielts/config'
import { getModelCapabilities } from '@ielts/ai'
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

const ADAPTER_CAPABILITIES: Record<string, string[]> = {
  'openai-compatible': ['Chat completions', 'Streaming', 'JSON mode', 'Function calling'],
}

const CAPABILITY_LABELS: Record<string, string> = {
  supportsTemperature: 'Temperature control',
  supportsMaxTokens: 'Max tokens',
  supportsMaxCompletionTokens: 'Max completion tokens',
  supportsReasoningEffort: 'Reasoning effort',
}

export default function AiSettingsForm({ settings, onChange, errors, setErrors }: AiSettingsFormProps) {
  const { showToast } = useToast()
  const [local, setLocal] = useState<{
    aiProvider: string
    aiBaseUrl: string
    aiApiKey: string
    aiModel: string
    aiTimeout: number
    aiTemperature?: number
  }>({
    aiProvider: settings.aiProvider,
    aiBaseUrl: settings.aiBaseUrl,
    aiApiKey: settings.aiApiKey,
    aiModel: settings.aiModel,
    aiTimeout: settings.aiTimeout ?? 30000,
    aiTemperature: settings.aiTemperature,
  })
  const [showApiKey, setShowApiKey] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [modelFocused, setModelFocused] = useState(false)

  useEffect(() => {
    setLocal({
      aiProvider: settings.aiProvider,
      aiBaseUrl: settings.aiBaseUrl,
      aiApiKey: settings.aiApiKey,
      aiModel: settings.aiModel,
      aiTimeout: settings.aiTimeout ?? 30000,
      aiTemperature: settings.aiTemperature,
    })
  }, [settings.aiProvider, settings.aiBaseUrl, settings.aiApiKey, settings.aiModel, settings.aiTimeout, settings.aiTemperature])

  const handleProviderChange = (value: string) => {
    const provider = value as AiProviderId
    const def = getProviderById(provider)
    setLocal((prev) => ({
      ...prev,
      aiProvider: provider,
      aiModel: def?.defaultModel ?? prev.aiModel,
      aiBaseUrl: def?.defaultApiUrl ?? prev.aiBaseUrl,
    }))
    setErrors({})
    setTestResult(null)
    onChange({
      aiProvider: provider as 'openai' | 'custom',
      aiModel: def?.defaultModel ?? local.aiModel,
      aiBaseUrl: def?.defaultApiUrl ?? local.aiBaseUrl,
    })
  }

  const handleTextChange = (field: 'aiBaseUrl' | 'aiApiKey' | 'aiModel', value: string) => {
    setLocal((prev) => ({ ...prev, [field]: value }))
    setErrors({ ...errors, [field]: '' })
    setTestResult(null)
    onChange({ [field]: value })
  }

  const handleSuggestionClick = (model: string) => {
    setLocal((prev) => ({ ...prev, aiModel: model }))
    setErrors({ ...errors, aiModel: '' })
    setTestResult(null)
    onChange({ aiModel: model })
    setModelFocused(false)
  }

  const handleTestConnection = async () => {
    const vals = local
    const providerDef = getProviderById(vals.aiProvider as AiProviderId)
    if (providerDef?.allowsCustomApiUrl && !vals.aiBaseUrl.trim()) {
      showToast('error', 'Enter a Base URL before testing')
      return
    }
    if (!vals.aiModel.trim()) {
      showToast('error', 'Enter a Model name before testing')
      return
    }
    if (providerDef?.requiresApiKey !== false && !vals.aiApiKey.trim()) {
      showToast('error', 'API key is required to test the connection')
      return
    }
    setTesting(true)
    setTestResult(null)
    try {
      const baseUrl = (vals.aiBaseUrl || providerDef?.defaultApiUrl || 'https://api.openai.com/v1').replace(/\/+$/, '')
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
      setTestResult({ ok: true, message: 'Connection successful' })
      showToast('success', 'Connection successful')
    } catch (err) {
      console.error('apps/extension/src/options/components/AiSettingsForm.tsx error:', err);
      const msg = err instanceof Error ? err.message : 'Connection failed'
      setTestResult({ ok: false, message: msg })
      showToast('error', `Connection failed: ${msg}`)
    } finally {
      setTesting(false)
    }
  }

  const providerDef = getProviderById(local.aiProvider as AiProviderId)
  const adapterCaps = providerDef ? ADAPTER_CAPABILITIES[providerDef.adapter] ?? [] : []
  const modelCapabilities = local.aiModel ? getModelCapabilities(local.aiModel) : null
  const modelCapBadges: string[] = modelCapabilities
    ? Object.entries(CAPABILITY_LABELS)
        .filter(([key]) => (modelCapabilities as unknown as Record<string, boolean>)[key])
        .map(([, label]) => label)
    : []

  return (
    <Section title="AI Provider">
      <Field label="Provider">
        <select
          value={local.aiProvider}
          onChange={(e) => handleProviderChange(e.target.value)}
          style={selectStyle}
        >
          {getVisibleProviders().map(p => (
            <option key={p.id} value={p.id}>{p.displayName}</option>
          ))}
        </select>
      </Field>

      {adapterCaps.length > 0 && (
        <Field label="Capabilities">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {adapterCaps.map(cap => (
              <span
                key={cap}
                style={{
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--color-surface-alt)',
                  border: '1px solid var(--color-border)',
                  fontSize: '11px',
                  color: 'var(--color-text-secondary)',
                  lineHeight: '1.6',
                }}
              >
                {cap}
              </span>
            ))}
          </div>
        </Field>
      )}

      {modelCapBadges.length > 0 && (
        <Field label="Model support">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {modelCapBadges.map(cap => (
              <span
                key={cap}
                style={{
                  padding: '1px 6px',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--color-primary-light)',
                  fontSize: '10px',
                  color: 'var(--color-primary)',
                  lineHeight: '1.6',
                }}
              >
                {cap}
              </span>
            ))}
          </div>
        </Field>
      )}

      {providerDef?.allowsCustomApiUrl && (
        <Field label="Base URL" error={errors.aiBaseUrl}>
          <input
            type="url"
            value={local.aiBaseUrl}
            onChange={(e) => handleTextChange('aiBaseUrl', e.target.value)}
            placeholder="https://api.openai.com/v1"
            style={inputStyle}
          />
        </Field>
      )}

      {providerDef?.requiresApiKey !== false && (
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
      )}

      <Field label="Model" error={errors.aiModel} required>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            value={local.aiModel}
            onChange={(e) => handleTextChange('aiModel', e.target.value)}
            onFocus={() => setModelFocused(true)}
            onBlur={() => setTimeout(() => setModelFocused(false), 150)}
            placeholder="gpt-4o-mini"
            style={inputStyle}
          />
          {modelFocused && providerDef?.defaultModel && !local.aiModel && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                zIndex: 10,
                marginTop: '2px',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: '4px',
              }}
            >
              <button
                onMouseDown={(e) => { e.preventDefault(); handleSuggestionClick(providerDef.defaultModel!) }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '6px 10px',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  background: 'transparent',
                  color: 'var(--color-text)',
                  fontSize: '13px',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                {providerDef.defaultModel}
              </button>
            </div>
          )}
        </div>
      </Field>

      <Field label="Timeout (ms)" description="Maximum wait time per AI request (default: 30000)">
        <input
          type="number"
          value={local.aiTimeout}
          onChange={(e) => {
            const raw = e.target.value
            setLocal((prev) => ({ ...prev, aiTimeout: raw === '' ? 30000 : Number(raw) }))
            onChange({ aiTimeout: raw === '' ? 30000 : Number(raw) })
          }}
          min={0}
          step={1000}
          placeholder="30000"
          style={inputStyle}
        />
      </Field>

      <Field label="Temperature" description="Creativity level (0 = deterministic, 2 = maximum creativity)">
        <input
          type="number"
          value={local.aiTemperature ?? ''}
          onChange={(e) => {
            const raw = e.target.value
            if (raw === '') {
              setLocal((prev) => ({ ...prev, aiTemperature: undefined }))
              onChange({ aiTemperature: undefined })
            } else {
              const num = Number(raw)
              if (!isNaN(num)) {
                const clamped = Math.min(2, Math.max(0, num))
                setLocal((prev) => ({ ...prev, aiTemperature: clamped }))
                onChange({ aiTemperature: clamped })
              }
            }
          }}
          min={0}
          max={2}
          step={0.1}
          placeholder="Optional (0.0 – 2.0)"
          style={inputStyle}
        />
      </Field>

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
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
        {testResult && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              borderRadius: 'var(--radius-md)',
              fontSize: '12px',
              background: testResult.ok ? 'var(--color-success-light)' : 'var(--color-danger-light)',
              color: testResult.ok ? 'var(--color-success)' : 'var(--color-danger)',
            }}
          >
            {testResult.ok ? '\u2713' : '\u2717'} {testResult.message}
          </span>
        )}
      </div>
    </Section>
  )
}
