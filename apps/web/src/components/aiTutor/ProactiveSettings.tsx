import { useState, useEffect } from 'react'
import { proactiveMessageEngine } from '../../services/ProactiveMessageEngine'
import type { ProactiveMessageSettings, ProactiveMessageCategory } from '../../services/ProactiveMessageEngine'
import ToggleSwitch from '../ui/ToggleSwitch'
import Button from '../ui/Button'

const CATEGORY_LABELS: Record<ProactiveMessageCategory, string> = {
  'vocabulary-review': 'Vocabulary Review',
  'mistake-review': 'Mistake Review',
  'study-plan': 'Study Plan',
  'speaking-practice': 'Speaking Practice',
  'writing-practice': 'Writing Practice',
  'exam-countdown': 'Exam Countdown',
  'motivation': 'Motivation',
  'saved-content': 'Saved Content Suggestions',
}

const CATEGORY_DESCRIPTIONS: Record<ProactiveMessageCategory, string> = {
  'vocabulary-review': 'Reminders for due vocabulary reviews',
  'mistake-review': 'Alerts about repeated mistakes and drills',
  'study-plan': 'Daily plan suggestions and missed task reminders',
  'speaking-practice': 'Speaking practice prompts',
  'writing-practice': 'Writing task suggestions',
  'exam-countdown': 'Exam date countdown notices',
  'motivation': 'Encouragement and streak updates',
  'saved-content': 'Suggestions for saved articles and transcripts',
}

interface ProactiveSettingsProps {
  onClose?: () => void
}

export default function ProactiveSettings({ onClose }: ProactiveSettingsProps) {
  const [settings, setSettings] = useState<ProactiveMessageSettings>(proactiveMessageEngine.getSettings())
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setSettings(proactiveMessageEngine.getSettings())
  }, [])

  function handleChange(patch: Partial<ProactiveMessageSettings>) {
    const updated = { ...settings, ...patch }
    setSettings(updated)
  }

  function handleSave() {
    proactiveMessageEngine.updateSettings(settings)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function handleReset() {
    const { DEFAULT_PROACTIVE_MESSAGE_SETTINGS } = { DEFAULT_PROACTIVE_MESSAGE_SETTINGS: {
      enabled: true,
      browserNotifications: false,
      aiEnhanced: false,
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00',
      reminderTime: '09:00',
      maxMessagesPerDay: 5,
      categories: {
        'vocabulary-review': true,
        'mistake-review': true,
        'study-plan': true,
        'speaking-practice': true,
        'writing-practice': true,
        'exam-countdown': true,
        'motivation': true,
        'saved-content': true,
      },
    }}
    setSettings({ ...DEFAULT_PROACTIVE_MESSAGE_SETTINGS })
    proactiveMessageEngine.updateSettings(DEFAULT_PROACTIVE_MESSAGE_SETTINGS)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function toggleCategory(category: ProactiveMessageCategory) {
    setSettings(prev => ({
      ...prev,
      categories: { ...prev.categories, [category]: !prev.categories[category] },
    }))
  }

  const categories = Object.keys(settings.categories) as ProactiveMessageCategory[]

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
        <div className="rounded-lg border px-4 py-3 text-xs leading-relaxed" style={{
          borderColor: 'var(--color-info)',
          backgroundColor: 'var(--color-info-light)',
          color: 'var(--color-text-secondary)',
        }}>
          <p className="font-medium" style={{ color: 'var(--color-text)' }}>Local-First Notice</p>
          <p className="mt-1">
            Proactive messages are generated entirely in your browser from local data.
            Without a backend push service, messages cannot be delivered when the website
            and extension are both closed. No data is sent to any external server unless
            AI-enhanced mode is explicitly enabled with your own API key.
          </p>
        </div>

        <ToggleSwitch
          enabled={settings.enabled}
          onChange={(v) => handleChange({ enabled: v })}
          label="Enable Proactive Tutor Messages"
          description="Allow the AI Tutor to send helpful suggestions based on your learning activity"
        />

        {settings.enabled && (
          <>
            <ToggleSwitch
              enabled={settings.browserNotifications}
              onChange={(v) => handleChange({ browserNotifications: v })}
              label="Browser Notifications"
              description="Show desktop notifications when new tutor messages arrive"
            />

            <ToggleSwitch
              enabled={settings.aiEnhanced}
              onChange={(v) => handleChange({ aiEnhanced: v })}
              label="AI-Enhanced Proactive Messages"
              description="Use AI to generate smarter coaching messages (requires API key)"
            />

            {settings.aiEnhanced && (
              <div className="rounded-lg border px-4 py-3 text-xs leading-relaxed" style={{
                borderColor: 'var(--color-warning)',
                backgroundColor: 'var(--color-warning-light)',
                color: 'var(--color-text-secondary)',
              }}>
                <p className="font-medium" style={{ color: 'var(--color-text)' }}>Privacy Notice</p>
                <p className="mt-1">
                  AI-enhanced mode sends a compact summary of your learning context to
                  the configured AI provider. Your API key is stored locally and never
                  shared with us. You can disable this at any time.
                </p>
              </div>
            )}

            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>
                Quiet Hours
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
                    onChange={(e) => handleChange({ quietHoursStart: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    style={{
                      backgroundColor: 'var(--color-surface)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text)',
                    }}
                  />
                </div>
                <span className="mt-5 text-xs" style={{ color: 'var(--color-muted)' }}>to</span>
                <div className="flex-1">
                  <label className="mb-1 block text-xs" style={{ color: 'var(--color-text-secondary)' }} htmlFor="quiet-end">
                    End
                  </label>
                  <input
                    id="quiet-end"
                    type="time"
                    value={settings.quietHoursEnd}
                    onChange={(e) => handleChange({ quietHoursEnd: e.target.value })}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    style={{
                      backgroundColor: 'var(--color-surface)',
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text)',
                    }}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }} htmlFor="reminder-time">
                Reminder Time
              </label>
              <input
                id="reminder-time"
                type="time"
                value={settings.reminderTime}
                onChange={(e) => handleChange({ reminderTime: e.target.value })}
                className="w-full rounded-lg border px-3 py-2 text-sm"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text)',
                }}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }} htmlFor="max-messages">
                Max Messages Per Day
              </label>
              <input
                id="max-messages"
                type="number"
                min={1}
                max={20}
                value={settings.maxMessagesPerDay}
                onChange={(e) => handleChange({ maxMessagesPerDay: Math.max(1, Math.min(20, parseInt(e.target.value) || 1)) })}
                className="w-24 rounded-lg border px-3 py-2 text-sm"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text)',
                }}
              />
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--color-muted)' }}>
                Message Categories
              </p>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                Disable categories you don't want to receive proactive messages about.
              </p>
              <div className="space-y-1">
                {categories.map((cat) => (
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

      <div className="flex items-center justify-between border-t px-4 py-3" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleSave}>
            Save Settings
          </Button>
          <Button variant="ghost" size="sm" onClick={handleReset}>
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
