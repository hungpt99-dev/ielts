import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import type { ProactiveMessage, ProactiveMessageCategory, ProactiveMessageSettings, ContextSuggestion, ChatMessage } from '../types'
import { generateProactiveMessages, generateContextSuggestions as generateContextCandidates } from '../services/proactiveMessageEngine'
import type { ProactiveEngineInput } from '../services/proactiveMessageEngine'
import { ProactiveEventBus } from '../services/proactiveEventBus'
import { generateId } from '../utils/id'

const SETTINGS_KEY = 'ielts-proactive-message-settings'
const STORAGE_KEY = 'ielts-proactive-messages'
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
  } catch { /* noop */ }
}

function loadSettings(): ProactiveMessageSettings {
  const saved = safeGet<Partial<ProactiveMessageSettings>>(SETTINGS_KEY, {})
  return { ...DEFAULT_SETTINGS, ...saved }
}

function saveSettings(s: ProactiveMessageSettings): void {
  safeSet(SETTINGS_KEY, s)
}

function loadMessages(): ProactiveMessage[] {
  const raw = safeGet<unknown>(STORAGE_KEY, null)
  if (!Array.isArray(raw)) return []
  return raw as ProactiveMessage[]
}

function saveMessages(msgs: ProactiveMessage[]): void {
  safeSet(STORAGE_KEY, msgs.slice(-MAX_STORED_MESSAGES))
}

