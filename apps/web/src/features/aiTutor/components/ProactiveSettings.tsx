import { useState, useRef, useEffect } from 'react'
import ToggleSwitch from '../../../components/ui/ToggleSwitch'
import Button from '../../../components/ui/Button'
import { useProactiveSettings, CATEGORY_LABELS, CATEGORY_DESCRIPTIONS } from '../hooks/useProactiveSettings'
import type { TutorTone, ReminderFrequency, AutomationLevel, NotificationChannel, ProactiveMessageCategory } from '../hooks/useProactiveSettings'

const TONE_OPTIONS: { value: TutorTone; label: string; description: string }[] = [
  { value: 'friendly', label: 'Friendly', description: 'Warm and encouraging tone like a supportive tutor' },
  { value: 'strict', label: 'Strict', description: 'Direct and disciplined tone like a strict teacher' },
  { value: 'motivational', label: 'Motivational', description: 'High-energy and inspiring tone' },
  { value: 'simple', label: 'Simple', description: 'Clear and easy-to-understand language' },
  { value: 'vietnamese', label: 'Vietnamese Explanation', description: 'Explanations in Vietnamese' },
]

const REMINDER_FREQUENCY_OPTIONS: { value: ReminderFrequency; label: string; description: string }[] = [
  { value: 'daily', label: 'Daily', description: 'Every day at the set time' },
  { value: 'every-other-day', label: 'Every Other Day', description: 'Once every two days' },
  { value: 'weekly', label: 'Weekly', description: 'Once per week' },
  { value: 'smart', label: 'Smart', description: 'Adapts based on your activity level' },
]

const AUTOMATION_OPTIONS: { value: AutomationLevel; label: string; description: string }[] = [
  { value: 'manual', label: 'Manual', description: 'Only send messages when I ask' },
  { value: 'semi-automatic', label: 'Semi-Automatic', description: 'Suggest actions but let me decide' },
  { value: 'automatic', label: 'Automatic', description: 'Fully automated proactive messages' },
]

const CHANNEL_OPTIONS: { value: NotificationChannel; label: string; description: string }[] = [
  { value: 'in-app', label: 'In-App', description: 'Show messages inside the app' },
  { value: 'browser', label: 'Browser', description: 'Desktop push notifications' },
  { value: 'extension', label: 'Extension', description: 'Show in the browser extension' },
]

const SKILL_OPTIONS = [
  { value: 'reading', label: 'Reading' },
  { value: 'listening', label: 'Listening' },
  { value: 'writing-task-1', label: 'Writing Task 1' },
  { value: 'writing-task-2', label: 'Writing Task 2' },
  { value: 'speaking-part-1', label: 'Speaking Part 1' },
  { value: 'speaking-part-2', label: 'Speaking Part 2' },
  { value: 'speaking-part-3', label: 'Speaking Part 3' },
  { value: 'grammar', label: 'Grammar' },
  { value: 'vocabulary', label: 'Vocabulary' },
  { value: 'pronunciation', label: 'Pronunciation' },
]

interface MultiSelectProps {
  label: string
  description: string
  options: { value: string; label: string }[]
  selected: string[]
  onChange: (selected: string[]) => void
  error?: string
}

