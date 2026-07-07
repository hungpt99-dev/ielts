import type { ISOString } from '@/types'

// ─── Event Types ─────────────────────────────────────────────────────────────

export const LEARNING_EVENT_TYPES = [
  'app_opened',
  'dashboard_opened',
  'ai_tutor_opened',
  'today_plan_opened',
  'study_task_started',
  'study_task_completed',
  'study_task_skipped',
  'study_day_completed',
  'study_day_missed',
  'study_plan_generated',
  'study_roadmap_viewed',
  'vocabulary_saved',
  'vocabulary_reviewed',
  'vocabulary_forgotten',
  'vocabulary_mastered',
  'selected_text_saved',
  'article_saved',
  'selected_text_explained',
  'selected_text_simplified',
  'reading_practice_completed',
  'listening_practice_completed',
  'writing_submitted',
  'speaking_practiced',
  'mistake_saved',
  'repeated_mistake_detected',
  'progress_viewed',
  'ai_progress_review_generated',
  'settings_changed',
  'ai_provider_configured',
  'user_became_inactive',
  'user_returned_after_inactivity',
  'streak_milestone_reached',
  'exam_date_is_close',
  'vocabulary_review_is_due',
  'weekly_progress_review_is_due',
  'daily_study_reminder_is_due',
  'scheduled_check_triggered',
  'extension_popup_opened',
  'extension_selected_text_detected',
  'extension_vocabulary_saved',
  'extension_selected_text_saved',
  'extension_article_saved',
  'extension_auto_highlight_enabled',
  'extension_auto_highlight_disabled',
  'extension_vocabulary_review_started',
  'extension_ai_tutor_opened',
  'extension_selected_text_explained',
  'extension_selected_text_simplified',
] as const

export type LearningEventType = typeof LEARNING_EVENT_TYPES[number]

// ─── Event Sources ───────────────────────────────────────────────────────────

export const LEARNING_EVENT_SOURCES = [
  'website',
  'extension_popup',
  'extension_content_script',
  'local_scheduler',
  'ai_tutor',
  'study_plan',
  'vocabulary',
  'practice',
  'progress',
  'settings',
] as const

export type LearningEventSource = typeof LEARNING_EVENT_SOURCES[number]

// ─── Sync Status ─────────────────────────────────────────────────────────────

export const SYNC_STATUSES = [
  'local_only',
  'pending_sync',
  'synced',
  'sync_failed',
] as const

export type SyncStatus = typeof SYNC_STATUSES[number]

// ─── Entity Types ────────────────────────────────────────────────────────────

export type LearningEntityType =
  | 'vocabulary'
  | 'task'
  | 'mistake'
  | 'article'
  | 'selected_text'
  | 'study_plan'
  | 'progress'
  | 'reading'
  | 'listening'
  | 'writing'
  | 'speaking'
  | 'settings'
  | 'ai_tutor'
  | 'dashboard'
  | 'today_plan'
  | 'roadmap'
  | 'extension'
  | 'user_session'

// ─── Event Payloads (Discriminated Union) ────────────────────────────────────

export interface AppOpenedPayload {
  eventType: 'app_opened'
  lastActiveAt: ISOString | null
  isReturnVisit: boolean
}

export interface DashboardOpenedPayload {
  eventType: 'dashboard_opened'
  activeTasks: number
}

export interface AITutorOpenedPayload {
  eventType: 'ai_tutor_opened'
  previousMessageCount: number
}

export interface TodayPlanOpenedPayload {
  eventType: 'today_plan_opened'
  pendingTasks: number
  completedTasks: number
}

export interface StudyTaskStartedPayload {
  eventType: 'study_task_started'
  taskId: string
  taskTitle: string
  taskCategory: string
  estimatedMinutes: number
}

export interface StudyTaskCompletedPayload {
  eventType: 'study_task_completed'
  taskId: string
  taskTitle: string
  taskCategory: string
  timeSpentMinutes: number
}

export interface StudyTaskSkippedPayload {
  eventType: 'study_task_skipped'
  taskId: string
  taskTitle: string
  taskCategory: string
}

export interface StudyDayCompletedPayload {
  eventType: 'study_day_completed'
  date: ISOString
  totalMinutes: number
  tasksCompleted: number
}

export interface StudyDayMissedPayload {
  eventType: 'study_day_missed'
  missedDate: ISOString
  consecutiveMissedDays: number
}

export interface StudyPlanGeneratedPayload {
  eventType: 'study_plan_generated'
  planId: string
  totalTasks: number
  totalMinutes: number
}

export interface StudyRoadmapViewedPayload {
  eventType: 'study_roadmap_viewed'
  roadmapId: string
  weeksPlanned: number
}

