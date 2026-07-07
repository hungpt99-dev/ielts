import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSettings } from '../../context/SettingsContext'
import { testConnection } from '../../services/ai/AIService'
import { OPENAI_BASE_URL, DEFAULT_MODEL } from '@ielts/settings'
import { emitAIProviderConfigured, emitSettingsChanged } from '../../features/websiteActions/eventEmitters'
import Card, { CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import ToggleSwitch from '../../components/ui/ToggleSwitch'
import { LoadingSkeleton } from '../../components/ui/LoadingSkeleton'
import { ErrorState } from '../../components/ui/EmptyState'
import {
  IconBack,
  IconCheck,
  IconAlertCircle,
  IconClose,
} from '@ielts/ui'

export default function AIProviderSettingsPage() {
  const navigate = useNavigate()
  const { settings, updateSettings } = useSettings()

  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState<string | null>(null)

  const [enabled, setEnabled] = useState(settings.aiEnabled)
  const [provider, setProvider] = useState(settings.aiProvider)
  const [apiKey, setApiKey] = useState(settings.aiApiKey)
  const [baseUrl, setBaseUrl] = useState(settings.aiBaseUrl || settings.aiEndpoint || '')
  const [model, setModel] = useState(settings.aiModel)

  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    setEnabled(settings.aiEnabled)
    setProvider(settings.aiProvider)
    setApiKey(settings.aiApiKey)
    setBaseUrl(settings.aiBaseUrl || settings.aiEndpoint || '')
    setModel(settings.aiModel)
  }, [settings])

  function showFeedback(type: 'success' | 'error', message: string) {
    setFeedback({ type, message })
    setTimeout(() => setFeedback(null), 4000)
  }

  function handleSave() {
    setSaving(true)
    try {
      updateSettings({
        aiApiKey: apiKey,
        aiProvider: provider,
        aiBaseUrl: baseUrl,
        aiEndpoint: baseUrl,
        aiModel: model,
        aiEnabled: enabled,
      })
      setDirty(false)
      emitSettingsChanged(['aiApiKey', 'aiProvider', 'aiBaseUrl', 'aiModel', 'aiEnabled'])
      emitAIProviderConfigured(provider, model)
      showFeedback('success', 'AI settings saved successfully.')
    } catch {
      showFeedback('error', 'Failed to save AI settings.')
    } finally {
      setSaving(false)
    }
  }

  function handleReset() {
    setEnabled(false)
    setProvider('openai')
    setApiKey('')
    setBaseUrl('')
    setModel('gpt-4o-mini')
    setTestResult(null)
    setDirty(true)
    updateSettings({
      aiApiKey: '',
      aiProvider: 'openai',
      aiBaseUrl: '',
      aiEndpoint: '',
      aiModel: 'gpt-4o-mini',
      aiEnabled: false,
    })
    showFeedback('success', 'AI settings reset to defaults.')
  }

  async function handleTestConnection() {
    if (!apiKey) {
      setTestResult({ ok: false, message: 'Enter an API key first.' })
      return
    }
    setTesting(true)
    setTestResult(null)
    try {
      const result = await testConnection({
        apiKey,
        baseUrl: baseUrl || OPENAI_BASE_URL,
        model: model || DEFAULT_MODEL,
      })
      setTestResult({ ok: result.ok, message: result.message })
    } catch {
      setTestResult({ ok: false, message: 'Connection test failed. Check your settings.' })
    } finally {
      setTesting(false)
    }
  }

  function handleApiKeyChange(val: string) {
    setApiKey(val)
    setTestResult(null)
    setDirty(true)
  }

  if (pageError) {
    return (
      <div style={{ maxWidth: '1280px', margin: '0 auto', paddingTop: 'var(--spacing-md)' }}>
        <ErrorState
          title="Failed to load AI settings"
          message={pageError}
          onRetry={() => {
            setPageError(null)
            setLoading(true)
            setTimeout(() => setLoading(false), 500)
          }}
          variant="card"
        />
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ maxWidth: '1280px', margin: '0 auto', paddingTop: 'var(--spacing-md)' }}>
        <div style={{ marginBottom: 'var(--spacing-lg)' }}>
          <LoadingSkeleton variant="text" width="180px" height="28px" />
          <div style={{ marginTop: 'var(--spacing-xs)' }}>
            <LoadingSkeleton variant="text" width="300px" />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <LoadingSkeleton variant="card" height="60px" />
          <LoadingSkeleton variant="card" height="400px" />
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', paddingTop: 'var(--spacing-md)' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-sm)',
          marginBottom: 'var(--spacing-lg)',
        }}
      >
        <button
          type="button"
          onClick={() => navigate('/settings')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: 'var(--radius-lg)',
            border: 'none',
            background: 'var(--color-surface-alt)',
            color: 'var(--color-text-secondary)',
            cursor: 'pointer',
            flexShrink: 0,
          }}
          aria-label="Back to settings"
        >
          <IconBack size={18} />
        </button>
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 'var(--text-2xl)',
              fontWeight: 700,
              color: 'var(--color-text)',
            }}
          >
            AI Provider Settings
          </h1>
          <p
            style={{
              margin: 'var(--spacing-2xs) 0 0',
              fontSize: 'var(--text-sm)',
              color: 'var(--color-text-secondary)',
            }}
          >
            Configure your AI Tutor provider and connection
          </p>
        </div>
      </div>

      {feedback && (
        <div
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-xs)',
            padding: 'var(--spacing-sm) var(--spacing-md)',
            borderRadius: 'var(--radius-lg)',
            marginBottom: 'var(--spacing-md)',
            fontSize: 'var(--text-sm)',
            border: '1px solid',
            backgroundColor: feedback.type === 'success' ? 'var(--color-success-light)' : 'var(--color-danger-light)',
            borderColor: feedback.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)',
            color: feedback.type === 'success' ? 'var(--color-success)' : 'var(--color-danger)',
          }}
        >
          {feedback.type === 'success' ? <IconCheck size={16} /> : <IconAlertCircle size={16} />}
          {feedback.message}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>AI Tutor Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
            <div
              style={{
                padding: 'var(--spacing-md)',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--color-primary-light)',
                border: '1px solid var(--color-border)',
                fontSize: 'var(--text-sm)',
                lineHeight: 1.6,
              }}
            >
              <p style={{ margin: '0 0 var(--spacing-xs)', fontWeight: 600, color: 'var(--color-text)' }}>
                Your Data Stays Local
              </p>
              <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
                Your API key is stored only in this browser using localStorage. It is never sent to any
                server except the AI provider you configure. The app works fully without an API key.
              </p>
            </div>

            <ToggleSwitch
              enabled={enabled}
              onChange={(val) => { setEnabled(val); setDirty(true) }}
              label="Enable AI Features"
              description="Turn on AI-powered study tools including AI Tutor"
            />

            {enabled && (
              <>
                <Select
                  id="ai-provider"
                  label="Provider"
                  value={provider}
                  onChange={(e) => {
                    const val = (e.target as HTMLSelectElement).value
                    setProvider(val as 'openai' | 'custom')
                    if (val === 'openai') {
                      setBaseUrl('')
                      setModel('gpt-4o-mini')
                    }
                    setTestResult(null)
                    setDirty(true)
                  }}
                  options={[
                    { value: 'openai', label: 'OpenAI' },
                    { value: 'custom', label: 'Custom (OpenAI-compatible)' },
                  ]}
                />

                <Input
                  id="ai-api-key"
                  type="password"
                  label="API Key"
                  value={apiKey}
                  onChange={(e) => handleApiKeyChange((e.target as HTMLInputElement).value)}
                  placeholder="sk-..."
                  autoComplete="off"
                  helperText={
                    apiKey
                      ? `${apiKey.slice(0, 8)}...${apiKey.slice(-4)}`
                      : 'No API key set — AI features will not work'
                  }
                />

                {provider === 'custom' && (
                  <Input
                    id="ai-base-url"
                    type="text"
                    label="Base URL"
                    value={baseUrl}
                    onChange={(e) => { setBaseUrl((e.target as HTMLInputElement).value); setTestResult(null); setDirty(true) }}
                    placeholder={OPENAI_BASE_URL}
                  />
                )}

                <Input
                  id="ai-model"
                  type="text"
                  label="Model"
                  value={model}
                  onChange={(e) => { setModel((e.target as HTMLInputElement).value); setTestResult(null); setDirty(true) }}
                  placeholder={DEFAULT_MODEL}
                />

                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    gap: 'var(--spacing-sm)',
                    paddingTop: 'var(--spacing-xs)',
                  }}
                >
                  <Button variant="outline" size="sm" onClick={handleTestConnection} loading={testing}>
                    Test Connection
                  </Button>
                  {testResult && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--spacing-2xs)',
                        padding: 'var(--spacing-xs) var(--spacing-sm)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 'var(--text-sm)',
                        background: testResult.ok ? 'var(--color-success-light)' : 'var(--color-danger-light)',
                        color: testResult.ok ? 'var(--color-success)' : 'var(--color-danger)',
                      }}
                    >
                      {testResult.ok ? <IconCheck size={16} /> : <IconClose size={16} />}
                      {testResult.message}
                    </div>
                  )}
                </div>
              </>
            )}

            {enabled && !apiKey && (
              <p
                style={{
                  margin: 0,
                  fontSize: 'var(--text-xs)',
                  color: 'var(--color-muted)',
                }}
              >
                AI features are enabled but no API key is configured. AI Tutor will not work until you provide a key.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--spacing-md)',
          marginTop: 'var(--spacing-lg)',
          paddingTop: 'var(--spacing-lg)',
          borderTop: '1px solid var(--color-border)',
        }}
      >
        <Button onClick={handleSave} disabled={!dirty || saving} loading={saving}>
          {saving ? 'Saving...' : 'Save AI Settings'}
        </Button>
        <Button variant="ghost" onClick={handleReset}>
          Reset AI Settings
        </Button>
      </div>
    </div>
  )
}
