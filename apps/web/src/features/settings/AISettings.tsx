import { useState, useEffect } from 'react'
import { useSettings } from '../../context/SettingsContext'
import Card, { CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import ToggleSwitch from '../../components/ui/ToggleSwitch'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import { OPENAI_BASE_URL, DEFAULT_MODEL } from '@ielts/settings'
import { testConnection } from '../../services/ai/AIService'

export default function AISettings() {
  const { settings, updateSettings } = useSettings()

  const [apiKey, setApiKey] = useState(settings.aiApiKey)
  const [provider, setProvider] = useState(settings.aiProvider)
  const [baseUrl, setBaseUrl] = useState(settings.aiBaseUrl || settings.aiEndpoint || '')
  const [model, setModel] = useState(settings.aiModel)
  const [enabled, setEnabled] = useState(settings.aiEnabled)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveFeedback, setSaveFeedback] = useState<'success' | 'error' | null>(null)

  useEffect(() => {
    setApiKey(settings.aiApiKey)
    setProvider(settings.aiProvider)
    setBaseUrl(settings.aiBaseUrl || settings.aiEndpoint || '')
    setModel(settings.aiModel)
    setEnabled(settings.aiEnabled)
  }, [settings.aiApiKey, settings.aiProvider, settings.aiBaseUrl, settings.aiEndpoint, settings.aiModel, settings.aiEnabled])

  function handleSave() {
    setSaving(true)
    setSaveFeedback(null)
    try {
      updateSettings({
        aiApiKey: apiKey,
        aiProvider: provider,
        aiBaseUrl: baseUrl,
        aiEndpoint: baseUrl,
        aiModel: model,
        aiEnabled: enabled,
      })
      setSaveFeedback('success')
    } catch {
      setSaveFeedback('error')
    } finally {
      setSaving(false)
      setTimeout(() => setSaveFeedback(null), 2500)
    }
  }

  function handleReset() {
    setApiKey('')
    setProvider('openai')
    setBaseUrl('')
    setModel('gpt-4o-mini')
    setEnabled(false)
    setTestResult(null)
    updateSettings({
      aiApiKey: '',
      aiProvider: 'openai',
      aiBaseUrl: '',
      aiEndpoint: '',
      aiModel: 'gpt-4o-mini',
      aiEnabled: false,
    })
    setSaveFeedback('success')
    setTimeout(() => setSaveFeedback(null), 2500)
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

  function handleKeyChange(val: string) {
    setApiKey(val)
    setTestResult(null)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Tutor</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
          <p className="font-medium">Local Storage Notice</p>
          <p className="mt-1">
            Your API key is stored only in this browser using localStorage. It is never sent to any
            server except the AI provider you configure. The app works fully without an API key.
          </p>
        </div>

        <ToggleSwitch
          enabled={enabled}
          onChange={setEnabled}
          label="Enable AI Features"
          description="Turn on AI-powered study tools"
        />

        {enabled && (
          <>
            <Select
              id="ai-provider"
              label="Provider"
              value={provider}
              onChange={(e) => {
                setProvider((e.target as HTMLSelectElement).value as 'openai' | 'custom')
                if ((e.target as HTMLSelectElement).value === 'openai') {
                  setBaseUrl('')
                  setModel('gpt-4o-mini')
                }
                setTestResult(null)
              }}
              options={[
                { value: 'openai', label: 'OpenAI' },
                { value: 'custom', label: 'Custom (OpenAI-compatible)' },
              ]}
            />

            <Input
              id="ai-key"
              type="password"
              label="API Key"
              value={apiKey}
              onChange={(e) => handleKeyChange((e.target as HTMLInputElement).value)}
              placeholder="sk-..."
              autoComplete="off"
              helperText={apiKey ? `${apiKey.slice(0, 8)}...${apiKey.slice(-4)}` : 'No API key set'}
            />

            <Input
              id="ai-base-url"
              type="text"
              label="Base URL"
              value={baseUrl}
              onChange={(e) => { setBaseUrl((e.target as HTMLInputElement).value); setTestResult(null) }}
              placeholder={OPENAI_BASE_URL}
            />

            <Input
              id="ai-model"
              type="text"
              label="Model"
              value={model}
              onChange={(e) => { setModel((e.target as HTMLInputElement).value); setTestResult(null) }}
              placeholder={DEFAULT_MODEL}
            />

            <div className="flex flex-wrap gap-3">
              <Button variant="outline" size="sm" onClick={handleTestConnection} loading={testing}>
                Test Connection
              </Button>
              {testResult && (
                <div
                  className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm ${
                    testResult.ok
                      ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }`}
                >
                  {testResult.ok ? (
                    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  {testResult.message}
                </div>
              )}
            </div>
          </>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <Button onClick={handleSave} disabled={saving || (!apiKey && enabled)}>
            {saving ? 'Saving...' : 'Save AI Settings'}
          </Button>
          <Button variant="ghost" onClick={handleReset}>
            Reset AI Settings
          </Button>
        </div>

        {saveFeedback === 'success' && (
          <p className="text-xs text-green-600 dark:text-green-400">AI settings saved.</p>
        )}
        {saveFeedback === 'error' && (
          <p className="text-xs text-red-600 dark:text-red-400">Failed to save settings.</p>
        )}
      </CardContent>
    </Card>
  )
}
