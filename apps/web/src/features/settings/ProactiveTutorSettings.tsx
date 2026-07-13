import { useState, useEffect } from 'react'
import ToggleSwitch from '../../components/ui/ToggleSwitch'
import Button from '../../components/ui/Button'
import Select from '../../components/ui/Select'
import Input from '../../components/ui/Input'
import type { ProactiveMessageSettings } from '@ielts/ai-tutor-engine'
import type { TutorTone, ReminderFrequency } from '../aiTutor/hooks/useProactiveSettings'

const SETTINGS_KEY = 'ielts-proactive-settings'

const DEFAULT_SETTINGS: ProactiveMessageSettings = {
  enabled: true,
  browserNotifications: false,
  extensionNotifications: false,
  aiEnhanced: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
  maxMessagesPerDay: 5,
  minIntervalMinutes: 60,
  categories: {
    'vocabulary-review': true,
    'mistake-review': true,
    'study-plan': true,
    'speaking-practice': true,
    'writing-practice': true,
    'reading-practice': true,
    'listening-practice': true,
    'exam-countdown': true,
    'motivation': true,
    'saved-content': true,
    'daily-tip': true,
    'progress-report': true,
  },
  examReminders: true,
  inactivityReminders: true,
  vocabularyReminders: true,
  roadmapReminders: true,
  motivationMessages: true,
  preferredTone: 'friendly',
  preferredMessageLength: 'medium',
}

const CATEGORY_LABELS: Record<string, string> = {
  'vocabulary-review': 'Vocabulary Review Reminder',
  'mistake-review': 'Mistake Review Reminder',
  'study-plan': 'Daily Study Plan Reminder',
  'speaking-practice': 'Speaking Practice Suggestion',
  'writing-practice': 'Writing Practice Suggestion',
  'reading-practice': 'Reading Practice Suggestion',
  'listening-practice': 'Listening Practice Suggestion',
  'exam-countdown': 'Exam Countdown Reminder',
  'motivation': 'Encouragement and Streak Updates',
  'saved-content': 'Saved Content Reminder',
  'daily-tip': 'Daily IELTS Tip',
  'progress-report': 'Progress Report',
}

function loadSettings(): ProactiveMessageSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_SETTINGS }
  } catch { return { ...DEFAULT_SETTINGS } }
}

function saveSettings(settings: ProactiveMessageSettings): void {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)) } catch {}
}

const CATEGORY_KEYS = Object.keys(CATEGORY_LABELS)

export default function ProactiveTutorSettings() {
  const [settings, setSettings] = useState<ProactiveMessageSettings>(loadSettings)
  const [saving, setSaving] = useState(false)
  const [saveFeedback, setSaveFeedback] = useState<'success' | 'error' | null>(null)

  useEffect(() => {
    setSettings(loadSettings())
  }, [])

  function handleChange(patch: Partial<ProactiveMessageSettings>) {
    setSettings(prev => ({ ...prev, ...patch }))
  }

  function handleSave() {
    setSaving(true)
    setSaveFeedback(null)
    try {
      saveSettings(settings)
      setSaveFeedback('success')
    } catch {
      setSaveFeedback('error')
    } finally {
      setSaving(false)
      setTimeout(() => setSaveFeedback(null), 2500)
    }
  }

  function handleReset() {
    const defaults = { ...DEFAULT_SETTINGS }
    setSettings(defaults)
    saveSettings(defaults)
    setSaveFeedback('success')
    setTimeout(() => setSaveFeedback(null), 2500)
  }

  return (
    <div className="proactive-tutor-settings">
      <h2>Proactive Tutor Settings</h2>

      <div className="settings-section">
        <ToggleSwitch
          label="Enable Proactive Tutor"
          checked={settings.enabled}
          onChange={(v: boolean) => handleChange({ enabled: v })}
        />
      </div>

      <div className="settings-section">
        <h3>Message Categories</h3>
        {CATEGORY_KEYS.map(cat => (
          <ToggleSwitch
            key={cat}
            label={CATEGORY_LABELS[cat] ?? cat}
            checked={settings.categories[cat] ?? true}
            onChange={(v: boolean) => handleChange({
              categories: { ...settings.categories, [cat]: v },
            })}
          />
        ))}
      </div>

      <div className="settings-section">
        <h3>Limits</h3>
        <Input
          type="number"
          label="Max messages per day"
          value={settings.maxMessagesPerDay}
          onChange={(v: string) => handleChange({ maxMessagesPerDay: parseInt(v, 10) || 5 })}
        />
        <Input
          type="time"
          label="Quiet hours start"
          value={settings.quietHoursStart}
          onChange={(v: string) => handleChange({ quietHoursStart: v })}
        />
        <Input
          type="time"
          label="Quiet hours end"
          value={settings.quietHoursEnd}
          onChange={(v: string) => handleChange({ quietHoursEnd: v })}
        />
      </div>

      <div className="settings-section">
        <h3>Reminders</h3>
        <ToggleSwitch
          label="Exam reminders"
          checked={settings.examReminders}
          onChange={(v: boolean) => handleChange({ examReminders: v })}
        />
        <ToggleSwitch
          label="Inactivity reminders"
          checked={settings.inactivityReminders}
          onChange={(v: boolean) => handleChange({ inactivityReminders: v })}
        />
        <ToggleSwitch
          label="Vocabulary reminders"
          checked={settings.vocabularyReminders}
          onChange={(v: boolean) => handleChange({ vocabularyReminders: v })}
        />
        <ToggleSwitch
          label="Roadmap reminders"
          checked={settings.roadmapReminders}
          onChange={(v: boolean) => handleChange({ roadmapReminders: v })}
        />
        <ToggleSwitch
          label="Motivation messages"
          checked={settings.motivationMessages}
          onChange={(v: boolean) => handleChange({ motivationMessages: v })}
        />
      </div>

      <div className="settings-actions">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
        <Button onClick={handleReset} variant="secondary">
          Reset to Defaults
        </Button>
      </div>

      {saveFeedback === 'success' && <p className="feedback-success">Settings saved.</p>}
      {saveFeedback === 'error' && <p className="feedback-error">Failed to save settings.</p>}
    </div>
  )
}
