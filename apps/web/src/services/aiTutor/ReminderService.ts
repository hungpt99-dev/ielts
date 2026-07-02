import { LocalTutorStorage } from '../storage/LocalTutorStorage'
import { loadNotificationPrefs } from '../storage/SettingsStorage'
import type {
  Reminder,
  ReminderType,
} from '../../models/aiTutorModels'

const CHECK_INTERVAL_MS = 60_000
const STORAGE_KEY_INITIALIZED = 'ielts-reminder-defaults-created'
const STORAGE_KEY_TRIGGERED = 'ielts-reminder-triggered-today'

export type ReminderCallback = (reminder: Reminder) => void

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

function getTriggeredToday(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TRIGGERED)
    if (raw) {
      const data = JSON.parse(raw) as Record<string, string[]>
      const key = todayKey()
      return new Set(data[key] ?? [])
    }
  } catch {}
  return new Set()
}

function addTriggeredToday(id: string): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TRIGGERED)
    const data: Record<string, string[]> = raw ? JSON.parse(raw) : {}
    const key = todayKey()
    data[key] = data[key] ?? []
    if (!data[key].includes(id)) {
      data[key].push(id)
    }
    localStorage.setItem(STORAGE_KEY_TRIGGERED, JSON.stringify(data))
  } catch {}
}

function isChromeExtensionAvailable(): boolean {
  try {
    return typeof globalThis !== 'undefined' &&
      (globalThis as Record<string, unknown>).chrome !== undefined
  } catch {
    return false
  }
}

function getChrome(): Record<string, unknown> | null {
  try {
    const c = (globalThis as Record<string, unknown>).chrome
    return c ? (c as Record<string, unknown>) : null
  } catch {
    return null
  }
}

export class ReminderService {
  private initialized = false
  private checkInterval: ReturnType<typeof setInterval> | null = null
  private inAppListeners = new Set<ReminderCallback>()
  private notificationPermission: NotificationPermission | 'unsupported' = 'unsupported'
  private chromeAvailable = false
  private alarmCreated = new Set<string>()


  async initialize(): Promise<void> {
    if (this.initialized) return

    this.chromeAvailable = isChromeExtensionAvailable()
    this.detectNotificationPermission()

    await this.createDefaultRemindersIfNeeded()

    this.checkInterval = setInterval(() => {
      this.checkReminders()
    }, CHECK_INTERVAL_MS)

    await this.checkReminders()

    this.setupChromeAlarms()

    this.initialized = true
  }

  async stop(): Promise<void> {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
    this.removeChromeAlarms()
    this.inAppListeners.clear()
    this.initialized = false
  }


  onReminder(callback: ReminderCallback): () => void {
    this.inAppListeners.add(callback)
    return () => {
      this.inAppListeners.delete(callback)
    }
  }

  private notifyInApp(reminder: Reminder): void {
    for (const listener of this.inAppListeners) {
      try {
        listener(reminder)
      } catch (e) {
        console.error('Reminder in-app listener error:', e)
      }
    }
  }


  private detectNotificationPermission(): void {
    if (typeof Notification === 'undefined') {
      this.notificationPermission = 'unsupported'
      return
    }
    this.notificationPermission = Notification.permission
  }

  async requestNotificationPermission(): Promise<boolean> {
    if (typeof Notification === 'undefined') return false
    if (Notification.permission === 'granted') {
      this.notificationPermission = 'granted'
      return true
    }
    if (Notification.permission === 'denied') return false
    const result = await Notification.requestPermission()
    this.notificationPermission = result
    return result === 'granted'
  }

  private async showBrowserNotification(reminder: Reminder): Promise<void> {
    if (this.notificationPermission !== 'granted') return
    if (typeof Notification === 'undefined') return
    try {
      const notif = new Notification(reminder.title, {
        body: reminder.message,
        icon: '/favicon.ico',
        tag: `ielts-reminder-${reminder.id}`,
        requireInteraction: true,
      })
      notif.addEventListener('click', () => {
        window.focus()
        notif.close()
      })
    } catch (e) {
      console.error('Failed to show notification:', e)
    }
  }


  private setupChromeAlarms(): void {
    if (!this.chromeAvailable) return
    LocalTutorStorage.getEnabledReminders().then(reminders => {
      for (const r of reminders) {
        this.createChromeAlarm(r)
      }
    })
  }

