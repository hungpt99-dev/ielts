import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import type { ProactiveMessage, ProactiveMessageCategory, ProactiveMessageSettings, ContextSuggestion, ChatMessage } from '@ielts/ai-tutor-engine'
import { generateProactiveMessages, generateContextCandidates, ProactiveEventBus, generateId, checkQuietHours, canSendNow as canSendNowFn, getMessagesForToday as getMessagesCountForToday, LocalStorageProactiveMessageRepository } from '@ielts/ai-tutor-engine'
import type { ProactiveEngineInput } from '@ielts/ai-tutor-engine'

const repository = new LocalStorageProactiveMessageRepository()

type ProactiveMessageCallback = (message: ProactiveMessage) => void

export function useProactiveMessages() {
  const [messages, setMessages] = useState<ProactiveMessage[]>(repository.loadMessages)
  const [settings, setSettingsState] = useState<ProactiveMessageSettings>(repository.loadSettings)
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
        repository.saveMessages(next)
        return next
      })
    })
    return unsub
  }, [])

  const updateSettings = useCallback((patch: Partial<ProactiveMessageSettings>) => {
    setSettingsState(prev => {
      const next = { ...prev, ...patch }
      repository.saveSettings(next)
      return next
    })
  }, [])

  const refreshMessages = useCallback(() => {
    setMessages(repository.loadMessages())
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
      repository.saveMessages(next)
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
    const todayCount = getMessagesCountForToday(currentMessages)
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
      repository.saveMessages(next)
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
      repository.saveMessages(next)
      return next
    })
  }, [])

  const markAsRead = useCallback((id: string) => updateMessage(id, { isRead: true }), [updateMessage])

  const markAllAsRead = useCallback(() => {
    setMessages(prev => {
      const next = prev.map(m => m.isRead ? m : { ...m, isRead: true })
      repository.saveMessages(next)
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
      repository.saveMessages(next)
      return next
    })
  }, [])

  const clearAllMessages = useCallback(() => {
    setMessages([])
    repository.clearMessages()
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

  const canSendNowVal = useMemo(() => canSendNowFn(settings.enabled, settings.quietHoursStart, settings.quietHoursEnd), [settings])

  const messagesForToday = useMemo(
    () => getMessagesCountForToday(messages),
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
} from '@ielts/ai-tutor-engine'

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
