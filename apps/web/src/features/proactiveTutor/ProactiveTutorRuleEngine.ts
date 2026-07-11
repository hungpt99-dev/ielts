import type { ISOString } from '@/types'
import type {
  LearningEvent,
  LearningEventType,
  ProactiveDecision,
  DecisionAction,
  MessagePriority,
} from '../learningEvents/types'
import { proactiveTutorSettingsRepository } from './ProactiveTutorSettingsRepository'
import type { StudyReminderToggle } from './ProactiveTutorSettingsRepository'

// ─── Context Types ──────────────────────────────────────────────────────────

export interface ProactiveTutorContext {
  sessionVocabularyCount: number
  dailyVocabularySaved: number
  weeklyVocabularySaved: number
  dueVocabularyCount: number
  sessionMistakeCount: number
  dailyMistakeSaved: number
  repeatedMistakeCount: number
  dailyTasksCompleted: number
  dailyTasksSkipped: number
  consecutiveMissedDays: number
  currentStreak: number
  totalStreak: number
  targetBand: number | null
  examDate: ISOString | null
  daysUntilExam: number | null
  todayPlanComplete: boolean
  pendingTasksCount: number
  weakSkills: string[]
  lastActiveAt: ISOString | null
  inactiveMinutes: number
  recentAccuracy: number | null
}

export interface CooldownEntry {
  lastMessageAt: ISOString | null
}

export interface CooldownState {
  global: CooldownEntry
  byEventType: Record<string, CooldownEntry>
}

export interface ProactiveMessageRecord {
  id: string
  eventId: string
  eventType: string
  messageType: string
  priority: string
  status: 'pending' | 'shown' | 'dismissed' | 'clicked' | 'expired'
  createdAt: ISOString
}

export interface DismissedMessage {
  id: string
  eventType: string
  messageType: string
  dismissedAt: ISOString
}

export interface RuleEngineInput {
  event: LearningEvent
  context: ProactiveTutorContext
  cooldownState: CooldownState
  recentMessages: ProactiveMessageRecord[]
  dismissedMessages: DismissedMessage[]
  currentPage: string
  isUserChattingWithTutor: boolean
}

export interface AggregationThreshold {
  count: number
  window: 'current_session' | 'today'
}

// ─── Event Type → Category Mapping ──────────────────────────────────────────

const EVENT_TYPE_TO_CATEGORY: Partial<Record<LearningEventType, StudyReminderToggle>> = {
  study_task_skipped: 'dailyStudyReminder',
  study_day_missed: 'dailyStudyReminder',
  study_day_completed: 'dailyStudyReminder',
  daily_study_reminder_is_due: 'dailyStudyReminder',
  vocabulary_saved: 'vocabularyReminder',
  vocabulary_reviewed: 'vocabularyReminder',
  vocabulary_forgotten: 'vocabularyReminder',
  vocabulary_mastered: 'vocabularyReminder',
  vocabulary_review_is_due: 'vocabularyReminder',
  mistake_saved: 'mistakeReminder',
  repeated_mistake_detected: 'mistakeReminder',
  progress_viewed: 'progressReviewReminder',
  ai_progress_review_generated: 'progressReviewReminder',
  weekly_progress_review_is_due: 'progressReviewReminder',
  streak_milestone_reached: 'motivationalMessage',
  study_plan_generated: 'motivationalMessage',
  study_task_completed: 'motivationalMessage',
  reading_practice_completed: 'motivationalMessage',
  listening_practice_completed: 'motivationalMessage',
  writing_submitted: 'motivationalMessage',
  speaking_practiced: 'motivationalMessage',
  extension_popup_opened: 'extensionProactiveMessage',
  extension_vocabulary_saved: 'extensionProactiveMessage',
  extension_selected_text_explained: 'extensionProactiveMessage',
  extension_selected_text_simplified: 'extensionProactiveMessage',
  extension_selected_text_saved: 'extensionProactiveMessage',
  extension_vocabulary_review_started: 'extensionProactiveMessage',
  extension_ai_tutor_opened: 'extensionProactiveMessage',
}

// ─── Event Type → Message Type Mapping ──────────────────────────────────────

