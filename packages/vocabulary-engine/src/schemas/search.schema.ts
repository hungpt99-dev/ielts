import { z } from 'zod'
import { CEFR_LEVELS } from '../domain/constants'
import { PartOfSpeechSchema, WordSchema } from './word.schema'

export const SearchInputSchema = z.object({
  query: z.string().trim().min(1),
  limit: z.number().int().positive().max(100).optional(),
  offset: z.number().int().nonnegative().optional(),
  partOfSpeech: PartOfSpeechSchema.optional(),
  cefrLevel: z.enum(CEFR_LEVELS).optional(),
  tags: z.array(z.string()).optional(),
  topics: z.array(z.string()).optional(),
})

export const SearchResultSchema = z.object({
  word: WordSchema,
  score: z.number().min(0).max(1),
})

export const SearchIndexStatsSchema = z.object({
  totalWords: z.number().int().nonnegative(),
  totalSynonyms: z.number().int().nonnegative(),
  totalAntonyms: z.number().int().nonnegative(),
  totalCollocations: z.number().int().nonnegative(),
  indexedAt: z.date(),
})