function clearMessages(): void {
  try { localStorage.removeItem(STORAGE_KEY) } catch { /* noop */ }
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

function canSendNow(settings: ProactiveMessageSettings): boolean {
  if (!settings.enabled) return false
  return !isInQuietHours(settings)
}

function getMessagesForToday(messages: ProactiveMessage[]): number {
  const today = new Date().toDateString()
  return messages.filter(m => new Date(m.createdAt).toDateString() === today).length
}

type ProactiveMessageCallback = (message: ProactiveMessage) => void

export function useProactiveMessages() {
  const [messages, setMessages] = useState<ProactiveMessage[]>(loadMessages)
  const [settings, setSettingsState] = useState<ProactiveMessageSettings>(loadSettings)
  const [unreadCount, setUnreadCount] = useState(0)
  const listenersRef = useRef<Set<ProactiveMessageCallback>>(new Set())
  const messagesRef = useRef(messages)

  useEffect(() => {
    setUnreadCount(messages.filter(m => !m.isRead && !m.isDismissed).length)
    messagesRef.current = messages
  }, [messages])

  useEffect(() => {
    const unsub = ProactiveEventBus.onNewMessage((msg) => {
      setMessages(prev => {
        const next = [msg, ...prev]
        saveMessages(next)
        return next
      })
    })
    return unsub
  }, [])

  const updateSettings = useCallback((patch: Partial<ProactiveMessageSettings>) => {
    setSettingsState(prev => {
      const next = { ...prev, ...patch }
      saveSettings(next)
      return next
    })
  }, [])

  const refreshMessages = useCallback(() => {
    setMessages(loadMessages())
  }, [])

  const getPendingMessages = useCallback((): ProactiveMessage[] => {
    return messages.filter(m => {
      if (m.isDismissed) return false
      if (m.snoozedUntil && new Date(m.snoozedUntil) > new Date()) return false
      return true
    })
  }, [messages])

  const getMessagesByCategory = useCallback((category: ProactiveMessageCategory): ProactiveMessage[] => {
    return messages.filter(m => m.category === category && !m.isDismissed)
  }, [messages])

  const addMessage = useCallback((msg: Omit<ProactiveMessage, 'id' | 'createdAt'>): ProactiveMessage => {
    const newMsg: ProactiveMessage = {
      ...msg,
      id: generateId(),
      createdAt: new Date().toISOString(),
    }
    setMessages(prev => {
      const next = [newMsg, ...prev]
      saveMessages(next)
      return next
    })
    listenersRef.current.forEach(fn => fn(newMsg))
    return newMsg
  }, [])

  const generateFromInput = useCallback(async (
    input: Parameters<typeof generateProactiveMessages>[0]
  ): Promise<ProactiveMessage[]> => {
    const engineMessages = await generateProactiveMessages(input)
    if (engineMessages.length === 0) return []
    const now = new Date().toISOString()
    const currentMessages = messagesRef.current
    const todayCount = getMessagesForToday(currentMessages)
    const maxAllowed = settings.maxMessagesPerDay - todayCount
    const toAdd = engineMessages.slice(0, Math.max(0, maxAllowed))
    if (toAdd.length === 0) return []
    const newMsgs: ProactiveMessage[] = toAdd.map(msg => {
      const m: ProactiveMessage = {
        id: generateId(),
        triggerType: msg.triggerType as ProactiveMessage['triggerType'],
        category: msg.category as ProactiveMessage['category'],
        title: msg.title,
        message: msg.message,
        reason: '',
        priority: msg.priority as ProactiveMessage['priority'],
        score: 0,
        deduplicationKey: `${msg.triggerType}-${msg.category}`,
        action: msg.action ? { type: msg.action.type, label: msg.action.label, payload: msg.action.payload } : undefined,
        isRead: false,
        isDismissed: false,
        isSnoozed: false,
        snoozedUntil: msg.snoozedUntil,
        createdAt: now,
      }
      return m
    })
    setMessages(prev => {
      const next = [...newMsgs, ...prev]
      saveMessages(next)
      return next
    })
    return newMsgs
  }, [settings.maxMessagesPerDay])

  const getContextSuggestionsForInput = useCallback((
    input: ProactiveEngineInput,
    recentMessages: ChatMessage[],
  ): ContextSuggestion[] => {
    return generateContextCandidates(input, recentMessages)
  }, [])

  const updateMessage = useCallback((id: string, patch: Partial<ProactiveMessage>) => {
    setMessages(prev => {
      const next = prev.map(m => m.id === id ? { ...m, ...patch } : m)
      saveMessages(next)
      return next
    })
  }, [])

  const markAsRead = useCallback((id: string) => updateMessage(id, { isRead: true }), [updateMessage])

  const markAllAsRead = useCallback(() => {
    setMessages(prev => {
      const next = prev.map(m => m.isRead ? m : { ...m, isRead: true })
      saveMessages(next)
      return next
    })
  }, [])

  const dismissMessage = useCallback((id: string) => updateMessage(id, { isDismissed: true }), [updateMessage])

  const snoozeMessage = useCallback((id: string) => {
    updateMessage(id, {
      isSnoozed: true,
      snoozedUntil: new Date(Date.now() + 3600_000).toISOString(),
    })
  }, [updateMessage])

  const deleteMessage = useCallback((id: string) => {
    setMessages(prev => {
      const next = prev.filter(m => m.id !== id)
      saveMessages(next)
      return next
    })
  }, [])

  const clearAllMessages = useCallback(() => {
    setMessages([])
    clearMessages()
    ProactiveEventBus.emitMessagesCleared()
  }, [])

  const onMessage = useCallback((callback: ProactiveMessageCallback): (() => void) => {
    listenersRef.current.add(callback)
    return () => { listenersRef.current.delete(callback) }
  }, [])

  const isDismissed = useCallback((id: string): boolean => {
    return messages.some(m => m.id === id && m.isDismissed)
  }, [messages])

  const isSnoozed = useCallback((id: string): boolean => {
    const msg = messages.find(m => m.id === id)
    if (!msg || !msg.isSnoozed || !msg.snoozedUntil) return false
    return new Date(msg.snoozedUntil) > new Date()
  }, [messages])

  const canSendNowVal = useMemo(() => canSendNow(settings), [settings])

  const messagesForToday = useMemo(
    () => getMessagesForToday(messages),
    [messages],
  )

  return {
    messages,
    settings,
    unreadCount,
    canSendNow: canSendNowVal,
    messagesForToday,
    updateSettings,
    refreshMessages,
    getPendingMessages,
    getMessagesByCategory,
    addMessage,
    generateFromInput,
    getContextSuggestionsForInput,
    markAsRead,
    markAllAsRead,
    dismissMessage,
    snoozeMessage,
    deleteMessage,
    clearAllMessages,
    onMessage,
    isDismissed,
    isSnoozed,
  }
}

export {
  getTimeBasedGreeting,
  getWelcomeMessage,
  generateQuickResponse,
  formatMessageTime,
  DEFAULT_QUICK_ACTIONS,
  ACTION_LABELS,
} from '../utils/chatHelpers'

export const PROACTIVE_CATEGORY_LABELS: Record<ProactiveMessageCategory | 'all', string> = {
  all: 'All',
  'vocabulary-review': 'Vocabulary',
  'mistake-review': 'Mistakes',
  'study-plan': 'Study Plan',
  'speaking-practice': 'Speaking',
  'writing-practice': 'Writing',
  'reading-practice': 'Reading',
  'listening-practice': 'Listening',
  'exam-countdown': 'Exam',
  'motivation': 'Motivation',
  'saved-content': 'Content',
  'daily-tip': 'Daily Tip',
  'progress-report': 'Progress',
  'suggestion': 'Suggestion',
}

export const PROACTIVE_PRIORITY_LABELS: Record<string, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}
