import { z } from 'zod'

export const SynonymSchema = z.object({
  id: z.string(),
  wordId: z.string(),
  synonymOf: z.string(),
  nuance: z.string().optional(),
  similarityScore: z.number().min(0).max(1),
})
