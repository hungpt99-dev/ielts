import { z } from 'zod'
import { REVIEW_CONTEXT, REVIEW_RATING } from '../domain/policies'

export const ReviewRatingSchema = z.enum(REVIEW_RATING)
export const ReviewContextSchema = z.enum(REVIEW_CONTEXT)

export const ReviewHistoryEntrySchema = z.object({
  date: z.date(),
  rating: ReviewRatingSchema,
  responseTimeMs: z.number().nonnegative(),
  confidenceScore: z.number().min(0).max(1),
  context: ReviewContextSchema,
})

export const SpacedRepetitionInfoSchema = z.object({
  interval: z.number().positive(),
  easeFactor: z.number().min(1.3),
  repetitions: z.number().int().nonnegative(),
  stability: z.number().positive(),
  difficulty: z.number().min(0).max(1),
  nextReviewDate: z.date(),
  lastReviewDate: z.date(),
  history: z.array(ReviewHistoryEntrySchema),
})
