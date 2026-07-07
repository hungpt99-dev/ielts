import type { TutorTone, ReminderFrequency } from '../aiTutor/hooks/useProactiveSettings'

const STORAGE_KEY = 'ielts-proactive-tutor-settings-v4'

const STORAGE_VERSION = 1

export type StudyReminderToggle =
  | 'dailyStudyReminder'
  | 'vocabularyReminder'
  | 'mistakeReminder'
  | 'progressReviewReminder'
  | 'motivationalMessage'
  | 'extensionProactiveMessage'

export interface ProactiveTutorSettings {
  enabled: boolean
  tone: TutorTone
  preferredLanguage: string
  reminderFrequency: ReminderFrequency
  maxMessagesPerDay: number
  quietHoursStart: string
  quietHoursEnd: string
  preferredStudyTime: string
  dailyStudyReminder: boolean
  vocabularyReminder: boolean
  mistakeReminder: boolean
  progressReviewReminder: boolean
  motivationalMessage: boolean
  extensionProactiveMessage: boolean
  lastResetDate: string | null
  currentDayMessageCount: number
  updatedAt: string
}

export const DEFAULT_PROACTIVE_TUTOR_SETTINGS: ProactiveTutorSettings = {
  enabled: false,
  tone: 'friendly',
  preferredLanguage: 'en',
  reminderFrequency: 'smart',
  maxMessagesPerDay: 3,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
  preferredStudyTime: '09:00',
  dailyStudyReminder: true,
  vocabularyReminder: true,
  mistakeReminder: true,
  progressReviewReminder: true,
  motivationalMessage: true,
  extensionProactiveMessage: true,
  lastResetDate: null,
  currentDayMessageCount: 0,
  updatedAt: new Date().toISOString(),
}

export type ProactiveTutorSettingsListener = (settings: ProactiveTutorSettings) => void

type StorageSchemaVersion = 1

interface StorageEnvelope {
  version: StorageSchemaVersion
  data: Record<string, unknown>
}

function getCurrentDateString(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function resetDailyCountIfNeeded(settings: ProactiveTutorSettings): ProactiveTutorSettings {
  const today = getCurrentDateString()
  if (settings.lastResetDate !== today) {
    return {
      ...settings,
      lastResetDate: today,
      currentDayMessageCount: 0,
    }
  }
  return settings
}

export class ProactiveTutorSettingsRepository {
  private listeners: Set<ProactiveTutorSettingsListener> = new Set()

  get(): ProactiveTutorSettings {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return { ...DEFAULT_PROACTIVE_TUTOR_SETTINGS }

      const envelope = JSON.parse(raw) as StorageEnvelope
      if (!envelope || typeof envelope !== 'object' || envelope.version !== STORAGE_VERSION) {
        return { ...DEFAULT_PROACTIVE_TUTOR_SETTINGS }
      }

      const parsed = envelope.data as Partial<ProactiveTutorSettings>
      const settings: ProactiveTutorSettings = {
        ...DEFAULT_PROACTIVE_TUTOR_SETTINGS,
        ...parsed,
      }

      return resetDailyCountIfNeeded(settings)
    } catch {
      return { ...DEFAULT_PROACTIVE_TUTOR_SETTINGS }
    }
  }

  set(settings: ProactiveTutorSettings): void {
    try {
      const resolved = resetDailyCountIfNeeded(settings)
      const toStore: ProactiveTutorSettings = {
        ...resolved,
        updatedAt: new Date().toISOString(),
      }
      const envelope: StorageEnvelope = {
        version: STORAGE_VERSION,
        data: toStore as unknown as Record<string, unknown>,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope))
      this.notify(toStore)
    } catch {
      /* storage full or unavailable */
    }
  }

  patch(changes: Partial<ProactiveTutorSettings>): ProactiveTutorSettings {
    const current = this.get()
    const updated = resetDailyCountIfNeeded({
      ...current,
      ...changes,
      updatedAt: new Date().toISOString(),
    })
    this.set(updated)
    return updated
  }

  reset(): ProactiveTutorSettings {
    const defaults = {
      ...DEFAULT_PROACTIVE_TUTOR_SETTINGS,
      updatedAt: new Date().toISOString(),
    }
    const envelope: StorageEnvelope = {
      version: STORAGE_VERSION,
      data: defaults as unknown as Record<string, unknown>,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope))
    this.notify(defaults)
    return defaults
  }

  isEnabled(): boolean {
    return this.get().enabled
  }

  incrementDailyCount(): number {
    const current = this.get()
    const updated = resetDailyCountIfNeeded(current)
    const newCount = updated.currentDayMessageCount + 1
    this.set({ ...updated, currentDayMessageCount: newCount })
    return newCount
  }

  getDailyRemaining(): number {
    const current = this.get()
    const updated = resetDailyCountIfNeeded(current)
    return Math.max(0, updated.maxMessagesPerDay - updated.currentDayMessageCount)
  }

  isInQuietHours(): boolean {
    const { quietHoursStart, quietHoursEnd } = this.get()
    const now = new Date()
    const currentMinutes = now.getHours() * 60 + now.getMinutes()

    const [startH, startM] = quietHoursStart.split(':').map(Number)
    const [endH, endM] = quietHoursEnd.split(':').map(Number)

    if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) return false

    const startMinutes = startH * 60 + startM
    const endMinutes = endH * 60 + endM

    if (startMinutes <= endMinutes) {
      return currentMinutes >= startMinutes && currentMinutes < endMinutes
    }
    return currentMinutes >= startMinutes || currentMinutes < endMinutes
  }

  isCategoryEnabled(category: StudyReminderToggle): boolean {
    return this.get()[category]
  }

  subscribe(listener: ProactiveTutorSettingsListener): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  unsubscribe(listener: ProactiveTutorSettingsListener): void {
    this.listeners.delete(listener)
  }

  private notify(settings: ProactiveTutorSettings): void {
    for (const listener of this.listeners) {
      try {
        listener(settings)
      } catch {
        /* listener error */
      }
    }
  }

  validate(settings: Partial<ProactiveTutorSettings>): Record<string, string> {
    const errors: Record<string, string> = {}

    if (settings.maxMessagesPerDay !== undefined) {
      if (settings.maxMessagesPerDay < 1 || settings.maxMessagesPerDay > 50) {
        errors.maxMessagesPerDay = 'Must be between 1 and 50'
      }
    }

    if (settings.quietHoursStart !== undefined && !/^\d{2}:\d{2}$/.test(settings.quietHoursStart)) {
      errors.quietHoursStart = 'Must be in HH:mm format'
    }

    if (settings.quietHoursEnd !== undefined && !/^\d{2}:\d{2}$/.test(settings.quietHoursEnd)) {
      errors.quietHoursEnd = 'Must be in HH:mm format'
    }

    if (settings.preferredStudyTime !== undefined && !/^\d{2}:\d{2}$/.test(settings.preferredStudyTime)) {
      errors.preferredStudyTime = 'Must be in HH:mm format'
    }

    if (settings.preferredLanguage !== undefined && settings.preferredLanguage.length < 2) {
      errors.preferredLanguage = 'Language code must be at least 2 characters'
    }

    return errors
  }
}

export const proactiveTutorSettingsRepository = new ProactiveTutorSettingsRepository()
