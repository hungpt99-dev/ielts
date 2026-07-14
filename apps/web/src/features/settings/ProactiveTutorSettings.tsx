import { useState, useEffect } from 'react'
import ToggleSwitch from '../../components/ui/ToggleSwitch'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Card, { CardContent } from '../../components/ui/Card'
import type { ProactiveMessageSettings } from '@ielts/ai-tutor-engine'
import { STORAGE_KEYS } from '@ielts/config'
const SETTINGS_KEY = STORAGE_KEYS.localStorage.proactiveSettings

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
  } catch (error) {
 console.error('apps/web/src/features/settings/ProactiveTutorSettings.tsx error:', error);
 return { ...DEFAULT_SETTINGS } }
}

function saveSettings(settings: ProactiveMessageSettings): void {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)) } catch (error) {
console.error('apps/web/src/features/settings/ProactiveTutorSettings.tsx error:', error);
  }
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
    } catch (error) {
      console.error('apps/web/src/features/settings/ProactiveTutorSettings.tsx error:', error);
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
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-6">
          <ToggleSwitch
            label="Enable Proactive Tutor"
            checked={settings.enabled}
            onChange={(v: boolean) => handleChange({ enabled: v })}
          />

          <div className="space-y-3">
            <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Message Categories</p>
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

          <div className="space-y-3">
            <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Limits</p>
            <Input
              type="number"
              label="Max messages per day"
              value={settings.maxMessagesPerDay}
              onChange={(e) => handleChange({ maxMessagesPerDay: parseInt((e.target as HTMLInputElement).value, 10) || 5 })}
            />
            <Input
              type="time"
              label="Quiet hours start"
              value={settings.quietHoursStart}
              onChange={(e) => handleChange({ quietHoursStart: (e.target as HTMLInputElement).value })}
            />
            <Input
              type="time"
              label="Quiet hours end"
              value={settings.quietHoursEnd}
              onChange={(e) => handleChange({ quietHoursEnd: (e.target as HTMLInputElement).value })}
            />
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>Reminders</p>
            <ToggleSwitch label="Exam reminders" checked={settings.examReminders} onChange={(v: boolean) => handleChange({ examReminders: v })} />
            <ToggleSwitch label="Inactivity reminders" checked={settings.inactivityReminders} onChange={(v: boolean) => handleChange({ inactivityReminders: v })} />
            <ToggleSwitch label="Vocabulary reminders" checked={settings.vocabularyReminders} onChange={(v: boolean) => handleChange({ vocabularyReminders: v })} />
            <ToggleSwitch label="Roadmap reminders" checked={settings.roadmapReminders} onChange={(v: boolean) => handleChange({ roadmapReminders: v })} />
            <ToggleSwitch label="Motivation messages" checked={settings.motivationMessages} onChange={(v: boolean) => handleChange({ motivationMessages: v })} />
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
            <Button onClick={handleReset} variant="secondary">
              Reset to Defaults
            </Button>
          </div>

          {saveFeedback === 'success' && <p className="text-sm" style={{ color: 'var(--color-success)' }}>Settings saved.</p>}
          {saveFeedback === 'error' && <p className="text-sm" style={{ color: 'var(--color-danger)' }}>Failed to save settings.</p>}
        </CardContent>
      </Card>
    </div>
  )
}
