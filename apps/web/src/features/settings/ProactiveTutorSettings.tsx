import { useState, useEffect } from 'react'
import ToggleSwitch from '../../components/ui/ToggleSwitch'
import Button from '../../components/ui/Button'
import Select from '../../components/ui/Select'
import Input from '../../components/ui/Input'
import { proactiveTutorSettingsRepository } from '../proactiveTutor/ProactiveTutorSettingsRepository'
import type { ProactiveTutorSettings } from '../proactiveTutor/ProactiveTutorSettingsRepository'
import type { TutorTone, ReminderFrequency } from '../aiTutor/hooks/useProactiveSettings'
import { proactiveMessageEngine } from '../../services/ProactiveMessageEngine'

const TONE_OPTIONS: { value: TutorTone; label: string }[] = [
  { value: 'friendly', label: 'Friendly' },
  { value: 'strict', label: 'Strict' },
  { value: 'motivational', label: 'Motivational' },
  { value: 'simple', label: 'Simple' },
  { value: 'vietnamese', label: 'Vietnamese (Tiếng Việt)' },
]

const FREQUENCY_OPTIONS: { value: ReminderFrequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'every-other-day', label: 'Every Other Day' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'smart', label: 'Smart (Adaptive)' },
]

const CATEGORY_LABELS: Record<string, string> = {
  dailyStudyReminder: 'Daily Study Reminder',
  vocabularyReminder: 'Vocabulary Reminder',
  mistakeReminder: 'Mistake Reminder',
  progressReviewReminder: 'Progress Review Reminder',
  motivationalMessage: 'Motivational Message',
  extensionProactiveMessage: 'Extension Proactive Message',
}

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  dailyStudyReminder: 'Reminders for daily study sessions',
  vocabularyReminder: 'Alerts for due vocabulary reviews',
  mistakeReminder: 'Insights about repeated mistakes',
  progressReviewReminder: 'Weekly and monthly progress summaries',
  motivationalMessage: 'Encouragement and streak updates',
  extensionProactiveMessage: 'Proactive messages in the browser extension',
}

const CATEGORY_KEYS = [
  'dailyStudyReminder',
  'vocabularyReminder',
  'mistakeReminder',
  'progressReviewReminder',
  'motivationalMessage',
  'extensionProactiveMessage',
] as const

