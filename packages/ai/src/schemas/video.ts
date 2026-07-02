import { z } from 'zod'

export const transcriptVocabularySchema = z.object({
  words: z.array(z.object({
    word: z.string().min(1),
    meaning: z.string().min(1),
    partOfSpeech: z.string().default(''),
    example: z.string().min(1),
    synonyms: z.array(z.string()).default([]),
    collocations: z.array(z.string()).default([]),
    context: z.string().default(''),
  })).min(1),
})
export type TranscriptVocabulary = z.infer<typeof transcriptVocabularySchema>

export const transcriptSummarySchema = z.object({
  summary: z.string().min(1),
  keyPoints: z.array(z.string()).default([]),
  ieltsTopics: z.array(z.string()).default([]),
})
export type TranscriptSummary = z.infer<typeof transcriptSummarySchema>

export const listeningQuestionSchema = z.object({
  questions: z.array(z.object({
    type: z.enum(['multiple-choice', 'short-answer', 'gap-fill', 'true-false']),
    question: z.string().min(1),
    options: z.array(z.string()).optional(),
    correctAnswer: z.string().min(1),
    explanation: z.string().min(1),
    bandScore: z.string().optional(),
  })).min(1),
})
export type ListeningQuestions = z.infer<typeof listeningQuestionSchema>

export const shadowingScriptSchema = z.object({
  scripts: z.array(z.object({
    sentence: z.string().min(1),
    translation: z.string().default(''),
    focusWords: z.array(z.string()).default([]),
    notes: z.string().default(''),
  })).min(1),
})
export type ShadowingScripts = z.infer<typeof shadowingScriptSchema>
