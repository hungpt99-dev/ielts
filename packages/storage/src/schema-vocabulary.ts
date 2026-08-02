import { z } from 'zod'
import { isoStringSchema, vocabDifficultySchema } from './schema'

export const partOfSpeechSchema = z.enum([
  'noun',
  'verb',
  'adjective',
  'adverb',
  'preposition',
  'conjunction',
  'pronoun',
  'interjection',
])
export const cefrLevelSchema = z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'])
export const ieltsFrequencySchema = z.enum(['low', 'medium', 'high'])
export const lifecyclePhaseSchema = z.enum([
  'DISCOVERED',
  'LEARNING',
  'PRACTICING',
  'REVIEWING',
  'USING',
  'MASTERED',
])
export const interactionTypeSchema = z.enum(['EXPOSURE', 'RECOGNITION', 'AUDIO_RECOGNITION', 'USAGE'])
export const vocabularySkillSchema = z.enum(['READING', 'LISTENING', 'WRITING', 'SPEAKING'])
export const reviewRatingSchema = z.enum(['AGAIN', 'HARD', 'GOOD', 'EASY'])
export const reviewModeSchema = z.enum(['FLASHCARD', 'READING', 'WRITING', 'SPEAKING'])
export const registerSchema = z.enum(['FORMAL', 'INFORMAL', 'ACADEMIC', 'NEUTRAL'])
export const antonymTypeSchema = z.enum(['GRADABLE', 'COMPLEMENTARY', 'RELATIONAL'])
export const commonMistakeTypeSchema = z.enum(['SPELLING', 'PRONUNCIATION', 'GRAMMAR', 'USAGE', 'COLLOCATION'])
export const usageExampleSourceSchema = z.enum([
  'READING',
  'LISTENING',
  'WRITING',
  'SPEAKING',
  'GRAMMAR',
  'AI',
  'DICTIONARY',
])
export const inflectionTypeSchema = z.enum([
  'PLURAL',
  'PAST',
  'PAST_PARTICIPLE',
  'PRESENT_PARTICIPLE',
  'THIRD_SINGULAR',
  'COMPARATIVE',
  'SUPERLATIVE',
])

export const skillMasteryStateSchema = z.object({
  score: z.number().min(0).max(100),
  lastInteractionDate: isoStringSchema.nullable().default(null),
})

export const reviewHistoryEntrySchema = z.object({
  date: isoStringSchema,
  rating: reviewRatingSchema,
  responseTimeMs: z.number().nonnegative(),
  confidenceScore: z.number().min(0).max(1),
  context: reviewModeSchema,
})

export const wordSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  normalizedWord: z.string().min(1),
  lemma: z.string().min(1),
  language: z.string().default('en'),
  partOfSpeech: partOfSpeechSchema,
  definition: z.string().min(1),
  simplifiedMeaning: z.string().default(''),
  pronunciation: z.string().default(''),
  translation: z.string().default(''),
  cefr: cefrLevelSchema.optional(),
  ieltsFrequency: ieltsFrequencySchema.optional(),
  topic: z.string().min(1),
  difficulty: vocabDifficultySchema,
  tags: z.array(z.string()).default([]),
  createdAt: isoStringSchema,
  updatedAt: isoStringSchema,
})

export const vocabularyStateSchema = z.object({
  id: z.string().min(1),
  wordId: z.string().min(1),
  lifecycle: lifecyclePhaseSchema,
  masteryScore: z.number().min(0).max(100),
  addedAt: isoStringSchema,
  discoveredFrom: z.string().min(1),
  tags: z.array(z.string()).default([]),
  interactionCount: z.number().int().nonnegative(),
  correctProductionCount: z.number().int().nonnegative(),
  consecutiveAgainRatings: z.number().int().nonnegative(),
  lastInteractionAt: isoStringSchema.nullable().default(null),
  lastStudyAt: isoStringSchema.nullable().default(null),
  createdAt: isoStringSchema,
  updatedAt: isoStringSchema,
})

export const interactionSchema = z.object({
  id: z.string().min(1),
  wordId: z.string().min(1),
  type: interactionTypeSchema,
  skill: vocabularySkillSchema,
  correct: z.boolean().default(true),
  timestamp: isoStringSchema,
})

export const spacedRepetitionInfoSchema = z.object({
  id: z.string().min(1),
  wordId: z.string().min(1),
  interval: z.number().positive(),
  easeFactor: z.number().min(1.3),
  repetitions: z.number().int().nonnegative(),
  stability: z.number().positive(),
  difficulty: z.number().min(0).max(1),
  nextReviewAt: isoStringSchema,
  lastReviewedAt: isoStringSchema,
  totalReviews: z.number().int().nonnegative(),
  history: z.array(reviewHistoryEntrySchema).default([]),
})

export const reviewRecordSchema = z.object({
  id: z.string().min(1),
  wordId: z.string().min(1),
  reviewedAt: isoStringSchema,
  rating: reviewRatingSchema,
  reviewMode: reviewModeSchema,
  responseTimeMs: z.number().nonnegative(),
  confidenceScore: z.number().min(0).max(1),
  skill: vocabularySkillSchema,
  correct: z.boolean(),
})

export const masteryProfileSchema = z.object({
  id: z.string().min(1),
  wordId: z.string().min(1),
  skills: z.object({
    READING: skillMasteryStateSchema,
    LISTENING: skillMasteryStateSchema,
    WRITING: skillMasteryStateSchema,
    SPEAKING: skillMasteryStateSchema,
  }),
  overallMastery: z.number().min(0).max(100),
  updatedAt: isoStringSchema,
})