  private createChromeAlarm(reminder: Reminder): void {
    if (!this.chromeAvailable) return
    const chrome = getChrome()
    if (!chrome) return
    const alarms = chrome.alarms as { create(name: string, opts: Record<string, unknown>): void } | undefined
    if (!alarms) return

    const alarmName = `ielts-reminder-${reminder.id}`
    if (this.alarmCreated.has(alarmName)) return

    if (reminder.scheduledDate) {
      const scheduled = new Date(reminder.scheduledDate).getTime()
      const now = Date.now()
      if (scheduled > now) {
        alarms.create(alarmName, { when: scheduled })
        this.alarmCreated.add(alarmName)
      }
      return
    }

    if (reminder.scheduledTime && reminder.repeatDays.length > 0) {
      const [hours, minutes] = reminder.scheduledTime.split(':').map(Number)
      const now = new Date()
      const scheduled = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes)
      if (scheduled.getTime() <= now.getTime()) {
        scheduled.setDate(scheduled.getDate() + 1)
      }
      alarms.create(alarmName, {
        when: scheduled.getTime(),
        periodInMinutes: 24 * 60,
      })
      this.alarmCreated.add(alarmName)
      return
    }

    if (reminder.scheduledTime) {
      const [hours, minutes] = reminder.scheduledTime.split(':').map(Number)
      const now = new Date()
      const scheduled = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes)
      if (scheduled.getTime() <= now.getTime()) {
        scheduled.setDate(scheduled.getDate() + 1)
      }
      alarms.create(alarmName, { when: scheduled.getTime() })
      this.alarmCreated.add(alarmName)
    }
  }

  private removeChromeAlarm(reminder: Reminder): void {
    if (!this.chromeAvailable) return
    const chrome = getChrome()
    if (!chrome) return
    const alarms = chrome.alarms as { clear(name: string): void } | undefined
    if (!alarms) return
    const alarmName = `ielts-reminder-${reminder.id}`
    alarms.clear(alarmName)
    this.alarmCreated.delete(alarmName)
  }

  private removeChromeAlarms(): void {
    if (!this.chromeAvailable) return
    const chrome = getChrome()
    if (!chrome) return
    const alarms = chrome.alarms as { clear(name: string): void } | undefined
    if (!alarms) return
    for (const name of this.alarmCreated) {
      alarms.clear(name)
    }
    this.alarmCreated.clear()
  }


  private async checkReminders(): Promise<void> {
    try {
      const reminders = await LocalTutorStorage.getEnabledReminders()
      const triggeredToday = getTriggeredToday()

      for (const reminder of reminders) {
        if (triggeredToday.has(reminder.id)) continue
        if (!this.isReminderDue(reminder)) continue
        await this.triggerReminder(reminder)
      }
    } catch (e) {
      console.error('Reminder check error:', e)
    }
  }

  private isReminderDue(reminder: Reminder): boolean {
    const now = new Date()

    if (reminder.type === 'exam-countdown' && reminder.scheduledDate) {
      const examDate = new Date(reminder.scheduledDate)
      const diffDays = Math.ceil((examDate.getTime() - now.getTime()) / 86_400_000)
      if (diffDays <= 0) return false
      if (diffDays <= 7) return true
      return diffDays <= 30 && now.getHours() === 9 && now.getMinutes() < 5
    }

    if (reminder.scheduledDate) {
      const scheduled = new Date(reminder.scheduledDate)
      return (
        scheduled.getFullYear() === now.getFullYear() &&
        scheduled.getMonth() === now.getMonth() &&
        scheduled.getDate() === now.getDate()
      )
    }

    if (reminder.scheduledTime && reminder.repeatDays.length > 0) {
      if (!reminder.repeatDays.includes(now.getDay())) return false
      const [hours, minutes] = reminder.scheduledTime.split(':').map(Number)
      const reminderTime = hours * 60 + minutes
      const currentTime = now.getHours() * 60 + now.getMinutes()
      return currentTime >= reminderTime && currentTime < reminderTime + 5
    }

    if (reminder.scheduledTime) {
      const [hours, minutes] = reminder.scheduledTime.split(':').map(Number)
      const reminderTime = hours * 60 + minutes
      const currentTime = now.getHours() * 60 + now.getMinutes()
      return currentTime >= reminderTime && currentTime < reminderTime + 5
    }

    return false
  }

  private async triggerReminder(reminder: Reminder): Promise<void> {
    addTriggeredToday(reminder.id)

    await LocalTutorStorage.updateReminder(reminder.id, {
      isTriggered: true,
      lastTriggeredAt: new Date().toISOString(),
    })

    this.notifyInApp(reminder)

    if (this.chromeAvailable) {
      this.showExtensionNotification(reminder)
    } else {
      this.showBrowserNotification(reminder)
    }
  }

  private showExtensionNotification(reminder: Reminder): void {
    if (!this.chromeAvailable) return
    const chrome = getChrome()
    if (!chrome) return
    const notifications = chrome.notifications as {
      create(id: string, opts: Record<string, unknown>): void
    } | undefined
    if (!notifications) return
    try {
      notifications.create(`ielts-reminder-${reminder.id}`, {
        type: 'basic',
        iconUrl: (chrome.runtime as Record<string, unknown>).getURL ?
          ((chrome.runtime as { getURL: (path: string) => string }).getURL('icon-128.png')) :
          '',
        title: reminder.title,
        message: reminder.message,
        priority: 2,
        requireInteraction: true,
      })
    } catch (e) {
      console.error('Chrome notification error:', e)
    }
  }


  private async createDefaultRemindersIfNeeded(): Promise<void> {
    const created = localStorage.getItem(STORAGE_KEY_INITIALIZED)
    if (created === 'true') return

    const prefs = loadNotificationPrefs()
    const existing = await LocalTutorStorage.getAllReminders()

    const hasType = (type: ReminderType): boolean =>
      existing.some(r => r.type === type)

    const defaults: Array<Omit<Reminder, 'id' | 'createdAt' | 'updatedAt'>> = []

    if (!hasType('daily-study')) {
      defaults.push({
        type: 'daily-study',
        title: 'Time to Study IELTS',
        message: 'Your daily study session is waiting. Let\'s make progress toward your target band!',
        scheduledTime: prefs.reminderTime || '09:00',
        repeatDays: [1, 2, 3, 4, 5, 6, 0],
        isEnabled: prefs.enabled ?? false,
        isTriggered: false,
      })
    }

    if (!hasType('vocabulary-review')) {
      defaults.push({
        type: 'vocabulary-review',
        title: 'Vocabulary Review Time',
        message: 'Review your saved vocabulary words to keep them fresh in your memory.',
        scheduledTime: '19:00',
        repeatDays: [1, 2, 3, 4, 5, 6, 0],
        isEnabled: false,
        isTriggered: false,
      })
    }

    if (!hasType('mistake-review')) {
      defaults.push({
        type: 'mistake-review',
        title: 'Review Your Mistakes',
        message: 'Take a few minutes to review your recent mistakes and avoid repeating them.',
        scheduledTime: '20:00',
        repeatDays: [1, 3, 5],
        isEnabled: false,
        isTriggered: false,
      })
    }

    if (!hasType('writing-draft')) {
      defaults.push({
        type: 'writing-draft',
        title: 'Continue Your Writing Draft',
        message: 'You have a saved writing draft. Review and improve it today.',
        scheduledTime: '18:00',
        repeatDays: [2, 4, 6],
        isEnabled: false,
        isTriggered: false,
      })
    }

    const memory = await LocalTutorStorage.loadMemory()
    if (!hasType('exam-countdown') && memory.examDate) {
      defaults.push({
        type: 'exam-countdown',
        title: 'IELTS Exam Countdown',
        message: 'Your IELTS exam is approaching. Let\'s review what you need to focus on.',
        scheduledDate: memory.examDate,
        scheduledTime: '09:00',
        repeatDays: [],
        isEnabled: true,
        isTriggered: false,
      })
    }

    if (!hasType('missed-task')) {
      defaults.push({
        type: 'missed-task',
        title: 'You Missed a Study Session',
        message: 'You didn\'t study yesterday. A short 10-minute review can help you stay on track.',
        scheduledTime: '10:00',
        repeatDays: [1, 2, 3, 4, 5],
        isEnabled: false,
        isTriggered: false,
      })
    }

    for (const data of defaults) {
      await LocalTutorStorage.addReminder(data)
    }

    localStorage.setItem(STORAGE_KEY_INITIALIZED, 'true')
  }


  async getAll(): Promise<Reminder[]> {
    return LocalTutorStorage.getAllReminders()
  }

  async getEnabled(): Promise<Reminder[]> {
    return LocalTutorStorage.getEnabledReminders()
  }

  async getByType(type: ReminderType): Promise<Reminder[]> {
    return LocalTutorStorage.getRemindersByType(type)
  }

  async add(
    data: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Reminder> {
    const reminder = await LocalTutorStorage.addReminder(data)
    if (reminder.isEnabled && this.chromeAvailable) {
      this.createChromeAlarm(reminder)
    }
    return reminder
  }

  async update(id: string, changes: Partial<Reminder>): Promise<void> {
    await LocalTutorStorage.updateReminder(id, changes)

    if (this.chromeAvailable) {
      const existing = await LocalTutorStorage.getAllReminders()
      const updated = existing.find(r => r.id === id)
      if (updated) {
        this.removeChromeAlarm(updated)
        if (updated.isEnabled) {
          this.createChromeAlarm(updated)
        }
      }
    }
  }

  async remove(id: string): Promise<void> {
    if (this.chromeAvailable) {
      const reminders = await LocalTutorStorage.getAllReminders()
      const target = reminders.find(r => r.id === id)
      if (target) {
        this.removeChromeAlarm(target)
      }
    }
    await LocalTutorStorage.deleteReminder(id)
  }

  async toggle(id: string, enabled: boolean): Promise<void> {
    await LocalTutorStorage.toggleReminder(id, enabled)
    if (this.chromeAvailable) {
      if (enabled) {
        const reminders = await LocalTutorStorage.getAllReminders()
        const reminder = reminders.find(r => r.id === id)
        if (reminder) {
          this.createChromeAlarm(reminder)
        }
      } else {
        this.removeChromeAlarm({ id } as Reminder)
      }
    }
  }


  async checkMissedTasks(): Promise<void> {
    const reminders = await LocalTutorStorage.getRemindersByType('missed-task')
    if (reminders.length === 0) return

    const memory = await LocalTutorStorage.loadMemory()
    const lastStudy = memory.lastStudyDate ? new Date(memory.lastStudyDate) : null
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().slice(0, 10)

    if (!lastStudy || lastStudy.toISOString().slice(0, 10) < yesterdayStr) {
      for (const reminder of reminders) {
        if (!reminder.isEnabled) continue
        const triggeredToday = getTriggeredToday()
        if (triggeredToday.has(reminder.id)) continue
        await this.triggerReminder(reminder)
      }
    }
  }


  async checkExamCountdown(): Promise<void> {
    const memory = await LocalTutorStorage.loadMemory()
    if (!memory.examDate) return

    const examDate = new Date(memory.examDate)
    const now = new Date()
    const diffDays = Math.ceil((examDate.getTime() - now.getTime()) / 86_400_000)

    if (diffDays <= 0) return

    const reminders = await LocalTutorStorage.getRemindersByType('exam-countdown')
    for (const reminder of reminders) {
      if (!reminder.isEnabled) continue
      const triggeredToday = getTriggeredToday()
      if (triggeredToday.has(reminder.id)) continue

      const shouldRemind =
        diffDays <= 7 ||
        (diffDays <= 30 && reminder.scheduledTime
          ? this.isTimeInWindow(reminder.scheduledTime)
          : true)

      if (shouldRemind) {
        const updatedMessage =
          diffDays <= 7
            ? `Only ${diffDays} day${diffDays > 1 ? 's' : ''} until your IELTS exam! Focus on your weak areas.`
            : `${diffDays} days until your IELTS exam. Keep up with your study plan.`
        await LocalTutorStorage.updateReminder(reminder.id, { message: updatedMessage })
        await this.triggerReminder(reminder)
      }
    }
  }

  private isTimeInWindow(scheduledTime: string): boolean {
    const [hours, minutes] = scheduledTime.split(':').map(Number)
    const now = new Date()
    const currentMinutes = now.getHours() * 60 + now.getMinutes()
    const targetMinutes = hours * 60 + minutes
    return currentMinutes >= targetMinutes && currentMinutes < targetMinutes + 5
  }


  resetDefaultsFlag(): void {
    localStorage.removeItem(STORAGE_KEY_INITIALIZED)
  }

  clearTriggeredToday(): void {
    localStorage.removeItem(STORAGE_KEY_TRIGGERED)
  }

  clearAll(): void {
    localStorage.removeItem(STORAGE_KEY_INITIALIZED)
    localStorage.removeItem(STORAGE_KEY_TRIGGERED)
  }
}

export const reminderService = new ReminderService()
export default reminderService
