import { learningEventRepository } from '../learningEvents/learningEventRepository'
import type { LearningEvent } from '../learningEvents/types'
import { cooldownManager } from './CooldownManager'
import { loadAppSettings } from '../../services/storage/SettingsStorage'
import { VocabReviewRepository, CustomStudyPlanRepository } from '@ielts/storage'
import type {
  ProactiveTutorContext,
  ProactiveMessageRecord,
  DismissedMessage,
  RuleEngineInput,
} from './ProactiveTutorRuleEngine'

const LAST_ACTIVE_KEY = 'ielts-proactive-last-active'
const SESSION_START_KEY = 'ielts-proactive-session-start'
const RECENT_MESSAGES_KEY = 'ielts-proactive-recent-messages'
const DISMISSED_MESSAGES_KEY = 'ielts-proactive-dismissed-messages'
const CONSECUTIVE_MISSED_KEY = 'ielts-proactive-consecutive-missed'
const STREAK_KEY = 'ielts-proactive-streak'

function getSessionStart(): string {
  try {
    const stored = localStorage.getItem(SESSION_START_KEY)
    if (stored) return stored
  } catch {
    /* ignore */
  }
  const now = new Date().toISOString()
  try {
    localStorage.setItem(SESSION_START_KEY, now)
  } catch {
    /* ignore */
  }
  return now
}

function getLastActiveTime(): string | null {
  try {
    return localStorage.getItem(LAST_ACTIVE_KEY)
  } catch {
    return null
  }
}

function getConsecutiveMissedDays(): number {
  try {
    const raw = localStorage.getItem(CONSECUTIVE_MISSED_KEY)
    if (raw) return parseInt(raw, 10)
  } catch {
    /* ignore */
  }
  return 0
}

function getCurrentStreak(): number {
  try {
    const raw = localStorage.getItem(STREAK_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as { current: number; total: number }
      return parsed.current
    }
  } catch {
    /* ignore */
  }
  return 0
}

function getTotalStreak(): number {
  try {
    const raw = localStorage.getItem(STREAK_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as { current: number; total: number }
      return parsed.total
    }
  } catch {
    /* ignore */
  }
  return 0
}

function getRecentMessages(): ProactiveMessageRecord[] {
  try {
    const raw = localStorage.getItem(RECENT_MESSAGES_KEY)
    if (raw) return JSON.parse(raw) as ProactiveMessageRecord[]
  } catch {
    /* ignore */
  }
  return []
}

function getDismissedMessages(): DismissedMessage[] {
  try {
    const raw = localStorage.getItem(DISMISSED_MESSAGES_KEY)
    if (raw) return JSON.parse(raw) as DismissedMessage[]
  } catch {
    /* ignore */
  }
  return []
}

async function countEventsSince(since: string, eventType: LearningEvent['eventType']): Promise<number> {
  try {
    const events = await learningEventRepository.findByDateRange(since, new Date().toISOString())
    return events.filter(e => e.eventType === eventType).length
  } catch {
    return 0
  }
}

function calculateDaysUntilExam(examDate: string): number {
  const exam = new Date(examDate.slice(0, 10) + 'T00:00:00.000Z')
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.max(0, Math.ceil((exam.getTime() - now.getTime()) / 86_400_000))
}

async function getRecentAccuracy(): Promise<number | null> {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const practiceEvents = await learningEventRepository.findByDateRange(sevenDaysAgo, new Date().toISOString())
    const completedPractice = practiceEvents.filter(e =>
      e.eventType === 'reading_practice_completed' ||
      e.eventType === 'listening_practice_completed'
    )
    if (completedPractice.length === 0) return null

    let totalCorrect = 0
    let totalQuestions = 0
    for (const event of completedPractice) {
      const payload = event.payload as Record<string, unknown>
      const correct = payload.correctAnswers as number | undefined
      const total = payload.totalQuestions as number | undefined
      if (typeof correct === 'number' && typeof total === 'number' && total > 0) {
        totalCorrect += correct
        totalQuestions += total
      }
    }
    if (totalQuestions === 0) return null
    return Math.round((totalCorrect / totalQuestions) * 100)
  } catch {
    return null
  }
}

const vocabReviewRepo = new VocabReviewRepository()
const customStudyPlanRepo = new CustomStudyPlanRepository()

async function getDueVocabularyCount(): Promise<number> {
  try {
    return await vocabReviewRepo.getDueCount()
  } catch {
    return 0
  }
}

async function getTodayPlanStatus(): Promise<{ complete: boolean; pending: number }> {
  try {
    const activePlan = await customStudyPlanRepo.findActive()
    if (!activePlan || !activePlan.isActive) return { complete: false, pending: 0 }

    const pending = activePlan.tasks.filter(t => !t.isDone).length
    const total = activePlan.tasks.length
    if (total === 0) return { complete: false, pending: 0 }

    return { complete: pending === 0, pending }
  } catch {
    return { complete: false, pending: 0 }
  }
}

