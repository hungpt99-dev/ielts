import { z } from 'zod'
import { CEFR_LEVELS } from '../domain/constants'
import { AntonymSchema } from './antonym.schema'
import { CollocationSchema, REGISTER } from './collocation.schema'
import { SynonymSchema } from './synonym.schema'

const PART_OF_SPEECH = [
  'noun',
  'verb',
  'adjective',
  'adverb',
  'preposition',
  'conjunction',
  'pronoun',
  'interjection',
] as const

export const PartOfSpeechSchema = z.enum(PART_OF_SPEECH)
export const CefrLevelSchema = z.enum(CEFR_LEVELS)
export const IeltsRelevanceSchema = z.enum(['low', 'medium', 'high'])

const VerbConjugationSchema = z.object({
  present: z.string(),
  past: z.string(),
  pastParticiple: z.string(),
  presentParticiple: z.string(),
  thirdSingular: z.string(),
})

const WordFamilyMemberSchema = z.object({
  id: z.string(),
  rootId: z.string(),
  word: z.string(),
  partOfSpeech: PartOfSpeechSchema,
  suffix: z.string(),
  definition: z.string(),
  pronunciation: z.string().optional(),
  verbConjugation: VerbConjugationSchema.optional(),
})

const CommonMistakeSchema = z.object({
  id: z.string(),
  wordId: z.string(),
  mistake: z.string(),
  correction: z.string(),
  explanation: z.string(),
  type: z.enum(['SPELLING', 'PRONUNCIATION', 'GRAMMAR', 'USAGE', 'COLLOCATION']),
})

const UsageExampleSchema = z.object({
  id: z.string(),
  wordId: z.string(),
  text: z.string(),
  source: z.enum(['READING', 'LISTENING', 'WRITING', 'SPEAKING', 'GRAMMAR', 'AI', 'DICTIONARY']),
  sourceId: z.string().optional(),
  timestamp: z.string().optional(),
  register: z.enum(REGISTER),
  context: z.string().optional(),
  isIeltsExample: z.boolean(),
})

const InflectionSchema = z.object({
  id: z.string(),
  wordId: z.string(),
  form: z.string(),
  type: z.enum([
    'PLURAL',
    'PAST',
    'PAST_PARTICIPLE',
    'PRESENT_PARTICIPLE',
    'THIRD_SINGULAR',
    'COMPARATIVE',
    'SUPERLATIVE',
  ]),
})

export const WordSchema = z.object({
  id: z.string(),
  text: z.string(),
  normalizedWord: z.string(),
  lemma: z.string().min(1),
  partOfSpeech: PartOfSpeechSchema,
  definition: z.string(),
  simplifiedMeaning: z.string().optional(),
  pronunciation: z.string().optional(),
  translation: z.string().optional(),
  cefrLevel: CefrLevelSchema.optional(),
  ieltsRelevance: IeltsRelevanceSchema.optional(),
  collocations: z.array(CollocationSchema),
  synonyms: z.array(SynonymSchema),
  antonyms: z.array(AntonymSchema),
  wordFamily: z.array(WordFamilyMemberSchema),
  commonMistakes: z.array(CommonMistakeSchema),
  usageExamples: z.array(UsageExampleSchema),
  inflections: z.array(InflectionSchema),
  tags: z.array(z.string()),
  topics: z.array(z.string()),
  createdAt: z.date(),
  updatedAt: z.date(),
})
