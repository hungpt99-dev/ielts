import { useState, useRef, useCallback, useEffect } from 'react'
import { useToast } from '../../../../../packages/ui/src/components/Toast'
import type { ExtensionSettings } from '@/background/settingsStorage'
import { Section, Field, inputStyle, selectStyle } from './ui'

interface AiSettingsFormProps {
  settings: ExtensionSettings
  onSave: (patch: Partial<ExtensionSettings>) => Promise<void>
}

interface Errors {
  aiBaseUrl?: string
  aiApiKey?: string
  aiModel?: string
}

function getErrors(values: { aiProvider: string; aiBaseUrl: string; aiApiKey: string; aiModel: string }): Errors {
  const e: Errors = {}
  if (values.aiProvider === 'custom' && !values.aiBaseUrl.trim()) {
    e.aiBaseUrl = 'Base URL is required when using a custom provider'
  }
  if (!values.aiModel.trim()) {
    e.aiModel = 'Model name is required'
  }
  if (!values.aiApiKey.trim()) {
    e.aiApiKey = 'API key is required'
  }
  return e
}

export default function AiSettingsForm({ settings, onSave }: AiSettingsFormProps) {
  const { showToast } = useToast()
  const [local, setLocal] = useState({
    aiProvider: settings.aiProvider,
    aiBaseUrl: settings.aiBaseUrl,
    aiApiKey: settings.aiApiKey,
    aiModel: settings.aiModel,
  })
  const [showApiKey, setShowApiKey] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [saving, setSaving] = useState(false)
  const [saveFeedback, setSaveFeedback] = useState<'success' | 'error' | null>(null)

  const latestRef = useRef(local)
  latestRef.current = local

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setLocal({
      aiProvider: settings.aiProvider,
      aiBaseUrl: settings.aiBaseUrl,
      aiApiKey: settings.aiApiKey,
      aiModel: settings.aiModel,
    })
  }, [settings.aiProvider, settings.aiBaseUrl, settings.aiApiKey, settings.aiModel])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const doSave = useCallback(async (patch: Partial<ExtensionSettings>) => {
    setSaving(true)
    setSaveFeedback(null)
    try {
      await onSave(patch)
      setSaveFeedback('success')
      setTimeout(() => setSaveFeedback(null), 2000)
    } catch {
      setSaveFeedback('error')
      showToast('error', 'Failed to save AI settings')
    } finally {
      setSaving(false)
    }
  }, [onSave, showToast])

  const flushSave = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
    const vals = latestRef.current
    const e = getErrors(vals)
    setErrors(e)
    if (Object.keys(e).length === 0) {
      doSave({
        aiProvider: vals.aiProvider,
        aiBaseUrl: vals.aiBaseUrl,
        aiApiKey: vals.aiApiKey,
        aiModel: vals.aiModel,
      })
    }
  }, [doSave])

  const handleProviderChange = useCallback((value: string) => {
    const provider = value as 'openai' | 'custom'
    setLocal((prev) => ({ ...prev, aiProvider: provider }))
    setErrors({})
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
    doSave({ aiProvider: provider })
  }, [doSave])

  const handleTextChange = useCallback(
    (field: 'aiBaseUrl' | 'aiApiKey' | 'aiModel', value: string) => {
      setLocal((prev) => ({ ...prev, [field]: value }))
      setErrors((prev) => ({ ...prev, [field]: undefined }))
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        const vals = latestRef.current
        const e = getErrors(vals)
        if (Object.keys(e).length === 0) {
          doSave({
            aiProvider: vals.aiProvider,
            aiBaseUrl: vals.aiBaseUrl,
            aiApiKey: vals.aiApiKey,
            aiModel: vals.aiModel,
          })
        }
      }, 500)
    },
    [doSave],
  )

  const handleBlur = useCallback(() => {
    flushSave()
  }, [flushSave])

  return (
    <Section title="AI Provider">
      <Field label="Provider">
        <select
          value={local.aiProvider}
          onChange={(e) => handleProviderChange(e.target.value)}
          style={selectStyle}
          disabled={saving}
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
          onBlur={handleBlur}
          placeholder="https://api.openai.com/v1"
          style={inputStyle}
          disabled={saving}
        />
      </Field>
      <Field label="API Key" error={errors.aiApiKey} required>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type={showApiKey ? 'text' : 'password'}
            value={local.aiApiKey}
            onChange={(e) => handleTextChange('aiApiKey', e.target.value)}
            onBlur={handleBlur}
            placeholder="sk-..."
            style={{ ...inputStyle, flex: 1 }}
            autoComplete="off"
            disabled={saving}
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
          onBlur={handleBlur}
          placeholder="gpt-4o-mini"
          style={inputStyle}
          disabled={saving}
        />
      </Field>
      {saving && (
        <div style={{ fontSize: '12px', color: 'var(--color-muted)', marginTop: '4px' }}>
          Saving...
        </div>
      )}
      {saveFeedback === 'success' && !saving && (
        <div style={{ fontSize: '12px', color: 'var(--color-success, #16a34a)', marginTop: '4px' }}>
          Settings saved.
        </div>
      )}
      {saveFeedback === 'error' && !saving && (
        <div style={{ fontSize: '12px', color: 'var(--color-danger, #dc2626)', marginTop: '4px' }}>
          Failed to save settings.
        </div>
      )}
    </Section>
  )
}