const EVENT_TYPE_TO_MESSAGE_TYPE: Partial<Record<LearningEventType, string>> = {
  study_task_skipped: 'study_reminder',
  study_day_missed: 'missed_study',
  study_day_completed: 'study_day_completed',
  study_plan_generated: 'study_plan_ready',
  daily_study_reminder_is_due: 'study_reminder',
  vocabulary_saved: 'vocabulary_saved',
  vocabulary_reviewed: 'vocabulary_reviewed',
  vocabulary_forgotten: 'vocabulary_forgotten',
  vocabulary_mastered: 'vocabulary_mastered',
  vocabulary_review_is_due: 'vocabulary_review_due',
  mistake_saved: 'mistake_saved',
  repeated_mistake_detected: 'repeated_mistake',
  progress_viewed: 'progress_viewed',
  ai_progress_review_generated: 'progress_review',
  weekly_progress_review_is_due: 'weekly_review_due',
  streak_milestone_reached: 'streak_milestone',
  exam_date_is_close: 'exam_countdown',
  reading_practice_completed: 'practice_completed',
  listening_practice_completed: 'practice_completed',
  writing_submitted: 'writing_completed',
  speaking_practiced: 'speaking_completed',
  study_task_completed: 'task_completed',
  scheduled_check_triggered: 'scheduled_check',
  user_returned_after_inactivity: 'return_after_inactivity',
  extension_popup_opened: 'extension_popup_opened',
  extension_vocabulary_saved: 'vocabulary_saved_ext',
  extension_vocabulary_review_started: 'vocabulary_review_started_ext',
  extension_ai_tutor_opened: 'extension_ai_tutor_opened',
  extension_selected_text_explained: 'text_explained',
  extension_selected_text_simplified: 'text_simplified',
}

// ─── Cooldown Configuration (milliseconds) ──────────────────────────────────

const COOLDOWN_MS: Record<string, number> = {
  global: 20 * 60 * 1000,
  missed_study: 24 * 60 * 60 * 1000,
  study_reminder: 24 * 60 * 60 * 1000,
  vocabulary_review_due: 12 * 60 * 60 * 1000,
  vocabulary_saved: 4 * 60 * 60 * 1000,
  vocabulary_saved_ext: 4 * 60 * 60 * 1000,
  mistake_saved: 4 * 60 * 60 * 1000,
  repeated_mistake: 24 * 60 * 60 * 1000,
  progress_review: 7 * 24 * 60 * 60 * 1000,
  weekly_review_due: 7 * 24 * 60 * 60 * 1000,
  streak_milestone: 24 * 60 * 60 * 1000,
  exam_countdown: 24 * 60 * 60 * 1000,
  return_after_inactivity: 24 * 60 * 60 * 1000,
  scheduled_check: 60 * 60 * 1000,
}

// ─── Aggregation Thresholds ─────────────────────────────────────────────────

const AGGREGATION_THRESHOLDS: Partial<Record<LearningEventType, AggregationThreshold>> = {
  vocabulary_saved: { count: 5, window: 'current_session' },
  mistake_saved: { count: 3, window: 'current_session' },
  study_task_skipped: { count: 2, window: 'today' },
  study_task_completed: { count: 5, window: 'today' },
}

// ─── Default Priority Mapping ───────────────────────────────────────────────

const PRIORITY_BY_EVENT_TYPE: Partial<Record<LearningEventType, MessagePriority>> = {
  exam_date_is_close: 'normal',
  study_day_missed: 'high',
  repeated_mistake_detected: 'high',
  streak_milestone_reached: 'high',
  user_returned_after_inactivity: 'normal',
  vocabulary_review_is_due: 'normal',
  ai_progress_review_generated: 'normal',
  weekly_progress_review_is_due: 'normal',
  daily_study_reminder_is_due: 'normal',
  study_plan_generated: 'normal',
  vocabulary_saved: 'low',
  mistake_saved: 'low',
  progress_viewed: 'low',
  study_task_completed: 'low',
  study_task_skipped: 'low',
  reading_practice_completed: 'low',
  listening_practice_completed: 'low',
  writing_submitted: 'low',
  speaking_practiced: 'low',
  scheduled_check_triggered: 'low',
}

// ─── Rule Engine ────────────────────────────────────────────────────────────

