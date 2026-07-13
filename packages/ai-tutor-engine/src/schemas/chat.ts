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
export type ChatSnapshotInput = z.input<typeof chatSnapshotSchema>
