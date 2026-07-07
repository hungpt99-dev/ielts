// ============================================================
// Proactive Message Engine — Local-First AI Tutor Assistant
// ============================================================
//
// IMPORTANT: Local-first limitation
// Without a backend push service, this engine cannot reliably
// deliver messages when the website and browser extension are
// both closed. Notifications only fire when:
//   - The website is open (in-app messages + browser notif.)
//   - The extension popup is open (extension reminders)
//   - A Chrome extension alarm fires (extension background)
// We do NOT fake cloud-push behavior.

import { LocalTutorStorage } from './storage/LocalTutorStorage'
import { DatabaseService } from './storage/Database'
import { loadAppSettings } from './storage/SettingsStorage'
import { aiGenerateProactiveMessage } from '../components/aiTutor/aiTutorHelper'
import type {
  TutorMemory,
  ExerciseResult,
} from '../models/aiTutorModels'
import type {
  AppSettings,
  VocabularyEntry,
  VocabReviewEntry,
  MistakeEntry,
  TaskEntry,
  ReadingPassage,
  ListeningTranscript,
} from '../models'
import type { ISOString } from '../types'
import { generateId } from '../utils'


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
  snoozedUntil?: ISOString
  createdAt: ISOString
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

export const DEFAULT_PROACTIVE_MESSAGE_SETTINGS: ProactiveMessageSettings = {
  enabled: true,
  browserNotifications: false,
  aiEnhanced: true,
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

const SETTINGS_KEY = 'ielts-proactive-message-settings'
const STORAGE_KEY = 'ielts-proactive-messages'
const TRIGGERED_KEY = 'ielts-proactive-triggered-today'
const MAX_STORED_MESSAGES = 100


function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

function daysBetween(a: Date, b: Date): number {
  return Math.floor((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24))
}

function isSameDay(a: string, b: string): boolean {
  return a.slice(0, 10) === b.slice(0, 10)
}


function loadSettings(): ProactiveMessageSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ProactiveMessageSettings>
      return { ...DEFAULT_PROACTIVE_MESSAGE_SETTINGS, ...parsed }
    }
  } catch {}
  return { ...DEFAULT_PROACTIVE_MESSAGE_SETTINGS }
}

function saveSettings(settings: ProactiveMessageSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch {}
}

function patchSettings(patch: Partial<ProactiveMessageSettings>): ProactiveMessageSettings {
  const current = loadSettings()
  const merged = { ...current, ...patch }
  saveSettings(merged)
  return merged
}


