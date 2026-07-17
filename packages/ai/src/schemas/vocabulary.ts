import { z } from 'zod'
import { verbConjugationSchema } from './verb'

const wordFormSchema = z.object({
  word: z.string(),
  pos: z.string().optional().default(''),
  pronunciation: z.string().optional().default(''),
  meaning: z.string().optional().default(''),
  verbConjugation: verbConjugationSchema.optional(),
}).passthrough()

export const vocabularyDetailsSchema = z.object({
  meaning: z.string().default(''),
  translation: z.string().default(''),
  partOfSpeech: z.string().default(''),
  pronunciation: z.string().default(''),
  exampleSentence: z.string().default(''),
  synonyms: z.array(z.string()).default([]),
  antonyms: z.array(z.string()).default([]),
  collocations: z.array(z.string()).default([]),
  wordFamily: z.array(z.union([z.string(), wordFormSchema])).default([]),
  verbConjugation: verbConjugationSchema.optional(),
  cefrLevel: z.string().default(''),
  ieltsRelevance: z.string().default(''),
  difficulty: z.string().default(''),
}).passthrough()
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
