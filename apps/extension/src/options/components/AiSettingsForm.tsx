import { useState, useRef, useCallback, useEffect } from 'react'
import { useToast } from '../../../../../packages/ui/src/components/Toast'
import type { ExtensionSettings } from '@/background/settingsStorage'
import { Section, Field, inputStyle, selectStyle, buttonStyle } from './ui'

interface AiSettingsFormProps {
  settings: ExtensionSettings
  onSave: (patch: Partial<ExtensionSettings>) => Promise<void>
}

interface Errors {
  aiBaseUrl?: string
  aiApiKey?: string
  aiModel?: string
}

function getErrors(values: {
  aiProvider: string
  aiBaseUrl: string
  aiApiKey: string
  aiModel: string
}): Errors {
  const e: Errors = {}
  if (values.aiProvider === 'custom' && !values.aiBaseUrl.trim()) {
    e.aiBaseUrl = 'Base URL is required when using a custom provider'
  }
  if (!values.aiModel.trim()) {
    e.aiModel = 'Model name is required'
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
  const [testing, setTesting] = useState(false)
  const [saveFeedback, setSaveFeedback] = useState<'success' | 'error' | null>(null)

  const latestRef = useRef(local)
  latestRef.current = local
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isSavingRef = useRef(false)

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

  const doSave = useCallback(
    async (patch: Partial<ExtensionSettings>) => {
      if (isSavingRef.current) return
      isSavingRef.current = true
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
        isSavingRef.current = false
      }
    },
    [onSave, showToast],
  )

  const doSaveAll = useCallback(() => {
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

  const scheduleSaveAll = useCallback(() => {
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
  }, [doSave])

  const handleProviderChange = useCallback(
    (value: string) => {
      const provider = value as 'openai' | 'custom'
      setLocal((prev) => ({ ...prev, aiProvider: provider }))
      setErrors({})
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
        debounceRef.current = null
      }
      doSave({ aiProvider: provider })
    },
    [doSave],
  )

  const handleTextChange = useCallback(
    (field: 'aiBaseUrl' | 'aiApiKey' | 'aiModel', value: string) => {
      setLocal((prev) => ({ ...prev, [field]: value }))
      setErrors((prev) => ({ ...prev, [field]: undefined }))
      scheduleSaveAll()
    },
    [scheduleSaveAll],
  )

  const handleBlur = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }
    doSaveAll()
  }, [doSaveAll])

  const handleTestConnection = useCallback(async () => {
    const vals = latestRef.current
    const e = getErrors(vals)
    setErrors(e)
    if (Object.keys(e).length > 0) {
      showToast('error', 'Fix validation errors before testing')
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
  }, [showToast])

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
          aria-required="true"
          aria-invalid={errors.aiModel ? 'true' : undefined}
          aria-describedby={errors.aiModel ? 'model-error' : undefined}
        />
      </Field>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={handleTestConnection}
          disabled={testing || saving}
          style={{
            ...buttonStyle,
            background: 'var(--color-primary)',
            color: '#fff',
            border: 'none',
            opacity: testing || saving ? 0.6 : 1,
          }}
          aria-label="Test AI provider connection"
        >
          {testing ? 'Testing...' : 'Test Connection'}
        </button>

        <div
          style={{
            fontSize: '12px',
            color:
              saveFeedback === 'success'
                ? 'var(--color-success, #16a34a)'
                : saveFeedback === 'error'
                  ? 'var(--color-danger, #dc2626)'
                  : 'var(--color-muted, #94a3b8)',
          }}
          role="status"
          aria-live="polite"
        >
          {saving && 'Saving...'}
          {saveFeedback === 'success' && !saving && 'Settings saved.'}
          {saveFeedback === 'error' && !saving && 'Failed to save settings.'}
        </div>
      </div>
    </Section>
  )
}