export class ProactiveTutorRuleEngine {
  evaluate(input: RuleEngineInput): ProactiveDecision {
    const { event, context, cooldownState, recentMessages, dismissedMessages, isUserChattingWithTutor } = input

    const settings = proactiveTutorSettingsRepository.get()
    if (!settings.enabled) {
      return this.decision(false, 'Proactive tutor is disabled', 'ignore_event', 'low')
    }

    const category = EVENT_TYPE_TO_CATEGORY[event.eventType]
    if (category) {
      if (!settings[category]) {
        return this.decision(false, `Category "${category}" is disabled`, 'ignore_event', 'low')
      }
    }

    if (proactiveTutorSettingsRepository.isInQuietHours()) {
      const delayUntil = this.calculateQuietHoursEnd()
      return this.decision(false, 'Quiet hours are active', 'delay_message', 'low', null, null, delayUntil)
    }

    const dailyRemaining = proactiveTutorSettingsRepository.getDailyRemaining()
    if (dailyRemaining <= 0) {
      return this.decision(false, 'Maximum daily messages reached', 'store_silent', 'low')
    }

    if (this.isOnCooldown(cooldownState.global.lastMessageAt, COOLDOWN_MS.global)) {
      return this.decision(false, 'Global cooldown active', 'store_silent', 'low')
    }

    const messageType = EVENT_TYPE_TO_MESSAGE_TYPE[event.eventType] ?? event.eventType
    const typeCooldownMs = COOLDOWN_MS[messageType]
    if (typeCooldownMs) {
      const cooldownKey = this.makeCooldownKey(event, messageType)
      const lastByType = cooldownState.byEventType[cooldownKey]
      if (lastByType?.lastMessageAt && this.isOnCooldown(lastByType.lastMessageAt, typeCooldownMs)) {
        return this.decision(false, `Cooldown active for "${messageType}"`, 'store_silent', 'low')
      }
    }

    if (isUserChattingWithTutor) {
      return this.decision(false, 'User is currently chatting with AI Tutor', 'store_silent', 'low')
    }

    if (this.wasRecentlyDismissed(dismissedMessages, event.eventType, messageType)) {
      return this.decision(false, 'Similar message was recently dismissed', 'ignore_event', 'low')
    }

    const aggregationThreshold = AGGREGATION_THRESHOLDS[event.eventType]
    if (aggregationThreshold) {
      const currentCount = this.getAggregationCount(event, context, aggregationThreshold)
      if (currentCount < aggregationThreshold.count) {
        return this.decision(false, `Below aggregation threshold for "${event.eventType}"`, 'store_silent', 'low', messageType)
      }
    }

    if (this.findPendingMessage(recentMessages, messageType)) {
      return this.decision(false, 'Similar message already pending', 'merge_with_existing', 'low', messageType)
    }

    const priority = this.calculatePriority(event, context)
    const suggestedAction = this.getSuggestedAction(event)

    return {
      shouldShow: true,
      reason: 'Event passed all rules',
      priority,
      messageType,
      suggestedAction,
      cooldownKey: this.makeCooldownKey(event, messageType),
      delayUntil: null,
    }
  }

  evaluateEventType(
    eventType: LearningEventType,
    context: ProactiveTutorContext,
    cooldownState: CooldownState,
    recentMessages: ProactiveMessageRecord[],
    dismissedMessages: DismissedMessage[],
    currentPage: string,
    isUserChattingWithTutor: boolean,
  ): ProactiveDecision {
    const now = new Date().toISOString()
    const mockEvent = {
      eventId: '',
      eventType,
      source: 'website' as const,
      timestamp: now,
      page: currentPage,
      entityType: null,
      entityId: null,
      payload: { eventType },
      metadata: {},
      sessionId: '',
      correlationId: null,
      createdAt: now,
      syncStatus: 'local_only' as const,
    } as unknown as LearningEvent

    return this.evaluate({
      event: mockEvent,
      context,
      cooldownState,
      recentMessages,
      dismissedMessages,
      currentPage,
      isUserChattingWithTutor,
    })
  }

  isCategoryEnabledForEvent(eventType: LearningEventType): boolean {
    const settings = proactiveTutorSettingsRepository.get()
    if (!settings.enabled) return false
    const category = EVENT_TYPE_TO_CATEGORY[eventType]
    if (!category) return false
    return settings[category]
  }

  getMessageType(eventType: LearningEventType): string {
    return EVENT_TYPE_TO_MESSAGE_TYPE[eventType] ?? eventType
  }

  getCooldownMs(messageType: string): number | undefined {
    return COOLDOWN_MS[messageType]
  }

  // ─── Private Helpers ─────────────────────────────────────────────────────

  private decision(
    shouldShow: boolean,
    reason: string,
    action: DecisionAction,
    priority: MessagePriority,
    messageType?: string | null,
    suggestedAction?: string | null,
    delayUntil?: ISOString | null,
  ): ProactiveDecision {
    return {
      shouldShow,
      reason,
      priority,
      messageType: messageType ?? null,
      suggestedAction: suggestedAction ?? null,
      cooldownKey: null,
      delayUntil: delayUntil ?? null,
    }
  }

  private isOnCooldown(lastMessageAt: ISOString | null, cooldownMs: number): boolean {
    if (!lastMessageAt) return false
    return Date.now() - new Date(lastMessageAt).getTime() < cooldownMs
  }