export const collocationSchema = z.object({
  id: z.string().min(1),
  wordId: z.string().min(1),
  pattern: z.string().min(1),
  frequency: z.number().nonnegative(),
  register: registerSchema,
  examples: z.array(z.string()).default([]),
})

export const synonymSchema = z.object({
  id: z.string().min(1),
  wordId: z.string().min(1),
  synonymOf: z.string().min(1),
  nuance: z.string().default(''),
  similarityScore: z.number().min(0).max(1),
})

export const antonymSchema = z.object({
  id: z.string().min(1),
  wordId: z.string().min(1),
  antonymOf: z.string().min(1),
  type: antonymTypeSchema,
})

export const wordFamilyMemberSchema = z.object({
  id: z.string().min(1),
  rootId: z.string().min(1),
  word: z.string().min(1),
  partOfSpeech: partOfSpeechSchema,
  suffix: z.string().default(''),
  definition: z.string().default(''),
  pronunciation: z.string().default(''),
})

export const commonMistakeSchema = z.object({
  id: z.string().min(1),
  wordId: z.string().min(1),
  mistake: z.string().min(1),
  correction: z.string().min(1),
  explanation: z.string().default(''),
  type: commonMistakeTypeSchema,
})

export const usageExampleSchema = z.object({
  id: z.string().min(1),
  wordId: z.string().min(1),
  text: z.string().min(1),
  source: usageExampleSourceSchema,
  sourceId: z.string().default(''),
  timestamp: z.string().default(''),
  register: registerSchema,
  context: z.string().default(''),
  isIeltsExample: z.boolean().default(false),
})

export const inflectionSchema = z.object({
  id: z.string().min(1),
  wordId: z.string().min(1),
  form: z.string().min(1),
  type: inflectionTypeSchema,
})

export const wordConnectionSchema = z.object({
  id: z.string().min(1),
  fromWordId: z.string().min(1),
  toWordId: z.string().min(1),
  relationship: z.string().min(1),
  weight: z.number().min(0).max(1),
  metadata: z.record(z.string(), z.unknown()).default({}),
})

export const topicClusterSchema = z.object({
  id: z.string().min(1),
  topic: z.string().min(1),
  centralWords: z.array(z.string()).default([]),
  relatedWords: z.array(z.string()).default([]),
  depth: z.number().int().nonnegative().default(0),
})

export const searchIndexEntrySchema = z.object({
  id: z.string().min(1),
  wordId: z.string().min(1),
  tokens: z.array(z.string()).default([]),
  ngrams: z.array(z.string()).default([]),
  indexedAt: isoStringSchema,
})

export const vocabularyTableSchemas: Record<string, z.ZodTypeAny> = {
  words: wordSchema,
  vocabularyStates: vocabularyStateSchema,
  interactions: interactionSchema,
  spacedRepetitionInfo: spacedRepetitionInfoSchema,
  reviewRecords: reviewRecordSchema,
  masteryProfiles: masteryProfileSchema,
  collocations: collocationSchema,
  synonyms: synonymSchema,
  antonyms: antonymSchema,
  wordFamily: wordFamilyMemberSchema,
  commonMistakes: commonMistakeSchema,
  usageExamples: usageExampleSchema,
  inflections: inflectionSchema,
  wordConnections: wordConnectionSchema,
  topicClusters: topicClusterSchema,
  searchIndex: searchIndexEntrySchema,
}

export const VOCABULARY_SCHEMA_VERSION = 2

export const VOCABULARY_STORES: Record<string, string> = {
  words: 'id, lemma, language, partOfSpeech, cefr, ieltsFrequency, topic, difficulty',
  vocabularyStates: 'id, wordId, lifecycle, masteryScore, addedAt, discoveredFrom, *tags',
  interactions: 'id, wordId, type, timestamp',
  spacedRepetitionInfo: 'id, wordId, nextReviewAt, lastReviewedAt, totalReviews',
  reviewRecords: 'id, wordId, reviewedAt, rating, reviewMode',
  masteryProfiles: 'id, wordId',
  collocations: 'id, wordId, pattern',
  synonyms: 'id, wordId, synonymOf',
  antonyms: 'id, wordId, antonymOf',
  wordFamily: 'id, rootId, word, partOfSpeech',
  commonMistakes: 'id, wordId, type',
  usageExamples: 'id, wordId, source, sourceId',
  inflections: 'id, wordId, form',
  wordConnections: 'id, fromWordId, toWordId, relationship, weight',
  topicClusters: 'id, topic',
  searchIndex: 'id, wordId, *tokens, *ngrams',
}

export type WordRow = z.infer<typeof wordSchema>
export type VocabularyStateRow = z.infer<typeof vocabularyStateSchema>
export type InteractionRow = z.infer<typeof interactionSchema>
export type SpacedRepetitionInfoRow = z.infer<typeof spacedRepetitionInfoSchema>
export type ReviewRecordRow = z.infer<typeof reviewRecordSchema>
export type MasteryProfileRow = z.infer<typeof masteryProfileSchema>
export type CollocationRow = z.infer<typeof collocationSchema>
export type SynonymRow = z.infer<typeof synonymSchema>
export type AntonymRow = z.infer<typeof antonymSchema>
export type WordFamilyRow = z.infer<typeof wordFamilyMemberSchema>
export type CommonMistakeRow = z.infer<typeof commonMistakeSchema>
export type UsageExampleRow = z.infer<typeof usageExampleSchema>
export type InflectionRow = z.infer<typeof inflectionSchema>
export type WordConnectionRow = z.infer<typeof wordConnectionSchema>
export type TopicClusterRow = z.infer<typeof topicClusterSchema>
export type SearchIndexRow = z.infer<typeof searchIndexEntrySchema>
