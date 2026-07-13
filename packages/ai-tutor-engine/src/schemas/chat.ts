import { z } from 'zod'

export const chatMessageRoleSchema = z.enum(['user', 'assistant'])

export const chatMessageSchema = z.object({
  id: z.string().min(1),
  role: chatMessageRoleSchema,
  content: z.string(),
  createdAt: z.string().refine(v => !isNaN(Date.parse(v)), { message: 'Invalid ISO date string' }),
})

export const quickActionTypeSchema = z.enum([
  'teach-me',
  'quiz-me',
  'correct-english',
  'explain-simply',
  'give-examples',
  'make-exercise',
  'remind-later',
  'practice-with-me',
])

export const quickActionSchema = z.object({
  type: quickActionTypeSchema,
  label: z.string().min(1),
  icon: z.string().min(1),
})

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
])

export const proactiveMessageCategorySchema = z.enum([
  'vocabulary-review',
  'mistake-review',
  'study-plan',
  'speaking-practice',
  'writing-practice',
  'exam-countdown',
  'motivation',
  'saved-content',
])

export const proactiveMessagePrioritySchema = z.enum(['high', 'medium', 'low'])

export const proactiveMessageActionSchema = z.object({
  type: z.string(),
  label: z.string(),
  payload: z.record(z.string(), z.unknown()).optional(),
})

export const proactiveMessageSchema = z.object({
  id: z.string().min(1),
  triggerType: proactiveMessageTriggerTypeSchema,
  category: proactiveMessageCategorySchema,
  title: z.string().min(1),
  message: z.string().min(1),
  priority: proactiveMessagePrioritySchema,
  action: proactiveMessageActionSchema.optional(),
  isRead: z.boolean(),
  isDismissed: z.boolean(),
  isSnoozed: z.boolean(),
  snoozedUntil: z.string().optional(),
  createdAt: z.string().refine(v => !isNaN(Date.parse(v)), { message: 'Invalid ISO date string' }),
})

export const proactiveMessageSettingsSchema = z.object({
  enabled: z.boolean(),
  browserNotifications: z.boolean(),
  aiEnhanced: z.boolean(),
  quietHoursStart: z.string(),
  quietHoursEnd: z.string(),
  reminderTime: z.string(),
  maxMessagesPerDay: z.number().int().positive(),
  categories: z.record(z.string(), z.boolean()),
})

export const chatSessionMetaSchema = z.object({
  currentLearningTopic: z.string().optional(),
  lastInteractionTime: z.string().optional(),
  lastOpenedAt: z.string().optional(),
  totalInteractions: z.number().int().min(0),
  acceptedRecommendations: z.array(z.string()),
  dismissedRecommendationIds: z.array(z.string()),
  snoozedRecommendations: z.array(z.object({
    id: z.string(),
    until: z.string(),
  })),
})

export const chatSnapshotSchema = z.object({
  version: z.number().int().positive(),
  messages: z.array(chatMessageSchema),
  meta: chatSessionMetaSchema,
  createdAt: z.string().refine(v => !isNaN(Date.parse(v)), { message: 'Invalid ISO date string' }),
  updatedAt: z.string().refine(v => !isNaN(Date.parse(v)), { message: 'Invalid ISO date string' }),
})

export const contextSuggestionSchema = z.object({
  title: z.string(),
  message: z.string(),
  action: quickActionTypeSchema.optional(),
  actionLabel: z.string(),
})

export const contextAwareQuickActionSchema = quickActionSchema.extend({
  relevance: z.number().min(0).max(1),
})

export type ChatMessageInput = z.input<typeof chatMessageSchema>
export type ProactiveMessageInput = z.input<typeof proactiveMessageSchema>
export type ChatSnapshotInput = z.input<typeof chatSnapshotSchema>
