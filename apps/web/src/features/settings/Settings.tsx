import { useState, useEffect, useRef, useCallback } from 'react'
import { useSettings } from '../../context/SettingsContext'
import { useTheme } from '../../context/ThemeContext'
import { DatabaseService } from '../../services/storage/Database'
import {
  loadNotificationPrefs,
  saveNotificationPrefs,
  type NotificationPrefs,
} from '../../services/storage/SettingsStorage'
import { ACCENT_COLOR_PRESETS, type ThemeMode } from '@ielts/theme'
import type { AppExportData } from '../../models'
import Card, { CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import ToggleSwitch from '../../components/ui/ToggleSwitch'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import AISettings from './AISettings'
import { ConfigProvider } from '../configuration/configSlice'
import BasicSettingsForm from '../configuration/components/BasicSettingsForm'
import AdvancedSettingsForm from '../configuration/components/AdvancedSettingsForm'
import PageHeader from '../../components/layout/PageHeader'
import { IconSettings } from '@ielts/ui'

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

function DeepConfigPanel() {
  const [view, setView] = useState<'basic' | 'advanced'>('basic')

  return (
    <div>
      <div className="mb-6 flex gap-1 rounded-lg border p-1" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-alt)' }}>
        <button
          type="button"
          onClick={() => setView('basic')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all ${
            view === 'basic'
              ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
          }`}
        >
          Basic Settings
        </button>
        <button
          type="button"
          onClick={() => setView('advanced')}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-all ${
            view === 'advanced'
              ? 'bg-[var(--color-surface)] text-[var(--color-text)] shadow-sm'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
          }`}
        >
          Advanced Settings
        </button>
      </div>

      {view === 'basic' ? <BasicSettingsForm /> : <AdvancedSettingsForm />}
    </div>
  )
}

