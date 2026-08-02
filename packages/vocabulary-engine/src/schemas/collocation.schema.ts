import { z } from 'zod'

export const REGISTER = ['FORMAL', 'INFORMAL', 'ACADEMIC', 'NEUTRAL'] as const

export const CollocationSchema = z.object({
  id: z.string(),
  pattern: z.string(),
  wordId: z.string(),
  frequency: z.number().nonnegative(),
  register: z.enum(REGISTER),
  examples: z.array(z.string()),
})