export default function ProactiveTutorSettings() {
  const [settings, setSettings] = useState<ProactiveTutorSettings>(() => proactiveTutorSettingsRepository.get())
  const [saving, setSaving] = useState(false)
  const [saveFeedback, setSaveFeedback] = useState<'success' | 'error' | null>(null)

  useEffect(() => {
    setSettings(proactiveTutorSettingsRepository.get())
  }, [])

  function handleChange(patch: Partial<ProactiveTutorSettings>) {
    setSettings(prev => ({ ...prev, ...patch }))
  }

  function handleSave() {
    setSaving(true)
    setSaveFeedback(null)
    try {
      proactiveTutorSettingsRepository.patch(settings)
      proactiveMessageEngine.updateSettings({
        enabled: settings.enabled,
        maxMessagesPerDay: settings.maxMessagesPerDay,
        quietHoursStart: settings.quietHoursStart,
        quietHoursEnd: settings.quietHoursEnd,
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
    const defaults = proactiveTutorSettingsRepository.reset()
    setSettings(defaults)
    proactiveMessageEngine.updateSettings({
      enabled: defaults.enabled,
      maxMessagesPerDay: defaults.maxMessagesPerDay,
      quietHoursStart: defaults.quietHoursStart,
      quietHoursEnd: defaults.quietHoursEnd,
    })
    setSaveFeedback('success')
    setTimeout(() => setSaveFeedback(null), 2500)
  }

  return (
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
          Local-First Notice
        </p>
        <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
          Proactive AI Tutor messages are generated entirely in your browser from local data.
          No data is sent to any external server. Time-based checks run while the app is open
          and when you return to the app. When the browser is fully closed, timers cannot run.
        </p>
      </div>

      <ToggleSwitch
        enabled={settings.enabled}
        onChange={(val) => handleChange({ enabled: val })}
        label="Enable Proactive AI Tutor"
        description="Allow the AI Tutor to send helpful study suggestions based on your learning activity"
      />

      <div
        style={{
          padding: 'var(--spacing-sm) var(--spacing-md)',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--color-surface-alt)',
          border: '1px solid var(--color-border)',
          fontSize: 'var(--text-xs)',
          color: 'var(--color-text-secondary)',
          lineHeight: 1.5,
        }}
      >
        {settings.enabled
          ? 'AI Tutor can now observe your learning journey and send contextual messages at the right time. You can dismiss any message or disable this feature at any time.'
          : 'When enabled, AI Tutor can send helpful study suggestions based on your learning activity. When disabled, AI Tutor will only respond when you ask.'
        }
      </div>

      {settings.enabled && (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 'var(--spacing-md)',
            }}
          >
            <Select
              id="reminder-frequency"
              label="Reminder Frequency"
              value={settings.reminderFrequency}
              onChange={(e) => handleChange({ reminderFrequency: (e.target as HTMLSelectElement).value as ReminderFrequency })}
              options={FREQUENCY_OPTIONS}
            />

            <Input
              id="max-messages"
              type="number"
              label="Max Messages Per Day"
              min={1}
              max={50}
              value={settings.maxMessagesPerDay}
              onChange={(e) => handleChange({ maxMessagesPerDay: Math.max(1, Math.min(50, parseInt((e.target as HTMLInputElement).value) || 1)) })}
              helperText="Between 1 and 50"
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            <p style={{ margin: 0, fontSize: 'var(--text-xs)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-muted)' }}>
              Quiet Hours
            </p>
            <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
              No proactive messages will be shown during this period.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
              <div style={{ flex: 1 }}>
                <label
                  htmlFor="quiet-start"
                  style={{
                    display: 'block',
                    marginBottom: 'var(--spacing-2xs)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 500,
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  Start
                </label>
                <input
                  id="quiet-start"
                  type="time"
                  value={settings.quietHoursStart}
                  onChange={(e) => handleChange({ quietHoursStart: e.target.value })}
                  style={{
                    width: '100%',
                    padding: 'var(--spacing-sm) var(--spacing-md)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-text)',
                    fontSize: 'var(--text-sm)',
                    fontFamily: 'var(--font-sans)',
                  }}
                />
              </div>
              <span style={{ marginTop: 'var(--spacing-lg)', fontSize: 'var(--text-xs)', color: 'var(--color-muted)' }}>to</span>
              <div style={{ flex: 1 }}>
                <label
                  htmlFor="quiet-end"
                  style={{
                    display: 'block',
                    marginBottom: 'var(--spacing-2xs)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 500,
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  End
                </label>
                <input
                  id="quiet-end"
                  type="time"
                  value={settings.quietHoursEnd}
                  onChange={(e) => handleChange({ quietHoursEnd: e.target.value })}
                  style={{
                    width: '100%',
                    padding: 'var(--spacing-sm) var(--spacing-md)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-text)',
                    fontSize: 'var(--text-sm)',
                    fontFamily: 'var(--font-sans)',
                  }}
                />
              </div>
            </div>
          </div>

          <Select
            id="tutor-tone"
            label="Tutor Tone"
            value={settings.tone}
            onChange={(e) => handleChange({ tone: (e.target as HTMLSelectElement).value as TutorTone })}
            options={TONE_OPTIONS}
          />

          <Input
            id="preferred-language"
            type="text"
            label="Preferred Language"
            value={settings.preferredLanguage}
            onChange={(e) => handleChange({ preferredLanguage: (e.target as HTMLInputElement).value })}
            placeholder="en"
            helperText="Language code for tutor messages (e.g., en, vi, zh)"
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
            <p style={{ margin: 0, fontSize: 'var(--text-xs)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--color-muted)' }}>
              Reminder Categories
            </p>
            <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
              Disable categories you don't want to receive proactive messages about.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-2xs)' }}>
              {CATEGORY_KEYS.map((key) => (
                <ToggleSwitch
                  key={key}
                  enabled={settings[key]}
                  onChange={(val) => handleChange({ [key]: val })}
                  label={CATEGORY_LABELS[key]}
                  description={CATEGORY_DESCRIPTIONS[key]}
                />
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', paddingTop: 'var(--spacing-sm)' }}>
            <Button onClick={handleSave} loading={saving} size="sm">
              {saving ? 'Saving...' : 'Save Proactive Settings'}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleReset}>
              Reset Defaults
            </Button>
            {saveFeedback === 'success' && (
              <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-success)' }}>
                Settings saved.
              </p>
            )}
            {saveFeedback === 'error' && (
              <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--color-danger)' }}>
                Failed to save.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
