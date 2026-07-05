import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useSettings } from '../context/SettingsContext'
import { useTheme } from '../context/ThemeContext'
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import Button from '../components/ui/Button'
import AISettings from '../features/settings/AISettings'
import type { CorsProxyConfig } from '../features/publicApiIntegration/types'
import { DEFAULT_CORS_PROXY, CORS_PROXY_STORAGE_KEY } from '../features/publicApiIntegration/types'

const IELTS_TOPICS = [
  'Education', 'Technology', 'Environment', 'Health',
  'Work', 'Business', 'Travel', 'Culture', 'Society',
  'Crime', 'Government', 'Media', 'Globalization',
  'Family', 'Housing', 'Transport', 'Art', 'Sports', 'Science',
]

const SKILL_OPTIONS = [
  'Reading', 'Listening', 'Writing', 'Speaking', 'Vocabulary', 'Grammar',
]

const DAYS_OF_WEEK = [
  { value: 'mon', label: 'Monday' },
  { value: 'tue', label: 'Tuesday' },
  { value: 'wed', label: 'Wednesday' },
  { value: 'thu', label: 'Thursday' },
  { value: 'fri', label: 'Friday' },
  { value: 'sat', label: 'Saturday' },
  { value: 'sun', label: 'Sunday' },
]

const BAND_OPTIONS = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9]

interface FormErrors {
  targetBand?: string
  currentBand?: string
  dailyStudyMinutes?: string
  studyReminder?: string
}

