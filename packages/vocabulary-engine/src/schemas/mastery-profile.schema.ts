import { z } from 'zod'
import { SKILL } from '../domain/policies'

export const SkillMasteryStateSchema = z.object({
  score: z.number().min(0).max(100),
  lastInteractionDate: z.date().nullable(),
})

export const MasteryProfileSchema = z.object({
  wordId: z.string(),
  skills: z.object({
    [SKILL.READING]: SkillMasteryStateSchema,
    [SKILL.LISTENING]: SkillMasteryStateSchema,
    [SKILL.WRITING]: SkillMasteryStateSchema,
    [SKILL.SPEAKING]: SkillMasteryStateSchema,
  }),
  overallMastery: z.number().min(0).max(100),
})
