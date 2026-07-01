import { useState, useEffect } from 'react'
import { useSettings } from '../context/SettingsContext'
import { useTheme } from '../context/ThemeContext'
import Card, { CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import Button from '../components/ui/Button'

const IELTS_TOPICS = [
  'Education', 'Technology', 'Environment', 'Health',
  'Work', 'Business', 'Travel', 'Culture', 'Society',
  'Crime', 'Government', 'Media', 'Globalization',
  'Family', 'Housing', 'Transport', 'Art', 'Sports', 'Science',
]

const SKILL_OPTIONS = [
  'Reading', 'Listening', 'Writing', 'Speaking', 'Vocabulary', 'Grammar',
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
      aiApiKey: '',
      aiProvider: 'openai' as const,
      aiEndpoint: '',
      aiModel: 'gpt-4o-mini',
      darkMode: false,
      sampleDataLoaded: false,
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

      <Card>
        <CardHeader>
          <CardTitle>AI Helper (Optional)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Paste your API key to enable AI features. The app still works fully without it.
            Your key is stored only in this browser.
          </p>
          <div>
            <label htmlFor="ai-provider" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Provider
            </label>
            <select
              id="ai-provider"
              value={form.aiProvider}
              onChange={(e) => { setForm(prev => ({ ...prev, aiProvider: e.target.value as 'openai' | 'custom' })); setDirty(true) }}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
            >
              <option value="openai">OpenAI</option>
              <option value="custom">Custom (OpenAI-compatible)</option>
            </select>
          </div>
          <div>
            <label htmlFor="ai-key" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              API Key
            </label>
            <input
              id="ai-key"
              type="password"
              value={form.aiApiKey}
              onChange={(e) => { setForm(prev => ({ ...prev, aiApiKey: e.target.value })); setDirty(true) }}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              placeholder="sk-..."
              autoComplete="off"
            />
          </div>
          {form.aiProvider === 'custom' && (
            <>
              <div>
                <label htmlFor="ai-endpoint" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Endpoint URL
                </label>
                <input
                  id="ai-endpoint"
                  type="text"
                  value={form.aiEndpoint}
                  onChange={(e) => { setForm(prev => ({ ...prev, aiEndpoint: e.target.value })); setDirty(true) }}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                  placeholder="https://api.openai.com/v1"
                />
              </div>
              <div>
                <label htmlFor="ai-model" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Model
                </label>
                <input
                  id="ai-model"
                  type="text"
                  value={form.aiModel}
                  onChange={(e) => { setForm(prev => ({ ...prev, aiModel: e.target.value })); setDirty(true) }}
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
                  placeholder="gpt-4o-mini"
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

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
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  dark ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </CardContent>
      </Card>

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
