import { z } from 'zod'

export const ANTONYM_TYPE = ['GRADABLE', 'COMPLEMENTARY', 'RELATIONAL'] as const

export const AntonymSchema = z.object({
  id: z.string(),
  wordId: z.string(),
  antonymOf: z.string(),
  type: z.enum(ANTONYM_TYPE),
})
