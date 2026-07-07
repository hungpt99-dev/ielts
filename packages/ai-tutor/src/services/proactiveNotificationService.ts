import { ProactiveEventBus } from './proactiveEventBus'
import { ProactiveMessageService } from './proactiveMessageService'
import type { ProactiveMessage, ProactiveMessageSettings } from '../types'

const NOTIFICATION_ICON = '/icon.png'

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

function hasReachedDailyLimit(settings: ProactiveMessageSettings): boolean {
  const messages = ProactiveMessageService.loadMessages()
  const today = new Date().toDateString()
  const todayCount = messages.filter(
    m => new Date(m.createdAt).toDateString() === today,
  ).length
  return todayCount >= settings.maxMessagesPerDay
}

class ProactiveNotificationService {
  private unsubNewMessage: (() => void) | null = null
  private unsubSettingsChanged: (() => void) | null = null
  private settings: ProactiveMessageSettings = ProactiveMessageService.loadSettings()
  private notificationPermission: NotificationPermission | 'unsupported' = this.detectPermission()
  private initialized = false

  private detectPermission(): NotificationPermission | 'unsupported' {
    if (typeof Notification === 'undefined') return 'unsupported'
    return Notification.permission
  }

  async initialize(): Promise<void> {
    if (this.initialized) return
    this.initialized = true

    this.settings = ProactiveMessageService.loadSettings()
    this.notificationPermission = this.detectPermission()

    this.unsubNewMessage = ProactiveEventBus.onNewMessage((msg) => {
      this.handleNewMessage(msg)
    })

    this.unsubSettingsChanged = ProactiveEventBus.onSettingsChanged((s) => {
      this.settings = s
    })
  }

  private async handleNewMessage(msg: ProactiveMessage): Promise<void> {
    if (!this.settings.enabled) return
    if (!this.settings.browserNotifications) return
    if (isInQuietHours(this.settings)) return
    if (hasReachedDailyLimit(this.settings)) return

    const permitted = await this.ensurePermission()
    if (!permitted) return

    this.showNotification(msg)
  }

  private async ensurePermission(): Promise<boolean> {
    if (this.notificationPermission === 'granted') return true
    if (this.notificationPermission === 'denied') return false
    if (this.notificationPermission === 'unsupported') return false

    try {
      const result = await Notification.requestPermission()
      this.notificationPermission = result
      return result === 'granted'
    } catch {
      return false
    }
  }

  showNotification(msg: ProactiveMessage): void {
    try {
      const notif = new Notification(msg.title, {
        body: msg.message,
        icon: NOTIFICATION_ICON,
        tag: `ielts-proactive-${msg.id}`,
        requireInteraction: true,
      })

      notif.addEventListener('click', () => {
        window.focus()
        notif.close()
        ProactiveEventBus.emitMessageRead(msg.id)
      })
    } catch (e) {
      console.error('Failed to show proactive notification:', e)
    }
  }

  async requestPermission(): Promise<boolean> {
    if (typeof Notification === 'undefined') return false
    if (Notification.permission === 'granted') {
      this.notificationPermission = 'granted'
      return true
    }
    if (Notification.permission === 'denied') return false

    try {
      const result = await Notification.requestPermission()
      this.notificationPermission = result
      return result === 'granted'
    } catch {
      return false
    }
  }

  get isSupported(): boolean {
    return typeof Notification !== 'undefined'
  }

  get permission(): NotificationPermission | 'unsupported' {
    return this.notificationPermission
  }

  dispose(): void {
    if (this.unsubNewMessage) {
      this.unsubNewMessage()
      this.unsubNewMessage = null
    }
    if (this.unsubSettingsChanged) {
      this.unsubSettingsChanged()
      this.unsubSettingsChanged = null
    }
    this.initialized = false
  }
}

export const proactiveNotificationService = new ProactiveNotificationService()
