import { z } from 'zod'

export const dictionaryEntrySchema = z.object({
  word: z.string().min(1),
  meaning: z.string().min(1),
  translation: z.string().default(''),
  pronunciation: z.string().default(''),
  partOfSpeech: z.string().default(''),
  exampleSentence: z.string().default(''),
  synonyms: z.array(z.string()).default([]),
  collocations: z.array(z.string()).default([]),
  ieltsTopic: z.string().default(''),
})
export type DictionaryEntry = z.infer<typeof dictionaryEntrySchema>
