import { describe, it, expect, beforeEach } from 'vitest'
import { ProactiveMessageService } from '../services/proactiveMessageService'

beforeEach(() => {
  localStorage.clear()
})

describe('ProactiveMessageService', () => {
  describe('loadSettings / saveSettings', () => {
    it('returns default settings when nothing is stored', () => {
      const settings = ProactiveMessageService.loadSettings()
      expect(settings.enabled).toBe(true)
      expect(settings.maxMessagesPerDay).toBe(5)
      expect(settings.quietHoursStart).toBe('22:00')
    })

    it('persists and restores settings', () => {
      ProactiveMessageService.saveSettings({ ...ProactiveMessageService.loadSettings(), maxMessagesPerDay: 3 })
      const loaded = ProactiveMessageService.loadSettings()
      expect(loaded.maxMessagesPerDay).toBe(3)
    })

    it('falls back to defaults on corrupted data', () => {
      localStorage.setItem('ielts-proactive-message-settings', '{corrupted')
      const settings = ProactiveMessageService.loadSettings()
      expect(settings.enabled).toBe(true)
    })

    it('merges partial settings with defaults', () => {
      localStorage.setItem('ielts-proactive-message-settings', JSON.stringify({ maxMessagesPerDay: 10 }))
      const settings = ProactiveMessageService.loadSettings()
      expect(settings.maxMessagesPerDay).toBe(10)
      expect(settings.enabled).toBe(true)
    })
  })

  describe('loadMessages / saveMessages', () => {
    it('returns empty array when nothing is stored', () => {
      expect(ProactiveMessageService.loadMessages()).toEqual([])
    })

    it('persists and restores messages', () => {
      const msg = {
        id: '1',
        triggerType: 'due_review' as const,
        category: 'vocabulary-review' as const,
        title: 'Test',
        message: 'Test message',
        priority: 'medium' as const,
        isRead: false,
        isDismissed: false,
        isSnoozed: false,
        createdAt: new Date().toISOString(),
      }
      ProactiveMessageService.saveMessages([msg])
      const loaded = ProactiveMessageService.loadMessages()
      expect(loaded).toHaveLength(1)
      expect(loaded[0].title).toBe('Test')
    })

    it('returns empty array on corrupted data', () => {
      localStorage.setItem('ielts-proactive-messages', '{corrupted')
      expect(ProactiveMessageService.loadMessages()).toEqual([])
    })

    it('returns empty array on non-array data', () => {
      localStorage.setItem('ielts-proactive-messages', JSON.stringify({ not: 'an array' }))
      expect(ProactiveMessageService.loadMessages()).toEqual([])
    })
  })

  describe('clearMessages', () => {
    it('removes stored messages', () => {
      ProactiveMessageService.saveMessages([{
        id: '1',
        triggerType: 'due_review',
        category: 'vocabulary-review',
        title: 'T',
        message: 'M',
        priority: 'medium',
        isRead: false,
        isDismissed: false,
        isSnoozed: false,
        createdAt: new Date().toISOString(),
      }])
      ProactiveMessageService.clearMessages()
      expect(ProactiveMessageService.loadMessages()).toEqual([])
    })
  })

  describe('canSendNow', () => {
    it('returns false when disabled', () => {
      const settings = ProactiveMessageService.getDefaultSettings()
      settings.enabled = false
      expect(ProactiveMessageService.canSendNow(settings)).toBe(false)
    })

    it('returns true when enabled and outside quiet hours', () => {
      const settings = ProactiveMessageService.getDefaultSettings()
      settings.quietHoursStart = '03:00'
      settings.quietHoursEnd = '04:00'
      expect(ProactiveMessageService.canSendNow(settings)).toBe(true)
    })

    it('returns false during quiet hours', () => {
      const now = new Date()
      const hour = now.getHours().toString().padStart(2, '0')
      const start = `${hour}:00`
      const end = `${hour}:59`
      const settings = ProactiveMessageService.getDefaultSettings()
      settings.quietHoursStart = start
      settings.quietHoursEnd = end
      expect(ProactiveMessageService.canSendNow(settings)).toBe(false)
    })
  })

  describe('getDefaultSettings', () => {
    it('returns a fresh copy of defaults', () => {
      const a = ProactiveMessageService.getDefaultSettings()
      const b = ProactiveMessageService.getDefaultSettings()
      expect(a).toEqual(b)
      a.maxMessagesPerDay = 99
      expect(b.maxMessagesPerDay).toBe(5)
    })
  })
})
