import { z } from 'zod'

export const proactiveMessageTriggerTypeSchema = z.enum([
  'due_review',
  'missed_task',
  'weak_skill_warning',
  'exam_countdown',
  'new_content_saved',
  'study_streak',
  'low_activity',
  'daily_plan_ready',
  'mistake_pattern_detected',
  'topic_practice_suggestion',
  'lesson_completed',
  'inactive_days',
  'weekly_review',
  'monthly_review',
  'unfinished_lesson',
  'saved_word_exercise',
  'daily_tip',
  'mock_test_ready',
  'exam_date_reminder',
  'progress_celebration',
  'study_session_suggestion',
])

export type ProactiveMessageTriggerType = z.infer<typeof proactiveMessageTriggerTypeSchema>

export const proactiveMessageCategorySchema = z.enum([
  'vocabulary-review',
  'mistake-review',
  'study-plan',
  'speaking-practice',
  'writing-practice',
  'reading-practice',
  'listening-practice',
  'exam-countdown',
  'motivation',
  'saved-content',
  'daily-tip',
  'progress-report',
  'suggestion',
])

export type ProactiveMessageCategory = z.infer<typeof proactiveMessageCategorySchema>

export const proactiveMessagePrioritySchema = z.enum(['high', 'medium', 'low'])

export type ProactiveMessagePriority = z.infer<typeof proactiveMessagePrioritySchema>

export const proactiveMessageActionSchema = z.object({
  type: z.string(),
  label: z.string(),
  payload: z.record(z.string(), z.unknown()).optional(),
})

export type ProactiveMessageAction = z.infer<typeof proactiveMessageActionSchema>

export const interactionTypeSchema = z.enum(['click', 'dismiss', 'snooze', 'action'])

export const feedbackRatingSchema = z.enum(['helpful', 'not-helpful', 'neutral'])

export const interactionRecordSchema = z.object({
  messageId: z.string(),
  type: interactionTypeSchema,
  timestamp: z.string(),
  rating: feedbackRatingSchema.optional(),
})

export const proactiveMessageReasonSchema = z.enum([
  'due_review',
  'weak_skill',
  'streak_milestone',
  'exam_countdown',
  'missed_task',
  'low_activity',
  'new_content',
  'daily_tip',
  'weekly_review',
  'monthly_review',
  'progress_celebration',
  'study_suggestion',
])

export const proactiveMessageSchema = z.object({
  id: z.string(),
  triggerType: proactiveMessageTriggerTypeSchema,
  category: proactiveMessageCategorySchema,
  priority: proactiveMessagePrioritySchema,
  title: z.string(),
  message: z.string(),
  reason: z.string(),
  score: z.number(),
  deduplicationKey: z.string(),
  action: proactiveMessageActionSchema.optional(),
  isRead: z.boolean().default(false),
  isDismissed: z.boolean().default(false),
  isSnoozed: z.boolean().default(false),
  snoozedUntil: z.string().optional(),
  expiresAt: z.string().optional(),
  createdAt: z.string(),
})

export type ProactiveMessage = z.infer<typeof proactiveMessageSchema>

export const tutorToneSchema = z.enum(['friendly', 'professional', 'simple', 'encouraging'])

export const notificationChannelSchema = z.enum(['popup', 'banner', 'badge', 'off'])

export const automationLevelSchema = z.enum(['manual', 'semi-automatic', 'automatic'])

export const reminderFrequencySchema = z.enum(['once', 'daily', 'weekly', 'smart'])

export const proactiveMessageSettingsSchema = z.object({
  enabled: z.boolean().default(true),
  browserNotifications: z.boolean().default(false),
  extensionNotifications: z.boolean().default(false),
  aiEnhanced: z.boolean().default(false),
  quietHoursStart: z.string().default('22:00'),
  quietHoursEnd: z.string().default('08:00'),
  reminderTime: z.string().default('09:00'),
  maxMessagesPerDay: z.number().default(5),
  minIntervalMinutes: z.number().default(60),
  categories: z.record(z.string(), z.boolean()).default({}),
  examReminders: z.boolean().default(true),
  inactivityReminders: z.boolean().default(true),
  vocabularyReminders: z.boolean().default(true),
  roadmapReminders: z.boolean().default(true),
  motivationMessages: z.boolean().default(true),
  preferredTone: tutorToneSchema.default('friendly'),
  preferredMessageLength: z.enum(['short', 'medium', 'detailed']).default('medium'),
})

export type ProactiveMessageSettings = z.infer<typeof proactiveMessageSettingsSchema>

export const DEFAULT_PROACTIVE_SETTINGS: ProactiveMessageSettings = {
  enabled: true,
  browserNotifications: false,
  extensionNotifications: false,
  aiEnhanced: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
  reminderTime: '09:00',
  maxMessagesPerDay: 5,
  minIntervalMinutes: 60,
  categories: {} as Record<string, boolean>,
  examReminders: true,
  inactivityReminders: true,
  vocabularyReminders: true,
  roadmapReminders: true,
  motivationMessages: true,
  preferredTone: 'friendly',
  preferredMessageLength: 'medium',
}

export type ProactiveMessageInput = z.input<typeof proactiveMessageSchema>
export type ProactiveMessageUpdate = Partial<ProactiveMessageInput>
export interface ProactiveMessageInteractionResult {
  messageId: string
  action: string
  timestamp: string
  success: boolean
}

export interface InteractionStats {
  total: number
  clicked: number
  dismissed: number
  snoozed: number
  rateLimited: number
}
