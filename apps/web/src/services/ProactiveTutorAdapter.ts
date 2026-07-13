import { ProactiveEventBus } from '@ielts/ai-tutor-engine'
import type { ProactiveMessage as SharedProactiveMessage, ProactiveEvaluationRequest, ProactiveEvaluationResult } from '@ielts/ai-tutor-engine'
import { LocalTutorStorage } from './storage/LocalTutorStorage'
import { loadAppSettings } from './storage/SettingsStorage'

export type ProactiveMessageTriggerType =
  | 'due_review'
  | 'missed_task'
  | 'weak_skill_warning'
  | 'exam_countdown'
  | 'new_content_saved'
  | 'study_streak'
  | 'low_activity'
  | 'daily_plan_ready'
  | 'mistake_pattern_detected'
  | 'topic_practice_suggestion'

export type ProactiveMessageCategory =
  | 'vocabulary-review'
  | 'mistake-review'
  | 'study-plan'
  | 'speaking-practice'
  | 'writing-practice'
  | 'reading-practice'
  | 'listening-practice'
  | 'exam-countdown'
  | 'motivation'
  | 'saved-content'
  | 'daily-tip'
  | 'progress-report'
  | 'suggestion'

export interface ProactiveMessageAction {
  type: string
  label: string
  payload?: Record<string, unknown>
}

export interface ProactiveMessage {
  id: string
  triggerType: ProactiveMessageTriggerType
  category: ProactiveMessageCategory
  title: string
  message: string
  priority: 'high' | 'medium' | 'low'
  action?: ProactiveMessageAction
  isRead: boolean
  isDismissed: boolean
  isSnoozed: boolean
  snoozedUntil?: string
  createdAt: string
}

export interface ProactiveMessageSettings {
  enabled: boolean
  browserNotifications: boolean
  aiEnhanced: boolean
  quietHoursStart: string
  quietHoursEnd: string
  reminderTime: string
  maxMessagesPerDay: number
  categories: Record<ProactiveMessageCategory, boolean>
}

const STORAGE_KEY = 'ielts-proactive-messages'
const SETTINGS_KEY = 'ielts-proactive-message-settings'
const MAX_STORED_MESSAGES = 100

const DEFAULT_PROACTIVE_MESSAGE_SETTINGS: ProactiveMessageSettings = {
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

export type ProactiveMessageCallback = (message: ProactiveMessage) => void

function loadSettings(): ProactiveMessageSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return { ...DEFAULT_PROACTIVE_MESSAGE_SETTINGS, ...parsed }
    }
  } catch {}
  return { ...DEFAULT_PROACTIVE_MESSAGE_SETTINGS }
}

function patchSettings(patch: Partial<ProactiveMessageSettings>): ProactiveMessageSettings {
  const current = loadSettings()
  const updated = { ...current, ...patch }
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated))
  } catch {}
  return updated
}

function loadMessages(): ProactiveMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch {}
  return []
}

function saveMessages(messages: ProactiveMessage[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-MAX_STORED_MESSAGES)))
  } catch {}
}

export class ProactiveTutorAdapter {
  private initialized = false
  private checkInterval: ReturnType<typeof setInterval> | null = null
  private notificationPermission: NotificationPermission | 'unsupported' = 'unsupported'
  private listeners = new Set<ProactiveMessageCallback>()
  private settings: ProactiveMessageSettings = { ...DEFAULT_PROACTIVE_MESSAGE_SETTINGS }

  async initialize(): Promise<void> {
    if (this.initialized) return

    this.settings = loadSettings()
    this.detectNotificationPermission()

    this.checkInterval = setInterval(() => {
      this.checkAndGenerate().catch(e => console.error('Proactive check error:', e))
    }, 120_000)

    await this.checkAndGenerate()

    this.initialized = true
  }

  async stop(): Promise<void> {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
    this.listeners.clear()
    this.initialized = false
  }

  onMessage(callback: ProactiveMessageCallback): () => void {
    this.listeners.add(callback)
    return () => {
      this.listeners.delete(callback)
    }
  }

  private notifyListeners(message: ProactiveMessage): void {
    for (const listener of this.listeners) {
      try {
        listener(message)
      } catch (e) {
        console.error('Proactive message listener error:', e)
      }
    }
  }

