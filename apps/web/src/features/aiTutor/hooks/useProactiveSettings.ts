import { useState, useCallback, useEffect } from 'react'
import type { ProactiveMessageSettings as EngineProactiveMessageSettings } from '@ielts/ai-tutor-engine'

export type TutorTone = 'friendly' | 'strict' | 'motivational' | 'simple' | 'vietnamese'
export type NotificationChannel = 'in-app' | 'browser' | 'extension'
export type AutomationLevel = 'manual' | 'semi-automatic' | 'automatic'
export type ReminderFrequency = 'daily' | 'every-other-day' | 'weekly' | 'smart'

export type ProactiveMessageCategory = NonNullable<keyof EngineProactiveMessageSettings['categories']>

export interface ProactiveMessageSettings extends EngineProactiveMessageSettings {
  tone: TutorTone
  preferredStudyTime: string
  dailyReminderTime: string
  reminderFrequency: ReminderFrequency
  weakSkillPriority: string[]
  notificationChannels: NotificationChannel[]
  automationLevel: AutomationLevel
  autoSuggestExercises: boolean
  autoWeeklyReview: boolean
  lastRemindedAt?: string
  updatedAt: string
}

export const SETTINGS_KEY = 'ielts-proactive-settings-v3'

export const CATEGORY_LABELS: Record<ProactiveMessageCategory, string> = {
  'vocabulary-review': 'Vocabulary Review',
  'mistake-review': 'Mistake Review',
  'study-plan': 'Study Plan',
  'speaking-practice': 'Speaking Practice',
  'writing-practice': 'Writing Practice',
  'reading-practice': 'Reading Practice',
  'listening-practice': 'Listening Practice',
  'exam-countdown': 'Exam Countdown',
  'motivation': 'Motivation',
  'saved-content': 'Saved Content',
  'daily-tip': 'Daily IELTS Tip',
  'progress-report': 'Progress Report',
  'suggestion': 'Suggestion',
}

export const CATEGORY_DESCRIPTIONS: Record<ProactiveMessageCategory, string> = {
  'vocabulary-review': 'Reminders for due vocabulary reviews',
  'mistake-review': 'Alerts about repeated mistakes and drills',
  'study-plan': 'Daily plan suggestions and missed task reminders',
  'speaking-practice': 'Speaking practice prompts',
  'writing-practice': 'Writing task suggestions',
  'reading-practice': 'Reading practice suggestions',
  'listening-practice': 'Listening practice suggestions',
  'exam-countdown': 'Exam date countdown notices',
  'motivation': 'Encouragement and streak updates',
  'saved-content': 'Suggestions for saved articles and transcripts',
  'daily-tip': 'Small daily IELTS learning tips',
  'progress-report': 'Weekly and monthly progress reviews',
  'suggestion': 'General learning suggestions',
}

export const DEFAULT_PROACTIVE_SETTINGS: ProactiveMessageSettings = {
  enabled: true,
  tone: 'friendly',
  preferredStudyTime: '09:00',
  dailyReminderTime: '09:00',
  reminderFrequency: 'smart',
  weakSkillPriority: [],
  notificationChannels: ['in-app'],
  automationLevel: 'semi-automatic',
  autoSuggestExercises: true,
  autoWeeklyReview: true,
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
    'suggestion': true,
  },
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
  maxMessagesPerDay: 5,
  updatedAt: new Date().toISOString(),
}

export function loadProactiveSettings(): ProactiveMessageSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return { ...DEFAULT_PROACTIVE_SETTINGS }
    const parsed = JSON.parse(raw) as Partial<ProactiveMessageSettings>
    return {
      ...DEFAULT_PROACTIVE_SETTINGS,
      ...parsed,
      categories: {
        ...DEFAULT_PROACTIVE_SETTINGS.categories,
        ...(parsed.categories || {}),
      },
      updatedAt: new Date().toISOString(),
    }
  } catch (error) {
    console.error('apps/web/src/features/aiTutor/hooks/useProactiveSettings.ts error:', error);
    return { ...DEFAULT_PROACTIVE_SETTINGS }
  }
}

export function saveProactiveSettings(settings: ProactiveMessageSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch (error) {
    console.error('apps/web/src/features/aiTutor/hooks/useProactiveSettings.ts error:', error);
    /* storage full or unavailable */
  }
}

export function resetProactiveSettings(): ProactiveMessageSettings {
  const defaults = { ...DEFAULT_PROACTIVE_SETTINGS, updatedAt: new Date().toISOString() }
  saveProactiveSettings(defaults)
  return defaults
}

export function validateProactiveSettings(settings: ProactiveMessageSettings): Record<string, string> {
  const errors: Record<string, string> = {}

  if (!settings.preferredStudyTime) {
    errors.preferredStudyTime = 'Preferred study time is required'
  }
  if (!settings.dailyReminderTime) {
    errors.dailyReminderTime = 'Daily reminder time is required'
  }
  if (!settings.quietHoursStart) {
    errors.quietHoursStart = 'Quiet hours start time is required'
  }
  if (!settings.quietHoursEnd) {
    errors.quietHoursEnd = 'Quiet hours end time is required'
  }
  if (settings.maxMessagesPerDay < 1 || settings.maxMessagesPerDay > 50) {
    errors.maxMessagesPerDay = 'Max messages per day must be between 1 and 50'
  }
  if (settings.notificationChannels.length === 0) {
    errors.notificationChannels = 'At least one notification channel must be selected'
  }

  return errors
}

export interface UseProactiveSettingsReturn {
  settings: ProactiveMessageSettings
  loading: boolean
  error: string | null
  validationErrors: Record<string, string>
  update: (patch: Partial<ProactiveMessageSettings>) => void
  save: () => void
  reset: () => void
  hasUnsavedChanges: boolean
  saved: boolean
}

export function useProactiveSettings(): UseProactiveSettingsReturn {
  const [initialSettings, setInitialSettings] = useState<ProactiveMessageSettings>(() => loadProactiveSettings())
  const [settings, setSettings] = useState<ProactiveMessageSettings>(initialSettings)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [saved, setSaved] = useState(false)

  const update = useCallback((patch: Partial<ProactiveMessageSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...patch }
      if (patch.categories) {
        updated.categories = { ...prev.categories, ...patch.categories }
      }
      if (patch.weakSkillPriority) {
        updated.weakSkillPriority = [...patch.weakSkillPriority]
      }
      if (patch.notificationChannels) {
        updated.notificationChannels = [...patch.notificationChannels]
      }
      return updated
    })
    setValidationErrors({})
    setError(null)
  }, [])

  const save = useCallback(() => {
    setLoading(true)
    setError(null)
    setValidationErrors({})

    try {
      const errors = validateProactiveSettings(settings)
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors)
        setLoading(false)
        return
      }

      const toSave = { ...settings, updatedAt: new Date().toISOString() }
      saveProactiveSettings(toSave)
      setInitialSettings(toSave)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      console.error('apps/web/src/features/aiTutor/hooks/useProactiveSettings.ts error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setLoading(false)
    }
  }, [settings])

  const reset = useCallback(() => {
    const defaults = resetProactiveSettings()
    setSettings(defaults)
    setInitialSettings(defaults)
    setValidationErrors({})
    setError(null)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }, [])

  const hasUnsavedChanges = JSON.stringify(settings) !== JSON.stringify(initialSettings)

  return {
    settings,
    loading,
    error,
    validationErrors,
    update,
    save,
    reset,
    hasUnsavedChanges,
    saved,
  }
}