function getTriggeredToday(): Set<string> {
  try {
    const raw = localStorage.getItem(TRIGGERED_KEY)
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
    const raw = localStorage.getItem(TRIGGERED_KEY)
    const data: Record<string, string[]> = raw ? JSON.parse(raw) : {}
    const key = todayKey()
    data[key] = data[key] ?? []
    if (!data[key].includes(id)) {
      data[key].push(id)
    }
    localStorage.setItem(TRIGGERED_KEY, JSON.stringify(data))
  } catch {}
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


export type ProactiveMessageCallback = (message: ProactiveMessage) => void

// ══════════════════════════════════════════════════════════════
// Engine
// ══════════════════════════════════════════════════════════════

export class ProactiveMessageEngine {
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
        icon: '/favicon.ico',
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

    const triggeredToday = getTriggeredToday()
    const dailyLimit = this.settings.maxMessagesPerDay
    if (triggeredToday.size >= dailyLimit) return

    if (this.isQuietHours()) return

    const messages = await this.analyzeAndGenerate()
    const accumulated: ProactiveMessage[] = []

    for (const msg of messages) {
      if (triggeredToday.has(msg.id)) continue
      const existing = loadMessages()
      if (this.isDuplicateMessage(existing, msg)) continue
      if (!this.settings.categories[msg.category]) continue

      accumulated.push(msg)
      addTriggeredToday(msg.id)

      this.notifyListeners(msg)

      if (this.settings.browserNotifications) {
        this.showBrowserNotification(msg)
      }

      await this.storeAsSuggestion(msg)
    }

    if (accumulated.length > 0) {
      const existing = loadMessages()
      saveMessages([...existing, ...accumulated])
    }
  }

  private isDuplicateMessage(existing: ProactiveMessage[], candidate: ProactiveMessage): boolean {
    const today = todayKey()
    return existing.some(
      m =>
        m.triggerType === candidate.triggerType &&
        isSameDay(m.createdAt, today) &&
        !m.isDismissed,
    )
  }

  private isQuietHours(): boolean {
    const now = new Date()
    const currentMinutes = now.getHours() * 60 + now.getMinutes()

    const [startH, startM] = this.settings.quietHoursStart.split(':').map(Number)
    const [endH, endM] = this.settings.quietHoursEnd.split(':').map(Number)
    const startMinutes = startH * 60 + startM
    const endMinutes = endH * 60 + endM

    if (startMinutes <= endMinutes) {
      return currentMinutes >= startMinutes && currentMinutes < endMinutes
    }
    return currentMinutes >= startMinutes || currentMinutes < endMinutes
  }

  private async storeAsSuggestion(msg: ProactiveMessage): Promise<void> {
    try {
      await LocalTutorStorage.addSuggestion({
        type: this.mapTriggerToSuggestionType(msg.triggerType),
        title: msg.title,
        description: msg.message,
        action: (msg.action?.type as never) ?? ('practice-with-me' as never),
        actionLabel: msg.action?.label ?? 'Review Now',
        skill: (msg.action?.payload?.skill as string | undefined),
        isAccepted: false,
        isDismissed: false,
      })
    } catch { /* ignore - suggestion storage is optional */ }
  }

  private mapTriggerToSuggestionType(trigger: ProactiveMessageTriggerType): 'weakness-practice' | 'vocabulary-review' | 'exam-prep' | 'mistake-review' | 'article-practice' | 'custom' {
    switch (trigger) {
      case 'due_review': return 'vocabulary-review'
      case 'missed_task': return 'custom'
      case 'weak_skill_warning': return 'weakness-practice'
      case 'exam_countdown': return 'exam-prep'
      case 'new_content_saved': return 'article-practice'
      case 'study_streak': return 'custom'
      case 'low_activity': return 'custom'
      case 'daily_plan_ready': return 'custom'
      case 'mistake_pattern_detected': return 'mistake-review'
      case 'topic_practice_suggestion': return 'custom'
    }
  }

  // ══════════════════════════════════════════════════════════════
  // Data Analysis & Message Generation
  // ══════════════════════════════════════════════════════════════

  private async analyzeAndGenerate(): Promise<ProactiveMessage[]> {
    const candidates: ProactiveMessage[] = []

    const [
      settings,
      memory,
      vocab,
      vocabReviews,
      mistakes,
      tasks,
      readingPassages,
      transcripts,
      exerciseResults,
    ] = await Promise.all([
      this.loadAppSettings(),
      LocalTutorStorage.loadMemory(),
      DatabaseService.getAll<VocabularyEntry>('vocabulary'),
      DatabaseService.getAll<VocabReviewEntry>('vocabularyReviews'),
      DatabaseService.getAll<MistakeEntry>('mistakes'),
      DatabaseService.getAll<TaskEntry>('tasks'),
      DatabaseService.getAll<ReadingPassage>('readingPassages'),
      DatabaseService.getAll<ListeningTranscript>('listeningTranscripts'),
      LocalTutorStorage.getAllExerciseResults().catch(() => [] as ExerciseResult[]),
    ])

    const currentPage = this.detectCurrentPage()
    const todayStr = todayKey()
    const now = new Date()

    candidates.push(
      ...this.checkDueReview(vocab, vocabReviews),
      ...this.checkMissedTask(tasks, memory, now),
      ...this.checkWeakSkillWarning(memory, mistakes, exerciseResults),
      ...this.checkExamCountdown(settings, memory),
      ...this.checkNewContentSaved(readingPassages, transcripts),
      ...this.checkStudyStreak(memory),
      ...this.checkLowActivity(memory, now),
      ...this.checkDailyPlanReady(memory, todayStr),
      ...this.checkMistakePatternDetected(mistakes),
      ...this.checkTopicPracticeSuggestion(currentPage, memory),
    )

    const aiMessages = await this.generateAIEnhancedMessages(settings)
    candidates.push(...aiMessages)

    return candidates.slice(0, 3)
  }

  private async loadAppSettings(): Promise<AppSettings> {
    try {
      return loadAppSettings()
    } catch {
      return {
        targetBand: 0, currentBand: 0, examDate: '',
        dailyStudyMinutes: 0, weakSkills: [], preferredTopics: [],
        studyReminder: '', aiApiKey: '', aiProvider: 'openai',
        aiEndpoint: '', aiModel: '', darkMode: false,
        aiEnabled: false,
      }
    }
  }

  private detectCurrentPage(): string {
    try {
      const path = window.location.pathname.toLowerCase()
      if (path.includes('/vocabulary')) return 'vocabulary'
      if (path.includes('/writing')) return 'writing'
      if (path.includes('/speaking')) return 'speaking'
      if (path.includes('/reading')) return 'reading'
      if (path.includes('/mistake') || path.includes('/mistakes')) return 'mistakes'
      if (path.includes('/dashboard') || path === '/') return 'dashboard'
      if (path.includes('/listening')) return 'listening'
      if (path.includes('/planner') || path.includes('/plan')) return 'planner'
      if (path.includes('/tutor')) return 'tutor'
      if (path.includes('/grammar')) return 'grammar'
      if (path.includes('/settings')) return 'settings'
      return 'other'
    } catch {
      return 'other'
    }
  }


  private checkDueReview(
    vocab: VocabularyEntry[],
    reviews: VocabReviewEntry[],
  ): ProactiveMessage[] {
    if (vocab.length === 0) return []

    const now = new Date()
    const dueIds = new Set<string>()

    for (const r of reviews) {
      if (new Date(r.nextReviewDate) <= now) {
        dueIds.add(r.vocabularyId)
      }
    }

    if (dueIds.size === 0) return []

    const dueWords = vocab.filter(v => dueIds.has(v.id))
    const topics = [...new Set(dueWords.map(v => v.topic).filter(Boolean))].slice(0, 3)
    const topicStr = topics.length > 0 ? ` about ${topics.join(', ')}` : ''

    const category: ProactiveMessageCategory = 'vocabulary-review'

    return [
      {
        id: generateId(),
        triggerType: 'due_review',
        category,
        title: `${dueIds.size} Words Due for Review`,
        message: `You have ${dueIds.size} vocabulary word${dueIds.size > 1 ? 's' : ''} due for review today${topicStr}. Want to practice them now?`,
        priority: dueIds.size > 10 ? 'high' : 'medium',
        action: {
          type: 'navigate',
          label: 'Review Now',
          payload: { path: '/vocabulary' },
        },
        isRead: false,
        isDismissed: false,
        isSnoozed: false,
        createdAt: new Date().toISOString(),
      },
    ]
  }


  private checkMissedTask(
    tasks: TaskEntry[],
    memory: TutorMemory,
    now: Date,
  ): ProactiveMessage[] {
    const lastStudy = memory.lastStudyDate
    if (!lastStudy) return []

    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().slice(0, 10)

    const lastStudyDay = lastStudy.slice(0, 10)

    if (lastStudyDay >= yesterdayStr) return []

    const yesterdaysTasks = tasks.filter(t => t.date.slice(0, 10) === yesterdayStr && !t.isDone)
    const undoneCount = yesterdaysTasks.length

    const msg: ProactiveMessage = {
      id: generateId(),
      triggerType: 'missed_task',
      category: 'study-plan',
      title: 'Missed Yesterday\'s Study',
      message: undoneCount > 0
        ? `You missed ${undoneCount} task${undoneCount > 1 ? 's' : ''} yesterday. I can adjust today's study plan and help you get back on track.`
        : 'You didn\'t study yesterday. A short 10-minute review can help you stay on track.',
      priority: 'medium',
      action: {
        type: 'navigate',
        label: 'Open Today\'s Plan',
        payload: { path: '/planner' },
      },
      isRead: false,
      isDismissed: false,
      isSnoozed: false,
      createdAt: new Date().toISOString(),
    }

    return [msg]
  }


  private checkWeakSkillWarning(
    memory: TutorMemory,
    mistakes: MistakeEntry[],
    exercises: ExerciseResult[],
  ): ProactiveMessage[] {
    const results: ProactiveMessage[] = []

    const weakSkills = [...new Set(memory.weakPoints.map(w => w.skill))]
    if (weakSkills.length > 0) {
      const topSkill = weakSkills[0]
      results.push({
        id: generateId(),
        triggerType: 'weak_skill_warning',
        category: 'mistake-review',
        title: `Weak Area: ${topSkill.charAt(0).toUpperCase() + topSkill.slice(1)}`,
        message: `Your ${topSkill} skills need attention. Let's practice with targeted exercises to improve.`,
        priority: 'medium',
        action: {
          type: 'practice',
          label: 'Practice Now',
          payload: { skill: topSkill },
        },
        isRead: false,
        isDismissed: false,
        isSnoozed: false,
        createdAt: new Date().toISOString(),
      })
    }

    const recentMistakes = mistakes.filter(m => {
      const d = new Date(m.date)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return d >= weekAgo
    })

    if (recentMistakes.length >= 5) {
      const skillCounts: Record<string, number> = {}
      for (const m of recentMistakes) {
        skillCounts[m.skill] = (skillCounts[m.skill] || 0) + 1
      }
      const topSkill = Object.entries(skillCounts).sort((a, b) => b[1] - a[1])[0]
      if (topSkill && !weakSkills.includes(topSkill[0])) {
        results.push({
          id: generateId(),
          triggerType: 'weak_skill_warning',
          category: 'mistake-review',
          title: `${topSkill[1]} Recent ${topSkill[0]} Mistakes`,
          message: `You made ${topSkill[1]} mistake${topSkill[1] > 1 ? 's' : ''} in ${topSkill[0]} this week. Let's review and fix them.`,
          priority: 'medium',
          action: {
            type: 'navigate',
            label: 'Open Mistake Notebook',
            payload: { path: '/mistakes' },
          },
          isRead: false,
          isDismissed: false,
          isSnoozed: false,
          createdAt: new Date().toISOString(),
        })
      }
    }

    const weakExercises = exercises.filter(
      e => e.total > 0 && e.score / e.total < 0.6,
    )
    if (weakExercises.length >= 2) {
      const topics = [...new Set(weakExercises.map(e => e.topic))].slice(0, 2)
      results.push({
        id: generateId(),
        triggerType: 'weak_skill_warning',
        category: 'mistake-review',
        title: 'Review Difficult Exercises',
        message: `You scored below 60% on ${weakExercises.length} recent exercise${weakExercises.length > 1 ? 's' : ''}${topics.length > 0 ? ` about ${topics.join(', ')}` : ''}. Let's strengthen your understanding.`,
        priority: 'medium',
        action: {
          type: 'action',
          label: 'Generate Exercise',
          payload: { topics },
        },
        isRead: false,
        isDismissed: false,
        isSnoozed: false,
        createdAt: new Date().toISOString(),
      })
    }

    return results
  }


  private checkExamCountdown(
    settings: AppSettings,
    memory: TutorMemory,
  ): ProactiveMessage[] {
    const examDate = settings.examDate || memory.examDate
    if (!examDate) return []

    const exam = new Date(examDate)
    const now = new Date()
    const diffDays = Math.ceil((exam.getTime() - now.getTime()) / 86_400_000)

    if (diffDays <= 0) return []

    const priority = diffDays <= 7 ? 'high' : diffDays <= 30 ? 'medium' : 'low'

    let title: string
    let message: string

    if (diffDays <= 7) {
      title = `⚠️ Only ${diffDays} Day${diffDays > 1 ? 's' : ''} Until Your Exam!`
      message = `Your IELTS exam is in ${diffDays} day${diffDays > 1 ? 's' : ''}. Focus on mock tests and review your weak areas.`
    } else if (diffDays <= 30) {
      title = `Exam in ${diffDays} Days — Stay on Track`
      message = `Your IELTS exam is ${diffDays} days away. Today we should focus on Writing Task 2 and your weak areas.`
    } else {
      title = `${diffDays} Days Until Your IELTS Exam`
      message = `You have ${diffDays} days until your exam. Consistent daily practice now will make a big difference.`
    }

    return [
      {
        id: generateId(),
        triggerType: 'exam_countdown',
        category: 'exam-countdown',
        title,
        message,
        priority,
        action: {
          type: 'navigate',
          label: diffDays <= 7 ? 'Start Mock Test' : 'Open Today\'s Plan',
          payload: { path: diffDays <= 7 ? '/dashboard' : '/planner' },
        },
        isRead: false,
        isDismissed: false,
        isSnoozed: false,
        createdAt: new Date().toISOString(),
      },
    ]
  }


  private checkNewContentSaved(
    passages: ReadingPassage[],
    transcripts: ListeningTranscript[],
  ): ProactiveMessage[] {
    const now = new Date()
    const dayAgo = new Date(now.getTime() - 86_400_000)

    const recentPassages = passages.filter(p => new Date(p.createdAt) >= dayAgo)
    const recentTranscripts = transcripts.filter(t => new Date(t.createdAt) >= dayAgo)

    const totalRecent = recentPassages.length + recentTranscripts.length
    if (totalRecent === 0) return []

    const results: ProactiveMessage[] = []

    if (recentPassages.length > 0) {
      const titles = recentPassages.slice(0, 2).map(p => p.title)
      results.push({
        id: generateId(),
        triggerType: 'new_content_saved',
        category: 'saved-content',
        title: 'New Reading Content Saved',
        message: `You just saved "${titles[0]}". I can turn it into IELTS Reading questions.`,
        priority: 'low',
        action: {
          type: 'navigate',
          label: 'Generate Exercise',
          payload: { path: '/reading', contentId: recentPassages[0].id },
        },
        isRead: false,
        isDismissed: false,
        isSnoozed: false,
        createdAt: now.toISOString(),
      })
    }

    if (recentTranscripts.length > 0) {
      results.push({
        id: generateId(),
        triggerType: 'new_content_saved',
        category: 'saved-content',
        title: 'YouTube Transcript Saved',
        message: `You saved a transcript. I can create listening comprehension exercises from it.`,
        priority: 'low',
        action: {
          type: 'navigate',
          label: 'Create Exercise',
          payload: { path: '/listening' },
        },
        isRead: false,
        isDismissed: false,
        isSnoozed: false,
        createdAt: now.toISOString(),
      })
    }

    return results
  }


  private checkStudyStreak(memory: TutorMemory): ProactiveMessage[] {
    if (memory.learningStreak <= 0) return []

    const results: ProactiveMessage[] = []

    if (memory.learningStreak >= 7 && memory.learningStreak % 7 === 0) {
      results.push({
        id: generateId(),
        triggerType: 'study_streak',
        category: 'motivation',
        title: `🔥 ${memory.learningStreak}-Day Study Streak!`,
        message: `Amazing work! You've studied for ${memory.learningStreak} consecutive days. Keep up the great momentum toward your IELTS goal!`,
        priority: 'low',
        action: {
          type: 'navigate',
          label: 'View Progress',
          payload: { path: '/dashboard' },
        },
        isRead: false,
        isDismissed: false,
        isSnoozed: false,
        createdAt: new Date().toISOString(),
      })
    }

    if (memory.learningStreak >= 3) {
      const today = todayKey()
      const lastStudy = memory.lastStudyDate ? memory.lastStudyDate.slice(0, 10) : ''
      if (lastStudy === today) {
        results.push({
          id: generateId(),
          triggerType: 'study_streak',
          category: 'motivation',
          title: 'Good Job! Study Streak Continues',
          message: `You completed your vocabulary review streak today. ${memory.learningStreak} day${memory.learningStreak > 1 ? 's' : ''} and counting!`,
          priority: 'low',
          action: {
            type: 'navigate',
            label: 'Continue Learning',
            payload: { path: '/dashboard' },
          },
          isRead: false,
          isDismissed: false,
          isSnoozed: false,
          createdAt: new Date().toISOString(),
        })
      }
    }

    return results
  }


  private checkLowActivity(
    memory: TutorMemory,
    now: Date,
  ): ProactiveMessage[] {
    if (!memory.lastStudyDate) return []

    const lastStudy = new Date(memory.lastStudyDate)
    const daysSince = daysBetween(now, lastStudy)

    if (daysSince < 2) return []

    let message: string
    let title: string

    if (daysSince >= 7) {
      title = 'Let\'s Get Back on Track!'
      message = `It's been ${daysSince} days since your last study session. Don't worry — every day is a fresh start! Let's begin with a short review.`
    } else if (daysSince >= 3) {
      title = 'Time to Study!'
      message = `You haven't studied for ${daysSince} days. A quick 10-minute session can help you stay on track for your IELTS goal.`
    } else {
      title = 'Quick Study Session?'
      message = 'You have not practiced Speaking for 2 days. Want to do a short Part 1 practice?'
    }

    return [
      {
        id: generateId(),
        triggerType: 'low_activity',
        category: 'motivation',
        title,
        message,
        priority: 'medium',
        action: {
          type: 'navigate',
          label: 'Start Learning',
          payload: { path: '/dashboard' },
        },
        isRead: false,
        isDismissed: false,
        isSnoozed: false,
        createdAt: now.toISOString(),
      },
    ]
  }


  private checkDailyPlanReady(
    memory: TutorMemory,
    todayStr: string,
  ): ProactiveMessage[] {
    if (!memory.currentPlan) return []

    const lastStudy = memory.lastStudyDate ? memory.lastStudyDate.slice(0, 10) : ''
    if (lastStudy === todayStr) return []

    return [
      {
        id: generateId(),
        triggerType: 'daily_plan_ready',
        category: 'study-plan',
        title: 'Today\'s Study Plan Ready',
        message: memory.currentPlan.length > 120
          ? memory.currentPlan.slice(0, 120) + '...'
          : memory.currentPlan,
        priority: 'medium',
        action: {
          type: 'navigate',
          label: 'Open Today\'s Plan',
          payload: { path: '/planner' },
        },
        isRead: false,
        isDismissed: false,
        isSnoozed: false,
        createdAt: new Date().toISOString(),
      },
    ]
  }


  private checkMistakePatternDetected(
    mistakes: MistakeEntry[],
  ): ProactiveMessage[] {
    const results: ProactiveMessage[] = []

    const patternMap = new Map<string, { count: number; examples: string[]; skill: string }>()

    for (const m of mistakes) {
      if (m.status === 'resolved') continue
      const key = m.skill
      if (!patternMap.has(key)) {
        patternMap.set(key, { count: 0, examples: [], skill: key })
      }
      const entry = patternMap.get(key)!
      entry.count++
      if (entry.examples.length < 3) {
        entry.examples.push(m.mistake.slice(0, 60))
      }
    }

    for (const [, entry] of patternMap) {
      if (entry.count < 3) continue

      let message: string
      if (entry.skill === 'grammar') {
        message = `You often make mistakes with articles: a, an, the. Let's fix that with 5 questions.`
      } else {
        message = `You have ${entry.count} unresolved ${entry.skill} mistakes. Let's review them together and make sure you understand the corrections.`
      }

      results.push({
        id: generateId(),
        triggerType: 'mistake_pattern_detected',
        category: 'mistake-review',
        title: `${entry.count} ${entry.skill.charAt(0).toUpperCase() + entry.skill.slice(1)} Mistakes to Review`,
        message,
        priority: entry.count >= 5 ? 'high' : 'medium',
        action: {
          type: 'navigate',
          label: 'Open Mistake Notebook',
          payload: { path: '/mistakes', skill: entry.skill },
        },
        isRead: false,
        isDismissed: false,
        isSnoozed: false,
        createdAt: new Date().toISOString(),
      })
    }

    return results.slice(0, 2)
  }


  private checkTopicPracticeSuggestion(
    currentPage: string,
    memory: TutorMemory,
  ): ProactiveMessage[] {
    const results: ProactiveMessage[] = []

    switch (currentPage) {
      case 'vocabulary':
        results.push({
          id: generateId(),
          triggerType: 'topic_practice_suggestion',
          category: 'vocabulary-review',
          title: 'Review Your Vocabulary',
          message: 'You are on the Vocabulary page. I can help you practice with a quick quiz!',
          priority: 'low',
          action: { type: 'action', label: 'Quiz Me', payload: { action: 'quiz-me' } },
          isRead: false,
          isDismissed: false,
          isSnoozed: false,
          createdAt: new Date().toISOString(),
        })
        break
      case 'writing':
        results.push({
          id: generateId(),
          triggerType: 'topic_practice_suggestion',
          category: 'writing-practice',
          title: 'Need Writing Feedback?',
          message: 'I can review your essay and give you band-specific feedback to help you improve.',
          priority: 'low',
          action: { type: 'action', label: 'Get Feedback', payload: { action: 'practice-with-me' } },
          isRead: false,
          isDismissed: false,
          isSnoozed: false,
          createdAt: new Date().toISOString(),
        })
        break
      case 'speaking':
        results.push({
          id: generateId(),
          triggerType: 'topic_practice_suggestion',
          category: 'speaking-practice',
          title: 'Speaking Partner Available',
          message: 'I can act as your Speaking test partner. Let\'s practice Part 1, 2, or 3!',
          priority: 'low',
          action: { type: 'action', label: 'Start Speaking', payload: { action: 'practice-with-me' } },
          isRead: false,
          isDismissed: false,
          isSnoozed: false,
          createdAt: new Date().toISOString(),
        })
        break
      case 'reading':
        results.push({
          id: generateId(),
          triggerType: 'topic_practice_suggestion',
          category: 'saved-content',
          title: 'Analyze This Reading',
          message: 'I can help you understand this passage, explain difficult sentences, and generate comprehension questions.',
          priority: 'low',
          action: { type: 'action', label: 'Explain Passage', payload: { action: 'teach-me' } },
          isRead: false,
          isDismissed: false,
          isSnoozed: false,
          createdAt: new Date().toISOString(),
        })
        break
      case 'mistakes':
        results.push({
          id: generateId(),
          triggerType: 'topic_practice_suggestion',
          category: 'mistake-review',
          title: 'Fix Your Mistakes',
          message: 'I can explain each mistake and create practice drills to help you avoid repeating them.',
          priority: 'low',
          action: { type: 'action', label: 'Explain Mistakes', payload: { action: 'teach-me' } },
          isRead: false,
          isDismissed: false,
          isSnoozed: false,
          createdAt: new Date().toISOString(),
        })
        break
      case 'dashboard':
        if (memory.weakPoints.length > 0) {
          const topWeakness = memory.weakPoints[0]
          results.push({
            id: generateId(),
            triggerType: 'topic_practice_suggestion',
            category: 'study-plan',
            title: 'Recommended: Improve ' + topWeakness.skill.charAt(0).toUpperCase() + topWeakness.skill.slice(1),
            message: topWeakness.description,
            priority: 'low',
            action: { type: 'practice', label: 'Start Practice', payload: { skill: topWeakness.skill } },
            isRead: false,
            isDismissed: false,
            isSnoozed: false,
            createdAt: new Date().toISOString(),
          })
        }
        break
    }

    return results
  }


  private async generateAIEnhancedMessages(
    settings: AppSettings,
  ): Promise<ProactiveMessage[]> {
    if (!settings.aiApiKey) return []

    try {
      const memory = await LocalTutorStorage.loadMemory().catch(() => null)
      const mistakes = await DatabaseService.getAll<MistakeEntry>('mistakes').catch(() => [] as MistakeEntry[])
      const vocab = await DatabaseService.getAll<VocabularyEntry>('vocabulary').catch(() => [] as VocabularyEntry[])

      const lastStudyDate = memory?.lastStudyDate ? new Date(memory.lastStudyDate) : null
      const lastStudyDaysAgo = lastStudyDate
        ? Math.floor((Date.now() - lastStudyDate.getTime()) / 86_400_000)
        : 0

      const message = await aiGenerateProactiveMessage({
        streak: memory?.learningStreak || 0,
        weakSkills: settings.weakSkills || [],
        examCountdownDays: settings.examDate
          ? Math.max(0, Math.ceil((new Date(settings.examDate).getTime() - Date.now()) / 86_400_000))
          : 0,
        dueVocabularyCount: vocab.length,
        mistakeCount: mistakes.filter(m => m.status !== 'resolved').length,
        lastStudyDaysAgo,
        todayUnfinishedTasks: 0,
      }, 'english')

      const uniqueSuffix = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)

      return [{
        id: generateId() + '-ai-' + uniqueSuffix,
        triggerType: 'topic_practice_suggestion',
        category: 'motivation',
        title: 'AI Coach Suggestion',
        message,
        priority: 'low',
        action: {
          type: 'navigate',
          label: 'Open AI Tutor',
          payload: { path: '/tutor' },
        },
        isRead: false,
        isDismissed: false,
        isSnoozed: false,
        createdAt: new Date().toISOString(),
      }]
    } catch {
      return []
    }
  }


  getAllMessages(): ProactiveMessage[] {
    return loadMessages()
  }

  addExternalMessage(msg: ProactiveMessage): void {
    const existing = loadMessages()
    if (!existing.some(m => m.id === msg.id)) {
      saveMessages([...existing, msg])
      this.notifyListeners(msg)
    }
  }

  getUnreadCount(): number {
    return loadMessages().filter(m => !m.isRead && !m.isDismissed && !m.isSnoozed).length
  }

  getPendingMessages(): ProactiveMessage[] {
    const now = new Date().toISOString()
    return loadMessages().filter(m => {
      if (m.isDismissed) return false
      if (m.isSnoozed && m.snoozedUntil && m.snoozedUntil > now) return false
      return true
    })
  }

  getMessagesByCategory(category: ProactiveMessageCategory): ProactiveMessage[] {
    return loadMessages().filter(m => m.category === category)
  }

  getMessagesByTrigger(triggerType: ProactiveMessageTriggerType): ProactiveMessage[] {
    return loadMessages().filter(m => m.triggerType === triggerType)
  }

  markAsRead(id: string): void {
    const messages = loadMessages()
    const msg = messages.find(m => m.id === id)
    if (msg) {
      msg.isRead = true
      saveMessages(messages)
    }
  }

  markAllAsRead(): void {
    const messages = loadMessages()
    for (const m of messages) {
      m.isRead = true
    }
    saveMessages(messages)
  }

  dismissMessage(id: string): void {
    const messages = loadMessages()
    const msg = messages.find(m => m.id === id)
    if (msg) {
      msg.isDismissed = true
      saveMessages(messages)
    }
  }

  snoozeMessage(id: string, until?: Date): void {
    const messages = loadMessages()
    const msg = messages.find(m => m.id === id)
    if (msg) {
      msg.isSnoozed = true
      msg.snoozedUntil = (until || new Date(Date.now() + 3600_000)).toISOString()
      saveMessages(messages)
    }
  }

  deleteMessage(id: string): void {
    const messages = loadMessages()
    saveMessages(messages.filter(m => m.id !== id))
  }

  clearAllMessages(): void {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {}
  }


  async forceGenerate(): Promise<ProactiveMessage[]> {
    const messages = await this.analyzeAndGenerate()
    const existing = loadMessages()
    for (const msg of messages) {
      if (!this.isDuplicateMessage(existing, msg)) {
        existing.push(msg)
      }
    }
    saveMessages(existing)
    return messages
  }
}


export const proactiveMessageEngine = new ProactiveMessageEngine()
export default proactiveMessageEngine
