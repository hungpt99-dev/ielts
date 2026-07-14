import { STORAGE_KEYS } from '@ielts/config'

export interface NotificationPrefs {
  enabled: boolean
  reminderTime: string
}

const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  enabled: false,
  reminderTime: '09:00',
}

export function loadNotificationPrefs(): NotificationPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.localStorage.notificationPrefs)
    return raw ? JSON.parse(raw) : DEFAULT_NOTIFICATION_PREFS
  } catch {
    return DEFAULT_NOTIFICATION_PREFS
  }
}

export function saveNotificationPrefs(prefs: NotificationPrefs): void {
  try {
    localStorage.setItem(STORAGE_KEYS.localStorage.notificationPrefs, JSON.stringify(prefs))
  } catch { /* ignore */ }
}