export default function Settings() {
  const { settings, updateSettings } = useSettings()
  const { dark, toggle } = useTheme()

  const [form, setForm] = useState({ ...settings })
  const [errors, setErrors] = useState<FormErrors>({})
  const [saved, setSaved] = useState(false)
  const [dirty, setDirty] = useState(false)

  const [showAdvanced, setShowAdvanced] = useState(false)
  const [corsProxy, setCorsProxy] = useState<CorsProxyConfig>(() => {
    try {
      const raw = localStorage.getItem(CORS_PROXY_STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as CorsProxyConfig
        if (parsed && typeof parsed.enabled === 'boolean' && typeof parsed.proxyUrl === 'string') {
          return parsed
        }
      }
    } catch {}
    return { enabled: false, proxyUrl: DEFAULT_CORS_PROXY }
  })

  useEffect(() => {
    setForm({ ...settings })
  }, [settings])

  function validate(): FormErrors {
    const errs: FormErrors = {}
    if (form.targetBand < 1 || form.targetBand > 9) {
      errs.targetBand = 'Target band must be between 1 and 9'
    }
    if (form.currentBand < 1 || form.currentBand > 9) {
      errs.currentBand = 'Current band must be between 1 and 9'
    }
    if (form.dailyStudyMinutes < 1 || form.dailyStudyMinutes > 1440) {
      errs.dailyStudyMinutes = 'Study time must be between 1 and 1440 minutes'
    }
    if (form.studyReminder.trim().length === 0) {
      errs.studyReminder = 'Reminder text is required'
    } else if (form.studyReminder.trim().length > 200) {
      errs.studyReminder = 'Reminder text must be 200 characters or less'
    }
    return errs
  }

  function handleSave() {
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    updateSettings({ ...form, darkMode: dark })
    setSaved(true)
    setDirty(false)
    setTimeout(() => setSaved(false), 2500)
  }

  function handleReset() {
    const confirmed = window.confirm('Reset all settings to default values?')
    if (!confirmed) return
    const defaultSettings = {
      targetBand: 7.0,
      currentBand: 5.5,
      examDate: '',
      dailyStudyMinutes: 60,
      weakSkills: [],
      preferredTopics: [],
      studyReminder: 'Time to study IELTS!',
      studyGoal: 'academic' as const,
      preferredSchedule: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const,
      aiApiKey: '',
      aiProvider: 'openai' as const,
      aiBaseUrl: '',
      aiEndpoint: '',
      aiModel: 'gpt-4o-mini',
      aiEnabled: false,
      darkMode: false,
    }
    setForm(defaultSettings)
    updateSettings(defaultSettings)
    if (dark) toggle()
    setDirty(true)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function toggleArrayItem(arr: string[], item: string): string[] {
    return arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item]
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Settings
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Configure your IELTS learning goals and preferences
        </p>
      </div>

      {saved && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-400">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Settings saved successfully.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>IELTS Goal Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="target-band" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Target Band
              </label>
              <select
                id="target-band"
                value={form.targetBand}
                onChange={(e) => { setForm(prev => ({ ...prev, targetBand: parseFloat(e.target.value) })); setDirty(true) }}
                className={`mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100 ${
                  errors.targetBand ? 'border-red-400 dark:border-red-500' : 'border-slate-300 dark:border-slate-600'
                }`}
              >
                {BAND_OPTIONS.map(b => (
                  <option key={b} value={b}>{b.toFixed(1)}</option>
                ))}
              </select>
              {errors.targetBand && <p className="mt-1 text-xs text-red-500">{errors.targetBand}</p>}
            </div>
            <div>
              <label htmlFor="current-band" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Current Estimated Band
              </label>
              <select
                id="current-band"
                value={form.currentBand}
                onChange={(e) => { setForm(prev => ({ ...prev, currentBand: parseFloat(e.target.value) })); setDirty(true) }}
                className={`mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100 ${
                  errors.currentBand ? 'border-red-400 dark:border-red-500' : 'border-slate-300 dark:border-slate-600'
                }`}
              >
                {BAND_OPTIONS.map(b => (
                  <option key={b} value={b}>{b.toFixed(1)}</option>
                ))}
              </select>
              {errors.currentBand && <p className="mt-1 text-xs text-red-500">{errors.currentBand}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="exam-date" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Exam Date
            </label>
            <input
              id="exam-date"
              type="date"
              value={form.examDate}
              onChange={(e) => { setForm(prev => ({ ...prev, examDate: e.target.value })); setDirty(true) }}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
            />
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">Leave empty if not yet scheduled</p>
          </div>

          <div>
            <label htmlFor="daily-study" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Daily Study Time (minutes)
            </label>
            <input
              id="daily-study"
              type="number"
              min={1}
              max={1440}
              value={form.dailyStudyMinutes}
              onChange={(e) => { setForm(prev => ({ ...prev, dailyStudyMinutes: Math.max(1, parseInt(e.target.value) || 1) })); setDirty(true) }}
              className={`mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100 ${
                errors.dailyStudyMinutes ? 'border-red-400 dark:border-red-500' : 'border-slate-300 dark:border-slate-600'
              }`}
            />
            {errors.dailyStudyMinutes && <p className="mt-1 text-xs text-red-500">{errors.dailyStudyMinutes}</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Weak Skills</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {SKILL_OPTIONS.map(skill => (
              <button
                key={skill}
                type="button"
                onClick={() => { setForm(prev => ({ ...prev, weakSkills: toggleArrayItem(prev.weakSkills, skill) })); setDirty(true) }}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  form.weakSkills.includes(skill)
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-slate-600'
                }`}
              >
                {skill}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">Select your weak areas to focus your study plan</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preferred Topics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {IELTS_TOPICS.map(topic => (
              <button
                key={topic}
                type="button"
                onClick={() => { setForm(prev => ({ ...prev, preferredTopics: toggleArrayItem(prev.preferredTopics, topic) })); setDirty(true) }}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  form.preferredTopics.includes(topic)
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-slate-600'
                }`}
              >
                {topic}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">Select topics you prefer to practice with</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Study Goal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => { setForm(prev => ({ ...prev, studyGoal: 'academic' })); setDirty(true) }}
              className={`rounded-xl border-2 p-4 text-left transition-all ${
                form.studyGoal === 'academic'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-slate-200 dark:border-slate-700 hover:border-blue-300'
              }`}
            >
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">IELTS Academic</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">For university admission</p>
            </button>
            <button
              type="button"
              onClick={() => { setForm(prev => ({ ...prev, studyGoal: 'general' })); setDirty(true) }}
              className={`rounded-xl border-2 p-4 text-left transition-all ${
                form.studyGoal === 'general'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-slate-200 dark:border-slate-700 hover:border-blue-300'
              }`}
            >
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">IELTS General</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">For work or migration</p>
            </button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Study Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">Which days do you plan to study?</p>
          <div className="flex flex-wrap gap-2">
            {DAYS_OF_WEEK.map(day => (
              <button
                key={day.value}
                type="button"
                onClick={() => { setForm(prev => ({ ...prev, preferredSchedule: toggleArrayItem(prev.preferredSchedule, day.value) as typeof prev.preferredSchedule })); setDirty(true) }}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  form.preferredSchedule.includes(day.value as typeof form.preferredSchedule[number])
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-slate-600'
                }`}
              >
                {day.label.slice(0, 3)}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Study Reminder</CardTitle>
        </CardHeader>
        <CardContent>
          <div>
            <label htmlFor="reminder-text" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Reminder Text
            </label>
            <input
              id="reminder-text"
              type="text"
              value={form.studyReminder}
              onChange={(e) => { setForm(prev => ({ ...prev, studyReminder: e.target.value })); setDirty(true) }}
              maxLength={200}
              className={`mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-100 ${
                errors.studyReminder ? 'border-red-400 dark:border-red-500' : 'border-slate-300 dark:border-slate-600'
              }`}
              placeholder="e.g., Time to study IELTS!"
            />
            {errors.studyReminder && <p className="mt-1 text-xs text-red-500">{errors.studyReminder}</p>}
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              {form.studyReminder.length}/200 characters
            </p>
          </div>
        </CardContent>
      </Card>

      <AISettings />

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Dark Mode</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">Switch between light and dark theme</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={dark}
              onClick={toggle}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                dark ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform dark:bg-slate-200 ${
                  dark ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Export, import, and manage your learning data. All data is stored locally in your browser.
          </p>
          <Link
            to="/settings/data"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Open Data Management
          </Link>
        </CardContent>
      </Card>

      <div className="pt-4">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex w-full items-center justify-between text-left"
        >
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Advanced</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Additional configuration for advanced users</p>
          </div>
          <svg
            className={`h-5 w-5 text-slate-400 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {showAdvanced && (
      <Card>
        <CardHeader>
          <CardTitle>CORS Proxy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Some public API sources (Tatoeba, OER Commons) do not support direct browser access due to CORS restrictions.
            Enable a CORS proxy to use them.
          </p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Enable CORS Proxy</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Routes requests through a proxy to bypass CORS</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={corsProxy.enabled}
              onClick={() => {
                const next = { ...corsProxy, enabled: !corsProxy.enabled }
                setCorsProxy(next)
                localStorage.setItem(CORS_PROXY_STORAGE_KEY, JSON.stringify(next))
              }}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                corsProxy.enabled ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform dark:bg-slate-200 ${
                  corsProxy.enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
          {corsProxy.enabled && (
            <div>
              <label htmlFor="cors-proxy-url" className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                Proxy URL
              </label>
              <input
                id="cors-proxy-url"
                type="url"
                value={corsProxy.proxyUrl}
                onChange={(e) => {
                  const next = { ...corsProxy, proxyUrl: e.target.value }
                  setCorsProxy(next)
                  localStorage.setItem(CORS_PROXY_STORAGE_KEY, JSON.stringify(next))
                }}
                placeholder={DEFAULT_CORS_PROXY}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Use a CORS proxy service like{" "}
                <a
                  href="https://corsproxy.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline dark:text-blue-400"
                >
                  corsproxy.io
                </a>{" "}
                or host your own.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <Button onClick={handleSave} disabled={!dirty}>
          Save Settings
        </Button>
        <Button variant="ghost" onClick={handleReset}>
          Reset to Defaults
        </Button>
      </div>
    </div>
  )
}