export default function Settings() {
  const { settings, updateSettings } = useSettings()
  const { mode: themeMode, accentColor, setMode: setThemeMode, setAccentColor } = useTheme()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({ ...settings })
  const [errors, setErrors] = useState<FormErrors>({})
  const [dirty, setDirty] = useState(false)

  const [notifications, setNotifications] = useState<NotificationPrefs>(loadNotificationPrefs)

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [confirmAction, setConfirmAction] = useState<{
    title: string
    message: string
    action: () => Promise<void> | void
    buttonLabel: string
    buttonVariant: 'danger' | 'primary'
    loading?: boolean
  } | null>(null)

  useEffect(() => {
    setForm({ ...settings })
  }, [settings])

  useEffect(() => {
    saveNotificationPrefs(notifications)
  }, [notifications])

  const showFeedback = useCallback((type: 'success' | 'error', message: string) => {
    setFeedback({ type, message })
    setTimeout(() => setFeedback(null), 4000)
  }, [])

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

    updateSettings({ ...form, darkMode: themeMode === 'dark' })
    setDirty(false)
    showFeedback('success', 'Settings saved successfully.')

    if (notifications.enabled && 'Notification' in window) {
      Notification.requestPermission()
    }
  }

  function handleReset() {
    setConfirmAction({
      title: 'Reset Settings',
      message: 'Reset all settings to default values? This will not affect your learning data.',
      action: () => {
        const defaults = {
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
        setForm(defaults)
        updateSettings(defaults)
        setDirty(true)
        setThemeMode('system')
        setAccentColor('#2563eb')
        setNotifications({ enabled: false, reminderTime: '09:00' })
        showFeedback('success', 'Settings reset to defaults.')
      },
      buttonLabel: 'Reset Settings',
      buttonVariant: 'danger',
    })
  }

  function toggleArrayItem(arr: string[], item: string): string[] {
    return arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item]
  }

  async function handleExport() {
    try {
      const data = await DatabaseService.exportAll()
      const json = JSON.stringify(data, null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const date = new Date().toISOString().slice(0, 10)
      const a = document.createElement('a')
      a.href = url
      a.download = `ielts-backup-${date}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      showFeedback('success', 'Backup exported successfully.')
    } catch (err) {
      showFeedback('error', err instanceof Error ? err.message : 'Export failed')
    }
  }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const raw = JSON.parse(evt.target?.result as string)
        if (!raw || typeof raw.version !== 'number') {
          showFeedback('error', 'Invalid backup file format.')
          return
        }
        setConfirmAction({
          title: 'Import Backup',
          message: `Import backup created on ${new Date(raw.exportedAt).toLocaleString()}? This will overwrite ALL current data.`,
          action: async () => {
            try {
              await DatabaseService.importAll(raw as AppExportData)
              showFeedback('success', 'Data imported successfully.')
            } catch (err) {
              showFeedback('error', err instanceof Error ? err.message : 'Import failed.')
            }
          },
          buttonLabel: 'Import & Overwrite',
          buttonVariant: 'danger',
        })
      } catch {
        showFeedback('error', 'Could not parse file.')
      }
    }
    reader.onerror = () => showFeedback('error', 'Failed to read file')
    reader.readAsText(file)
    e.target.value = ''
  }

  function handleClearAll() {
    setConfirmAction({
      title: 'Clear All Data',
      message: 'Delete ALL your data including vocabulary, tasks, sessions, notes, mistakes, and mock tests. This action cannot be undone. Export a backup first.',
      action: async () => {
        await DatabaseService.resetAll()
        window.location.reload()
      },
      buttonLabel: 'Delete Everything',
      buttonVariant: 'danger',
    })
  }

  function handleRequestNotification() {
    if (!('Notification' in window)) {
      showFeedback('error', 'Notifications are not supported in this browser.')
      return
    }
    Notification.requestPermission().then(perm => {
      if (perm === 'granted') {
        showFeedback('success', 'Notifications enabled.')
      } else {
        showFeedback('error', 'Notification permission denied.')
      }
    })
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        icon={<IconSettings size={22} />}
        title="Settings"
        description="Configure your IELTS learning goals and preferences"
      />

      {feedback && (
        <div
          className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
            feedback.type === 'success'
              ? 'border-[var(--color-success)] bg-[var(--color-success-light)] text-[var(--color-success)]'
              : 'border-[var(--color-danger)] bg-[var(--color-danger-light)] text-[var(--color-danger)]'
          }`}
        >
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {feedback.type === 'success' ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            )}
          </svg>
          {feedback.message}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>IELTS Goal Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Select
                id="target-band"
                label="Target Band"
                value={form.targetBand}
                onChange={(e) => { setForm(prev => ({ ...prev, targetBand: parseFloat((e.target as HTMLSelectElement).value) })); setDirty(true) }}
                error={errors.targetBand}
                options={BAND_OPTIONS.map(b => ({ value: String(b), label: b.toFixed(1) }))}
              />
            </div>
            <div>
              <Select
                id="current-band"
                label="Current Estimated Band"
                value={form.currentBand}
                onChange={(e) => { setForm(prev => ({ ...prev, currentBand: parseFloat((e.target as HTMLSelectElement).value) })); setDirty(true) }}
                error={errors.currentBand}
                options={BAND_OPTIONS.map(b => ({ value: String(b), label: b.toFixed(1) }))}
              />
            </div>
          </div>

          <Input
            id="exam-date"
            type="date"
            label="Exam Date"
            value={form.examDate}
            onChange={(e) => { setForm(prev => ({ ...prev, examDate: (e.target as HTMLInputElement).value })); setDirty(true) }}
            helperText="Leave empty if not yet scheduled"
          />

          <Input
            id="daily-study"
            type="number"
            label="Daily Study Time (minutes)"
            min={1}
            max={1440}
            value={form.dailyStudyMinutes}
            onChange={(e) => { setForm(prev => ({ ...prev, dailyStudyMinutes: Math.max(1, parseInt((e.target as HTMLInputElement).value) || 1) })); setDirty(true) }}
            error={errors.dailyStudyMinutes}
          />
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
                  : 'border-[var(--color-border)] hover:border-blue-300'
              }`}
            >
              <p className="text-sm font-semibold text-[var(--color-text)]">IELTS Academic</p>
              <p className="mt-1 text-xs text-[var(--color-text-secondary)]">For university admission</p>
            </button>
            <button
              type="button"
              onClick={() => { setForm(prev => ({ ...prev, studyGoal: 'general' })); setDirty(true) }}
              className={`rounded-xl border-2 p-4 text-left transition-all ${
                form.studyGoal === 'general'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-[var(--color-border)] hover:border-blue-300'
              }`}
            >
              <p className="text-sm font-semibold text-[var(--color-text)]">IELTS General</p>
              <p className="mt-1 text-xs text-[var(--color-text-secondary)]">For work or migration</p>
            </button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Study Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-[var(--color-text-secondary)]">Which days do you plan to study?</p>
          <div className="flex flex-wrap gap-2">
            {DAYS_OF_WEEK.map(day => (
              <button
                key={day.value}
                type="button"
                onClick={() => { setForm(prev => ({ ...prev, preferredSchedule: toggleArrayItem(prev.preferredSchedule, day.value) as typeof prev.preferredSchedule })); setDirty(true) }}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  form.preferredSchedule.includes(day.value as typeof form.preferredSchedule[number])
                    ? 'bg-blue-600 text-white'
                    : 'bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)] hover:brightness-95'
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
          <Input
            id="reminder-text"
            type="text"
            label="Reminder Text"
            value={form.studyReminder}
            onChange={(e) => { setForm(prev => ({ ...prev, studyReminder: (e.target as HTMLInputElement).value })); setDirty(true) }}
            maxLength={200}
            error={errors.studyReminder}
            helperText={`${form.studyReminder.length}/200 characters`}
            placeholder="e.g., Time to study IELTS!"
          />
        </CardContent>
      </Card>

      <AISettings />

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <Select
            id="theme-mode"
            label="Theme Mode"
            value={themeMode}
            onChange={(e) => { setThemeMode(e.target.value as ThemeMode); setDirty(true) }}
            options={[
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
              { value: 'system', label: 'System' },
            ]}
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Accent Color
            </label>
            <div className="mt-2 flex flex-wrap gap-3">
              {ACCENT_COLOR_PRESETS.map(c => (
                <button
                  key={c.value}
                  type="button"
                  title={c.name}
                  onClick={() => { setAccentColor(c.value); setDirty(true) }}
                  className={`h-8 w-8 rounded-full ring-2 ring-offset-2 transition-all ${
                    accentColor === c.value ? 'ring-slate-400 scale-110' : 'ring-transparent hover:scale-110'
                  }`}
                  style={{ backgroundColor: c.value }}
                  aria-label={`Set accent color to ${c.name}`}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ToggleSwitch
            enabled={notifications.enabled}
            onChange={(val) => {
              setNotifications(prev => ({ ...prev, enabled: val }))
              if (val) handleRequestNotification()
            }}
            label="Enable Notifications"
            description="Get reminded to study daily"
          />

          {notifications.enabled && (
            <div>
              <label htmlFor="reminder-time" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Reminder Time
              </label>
              <input
                id="reminder-time"
                type="time"
                value={notifications.reminderTime}
                onChange={(e) => setNotifications(prev => ({ ...prev, reminderTime: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100"
              />
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                {!('Notification' in window) && 'Notifications not supported in this browser. '}
                {notifications.enabled && 'Study reminder notifications are active.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Deep Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-[var(--color-text-secondary)]">
            Customize AI tutor behavior, provider settings, feedback preferences, and more.
            Basic settings cover common preferences; advanced settings give you full control.
          </p>
          <ConfigProvider>
            <DeepConfigPanel />
          </ConfigProvider>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle style={{ color: 'var(--color-danger)' }}>Data Management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Your data is stored locally in this browser. Download a backup regularly.
          </p>

          <div className="flex flex-wrap gap-3">
            <Button onClick={handleExport}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export Backup
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileSelected}
              className="hidden"
              aria-hidden="true"
            />
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L5 8m4-4v12" />
              </svg>
              Import Backup
            </Button>

            <Button variant="danger" onClick={handleClearAll}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Clear All Data
            </Button>

          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/50">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              All data is stored locally. No data is ever sent to any server.
              Regular backups are recommended in JSON format.
            </p>
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

      <ConfirmDialog
        open={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        title={confirmAction?.title ?? ''}
        message={confirmAction?.message ?? ''}
        confirmLabel={confirmAction?.buttonLabel}
        cancelLabel="Cancel"
        variant={confirmAction?.buttonVariant ?? 'danger'}
        onConfirm={async () => {
          await confirmAction?.action()
        }}
      />
    </div>
  )
}
