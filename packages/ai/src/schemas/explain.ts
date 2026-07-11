import { z } from 'zod'

export const simpleExplainSchema = z.object({
  explanation: z.string().min(1),
})
export type SimpleExplain = z.infer<typeof simpleExplainSchema>

export const translateExplainSchema = z.object({
  translation: z.string().min(1),
  vocabularyNotes: z.array(z.object({
    word: z.string(),
    meaning: z.string(),
  })).default([]),
})
export type TranslateExplain = z.infer<typeof translateExplainSchema>

export const ieltsVocabSchema = z.object({
  words: z.array(z.object({
    word: z.string().min(1),
    meaning: z.string().min(1),
    partOfSpeech: z.string().default(''),
    example: z.string().min(1),
    synonyms: z.array(z.string()).default([]),
    collocations: z.array(z.string()).default([]),
  })).min(1),
})
export type IeltsVocabResult = z.infer<typeof ieltsVocabSchema>

export const grammarExplainSchema = z.object({
  explanation: z.string().min(1),
  structure: z.string().default(''),
  rules: z.array(z.string()).default([]),
  commonMistakes: z.array(z.string()).default([]),
})
export type GrammarExplain = z.infer<typeof grammarExplainSchema>

export const rewriteSchema = z.object({
  rewritten: z.string().min(1),
  changes: z.string().default(''),
  tone: z.string().default(''),
})
export type RewriteResult = z.infer<typeof rewriteSchema>

export const exampleSentencesSchema = z.object({
  sentences: z.array(z.string()).min(1),
  explanation: z.string().default(''),
})
export type ExampleSentencesResult = z.infer<typeof exampleSentencesSchema>

export const quizSchema = z.object({
  questions: z.array(z.object({
    question: z.string().min(1),
    options: z.array(z.string()).min(2),
    correctAnswer: z.number().int().min(0),
    explanation: z.string().min(1),
  })).min(1),
})
export type QuizResult = z.infer<typeof quizSchema>

export type AiExplainResult =
  | SimpleExplain
  | TranslateExplain
  | IeltsVocabResult
  | GrammarExplain
  | RewriteResult
  | ExampleSentencesResult
  | QuizResult
