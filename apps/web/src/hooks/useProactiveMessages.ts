import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import type { ProactiveMessage, ProactiveMessageCategory, ProactiveMessageSettings, LearnerStateSnapshot } from '@ielts/ai-tutor-engine'
import { generateProactiveMessages, checkQuietHours, canSendNow as canSendNowFn, getMessagesForToday as getMessagesCountForToday, LocalStorageProactiveMessageRepository, generateId } from '@ielts/ai-tutor-engine'
import { STORAGE_KEYS } from '@ielts/config'

const repository = new LocalStorageProactiveMessageRepository()

type ProactiveMessageCallback = (message: ProactiveMessage) => void

const LAST_ACTIVE_KEY = 'ielts-last-active-at'

function buildLearnerState(): LearnerStateSnapshot {
  const settingsRaw = localStorage.getItem(STORAGE_KEYS.localStorage.userSettings)
  const settings = settingsRaw ? JSON.parse(settingsRaw) : {}
  const study = settings.study ?? {}
  const lastActiveAt = localStorage.getItem(LAST_ACTIVE_KEY)
  const now = new Date().toISOString()
  const lastActive = lastActiveAt ? new Date(lastActiveAt) : new Date()
  const inactiveDays = Math.floor((Date.now() - lastActive.getTime()) / 86400000)

  const tasksRaw = localStorage.getItem('ielts-tasks')
  const tasks = tasksRaw ? JSON.parse(tasksRaw) : []
  const todayStr = now.slice(0, 10)
  const tasksCompletedToday = Array.isArray(tasks)
    ? tasks.filter((t: any) => t.isDone && t.completedAt?.slice(0, 10) === todayStr).length
    : 0

  const streakRaw = localStorage.getItem('ielts-study-streak')
  const studyStreak = streakRaw ? parseInt(streakRaw, 10) || 0 : 0

  const vocabRaw = localStorage.getItem('ielts-vocabulary')
  const vocab = vocabRaw ? JSON.parse(vocabRaw) : []
  const dueForReview = Array.isArray(vocab)
    ? vocab.filter((v: any) => v.nextReviewAt && new Date(v.nextReviewAt) <= new Date()).length
    : 0

  const mistakesRaw = localStorage.getItem('ielts-mistakes')
  const mistakes = mistakesRaw ? JSON.parse(mistakesRaw) : []
  const unreviewed = Array.isArray(mistakes)
    ? mistakes.filter((m: any) => m.status === 'new' || m.status === 'unreviewed').length
    : 0

  const examDate = study.examDate || settings.examDate
  const daysUntilExam = examDate ? Math.max(0, Math.floor((new Date(examDate).getTime() - Date.now()) / 86400000)) : null

  const roadmapRaw = localStorage.getItem('ielts-roadmap')
  const roadmap = roadmapRaw ? JSON.parse(roadmapRaw) : null
  const missedTasks = roadmap?.phases
    ? roadmap.phases.reduce((sum: number, p: any) => sum + (p.weeks?.reduce((ws: number, w: any) => ws + (w.days?.reduce((ds: number, d: any) => ds + d.taskIds?.length || 0, 0) || 0), 0) || 0), 0) -
      (roadmap.completedTasks || 0)
    : 0

  return {
    profile: {
      id: 'learner',
      name: '',
      currentBand: study.currentBand || settings.currentBand || 0,
      targetBand: study.targetBand || settings.targetBand || 0,
      examType: (study.studyGoal || settings.studyGoal || 'academic') as any,
      weakSkills: study.weakSkills || settings.weakSkills || [],
      strongSkills: study.strongSkills || settings.strongSkills || [],
      preferredStudyTime: study.preferredStudyTime || 'flexible',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    exam: {
      examDate: examDate || '',
      daysUntilExam,
      examType: (study.studyGoal || settings.studyGoal || 'academic') as any,
    },
    progress: {
      overallCompletionPercent: roadmap?.overallProgress || 0,
      skillProgress: {},
      weeklyCompletionPercent: 0,
      studyStreak,
      inactiveDays,
      consistency: 0,
    },
    vocabularySummary: {
      totalCount: Array.isArray(vocab) ? vocab.length : 0,
      dueForReview,
      masteredCount: Array.isArray(vocab) ? vocab.filter((v: any) => v.status === 'mastered').length : 0,
      newCount: Array.isArray(vocab) ? vocab.filter((v: any) => v.status === 'new').length : 0,
    },
    mistakeSummary: {
      total: Array.isArray(mistakes) ? mistakes.length : 0,
      unreviewed,
      bySkill: {},
    },
    roadmap: roadmap ? {
      currentPhase: roadmap.currentPhaseIndex ?? 0,
      totalPhases: roadmap.phases?.length || 0,
      overallProgress: roadmap.overallProgress || 0,
      completedTasks: roadmap.completedTasks || 0,
      totalTasks: roadmap.totalTasks || 0,
      missedTasks,
    } : null,
    activitySummary: {
      lastActiveAt,
      todayStudyMinutes: 0,
      weeklyStudyMinutes: 0,
      tasksCompletedToday,
    },
    skillStates: {},
    savedContentSummary: { total: 0, unread: 0 },
    preferences: {
      preferredMode: 'general-teacher' as const,
      tone: 'friendly' as const,
      explanationDetail: 'detailed' as const,
      proactiveEnabled: true,
    },
    environment: {
      currentHour: new Date().getHours(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      isOnline: navigator.onLine,
    },
  }
}

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
    const interval = setInterval(async () => {
      const todayCount = getMessagesCountForToday(messagesRef.current)
      if (todayCount >= settings.maxMessagesPerDay) return
      if (!checkQuietHours(settings.quietHoursStart, settings.quietHoursEnd)) return
      const state = buildLearnerState()
      const result = await generateProactiveMessages(
        { triggerEvent: 'daily_evaluation', learnerState: state, recentMessages: [] },
        settings as any,
        [],
      )
      if (!result.selected || result.selected.length === 0) return
      const now = new Date().toISOString()
      const maxAllowed = settings.maxMessagesPerDay - todayCount
      const toAdd = result.selected.slice(0, Math.max(0, maxAllowed)).map(m => ({
        ...m,
        id: generateId(),
        isRead: false,
        isDismissed: false,
        isSnoozed: false,
        createdAt: now,
      })) as ProactiveMessage[]
      if (toAdd.length === 0) return
      setMessages(prev => {
        const next = [...toAdd, ...prev]
        repository.saveMessages(next)
        return next
      })
    }, 300_000)

    return () => clearInterval(interval)
  }, [settings.maxMessagesPerDay, settings.quietHoursStart, settings.quietHoursEnd])

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
