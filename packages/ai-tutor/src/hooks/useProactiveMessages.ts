import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import type { ProactiveMessage, ProactiveMessageCategory, ProactiveMessageSettings, ContextSuggestion, ChatMessage } from '../types'
import { generateProactiveMessages } from '../services/proactiveMessageEngine'
import { ProactiveMessageService } from '../services/proactiveMessageService'
import { ProactiveEventBus } from '../services/proactiveEventBus'
import { getContextSuggestions } from '../utils/contextSuggestions'
import { generateId } from '../utils/id'

type ProactiveMessageCallback = (message: ProactiveMessage) => void

export function useProactiveMessages() {
  const [messages, setMessages] = useState<ProactiveMessage[]>(ProactiveMessageService.loadMessages)
  const [settings, setSettingsState] = useState<ProactiveMessageSettings>(ProactiveMessageService.loadSettings)
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
        ProactiveMessageService.saveMessages(next)
        return next
      })
    })
    return unsub
  }, [])

  const updateSettings = useCallback((patch: Partial<ProactiveMessageSettings>) => {
    setSettingsState(prev => {
      const next = { ...prev, ...patch }
      ProactiveMessageService.saveSettings(next)
      return next
    })
  }, [])

  const refreshMessages = useCallback(() => {
    setMessages(ProactiveMessageService.loadMessages())
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
      ProactiveMessageService.saveMessages(next)
      return next
    })
    listenersRef.current.forEach(fn => fn(newMsg))
    return newMsg
  }, [])

  const generateFromInput = useCallback((
    input: Parameters<typeof generateProactiveMessages>[0]
  ): ProactiveMessage[] => {
    const engineMessages = generateProactiveMessages(input)
    if (engineMessages.length === 0) return []
    const now = new Date().toISOString()
    const currentMessages = messagesRef.current
    const todayCount = ProactiveMessageService.getMessagesForToday(currentMessages)
    const maxAllowed = settings.maxMessagesPerDay - todayCount
    const toAdd = engineMessages.slice(0, Math.max(0, maxAllowed))
    if (toAdd.length === 0) return []
    const newMsgs: ProactiveMessage[] = toAdd.map(msg => ({
      ...msg,
      id: generateId(),
      createdAt: now,
    }))
    setMessages(prev => {
      const next = [...newMsgs, ...prev]
      ProactiveMessageService.saveMessages(next)
      return next
    })
    newMsgs.forEach(msg => {
      listenersRef.current.forEach(fn => fn(msg))
    })
    return newMsgs
  }, [settings.maxMessagesPerDay])

  const getContextSuggestionsForInput = useCallback((
    input: Parameters<typeof getContextSuggestions>[0],
    recentMessages: ChatMessage[],
  ): ContextSuggestion[] => {
    return getContextSuggestions(input, recentMessages)
  }, [])

  const updateMessage = useCallback((id: string, patch: Partial<ProactiveMessage>) => {
    setMessages(prev => {
      const next = prev.map(m => m.id === id ? { ...m, ...patch } : m)
      ProactiveMessageService.saveMessages(next)
      return next
    })
  }, [])

  const markAsRead = useCallback((id: string) => updateMessage(id, { isRead: true }), [updateMessage])

  const markAllAsRead = useCallback(() => {
    setMessages(prev => {
      const next = prev.map(m => m.isRead ? m : { ...m, isRead: true })
      ProactiveMessageService.saveMessages(next)
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
      ProactiveMessageService.saveMessages(next)
      return next
    })
  }, [])

  const clearAllMessages = useCallback(() => {
    setMessages([])
    ProactiveMessageService.clearMessages()
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

  const canSendNow = useMemo(() => ProactiveMessageService.canSendNow(settings), [settings])

  const messagesForToday = useMemo(
    () => ProactiveMessageService.getMessagesForToday(messages),
    [messages],
  )

  return {
    messages,
    settings,
    unreadCount,
    canSendNow,
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
