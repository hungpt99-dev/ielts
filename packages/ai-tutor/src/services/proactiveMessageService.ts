import type { ProactiveMessage, ProactiveMessageSettings } from '../types'
import { proactiveMessageSettingsSchema } from '../schemas/chat'

const SETTINGS_KEY = 'ielts-proactive-message-settings'
const STORAGE_KEY = 'ielts-proactive-messages'
const MAX_STORED_MESSAGES = 100

const DEFAULT_SETTINGS: ProactiveMessageSettings = {
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
    'reading-practice': true,
    'listening-practice': true,
    'exam-countdown': true,
    'motivation': true,
    'saved-content': true,
    'daily-tip': true,
    'progress-report': true,
    'suggestion': true,
  },
}

function safeJsonParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function safeJsonSet<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage full or unavailable */
  }
}

function isInQuietHours(settings: ProactiveMessageSettings): boolean {
  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const startParts = settings.quietHoursStart.split(':').map(Number)
  const endParts = settings.quietHoursEnd.split(':').map(Number)
  const startMinutes = startParts[0] * 60 + startParts[1]
  const endMinutes = endParts[0] * 60 + endParts[1]
  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes
  }
  return currentMinutes >= startMinutes || currentMinutes <= endMinutes
}

export const ProactiveMessageService = {
  loadSettings(): ProactiveMessageSettings {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return { ...DEFAULT_SETTINGS }
    const parsed = safeJsonParse<Partial<ProactiveMessageSettings>>(raw, {})
    const result = proactiveMessageSettingsSchema.safeParse({ ...DEFAULT_SETTINGS, ...parsed })
    if (result.success) return result.data
    return { ...DEFAULT_SETTINGS }
  },

  saveSettings(settings: ProactiveMessageSettings): void {
    safeJsonSet(SETTINGS_KEY, settings)
  },

  loadMessages(): ProactiveMessage[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return []
      const parsed = safeJsonParse<unknown>(raw, null)
      if (!Array.isArray(parsed)) return []
      return parsed as ProactiveMessage[]
    } catch {
      return []
    }
  },

  saveMessages(messages: ProactiveMessage[]): void {
    safeJsonSet(STORAGE_KEY, messages.slice(-MAX_STORED_MESSAGES))
  },

  clearMessages(): void {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch { /* noop */ }
  },

  canSendNow(settings: ProactiveMessageSettings): boolean {
    if (!settings.enabled) return false
    return !isInQuietHours(settings)
  },

  getMessagesForToday(messages: ProactiveMessage[]): number {
    const today = new Date().toDateString()
    return messages.filter(m => new Date(m.createdAt).toDateString() === today).length
  },

  getDefaultSettings(): ProactiveMessageSettings {
    return { ...DEFAULT_SETTINGS }
  },
}