export interface VocabularySavedPayload {
  eventType: 'vocabulary_saved'
  vocabularyId: string
  word: string
  topic: string
  sessionWordCount: number
}

export interface VocabularyReviewedPayload {
  eventType: 'vocabulary_reviewed'
  vocabularyId: string
  word: string
  rating: 'again' | 'hard' | 'good' | 'easy'
  sessionReviewCount: number
}

export interface VocabularyForgottenPayload {
  eventType: 'vocabulary_forgotten'
  vocabularyId: string
  word: string
  timesForgotten: number
}

export interface VocabularyMasteredPayload {
  eventType: 'vocabulary_mastered'
  vocabularyId: string
  word: string
  totalMastered: number
}

export interface SelectedTextSavedPayload {
  eventType: 'selected_text_saved'
  textId: string
  textSnippet: string
  sourceUrl: string
}

export interface ArticleSavedPayload {
  eventType: 'article_saved'
  articleId: string
  title: string
  sourceUrl: string
  wordCount: number
}

export interface SelectedTextExplainedPayload {
  eventType: 'selected_text_explained'
  textId: string
  textSnippet: string
}

export interface SelectedTextSimplifiedPayload {
  eventType: 'selected_text_simplified'
  textId: string
  textSnippet: string
}

export interface ReadingPracticeCompletedPayload {
  eventType: 'reading_practice_completed'
  sessionId: string
  title: string
  accuracy: number
  totalQuestions: number
  correctAnswers: number
  timeSpentSeconds: number
}

export interface ListeningPracticeCompletedPayload {
  eventType: 'listening_practice_completed'
  sessionId: string
  title: string
  accuracy: number
  totalQuestions: number
  correctAnswers: number
  timeSpentSeconds: number
}

export interface WritingSubmittedPayload {
  eventType: 'writing_submitted'
  sessionId: string
  taskType: 'task1' | 'task2'
  wordCount: number
  estimatedBand: number
}

export interface SpeakingPracticedPayload {
  eventType: 'speaking_practiced'
  sessionId: string
  part: 1 | 2 | 3
  durationSeconds: number
}

export interface MistakeSavedPayload {
  eventType: 'mistake_saved'
  mistakeId: string
  mistake: string
  skill: string
  sessionMistakeCount: number
}

export interface RepeatedMistakeDetectedPayload {
  eventType: 'repeated_mistake_detected'
  mistakeId: string
  mistake: string
  skill: string
  repetitionCount: number
}

export interface ProgressViewedPayload {
  eventType: 'progress_viewed'
  timeRange: string
}

export interface AIProgressReviewGeneratedPayload {
  eventType: 'ai_progress_review_generated'
  reviewId: string
  periodStart: ISOString
  periodEnd: ISOString
}

export interface SettingsChangedPayload {
  eventType: 'settings_changed'
  changedKeys: string[]
}

export interface AIProviderConfiguredPayload {
  eventType: 'ai_provider_configured'
  provider: string
  model: string
}

export interface UserBecameInactivePayload {
  eventType: 'user_became_inactive'
  inactivityDurationMinutes: number
}

export interface UserReturnedAfterInactivityPayload {
  eventType: 'user_returned_after_inactivity'
  inactivityDurationMinutes: number
}

export interface StreakMilestoneReachedPayload {
  eventType: 'streak_milestone_reached'
  streakDays: number
  milestoneDays: number
}

export interface ExamDateIsClosePayload {
  eventType: 'exam_date_is_close'
  examDate: ISOString
  daysRemaining: number
  tasksIncomplete: number
}

export interface VocabularyReviewIsDuePayload {
  eventType: 'vocabulary_review_is_due'
  dueCount: number
}

export interface WeeklyProgressReviewIsDuePayload {
  eventType: 'weekly_progress_review_is_due'
  weekEnd: ISOString
}

export interface DailyStudyReminderIsDuePayload {
  eventType: 'daily_study_reminder_is_due'
  todayPlanIncomplete: boolean
}

export interface ScheduledCheckTriggeredPayload {
  eventType: 'scheduled_check_triggered'
  checkType: 'idle' | 'focus' | 'periodic' | 'reopen'
  lastCheckAt: ISOString | null
}

export interface ExtensionPopupOpenedPayload {
  eventType: 'extension_popup_opened'
}

export interface ExtensionSelectedTextDetectedPayload {
  eventType: 'extension_selected_text_detected'
  textSnippet: string
  sourceUrl: string
}

export interface ExtensionVocabularySavedPayload {
  eventType: 'extension_vocabulary_saved'
  word: string
  contextSnippet: string
  sourceUrl: string
}

export interface ExtensionSelectedTextSavedPayload {
  eventType: 'extension_selected_text_saved'
  textSnippet: string
  sourceUrl: string
}

