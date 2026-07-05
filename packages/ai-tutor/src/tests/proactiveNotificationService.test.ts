import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ProactiveEventBus } from '../services/proactiveEventBus'
import { ProactiveMessageService } from '../services/proactiveMessageService'
import { proactiveNotificationService } from '../services/proactiveNotificationService'
import type { ProactiveMessage, ProactiveMessageSettings } from '../types'

// jsdom does not define Notification — provide a minimal mock so the service
// can detect it and proceed through the notification path in tests.
if (typeof Notification === 'undefined') {
  globalThis.Notification = class {
    static permission: NotificationPermission = 'granted'
    static requestPermission = vi.fn<() => Promise<NotificationPermission>>().mockResolvedValue('granted')
    addEventListener = vi.fn()
    close = vi.fn()
    constructor(
      public title: string,
      public options?: NotificationOptions,
    ) {
      // noop
    }
  } as unknown as typeof Notification
}

const makeMsg = (id: string): ProactiveMessage => ({
  id,
  triggerType: 'due_review',
  category: 'vocabulary-review',
  title: 'Test Title',
  message: 'Test message body',
  priority: 'medium',
  isRead: false,
  isDismissed: false,
  isSnoozed: false,
  createdAt: new Date().toISOString(),
})

function setSettings(overrides: Partial<ProactiveMessageSettings> = {}): void {
  const settings: ProactiveMessageSettings = {
    enabled: true,
    browserNotifications: true,
    aiEnhanced: false,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
    reminderTime: '09:00',
    maxMessagesPerDay: 10,
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
    ...overrides,
  }
  ProactiveMessageService.saveSettings(settings)
}

describe('proactiveNotificationService', () => {
  let showNotificationSpy: ReturnType<typeof vi.spyOn>

  beforeEach(async () => {
    localStorage.clear()
    proactiveNotificationService.dispose()
  })

  afterEach(() => {
    if (showNotificationSpy) {
      showNotificationSpy.mockRestore()
    }
    proactiveNotificationService.dispose()
  })

  describe('initialize', () => {
    it('subscribes to event bus and loads settings', async () => {
      setSettings({ browserNotifications: true })
      await proactiveNotificationService.initialize()

      expect(proactiveNotificationService.isSupported).toBe(true)
    })

    it('is idempotent when called multiple times', async () => {
      setSettings({ browserNotifications: true })
      await proactiveNotificationService.initialize()
      await proactiveNotificationService.initialize()

      showNotificationSpy = vi.spyOn(proactiveNotificationService, 'showNotification')

      ProactiveEventBus.emitNewMessage(makeMsg('1'))

      await vi.waitFor(() => {
        expect(showNotificationSpy).toHaveBeenCalledTimes(1)
      })
    })
  })

  describe('notification behavior', () => {
    it('shows notification when settings permit', async () => {
      setSettings({ browserNotifications: true })
      await proactiveNotificationService.initialize()

      showNotificationSpy = vi.spyOn(proactiveNotificationService, 'showNotification')

      ProactiveEventBus.emitNewMessage(makeMsg('1'))

      await vi.waitFor(() => {
        expect(showNotificationSpy).toHaveBeenCalledTimes(1)
      })
      expect(showNotificationSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Title',
          message: 'Test message body',
        }),
      )
    })

    it('does not show notification when disabled', async () => {
      setSettings({ enabled: false, browserNotifications: true })
      await proactiveNotificationService.initialize()

      showNotificationSpy = vi.spyOn(proactiveNotificationService, 'showNotification')

      ProactiveEventBus.emitNewMessage(makeMsg('1'))

      expect(showNotificationSpy).not.toHaveBeenCalled()
    })

    it('does not show notification when browserNotifications disabled', async () => {
      setSettings({ browserNotifications: false })
      await proactiveNotificationService.initialize()

      showNotificationSpy = vi.spyOn(proactiveNotificationService, 'showNotification')

      ProactiveEventBus.emitNewMessage(makeMsg('1'))

      expect(showNotificationSpy).not.toHaveBeenCalled()
    })

    it('does not show notification during quiet hours', async () => {
      const now = new Date()
      const hour = now.getHours().toString().padStart(2, '0')
      setSettings({
        browserNotifications: true,
        quietHoursStart: `${hour}:00`,
        quietHoursEnd: `${hour}:59`,
      })
      await proactiveNotificationService.initialize()

      showNotificationSpy = vi.spyOn(proactiveNotificationService, 'showNotification')

      ProactiveEventBus.emitNewMessage(makeMsg('1'))

      expect(showNotificationSpy).not.toHaveBeenCalled()
    })

    it('does not show notification when daily limit reached', async () => {
      const today = new Date().toISOString()
      const existingMsgs: ProactiveMessage[] = Array.from({ length: 5 }, (_, i) => ({
        id: `existing-${i}`,
        triggerType: 'due_review' as const,
        category: 'vocabulary-review' as const,
        title: 'Existing',
        message: 'Existing message',
        priority: 'medium' as const,
        isRead: false,
        isDismissed: false,
        isSnoozed: false,
        createdAt: today,
      }))
      ProactiveMessageService.saveMessages(existingMsgs)

      setSettings({ browserNotifications: true, maxMessagesPerDay: 5 })
      await proactiveNotificationService.initialize()

      showNotificationSpy = vi.spyOn(proactiveNotificationService, 'showNotification')

      ProactiveEventBus.emitNewMessage(makeMsg('new-1'))

      expect(showNotificationSpy).not.toHaveBeenCalled()
    })

    it('respects updated settings via settingsChanged event', async () => {
      setSettings({ browserNotifications: true })
      await proactiveNotificationService.initialize()

      ProactiveEventBus.emitSettingsChanged({
        ...ProactiveMessageService.loadSettings(),
        browserNotifications: false,
      })

      showNotificationSpy = vi.spyOn(proactiveNotificationService, 'showNotification')

      ProactiveEventBus.emitNewMessage(makeMsg('1'))

      expect(showNotificationSpy).not.toHaveBeenCalled()
    })
  })

  describe('requestPermission', () => {
    it('returns true when already granted', async () => {
      setSettings()
      await proactiveNotificationService.initialize()

      const result = await proactiveNotificationService.requestPermission()

      expect(result).toBe(true)
    })
  })

  describe('isSupported', () => {
    it('returns true when Notification API exists', () => {
      expect(proactiveNotificationService.isSupported).toBe(true)
    })
  })

  describe('dispose', () => {
    it('unsubscribes from event bus', async () => {
      setSettings({ browserNotifications: true })
      await proactiveNotificationService.initialize()

      showNotificationSpy = vi.spyOn(proactiveNotificationService, 'showNotification')

      proactiveNotificationService.dispose()

      ProactiveEventBus.emitNewMessage(makeMsg('1'))

      expect(showNotificationSpy).not.toHaveBeenCalled()
    })
  })
})
