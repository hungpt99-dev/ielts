import { z } from 'zod'
import { LIFECYCLE_PHASE } from '../domain/constants'
import { SpacedRepetitionInfoSchema } from './spaced-repetition.schema'

export const LifecyclePhaseSchema = z.enum(LIFECYCLE_PHASE)

export const VocabularyStateSchema = z.object({
  wordId: z.string(),
  lifecyclePhase: LifecyclePhaseSchema,
  masteryScore: z.number().min(0).max(100),
  spacedRepetitionInfo: SpacedRepetitionInfoSchema,
  interactionCount: z.number().int().nonnegative(),
  correctProductionCount: z.number().int().nonnegative(),
  consecutiveAgainRatings: z.number().int().nonnegative(),
  lastInteractionAt: z.date().optional(),
  lastStudyAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
})
