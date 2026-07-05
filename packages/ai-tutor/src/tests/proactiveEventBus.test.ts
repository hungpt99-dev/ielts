import { describe, it, expect, vi, afterEach } from 'vitest'
import { ProactiveEventBus } from '../services/proactiveEventBus'
import type { ProactiveMessage, ProactiveMessageSettings } from '../types'

const makeMsg = (id: string, overrides: Partial<ProactiveMessage> = {}): ProactiveMessage => ({
  id,
  triggerType: 'due_review',
  category: 'vocabulary-review',
  title: 'Test',
  message: 'Test message',
  priority: 'medium',
  isRead: false,
  isDismissed: false,
  isSnoozed: false,
  createdAt: new Date().toISOString(),
  ...overrides,
})

const makeSettings = (overrides: Partial<ProactiveMessageSettings> = {}): ProactiveMessageSettings => ({
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
  ...overrides,
})

describe('ProactiveEventBus', () => {
  afterEach(() => {
    ProactiveEventBus.clear()
  })

  describe('newMessage', () => {
    it('emits new messages to subscribers', () => {
      const handler = vi.fn()
      ProactiveEventBus.onNewMessage(handler)

      const msg = makeMsg('1')
      ProactiveEventBus.emitNewMessage(msg)

      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler).toHaveBeenCalledWith(msg)
    })

    it('allows multiple subscribers for new messages', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      ProactiveEventBus.onNewMessage(handler1)
      ProactiveEventBus.onNewMessage(handler2)

      ProactiveEventBus.emitNewMessage(makeMsg('1'))

      expect(handler1).toHaveBeenCalledTimes(1)
      expect(handler2).toHaveBeenCalledTimes(1)
    })

    it('unsubscribes correctly', () => {
      const handler = vi.fn()
      const unsub = ProactiveEventBus.onNewMessage(handler)
      unsub()

      ProactiveEventBus.emitNewMessage(makeMsg('1'))

      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('messageRead', () => {
    it('emits messageRead to subscribers', () => {
      const handler = vi.fn()
      ProactiveEventBus.onMessageRead(handler)

      ProactiveEventBus.emitMessageRead('msg-1')

      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler).toHaveBeenCalledWith('msg-1')
    })

    it('unsubscribes correctly', () => {
      const handler = vi.fn()
      const unsub = ProactiveEventBus.onMessageRead(handler)
      unsub()

      ProactiveEventBus.emitMessageRead('msg-1')

      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('messageDismissed', () => {
    it('emits messageDismissed to subscribers', () => {
      const handler = vi.fn()
      ProactiveEventBus.onMessageDismissed(handler)

      ProactiveEventBus.emitMessageDismissed('msg-1')

      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler).toHaveBeenCalledWith('msg-1')
    })
  })

  describe('messageSnoozed', () => {
    it('emits messageSnoozed with id and until date', () => {
      const handler = vi.fn()
      ProactiveEventBus.onMessageSnoozed(handler)
      const until = new Date(Date.now() + 3600_000).toISOString()

      ProactiveEventBus.emitMessageSnoozed('msg-1', until)

      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler).toHaveBeenCalledWith('msg-1', until)
    })
  })

  describe('messagesCleared', () => {
    it('emits messagesCleared', () => {
      const handler = vi.fn()
      ProactiveEventBus.onMessagesCleared(handler)

      ProactiveEventBus.emitMessagesCleared()

      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('does not emit to unsubscribed handlers', () => {
      const handler = vi.fn()
      ProactiveEventBus.onMessagesCleared(handler)
      ProactiveEventBus.clear()

      ProactiveEventBus.emitMessagesCleared()

      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('settingsChanged', () => {
    it('emits settingsChanged to subscribers', () => {
      const handler = vi.fn()
      ProactiveEventBus.onSettingsChanged(handler)
      const settings = makeSettings({ maxMessagesPerDay: 10 })

      ProactiveEventBus.emitSettingsChanged(settings)

      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler).toHaveBeenCalledWith(settings)
    })
  })

  describe('error isolation', () => {
    it('continues notifying other handlers when one throws', () => {
      const throwingHandler = vi.fn().mockImplementation(() => {
        throw new Error('handler error')
      })
      const goodHandler = vi.fn()

      ProactiveEventBus.onNewMessage(throwingHandler)
      ProactiveEventBus.onNewMessage(goodHandler)

      ProactiveEventBus.emitNewMessage(makeMsg('1'))

      expect(throwingHandler).toHaveBeenCalledTimes(1)
      expect(goodHandler).toHaveBeenCalledTimes(1)
    })
  })

  describe('clear', () => {
    it('removes all handlers for all event types', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()
      const handler3 = vi.fn()

      ProactiveEventBus.onNewMessage(handler1)
      ProactiveEventBus.onMessageRead(handler2)
      ProactiveEventBus.onSettingsChanged(handler3)

      ProactiveEventBus.clear()

      ProactiveEventBus.emitNewMessage(makeMsg('1'))
      ProactiveEventBus.emitMessageRead('msg-1')
      ProactiveEventBus.emitSettingsChanged(makeSettings())

      expect(handler1).not.toHaveBeenCalled()
      expect(handler2).not.toHaveBeenCalled()
      expect(handler3).not.toHaveBeenCalled()
    })
  })
})