async function getSessionCounts(event?: LearningEvent): Promise<{
  sessionVocabularyCount: number
  sessionMistakeCount: number
}> {
  const sessionStart = getSessionStart()
  try {
    const [
      sessionVocabularyEvents,
      sessionMistakeEvents,
    ] = await Promise.all([
      countEventsSince(sessionStart, 'vocabulary_saved'),
      countEventsSince(sessionStart, 'mistake_saved'),
    ])

    let sessionVocabularyCount = sessionVocabularyEvents
    let sessionMistakeCount = sessionMistakeEvents

    if (event && event.eventType === 'vocabulary_saved') {
      const payloadEvent = event as LearningEvent & { payload: { sessionWordCount?: number } }
      if (typeof payloadEvent.payload.sessionWordCount === 'number') {
        sessionVocabularyCount = payloadEvent.payload.sessionWordCount
      } else {
        sessionVocabularyCount++
      }
    }

    if (event && event.eventType === 'mistake_saved') {
      const payloadEvent = event as LearningEvent & { payload: { sessionMistakeCount?: number } }
      if (typeof payloadEvent.payload.sessionMistakeCount === 'number') {
        sessionMistakeCount = payloadEvent.payload.sessionMistakeCount
      } else {
        sessionMistakeCount++
      }
    }

    return { sessionVocabularyCount, sessionMistakeCount }
  } catch {
    return { sessionVocabularyCount: 0, sessionMistakeCount: 0 }
  }
}

export class ProactiveTutorContextBuilder {
  async buildContext(event?: LearningEvent): Promise<ProactiveTutorContext> {
    const appSettings = loadAppSettings()

    const [
      dailyVocabularySaved,
      weeklyVocabularySaved,
      dueVocabularyCount,
      dailyMistakeSaved,
      dailyTasksCompleted,
      dailyTasksSkipped,
      sessionCounts,
      todayPlan,
      recentAccuracy,
    ] = await Promise.all([
      this.safeCount('vocabulary_saved', 'today'),
      this.safeCount('vocabulary_saved', 'last_7_days'),
      getDueVocabularyCount(),
      this.safeCount('mistake_saved', 'today'),
      this.safeCount('study_task_completed', 'today'),
      this.safeCount('study_task_skipped', 'today'),
      getSessionCounts(event),
      getTodayPlanStatus(),
      getRecentAccuracy(),
    ])

    const repeatedMistakeCount = (event && event.eventType === 'repeated_mistake_detected')
      ? ((event.payload as Record<string, unknown>).repetitionCount as number) ?? 0
      : 0

    const examDate = appSettings.examDate || null
    const daysUntilExam = examDate ? calculateDaysUntilExam(examDate) : null
    const targetBand = appSettings.targetBand > 0 ? appSettings.targetBand : null
    const lastActiveAt = getLastActiveTime()
    const inactiveMinutes = lastActiveAt
      ? Math.floor((Date.now() - new Date(lastActiveAt).getTime()) / 60_000)
      : 0

    return {
      sessionVocabularyCount: sessionCounts.sessionVocabularyCount,
      dailyVocabularySaved,
      weeklyVocabularySaved,
      dueVocabularyCount,
      sessionMistakeCount: sessionCounts.sessionMistakeCount,
      dailyMistakeSaved,
      repeatedMistakeCount,
      dailyTasksCompleted,
      dailyTasksSkipped,
      consecutiveMissedDays: getConsecutiveMissedDays(),
      currentStreak: getCurrentStreak(),
      totalStreak: getTotalStreak(),
      targetBand,
      examDate,
      daysUntilExam,
      todayPlanComplete: todayPlan.complete,
      pendingTasksCount: todayPlan.pending,
      weakSkills: appSettings.weakSkills ?? [],
      lastActiveAt,
      inactiveMinutes,
      recentAccuracy,
    }
  }

  async buildEngineInput(
    event: LearningEvent,
    options?: {
      currentPage?: string
      isUserChattingWithTutor?: boolean
    },
  ): Promise<RuleEngineInput> {
    const context = await this.buildContext(event)
    const cooldownState = cooldownManager.getState()

    return {
      event,
      context,
      cooldownState,
      recentMessages: getRecentMessages(),
      dismissedMessages: getDismissedMessages(),
      currentPage: options?.currentPage ?? (typeof window !== 'undefined' ? window.location.pathname : '/'),
      isUserChattingWithTutor: options?.isUserChattingWithTutor ?? false,
    }
  }

  private async safeCount(eventType: LearningEvent['eventType'], window: 'today' | 'last_7_days'): Promise<number> {
    try {
      return await learningEventRepository.countInWindow(eventType, window)
    } catch {
      return 0
    }
  }
}

export const proactiveTutorContextBuilder = new ProactiveTutorContextBuilder()