  getSettings(): ProactiveMessageSettings {
    return { ...this.settings }
  }

  updateSettings(patch: Partial<ProactiveMessageSettings>): ProactiveMessageSettings {
    this.settings = patchSettings(patch)
    return { ...this.settings }
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

  private showBrowserNotification(message: ProactiveMessage): void {
    if (this.notificationPermission !== 'granted') return
    if (typeof Notification === 'undefined') return
    try {
      const notif = new Notification('AI Tutor', {
        body: message.title + '\n' + message.message,
        icon: '/icon.png',
        tag: `ielts-proactive-${message.id}`,
        requireInteraction: true,
      })
      notif.addEventListener('click', () => {
        window.focus()
        notif.close()
      })
    } catch (e) {
      console.error('Failed to show proactive notification:', e)
    }
  }

  private async checkAndGenerate(): Promise<void> {
    if (!this.settings.enabled) return

    const existing = loadMessages()

    const dueReview = existing.filter(m => m.triggerType === 'due_review' && !m.isRead)
    if (dueReview.length === 0) {
      const memory = await LocalTutorStorage.loadMemory()
      const settings = loadAppSettings()

      const vocabCount = settings.vocabulary?.dueForReview ?? 0
      const mistakeCount = settings.mistakes?.unreviewed ?? 0

      if (vocabCount > 0) {
        const msg: ProactiveMessage = {
          id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
          triggerType: 'due_review',
          category: 'vocabulary-review',
          title: 'Vocabulary Review Due',
          message: `You have ${vocabCount} vocabulary words due for review.`,
          priority: 'medium',
          isRead: false,
          isDismissed: false,
          isSnoozed: false,
          createdAt: new Date().toISOString(),
        }
        existing.push(msg)
      }

      if (mistakeCount > 0) {
        const msg: ProactiveMessage = {
          id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
          triggerType: 'due_review',
          category: 'mistake-review',
          title: 'Mistakes to Review',
          message: `You have ${mistakeCount} unreviewed mistakes.`,
          priority: 'medium',
          isRead: false,
          isDismissed: false,
          isSnoozed: false,
          createdAt: new Date().toISOString(),
        }
        existing.push(msg)
      }

      if (memory.learningStreak > 0 && memory.learningStreak % 7 === 0) {
        const msg: ProactiveMessage = {
          id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
          triggerType: 'study_streak',
          category: 'motivation',
          title: `🔥 ${memory.learningStreak}-Day Study Streak!`,
          message: `Amazing consistency! You've studied for ${memory.learningStreak} consecutive days.`,
          priority: 'low',
          isRead: false,
          isDismissed: false,
          isSnoozed: false,
          createdAt: new Date().toISOString(),
        }
        existing.push(msg)
      }
    }

    saveMessages(existing)
  }

  getPendingMessages(): ProactiveMessage[] {
    return loadMessages().filter(m => !m.isRead && !m.isDismissed)
  }

  markAsRead(id: string): void {
    const messages = loadMessages()
    const msg = messages.find(m => m.id === id)
    if (msg) {
      msg.isRead = true
      saveMessages(messages)
    }
  }

  dismissMessage(id: string): void {
    const messages = loadMessages()
    const msg = messages.find(m => m.id === id)
    if (msg) {
      msg.isDismissed = true
      saveMessages(messages)
    }
  }

  snoozeMessage(id: string, until: string): void {
    const messages = loadMessages()
    const msg = messages.find(m => m.id === id)
    if (msg) {
      msg.isSnoozed = true
      msg.snoozedUntil = until
      saveMessages(messages)
    }
  }

  addExternalMessage(msg: ProactiveMessage): void {
    const existing = loadMessages()
    if (!existing.find(m => m.id === msg.id)) {
      existing.push(msg)
      saveMessages(existing)
      this.notifyListeners(msg)
      ProactiveEventBus.emitNewMessage(msg as unknown as Parameters<typeof ProactiveEventBus.emitNewMessage>[0])
    }
  }

  async forceGenerate(): Promise<ProactiveMessage[]> {
    await this.checkAndGenerate()
    return loadMessages()
  }
}

export const proactiveMessageEngine = new ProactiveTutorAdapter()
export default proactiveMessageEngine
