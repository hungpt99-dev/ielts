import { z } from 'zod'

export const vocabularyDetailsSchema = z.object({
  meaning: z.string().min(1),
  meaningVi: z.string().default(''),
  partOfSpeech: z.string().default(''),
  pronunciation: z.string().default(''),
  exampleSentence: z.string().min(1),
  synonyms: z.array(z.string()).default([]),
  antonyms: z.array(z.string()).default([]),
  collocations: z.array(z.string()).default([]),
  wordFamily: z.array(z.string()).default([]),
})
export type VocabularyDetails = z.infer<typeof vocabularyDetailsSchema>

export const vocabularyQuizSchema = z.object({
  questions: z.array(z.object({
    type: z.enum(['meaning', 'gap-fill', 'synonym', 'collocation']),
    question: z.string().min(1),
    options: z.array(z.string()).optional(),
    correctAnswer: z.string().min(1),
    explanation: z.string().min(1),
  })),
})
export type VocabularyQuiz = z.infer<typeof vocabularyQuizSchema>