export interface ExtensionArticleSavedPayload {
  eventType: 'extension_article_saved'
  title: string
  sourceUrl: string
}

export interface ExtensionAutoHighlightEnabledPayload {
  eventType: 'extension_auto_highlight_enabled'
}

export interface ExtensionAutoHighlightDisabledPayload {
  eventType: 'extension_auto_highlight_disabled'
}

export interface ExtensionVocabularyReviewStartedPayload {
  eventType: 'extension_vocabulary_review_started'
  dueCount: number
}

export interface ExtensionAITutorOpenedPayload {
  eventType: 'extension_ai_tutor_opened'
}

export interface ExtensionSelectedTextExplainedPayload {
  eventType: 'extension_selected_text_explained'
  textSnippet: string
  sourceUrl: string
}

export interface ExtensionSelectedTextSimplifiedPayload {
  eventType: 'extension_selected_text_simplified'
  textSnippet: string
  sourceUrl: string
}

// ─── Discriminated Union ─────────────────────────────────────────────────────

export type LearningEventPayload =
  | AppOpenedPayload
  | DashboardOpenedPayload
  | AITutorOpenedPayload
  | TodayPlanOpenedPayload
  | StudyTaskStartedPayload
  | StudyTaskCompletedPayload
  | StudyTaskSkippedPayload
  | StudyDayCompletedPayload
  | StudyDayMissedPayload
  | StudyPlanGeneratedPayload
  | StudyRoadmapViewedPayload
  | VocabularySavedPayload
  | VocabularyReviewedPayload
  | VocabularyForgottenPayload
  | VocabularyMasteredPayload
  | SelectedTextSavedPayload
  | ArticleSavedPayload
  | SelectedTextExplainedPayload
  | SelectedTextSimplifiedPayload
  | ReadingPracticeCompletedPayload
  | ListeningPracticeCompletedPayload
  | WritingSubmittedPayload
  | SpeakingPracticedPayload
  | MistakeSavedPayload
  | RepeatedMistakeDetectedPayload
  | ProgressViewedPayload
  | AIProgressReviewGeneratedPayload
  | SettingsChangedPayload
  | AIProviderConfiguredPayload
  | UserBecameInactivePayload
  | UserReturnedAfterInactivityPayload
  | StreakMilestoneReachedPayload
  | ExamDateIsClosePayload
  | VocabularyReviewIsDuePayload
  | WeeklyProgressReviewIsDuePayload
  | DailyStudyReminderIsDuePayload
  | ScheduledCheckTriggeredPayload
  | ExtensionPopupOpenedPayload
  | ExtensionSelectedTextDetectedPayload
  | ExtensionVocabularySavedPayload
  | ExtensionSelectedTextSavedPayload
  | ExtensionArticleSavedPayload
  | ExtensionAutoHighlightEnabledPayload
  | ExtensionAutoHighlightDisabledPayload
  | ExtensionVocabularyReviewStartedPayload
  | ExtensionAITutorOpenedPayload
  | ExtensionSelectedTextExplainedPayload
  | ExtensionSelectedTextSimplifiedPayload

// ─── Learning Event ──────────────────────────────────────────────────────────

export interface LearningEventBase {
  eventId: string
  eventType: LearningEventType
  source: LearningEventSource
  timestamp: ISOString
  page: string
  entityType: LearningEntityType | null
  entityId: string | null
  metadata: Record<string, string>
  sessionId: string
  correlationId: string | null
  createdAt: ISOString
  syncStatus: SyncStatus
}

export type LearningEvent = LearningEventBase & {
  payload: LearningEventPayload
}

// ─── Event Creation Input ────────────────────────────────────────────────────

export type CreateLearningEventInput = {
  eventType: LearningEventType
  source: LearningEventSource
  payload: LearningEventPayload
  page?: string
  entityType?: LearningEntityType | null
  entityId?: string | null
  metadata?: Record<string, string>
  correlationId?: string | null
}

// ─── Aggregation Types ───────────────────────────────────────────────────────

export type AggregationWindow = 'current_session' | 'last_30_minutes' | 'today' | 'last_7_days'

export interface EventAggregation {
  eventType: LearningEventType
  count: number
  window: AggregationWindow
  firstEventAt: ISOString
  lastEventAt: ISOString
  entities: string[]
}

// ─── Decision Result ─────────────────────────────────────────────────────────

export type DecisionAction = 'show_message' | 'store_silent' | 'delay_message' | 'merge_with_existing' | 'ignore_event'

export type MessagePriority = 'low' | 'normal' | 'high' | 'urgent'

export interface ProactiveDecision {
  shouldShow: boolean
  reason: string
  priority: MessagePriority
  messageType: string | null
  suggestedAction: string | null
  cooldownKey: string | null
  delayUntil: ISOString | null
}
