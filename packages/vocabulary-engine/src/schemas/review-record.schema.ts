import { z } from 'zod'
import { SKILL } from '../domain/policies'

export const SkillSchema = z.enum(SKILL)

export const ReviewRecordSchema = z.object({
  skill: SkillSchema,
  date: z.date(),
  correct: z.boolean(),
})