  private wasRecentlyDismissed(
    dismissedMessages: DismissedMessage[],
    eventType: LearningEventType,
    messageType: string,
  ): boolean {
    const cooldownMs = COOLDOWN_MS[messageType] ?? 24 * 60 * 60 * 1000
    const cutoff = Date.now() - cooldownMs
    return dismissedMessages.some(
      m =>
        (m.eventType === eventType || m.messageType === messageType) &&
        new Date(m.dismissedAt).getTime() > cutoff,
    )
  }

  private getAggregationCount(
    event: LearningEvent,
    context: ProactiveTutorContext,
    threshold: AggregationThreshold,
  ): number {
    switch (event.eventType) {
      case 'vocabulary_saved':
        return threshold.window === 'current_session'
          ? context.sessionVocabularyCount
          : context.dailyVocabularySaved
      case 'mistake_saved':
        return threshold.window === 'current_session'
          ? context.sessionMistakeCount
          : context.dailyMistakeSaved
      case 'study_task_skipped':
        return context.dailyTasksSkipped
      case 'study_task_completed':
        return context.dailyTasksCompleted
      default:
        return 1
    }
  }

  private findPendingMessage(
    recentMessages: ProactiveMessageRecord[],
    messageType: string,
  ): ProactiveMessageRecord | undefined {
    return recentMessages.find(m => m.messageType === messageType && m.status === 'pending')
  }

  private calculatePriority(event: LearningEvent, context: ProactiveTutorContext): MessagePriority {
    if (event.eventType === 'exam_date_is_close') {
      const p = event.payload as { daysRemaining?: number; tasksIncomplete?: number }
      if (p.daysRemaining !== undefined && p.daysRemaining <= 7 && (p.tasksIncomplete ?? 0) > 5) {
        return 'urgent'
      }
      if (p.daysRemaining !== undefined && p.daysRemaining <= 7) {
        return 'high'
      }
    }

    if (event.eventType === 'study_day_missed' && context.consecutiveMissedDays >= 3) {
      return 'urgent'
    }

    if (event.eventType === 'streak_milestone_reached') {
      if (context.totalStreak >= 30) return 'urgent'
      if (context.totalStreak >= 7) return 'high'
      return 'normal'
    }

    if (event.eventType === 'repeated_mistake_detected') {
      if (context.repeatedMistakeCount >= 5) return 'urgent'
      return 'high'
    }

    if (event.eventType === 'user_returned_after_inactivity' && context.consecutiveMissedDays >= 3) {
      return 'high'
    }

    const staticPriority = PRIORITY_BY_EVENT_TYPE[event.eventType]
    if (staticPriority) return staticPriority

    return 'low'
  }

  private getSuggestedAction(event: LearningEvent): string | null {
    switch (event.eventType) {
      case 'vocabulary_saved':
      case 'vocabulary_review_is_due':
      case 'vocabulary_reviewed':
        return 'review_vocabulary'
      case 'mistake_saved':
      case 'repeated_mistake_detected':
        return 'review_mistakes'
      case 'study_task_skipped':
      case 'study_day_missed':
        return 'adjust_plan'
      case 'study_plan_generated':
        return 'view_plan'
      case 'reading_practice_completed':
        return 'review_reading'
      case 'listening_practice_completed':
        return 'review_listening'
      case 'writing_submitted':
        return 'review_writing'
      case 'speaking_practiced':
        return 'review_speaking'
      case 'exam_date_is_close':
        return 'view_exam_prep'
      case 'weekly_progress_review_is_due':
      case 'ai_progress_review_generated':
        return 'view_progress'
      case 'streak_milestone_reached':
        return 'view_streak'
      case 'user_returned_after_inactivity':
        return 'resume_study'
      default:
        return null
    }
  }

  private makeCooldownKey(event: LearningEvent, messageType: string): string {
    const entityId = event.entityId ?? ''
    return entityId ? `${messageType}:${entityId}` : messageType
  }

  private calculateQuietHoursEnd(): ISOString {
    const { quietHoursEnd } = proactiveTutorSettingsRepository.get()
    const [endH, endM] = quietHoursEnd.split(':').map(Number)
    const now = new Date()
    const end = new Date(now)
    end.setHours(endH, endM, 0, 0)
    if (end.getTime() <= now.getTime()) {
      end.setDate(end.getDate() + 1)
    }
    return end.toISOString()
  }
}

export const proactiveTutorRuleEngine = new ProactiveTutorRuleEngine()
