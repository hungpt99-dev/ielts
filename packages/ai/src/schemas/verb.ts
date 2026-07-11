import { z } from 'zod'

export const verbConjugationSchema = z.object({
  base: z.string().default(''),
  pastSimple: z.string().default(''),
  pastParticiple: z.string().default(''),
  presentParticiple: z.string().default(''),
  thirdPersonSingular: z.string().default(''),
})
export type VerbConjugation = z.infer<typeof verbConjugationSchema>

export const verbAnalysisSchema = z.object({
  verb: z.string().min(1),
  baseForm: z.string().default(''),
  tense: z.string().default(''),
  aspect: z.string().default(''),
  voice: z.string().default(''),
  mood: z.string().default(''),
  explanation: z.string().default(''),
})
export type VerbAnalysis = z.infer<typeof verbAnalysisSchema>