function MultiSelect({ label, description, options, selected, onChange, error }: MultiSelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function toggleOption(value: string) {
    if (selected.includes(value)) {
      onChange(selected.filter(v => v !== value))
    } else {
      onChange([...selected, value])
    }
  }

  return (
    <div ref={ref} className="relative">
      <p className="mb-1 text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
        {label}
      </p>
      <p className="mb-1 text-xs" style={{ color: 'var(--color-muted)' }}>
        {description}
      </p>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
          error ? 'border-red-500' : ''
        }`}
        style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: error ? '#ef4444' : 'var(--color-border)',
          color: 'var(--color-text)',
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className={selected.length === 0 ? 'opacity-50' : ''}>
          {selected.length === 0 ? 'Select skills...' : `${selected.length} skill${selected.length > 1 ? 's' : ''} selected`}
        </span>
        <svg className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      {open && (
        <div
          className="absolute left-0 right-0 z-10 mt-1 max-h-60 overflow-auto rounded-lg border shadow-lg"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
          }}
          role="listbox"
          aria-multiselectable="true"
        >
          {options.map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggleOption(opt.value)}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:brightness-95"
              style={{ color: 'var(--color-text)' }}
              role="option"
              aria-selected={selected.includes(opt.value)}
            >
              <span
                className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${
                  selected.includes(opt.value) ? 'border-transparent' : ''
                }`}
                style={{
                  backgroundColor: selected.includes(opt.value) ? 'var(--color-primary)' : 'transparent',
                  borderColor: selected.includes(opt.value) ? 'var(--color-primary)' : 'var(--color-border)',
                }}
              >
                {selected.includes(opt.value) && (
                  <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </span>
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

interface ProactiveSettingsProps {
  onClose?: () => void
}

export default function ProactiveSettings({ onClose }: ProactiveSettingsProps) {
  const {
    settings,
    loading,
    error,
    validationErrors,
    update,
    save,
    reset,
    hasUnsavedChanges,
    saved,
  } = useProactiveSettings()

  const categories = Object.keys(CATEGORY_LABELS) as ProactiveMessageCategory[]

  function handleToneChange(e: React.ChangeEvent<HTMLSelectElement>) {
    update({ tone: e.target.value as TutorTone })
  }

  function handleReminderFrequencyChange(e: React.ChangeEvent<HTMLSelectElement>) {
    update({ reminderFrequency: e.target.value as ReminderFrequency })
  }

  function handleAutomationChange(e: React.ChangeEvent<HTMLSelectElement>) {
    update({ automationLevel: e.target.value as AutomationLevel })
  }

  function toggleChannel(channel: NotificationChannel) {
    const channels = settings.notificationChannels.includes(channel)
      ? settings.notificationChannels.filter(c => c !== channel)
      : [...settings.notificationChannels, channel]
    update({ notificationChannels: channels })
  }

  function toggleCategory(category: ProactiveMessageCategory) {
    update({
      categories: {
        ...settings.categories,
        [category]: !settings.categories[category],
      },
    })
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto" style={{ color: 'var(--color-text)' }}>
      <div className="flex items-center justify-between border-b px-4 py-3" style={{ borderColor: 'var(--color-border)' }}>
        <h3 className="text-sm font-semibold">Proactive Tutor Settings</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-sm transition-colors hover:opacity-80"
            style={{ color: 'var(--color-muted)' }}
            aria-label="Close settings"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="flex-1 space-y-5 p-4 text-sm">
        {/* Local-First Notice */}
        <div
          className="rounded-lg border px-4 py-3 text-xs leading-relaxed"
          style={{
            borderColor: 'var(--color-info)',
            backgroundColor: 'var(--color-info-light)',
            color: 'var(--color-text-secondary)',
          }}
        >
          <p className="font-medium" style={{ color: 'var(--color-text)' }}>
            Local-First Notice
          </p>
          <p className="mt-1">
            Proactive messages are generated entirely in your browser from local data.
            Without a backend push service, messages cannot be delivered when the website
            and extension are both closed. No data is sent to any external server unless
            AI-enhanced mode is explicitly enabled with your own API key.
          </p>
        </div>

        {error && (
          <div
            className="rounded-lg border px-4 py-3 text-xs leading-relaxed"
            style={{
              borderColor: 'var(--color-danger)',
              backgroundColor: 'var(--color-danger-light)',
              color: 'var(--color-text-secondary)',
            }}
          >
            <p className="font-medium" style={{ color: 'var(--color-danger)' }}>
              Error
            </p>
            <p className="mt-1">{error}</p>
          </div>
        )}

        {/* Enable Proactive Tutor */}
        <ToggleSwitch
          enabled={settings.enabled}
          onChange={v => update({ enabled: v })}
          label="Enable Proactive Tutor Messages"
          description="Allow the AI Tutor to send helpful suggestions based on your learning activity"
        />

        {settings.enabled && (
          <>
            {/* Tutor Tone */}
            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }} htmlFor="tutor-tone">
                Tutor Tone
              </label>
              <p className="mb-1 text-xs" style={{ color: 'var(--color-muted)' }}>
                How the AI Tutor should speak to you
              </p>
              <select
                id="tutor-tone"
                value={settings.tone}
                onChange={handleToneChange}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text)',
                }}
              >
                {TONE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs" style={{ color: 'var(--color-muted)' }}>
                {TONE_OPTIONS.find(o => o.value === settings.tone)?.description}
              </p>
            </div>

            {/* Reminder Frequency */}
            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }} htmlFor="reminder-frequency">
                Reminder Frequency
              </label>
              <p className="mb-1 text-xs" style={{ color: 'var(--color-muted)' }}>
                How often the AI Tutor should send proactive messages
              </p>
              <select
                id="reminder-frequency"
                value={settings.reminderFrequency}
                onChange={handleReminderFrequencyChange}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text)',
                }}
              >
                {REMINDER_FREQUENCY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs" style={{ color: 'var(--color-muted)' }}>
                {REMINDER_FREQUENCY_OPTIONS.find(o => o.value === settings.reminderFrequency)?.description}
              </p>
            </div>

            {/* Daily Reminder Time */}
            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }} htmlFor="daily-reminder-time">
                Daily Reminder Time
              </label>
              <p className="mb-1 text-xs" style={{ color: 'var(--color-muted)' }}>
                When the AI Tutor should send the first daily message
              </p>
              <input
                id="daily-reminder-time"
                type="time"
                value={settings.dailyReminderTime}
                onChange={e => update({ dailyReminderTime: e.target.value })}
                className={`w-full rounded-lg border px-3 py-2 text-sm ${
                  validationErrors.dailyReminderTime ? 'border-red-500' : ''
                }`}
                style={{
                  backgroundColor: 'var(--color-surface)',
                  borderColor: validationErrors.dailyReminderTime ? '#ef4444' : 'var(--color-border)',
                  color: 'var(--color-text)',
                }}
              />
              {validationErrors.dailyReminderTime && (
                <p className="mt-1 text-xs text-red-500">{validationErrors.dailyReminderTime}</p>
              )}
            </div>

            {/* Preferred Study Time */}
            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }} htmlFor="preferred-study-time">
                Preferred Study Time
              </label>
              <p className="mb-1 text-xs" style={{ color: 'var(--color-muted)' }}>
                Your preferred time of day for studying
              </p>
              <input
                id="preferred-study-time"
                type="time"
                value={settings.preferredStudyTime}
                onChange={e => update({ preferredStudyTime: e.target.value })}
                className={`w-full rounded-lg border px-3 py-2 text-sm ${
                  validationErrors.preferredStudyTime ? 'border-red-500' : ''
                }`}
                style={{
                  backgroundColor: 'var(--color-surface)',
                  borderColor: validationErrors.preferredStudyTime ? '#ef4444' : 'var(--color-border)',
                  color: 'var(--color-text)',
                }}
              />
              {validationErrors.preferredStudyTime && (
                <p className="mt-1 text-xs text-red-500">{validationErrors.preferredStudyTime}</p>
              )}
            </div>

            {/* Automation Level */}
            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }} htmlFor="automation-level">
                Automation Level
              </label>
              <p className="mb-1 text-xs" style={{ color: 'var(--color-muted)' }}>
                How much autonomy the AI Tutor has
              </p>
              <select
                id="automation-level"
                value={settings.automationLevel}
                onChange={handleAutomationChange}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text)',
                }}
              >
                {AUTOMATION_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs" style={{ color: 'var(--color-muted)' }}>
                {AUTOMATION_OPTIONS.find(o => o.value === settings.automationLevel)?.description}
              </p>
            </div>

            {/* Weak Skill Priority */}
            <MultiSelect
              label="Weak Skill Priority"
              description="Skills you want the AI Tutor to prioritize in proactive messages"
              options={SKILL_OPTIONS}
              selected={settings.weakSkillPriority}
              onChange={selected => update({ weakSkillPriority: selected })}
              error={validationErrors.weakSkillPriority}
            />

            {/* Notification Channels */}
            <div>
              <p className="mb-1 text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                Notification Channels
              </p>
              <p className="mb-1 text-xs" style={{ color: 'var(--color-muted)' }}>
                Where you want to receive proactive messages
              </p>
              <div className="space-y-2">
                {CHANNEL_OPTIONS.map(channel => (
                  <label
                    key={channel.value}
                    className="flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 transition-colors hover:brightness-95"
                    style={{ borderColor: 'var(--color-border)' }}
                  >
                    <div>
                      <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                        {channel.label}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
                        {channel.description}
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.notificationChannels.includes(channel.value)}
                      onChange={() => toggleChannel(channel.value)}
                      className="h-4 w-4 rounded"
                      style={{ accentColor: 'var(--color-primary)' }}
                    />
                  </label>
                ))}
              </div>
              {validationErrors.notificationChannels && (
                <p className="mt-1 text-xs text-red-500">{validationErrors.notificationChannels}</p>
              )}
            </div>

            {/* Auto-Suggest Exercises */}
            <ToggleSwitch
              enabled={settings.autoSuggestExercises}
              onChange={v => update({ autoSuggestExercises: v })}
              label="Auto-Suggest Exercises"
              description="Allow AI to suggest practice exercises based on your mistakes and weak skills"
            />

            {/* Auto Weekly Review */}
            <ToggleSwitch
              enabled={settings.autoWeeklyReview}
              onChange={v => update({ autoWeeklyReview: v })}
              label="Auto-Generate Weekly Progress Review"
              description="Allow AI to automatically create weekly and monthly progress review reports"
            />

            {/* Quiet Hours */}
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>
                Quiet Hours
              </p>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                No proactive messages will be sent during these hours
              </p>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="mb-1 block text-xs" style={{ color: 'var(--color-text-secondary)' }} htmlFor="quiet-start">
                    Start
                  </label>
                  <input
                    id="quiet-start"
                    type="time"
                    value={settings.quietHoursStart}
                    onChange={e => update({ quietHoursStart: e.target.value })}
                    className={`w-full rounded-lg border px-3 py-2 text-sm ${
                      validationErrors.quietHoursStart ? 'border-red-500' : ''
                    }`}
                    style={{
                      backgroundColor: 'var(--color-surface)',
                      borderColor: validationErrors.quietHoursStart ? '#ef4444' : 'var(--color-border)',
                      color: 'var(--color-text)',
                    }}
                  />
                  {validationErrors.quietHoursStart && (
                    <p className="mt-1 text-xs text-red-500">{validationErrors.quietHoursStart}</p>
                  )}
                </div>
                <span className="mt-5 text-xs" style={{ color: 'var(--color-muted)' }}>
                  to
                </span>
                <div className="flex-1">
                  <label className="mb-1 block text-xs" style={{ color: 'var(--color-text-secondary)' }} htmlFor="quiet-end">
                    End
                  </label>
                  <input
                    id="quiet-end"
                    type="time"
                    value={settings.quietHoursEnd}
                    onChange={e => update({ quietHoursEnd: e.target.value })}
                    className={`w-full rounded-lg border px-3 py-2 text-sm ${
                      validationErrors.quietHoursEnd ? 'border-red-500' : ''
                    }`}
                    style={{
                      backgroundColor: 'var(--color-surface)',
                      borderColor: validationErrors.quietHoursEnd ? '#ef4444' : 'var(--color-border)',
                      color: 'var(--color-text)',
                    }}
                  />
                  {validationErrors.quietHoursEnd && (
                    <p className="mt-1 text-xs text-red-500">{validationErrors.quietHoursEnd}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Max Messages Per Day */}
            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }} htmlFor="max-messages">
                Max Messages Per Day
              </label>
              <p className="mb-1 text-xs" style={{ color: 'var(--color-muted)' }}>
                Limit how many proactive messages the AI Tutor can send each day
              </p>
              <input
                id="max-messages"
                type="number"
                min={1}
                max={50}
                value={settings.maxMessagesPerDay}
                onChange={e => update({ maxMessagesPerDay: Math.max(1, Math.min(50, parseInt(e.target.value) || 1)) })}
                className={`w-24 rounded-lg border px-3 py-2 text-sm ${
                  validationErrors.maxMessagesPerDay ? 'border-red-500' : ''
                }`}
                style={{
                  backgroundColor: 'var(--color-surface)',
                  borderColor: validationErrors.maxMessagesPerDay ? '#ef4444' : 'var(--color-border)',
                  color: 'var(--color-text)',
                }}
              />
              {validationErrors.maxMessagesPerDay && (
                <p className="mt-1 text-xs text-red-500">{validationErrors.maxMessagesPerDay}</p>
              )}
            </div>

            {/* Message Categories */}
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>
                Message Categories
              </p>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                Disable categories you don&apos;t want to receive proactive messages about
              </p>
              <div className="space-y-1">
                {categories.map(cat => (
                  <ToggleSwitch
                    key={cat}
                    enabled={settings.categories[cat]}
                    onChange={() => toggleCategory(cat)}
                    label={CATEGORY_LABELS[cat]}
                    description={CATEGORY_DESCRIPTIONS[cat]}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between border-t px-4 py-3" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={save} loading={loading} disabled={!hasUnsavedChanges && !error}>
            Save Settings
          </Button>
          <Button variant="ghost" size="sm" onClick={reset}>
            Reset
          </Button>
        </div>
        {saved && (
          <p className="text-xs" style={{ color: 'var(--color-success)' }}>
            Settings saved.
          </p>
        )}
      </div>
    </div>
  )
}
