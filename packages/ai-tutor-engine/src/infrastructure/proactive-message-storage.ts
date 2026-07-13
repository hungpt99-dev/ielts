import type { ProactiveMessage, ProactiveMessageSettings } from '../types'
import type { ProactiveMessageRepositoryPort } from '../ports/proactive-message-repository'

const STORAGE_KEY = 'ielts-proactive-messages'
const SETTINGS_KEY = 'ielts-proactive-message-settings'
const MAX_STORED_MESSAGES = 100

const DEFAULT_SETTINGS: ProactiveMessageSettings = {
  enabled: true,
  browserNotifications: false,
  extensionNotifications: false,
  aiEnhanced: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
  reminderTime: '09:00',
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
    'suggestion': true,
  },
  examReminders: true,
  inactivityReminders: true,
  vocabularyReminders: true,
  roadmapReminders: true,
  motivationMessages: true,
  preferredTone: 'friendly',
  preferredMessageLength: 'medium',
}

function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function safeSet(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* noop */
  }
}

export class LocalStorageProactiveMessageRepository implements ProactiveMessageRepositoryPort {
  loadSettings(): ProactiveMessageSettings {
    const saved = safeGet<Partial<ProactiveMessageSettings>>(SETTINGS_KEY, {})
    return { ...DEFAULT_SETTINGS, ...saved }
  }

  saveSettings(settings: ProactiveMessageSettings): void {
    safeSet(SETTINGS_KEY, settings)
  }

  loadMessages(): ProactiveMessage[] {
    const raw = safeGet<unknown>(STORAGE_KEY, null)
    if (!Array.isArray(raw)) return []
    return raw as ProactiveMessage[]
  }

  saveMessages(msgs: ProactiveMessage[]): void {
    safeSet(STORAGE_KEY, msgs.slice(-MAX_STORED_MESSAGES))
  }

  clearMessages(): void {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* noop */
    }
  }
}

export const proactiveMessageDefaults = {
  DEFAULT_SETTINGS,
  MAX_STORED_MESSAGES,
}

export function isInQuietHours(quietHoursStart: string, quietHoursEnd: string): boolean {
  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()
  const startParts = quietHoursStart.split(':').map(Number)
  const endParts = quietHoursEnd.split(':').map(Number)
  const startMinutes = startParts[0] * 60 + startParts[1]
  const endMinutes = endParts[0] * 60 + endParts[1]
  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes
  }
  return currentMinutes >= startMinutes || currentMinutes <= endMinutes
}

export function canSendNow(enabled: boolean, quietHoursStart: string, quietHoursEnd: string): boolean {
  if (!enabled) return false
  return !isInQuietHours(quietHoursStart, quietHoursEnd)
}

export function getMessagesForToday(messages: ProactiveMessage[]): number {
  const today = new Date().toDateString()
  return messages.filter(m => new Date(m.createdAt).toDateString() === today).length
}
